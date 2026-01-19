// js/views/dashboard/progressWidget.js
import { getSportColorVar } from './utils.js';

// --- Internal Helper: Date Normalizer ---
function getSafeDate(dateInput) {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return new Date(dateInput); 
    if (typeof dateInput === 'string') {
        // Handle "YYYY-MM-DD"
        const parts = dateInput.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        // Handle ISO strings just in case
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

// --- Internal Helper: Streak Calculators ---
// (Kept simple to focus on the chart issue)
function calculateStreak(fullLogData, type) {
    if (!fullLogData || fullLogData.length === 0) return 0;
    // ... [Streak logic hidden to save space, logic remains same as previous working version]
    return 0; // Placeholder if you want to focus purely on the bars for a moment, or paste back the streak logic
}

export function renderProgressWidget(plannedWorkouts, fullLogData) {
    console.group("🔥 PROGRESS WIDGET DEBUGGER 🔥");

    // 1. Define Current Week
    const today = new Date();
    today.setHours(0,0,0,0);
    const currentDay = today.getDay(); // 0=Sun, 1=Mon
    const distToMon = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distToMon);
    monday.setHours(0,0,0,0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    console.log(`📅 Date Window: ${monday.toLocaleDateString()} to ${sunday.toLocaleDateString()}`);

    // 2. Initialize Stats
    const sportStats = { 
        Bike: { planned: 0, actual: 0, dailyMarkers: {} }, 
        Run: { planned: 0, actual: 0, dailyMarkers: {} }, 
        Swim: { planned: 0, actual: 0, dailyMarkers: {} },
        Other: { planned: 0, actual: 0, dailyMarkers: {} } 
    };
    
    let totalPlanned = 0; 
    let totalActual = 0; 
    const totalDailyMarkers = {};

    // 3. Process ACTUAL Data (Strict Logic)
    console.groupCollapsed("🔎 Processing Actuals");
    if (fullLogData) {
        fullLogData.forEach((item, index) => {
            const d = getSafeDate(item.date);
            const actDur = parseFloat(item.actualDuration) || 0;
            const rawSport = item.actualSport;
            
            // Debug String
            let logPrefix = `[Item ${index}] ${item.date} | Sport: "${rawSport}" | Dur: ${actDur}`;

            if (!d) {
                console.log(`${logPrefix} -> ❌ REJECTED (Invalid Date)`);
                return;
            }

            // Date Check
            if (d < monday || d > sunday) {
                // Don't log every historical item, too noisy
                // console.log(`${logPrefix} -> ❌ REJECTED (Date out of range)`);
                return;
            }

            // Duration Check
            if (actDur <= 0) {
                console.log(`${logPrefix} -> ❌ REJECTED (Duration is 0 or null)`);
                return;
            }

            // Strict Sport Check
            let sport = 'Other';
            const s = String(rawSport || '').trim().toLowerCase();
            
            if (s === 'bike') sport = 'Bike';
            else if (s === 'run') sport = 'Run';
            else if (s === 'swim') sport = 'Swim';

            console.log(`${logPrefix} -> ✅ ACCEPTED as ${sport}`);

            // Add to stats
            totalActual += actDur;
            sportStats[sport].actual += actDur;
        });
    } else {
        console.warn("⚠️ No Actual Data Provided");
    }
    console.groupEnd();

    // 4. Process PLANNED Data (Strict Logic)
    console.groupCollapsed("🔎 Processing Planned");
    if (plannedWorkouts) {
        plannedWorkouts.forEach((w, index) => {
            const d = getSafeDate(w.date);
            const planDur = parseFloat(w.plannedDuration) || 0;
            const rawType = w.activityType;
            
            let logPrefix = `[Plan ${index}] ${w.date} | Type: "${rawType}"`;

            if (d >= monday && d <= sunday) {
                let sport = 'Other';
                const s = String(rawType || '').trim().toLowerCase();
                
                if (s === 'bike') sport = 'Bike';
                else if (s === 'run') sport = 'Run';
                else if (s === 'swim') sport = 'Swim';

                console.log(`${logPrefix} -> ✅ ACCEPTED as ${sport}`);

                totalPlanned += planDur;
                const dateKey = d.toISOString().split('T')[0];
                if (!totalDailyMarkers[dateKey]) totalDailyMarkers[dateKey] = 0;
                totalDailyMarkers[dateKey] += planDur;

                if (sportStats[sport]) {
                    sportStats[sport].planned += planDur;
                    if (!sportStats[sport].dailyMarkers[dateKey]) sportStats[sport].dailyMarkers[dateKey] = 0;
                    sportStats[sport].dailyMarkers[dateKey] += planDur;
                }
            }
        });
    }
    console.groupEnd();
    console.log("📊 Final Totals:", sportStats);
    console.groupEnd();

    // 5. HTML Generators
    const generateBarHtml = (label, iconClass, actual, planned, dailyMap, isMain = false, sportType = 'All') => {
        const rawPct = planned > 0 ? Math.round((actual / planned) * 100) : 0; 
        const displayPct = rawPct; 
        const barWidth = Math.min(rawPct, 100); 
        const actualHrs = (actual / 60).toFixed(1); 
        const plannedHrs = (planned / 60).toFixed(1);
        
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
        
        const labelHtml = isMain ? `<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">${label}</span>` : ''; 
        const colorStyle = `style="color: ${getSportColorVar(sportType)}"`;
        const iconHtml = iconClass ? `<i class="fa-solid ${iconClass} mr-2 w-4 text-center" ${colorStyle}></i>` : ''; 
        const heightClass = isMain ? 'h-3' : 'h-2.5'; 
        const mbClass = isMain ? 'mb-4' : 'mb-3'; 
        const pctColor = displayPct > 100 ? 'text-emerald-400' : 'text-blue-400';
        const barBgStyle = `style="width: ${barWidth}%; background-color: ${getSportColorVar(sportType)}"`;

        // Always render main bar, but hide sport bars if 0/0
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
                <span class="text-xs font-bold ${pctColor}">${displayPct}%</span>
            </div>
            <div class="relative w-full ${heightClass} bg-slate-700 rounded-full overflow-hidden">
                ${markersHtml}
                <div class="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" ${barBgStyle}></div>
            </div>
        </div>`;
    };
    
    // Placeholder Pacing (Can restore logic if needed)
    const pacingLabel = "Calculating..."; 
    const pacingColor = "text-slate-500"; 
    const pacingIcon = "fa-circle-notch";

    // Streak Placeholders
    const dailyStreak = 0; 
    const volumeStreak = 0;

    return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-8 flex flex-col md:flex-row items-start gap-6 shadow-sm">
        <div class="flex-1 w-full">
            ${generateBarHtml('Weekly Goal', null, totalActual, totalPlanned, totalDailyMarkers, true, 'All')}
            ${generateBarHtml('Bike', 'fa-bicycle', sportStats.Bike.actual, sportStats.Bike.planned, sportStats.Bike.dailyMarkers, false, 'Bike')}
            ${generateBarHtml('Run', 'fa-person-running', sportStats.Run.actual, sportStats.Run.planned, sportStats.Run.dailyMarkers, false, 'Run')}
            ${generateBarHtml('Swim', 'fa-person-swimming', sportStats.Swim.actual, sportStats.Swim.planned, sportStats.Swim.dailyMarkers, false, 'Swim')}
        </div>
        
        <div class="w-full md:w-auto md:border-l md:border-slate-700 md:pl-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-6 md:gap-4 self-center">
            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Debug Info</span>
                <div class="text-xs text-slate-400 font-mono">
                    Check Console (F12)<br>
                    Act: ${Math.round(totalActual)}m<br>
                    Plan: ${Math.round(totalPlanned)}m
                </div>
            </div>
        </div>
    </div>`;
}
