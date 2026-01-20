import { getSportColorVar } from './utils.js';

export function renderProgressWidget() {
    // 1. Placeholder while loading
    const loadingHtml = `
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-8 h-40 animate-pulse flex items-center justify-center">
            <span class="text-slate-500">Loading Progress...</span>
        </div>`;
        
    setTimeout(async () => {
        const container = document.getElementById('progress-widget-container');
        if (!container) return;
        
        try {
            const response = await fetch('data/dashboard/plannedWorkouts.json');
            if (!response.ok) throw new Error("Data not found");
            
            const data = await response.json();
            container.innerHTML = generateWidgetHTML(data);
            
        } catch (error) {
            console.error("Widget Error:", error);
            container.innerHTML = ''; 
        }
    }, 50);

    return `<div id="progress-widget-container">${loadingHtml}</div>`;
}

// --- LOGIC ADAPTER ---
function generateWidgetHTML(data) {
    if (!data || data.length === 0) return '';

    // 1. Date Setup
    const now = new Date();
    const today = new Date(); 
    today.setHours(0,0,0,0);
    
    // Calculate This Week's Window (Monday to Sunday)
    const day = today.getDay(); 
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    // 2. Initialize Stats Buckets
    const currentWeekStats = {
        totalPlanned: 0,
        totalActual: 0,
        expectedSoFar: 0,
        dailyMarkers: {}, // { '2023-10-25': 60 }
        bySport: {
            Bike: { planned: 0, actual: 0, dailyMarkers: {} },
            Run: { planned: 0, actual: 0, dailyMarkers: {} },
            Swim: { planned: 0, actual: 0, dailyMarkers: {} },
            Other: { planned: 0, actual: 0, dailyMarkers: {} }
        }
    };

    // Helper for Streaks
    const weeksMap = {}; // Key: "YYYY-Www" -> { planned, actual, totalItems, completedItems, missed }

    // 3. Process Data Loop
    data.forEach(w => {
        const wDate = new Date(w.date.replace(/-/g, '/')); // Fix for some browser parsing
        const dateKey = w.date;
        
        // --- A. Build Weeks Map for Streaks ---
        // Get Monday of that week
        const dDay = wDate.getDay();
        const dDiff = wDate.getDate() - dDay + (dDay === 0 ? -6 : 1);
        const wMonday = new Date(wDate);
        wMonday.setDate(dDiff);
        const weekKey = wMonday.toISOString().split('T')[0];

        if (!weeksMap[weekKey]) {
            weeksMap[weekKey] = { planned: 0, actual: 0, items: 0, completed: 0, failed: false };
        }

        const planDur = w.plannedDuration || 0;
        const actDur = w.actualDuration || 0;

        weeksMap[weekKey].planned += planDur;
        weeksMap[weekKey].actual += actDur;
        
        if (planDur > 0) {
            weeksMap[weekKey].items++;
            // Strict completion check
            if (w.status === 'COMPLETED' || (actDur / planDur) >= 0.8) {
                weeksMap[weekKey].completed++;
            } else if (w.status === 'MISSED') {
                weeksMap[weekKey].failed = true;
            }
        }

        // --- B. Process Current Week Stats ---
        if (wDate >= monday && wDate <= sunday) {
            currentWeekStats.totalPlanned += planDur;
            currentWeekStats.totalActual += actDur;

            // Pacing: Only add to "Expected" if the workout was in the past (or today)
            if (wDate <= now) {
                currentWeekStats.expectedSoFar += planDur;
            }

            // Daily Markers for the main bar
            if (!currentWeekStats.dailyMarkers[dateKey]) currentWeekStats.dailyMarkers[dateKey] = 0;
            currentWeekStats.dailyMarkers[dateKey] += planDur;

            // Sport Breakdown
            // Use 'actualSport' which is normalized in the JSON (Run, Bike, Swim, Strength -> Other)
            let sport = w.actualSport || 'Other';
            if (['Strength', 'Gym', 'Rest'].includes(sport)) sport = 'Other';
            if (!currentWeekStats.bySport[sport]) sport = 'Other';

            currentWeekStats.bySport[sport].planned += planDur;
            currentWeekStats.bySport[sport].actual += actDur;
            
            if (!currentWeekStats.bySport[sport].dailyMarkers[dateKey]) currentWeekStats.bySport[sport].dailyMarkers[dateKey] = 0;
            currentWeekStats.bySport[sport].dailyMarkers[dateKey] += planDur;
        }
    });

    // 4. Calculate Streaks
    // Sort weeks descending
    const sortedWeeks = Object.keys(weeksMap).sort((a, b) => new Date(b) - new Date(a));
    const thisWeekKey = monday.toISOString().split('T')[0];

    let dailyStreak = 0;
    let volumeStreak = 0;

    // Start looking from LAST week (ignore current incomplete week)
    let startIndex = sortedWeeks.indexOf(thisWeekKey);
    // If current week not found (no data yet), start at 0, else start at index + 1
    startIndex = (startIndex === -1) ? 0 : startIndex + 1;

    // Daily Streak: No "Missed" workouts AND 100% completion of planned items
    for (let i = startIndex; i < sortedWeeks.length; i++) {
        const wk = weeksMap[sortedWeeks[i]];
        if (!wk.failed && wk.items > 0 && wk.completed === wk.items) {
            dailyStreak++;
        } else {
            break;
        }
    }

    // Volume Streak: >90% volume compliance
    for (let i = startIndex; i < sortedWeeks.length; i++) {
        const wk = weeksMap[sortedWeeks[i]];
        if (wk.planned > 0 && (wk.actual / wk.planned) >= 0.90) {
            volumeStreak++;
        } else {
            break;
        }
    }

    // 5. Render HTML Helper
    const generateBarHtml = (label, iconClass, actual, planned, dailyMap, isMain = false, sportType = 'Other') => {
        // Calculations
        const rawPct = planned > 0 ? Math.round((actual / planned) * 100) : 0; 
        const barWidth = Math.min(rawPct, 100); 
        const actualHrs = (actual / 60).toFixed(1); 
        const plannedHrs = (planned / 60).toFixed(1);
        
        // Markers (Tick marks for each day's contribution)
        let markersHtml = ''; 
        let runningTotal = 0; 
        const sortedDays = Object.keys(dailyMap).sort();
        
        if (planned > 0) { 
            for (let i = 0; i < sortedDays.length - 1; i++) { 
                runningTotal += dailyMap[sortedDays[i]]; 
                const pct = (runningTotal / planned) * 100; 
                markersHtml += `<div class="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10" style="left: ${pct}%"></div>`; 
            } 
        }
        
        // Styles
        const colorVar = getSportColorVar(sportType);
        const labelHtml = isMain ? `<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">${label}</span>` : ''; 
        const iconHtml = iconClass ? `<i class="fa-solid ${iconClass} mr-2 w-4 text-center" style="color: ${colorVar}"></i>` : ''; 
        const heightClass = isMain ? 'h-3' : 'h-2.5'; 
        const mbClass = isMain ? 'mb-4' : 'mb-3'; 
        const pctColor = rawPct >= 100 ? 'text-emerald-400' : (rawPct >= 80 ? 'text-blue-400' : 'text-slate-400');
        const barBgStyle = `style="width: ${barWidth}%; background-color: ${colorVar}"`;

        // Hide empty rows (except main)
        if (!isMain && planned === 0 && actual === 0) return '';

        return `
        <div class="flex-1 w-full ${mbClass}">
            <div class="flex justify-between items-end mb-1">
                <div class="flex flex-col">
                    ${labelHtml}
                    <div class="flex items-center">
                        ${iconHtml}
                        <span class="text-sm font-bold text-white flex items-baseline gap-1">
                            ${Math.round(actual)} / ${Math.round(planned)} mins
                            <span class="text-xs text-slate-400 font-normal ml-1">(${actualHrs} / ${plannedHrs} hrs)</span>
                        </span>
                    </div>
                </div>
                <span class="text-xs font-bold ${pctColor}">${rawPct}%</span>
            </div>
            <div class="relative w-full ${heightClass} bg-slate-700 rounded-full overflow-hidden">
                ${markersHtml}
                <div class="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" ${barBgStyle}></div>
            </div>
        </div>`;
    };

    // 6. Pacing Logic
    const pacingDiff = currentWeekStats.totalActual - currentWeekStats.expectedSoFar; 
    let pacingLabel = "On Track"; 
    let pacingColor = "text-slate-400"; 
    let pacingIcon = "fa-check";
    
    if (pacingDiff >= 15) { 
        pacingLabel = `${Math.round(pacingDiff)}m Ahead`; 
        pacingColor = "text-emerald-400"; 
        pacingIcon = "fa-arrow-trend-up"; 
    } else if (pacingDiff <= -15) { 
        pacingLabel = `${Math.abs(Math.round(pacingDiff))}m Behind`; 
        pacingColor = "text-orange-400"; 
        pacingIcon = "fa-triangle-exclamation"; 
    }

    const getStreakColor = (val) => val >= 3 ? "text-orange-400" : "text-slate-500";

    // 7. Final HTML
    return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-8 flex flex-col md:flex-row items-start gap-6 shadow-sm">
        <div class="flex-1 w-full">
            ${generateBarHtml('Weekly Goal', null, currentWeekStats.totalActual, currentWeekStats.totalPlanned, currentWeekStats.dailyMarkers, true, 'All')}
            ${generateBarHtml('Bike', 'fa-bicycle', currentWeekStats.bySport.Bike.actual, currentWeekStats.bySport.Bike.planned, currentWeekStats.bySport.Bike.dailyMarkers, false, 'Bike')}
            ${generateBarHtml('Run', 'fa-person-running', currentWeekStats.bySport.Run.actual, currentWeekStats.bySport.Run.planned, currentWeekStats.bySport.Run.dailyMarkers, false, 'Run')}
            ${generateBarHtml('Swim', 'fa-person-swimming', currentWeekStats.bySport.Swim.actual, currentWeekStats.bySport.Swim.planned, currentWeekStats.bySport.Swim.dailyMarkers, false, 'Swim')}
        </div>

        <div class="w-full md:w-auto md:border-l md:border-slate-700 md:pl-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-6 md:gap-4 self-center">
            
            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Pacing</span>
                <div class="flex items-center gap-2">
                    <i class="fa-solid ${pacingIcon} ${pacingColor}"></i>
                    <span class="text-lg font-bold ${pacingColor}">${pacingLabel}</span>
                </div>
                <div class="text-right md:text-left flex flex-col items-end md:items-start mt-1">
                    <span class="text-[10px] text-slate-300 font-mono">Act: ${Math.round(currentWeekStats.totalActual)}m</span>
                    <span class="text-[10px] text-slate-300 font-mono">Tgt: ${Math.round(currentWeekStats.expectedSoFar)}m</span>
                </div>
            </div>

            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Daily Streak</span>
                <div class="flex items-center gap-2" title="Consecutive weeks where every single workout was Completed">
                    <i class="fa-solid fa-calendar-day ${getStreakColor(dailyStreak)}"></i>
                    <span class="text-lg font-bold ${getStreakColor(dailyStreak)}">${dailyStreak} Wks</span>
                </div>
            </div>

            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Volume Streak</span>
                <div class="flex items-center gap-2" title="Consecutive weeks where total volume was >90%">
                    <i class="fa-solid fa-fire ${getStreakColor(volumeStreak)}"></i>
                    <span class="text-lg font-bold ${getStreakColor(volumeStreak)}">${volumeStreak} Wks</span>
                </div>
            </div>
        </div>
    </div>`;
}
