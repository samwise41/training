// js/views/dashboard/progressWidget.js
import { getSportColorVar } from './utils.js';

// --- Internal Helper: Streak Calculators ---
function calculateDailyStreak(fullLogData) {
    if (!fullLogData || fullLogData.length === 0) {
        console.log("Streak Calc: No data available.");
        return 0;
    }

    // 1. Setup Current Week Boundary (Start of this week, Monday)
    const today = new Date(); 
    today.setHours(0,0,0,0);
    const dayOfWeek = today.getDay(); 
    const currentWeekStart = new Date(today); 
    currentWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // 2. Group Data by Week
    const weeksMap = {};
    fullLogData.forEach(item => {
        if (!item.date) return;
        
        // Fix: Parse YYYY-MM-DD string to local date
        const parts = item.date.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]); 
        
        const day = d.getDay(); 
        const weekStart = new Date(d); 
        weekStart.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        weekStart.setHours(0,0,0,0);
        
        // Ignore the current partial week for streak calculation
        if (weekStart >= currentWeekStart) return; 
        
        const key = weekStart.toISOString().split('T')[0];
        if (!weeksMap[key]) weeksMap[key] = { failed: false };
        
        // Check for failures
        if (item.plannedDuration > 0) {
            // Check status (handle both JSON "Status" and older formats if mixed)
            const statusStr = (item.Status || item.status || '').toUpperCase();
            
            // Logic: It counts as failed if it wasn't completed AND had no duration
            // You might want to tighten this to just checking "MISSED" or "SKIPPED" depending on your JSON
            const isCompleted = statusStr === 'COMPLETED' || (item.actualDuration > 0);
            
            if (!isCompleted) {
                weeksMap[key].failed = true;
            }
        }
    });

    // 3. Count Backwards
    let streak = 0; 
    let checkDate = new Date(currentWeekStart); 
    checkDate.setDate(checkDate.getDate() - 7); // Start checking from last week

    for (let i = 0; i < 260; i++) { // Check up to 5 years back
        const key = checkDate.toISOString().split('T')[0]; 
        const weekData = weeksMap[key];
        
        // If we have no data for a week, break the streak (assuming you log every week)
        // OR: If the week exists but contains a failure, break.
        if (!weekData) break; 
        if (weekData.failed) break; 
        
        streak++; 
        checkDate.setDate(checkDate.getDate() - 7);
    }
    
    return streak;
}

function calculateVolumeStreak(fullLogData) {
    if (!fullLogData || fullLogData.length === 0) return 0;

    const today = new Date(); 
    today.setHours(0,0,0,0);
    const dayOfWeek = today.getDay(); 
    const currentWeekStart = new Date(today); 
    currentWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weeksMap = {};
    fullLogData.forEach(item => {
        if (!item.date) return;
        
        const parts = item.date.split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]); 
        
        const day = d.getDay(); 
        const weekStart = new Date(d); 
        weekStart.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        weekStart.setHours(0,0,0,0);
        
        if (weekStart >= currentWeekStart) return;

        const key = weekStart.toISOString().split('T')[0];
        if (!weeksMap[key]) weeksMap[key] = { planned: 0, actual: 0 };
        
        weeksMap[key].planned += (item.plannedDuration || 0);
        weeksMap[key].actual += (item.actualDuration || 0);
    });

    let streak = 0; 
    let checkDate = new Date(currentWeekStart); 
    checkDate.setDate(checkDate.getDate() - 7); 

    for (let i = 0; i < 260; i++) { 
        const key = checkDate.toISOString().split('T')[0]; 
        const stats = weeksMap[key];
        
        if (!stats) break; // Gap in logs
        
        if (stats.planned === 0) {
            streak++; // Recover weeks count as streaks
        } else { 
            const ratio = stats.actual / stats.planned; 
            if (ratio >= 0.95) streak++; else break; 
        }
        checkDate.setDate(checkDate.getDate() - 7);
    }

    return streak;
}

// --- Main Component ---
export function renderProgressWidget(plannedWorkouts, fullLogData) {
    console.group("🚀 Progress Widget Debug Start");
    console.log("Inputs:", { planned: plannedWorkouts?.length, actuals: fullLogData?.length });

    // 1. Strictly Define Current Week (Monday - Sunday)
    const today = new Date();
    today.setHours(0,0,0,0);
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon
    
    // Calculate Monday (Start of Week)
    const distToMon = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distToMon);
    monday.setHours(0,0,0,0);

    // Calculate Sunday (End of Week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    console.log(`📅 Current Week Window: ${monday.toDateString()} to ${sunday.toDateString()}`);

    // 2. Initialize Stats
    const sportStats = { 
        Bike: { planned: 0, actual: 0, dailyMarkers: {} }, 
        Run: { planned: 0, actual: 0, dailyMarkers: {} }, 
        Swim: { planned: 0, actual: 0, dailyMarkers: {} },
        Other: { planned: 0, actual: 0, dailyMarkers: {} } 
    };
    
    let totalPlanned = 0; 
    let totalActual = 0; 
    let expectedSoFar = 0; 
    const totalDailyMarkers = {};

    // Helper: Normalize sport names from JSON
    const normalizeSport = (type) => {
        if (!type) return 'Other';
        const t = type.toLowerCase();
        if (t === 'bike' || t === 'virtual_ride' || t === 'road_biking' || t === 'indoor_cycling') return 'Bike';
        if (t === 'run' || t === 'running') return 'Run';
        if (t === 'swim' || t === 'swimming' || t === 'lap_swimming') return 'Swim';
        return 'Other';
    };

    const now = new Date(); 

    // 3. Process PLANNED Data (from planned.json)
    if (plannedWorkouts) {
        plannedWorkouts.forEach(w => {
            // Parse "YYYY-MM-DD" safely
            const parts = w.date.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]); 
            
            if (d >= monday && d <= sunday) {
                const planDur = w.plannedDuration || 0;
                const dateKey = w.date; // Use string directly as key
                
                totalPlanned += planDur;
                
                // If the workout date is in the past (or today), add to "expectedSoFar"
                // Note: This adds the full duration if today is the day.
                if (d < now) expectedSoFar += planDur;

                if (!totalDailyMarkers[dateKey]) totalDailyMarkers[dateKey] = 0;
                totalDailyMarkers[dateKey] += planDur;

                const sport = normalizeSport(w.activityType);
                if (sportStats[sport]) {
                    sportStats[sport].planned += planDur;
                    if (!sportStats[sport].dailyMarkers[dateKey]) sportStats[sport].dailyMarkers[dateKey] = 0;
                    sportStats[sport].dailyMarkers[dateKey] += planDur;
                }
            }
        });
    }

    // 4. Process ACTUAL Data (from training_log.json)
    if (fullLogData) {
        fullLogData.forEach(item => {
            if (!item.date) return;
            const parts = item.date.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]); 
            
            // Strict Filter: Current Week Only
            if (d >= monday && d <= sunday) {
                const actDur = parseFloat(item.actualDuration) || 0;
                
                if (actDur > 0) {
                    totalActual += actDur;
                    
                    // Use actualSport from log if available, otherwise guess or use activityType
                    const sportRaw = item.actualSport || item.activityType || 'Other';
                    const sport = normalizeSport(sportRaw);

                    if (sportStats[sport]) {
                        sportStats[sport].actual += actDur;
                    } else {
                        sportStats.Other.actual += actDur;
                    }
                }
            }
        });
    }

    console.log(`📊 Totals -> Planned: ${totalPlanned}m, Actual: ${totalActual}m`);
    console.groupEnd();

    // 5. HTML Generation Helpers
    const generateBarHtml = (label, iconClass, actual, planned, dailyMap, isMain = false, sportType = 'All') => {
        const rawPct = planned > 0 ? Math.round((actual / planned) * 100) : 0; 
        const displayPct = rawPct; 
        const barWidth = Math.min(rawPct, 100); 
        const actualHrs = (actual / 60).toFixed(1); 
        const plannedHrs = (planned / 60).toFixed(1);
        
        // Markers logic (little ticks for daily workouts)
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

        // If no plan and no actual, hide the row (except main)
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
    
    // Pacing Logic
    const pacingDiff = totalActual - expectedSoFar; 
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
    
    const totalActualHrsPacing = (totalActual / 60).toFixed(1); 
    const expectedHrs = (expectedSoFar / 60).toFixed(1);

    // Streaks (Calculated from History)
    const dailyStreak = calculateDailyStreak(fullLogData);
    const volumeStreak = calculateVolumeStreak(fullLogData);

    const getStreakColor = (val) => {
        if (val >= 8) return "text-red-500";
        if (val >= 3) return "text-orange-400";
        return "text-slate-500";
    };
    
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
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Pacing</span>
                <div class="flex items-center gap-2">
                    <i class="fa-solid ${pacingIcon} ${pacingColor}"></i>
                    <span class="text-lg font-bold ${pacingColor}">${pacingLabel}</span>
                </div>
                <div class="text-right md:text-left flex flex-col items-end md:items-start mt-1">
                    <span class="text-[10px] text-slate-300 font-mono">Act: ${Math.round(totalActual)}m <span class="text-slate-500">(${totalActualHrsPacing}h)</span></span>
                    <span class="text-[10px] text-slate-300 font-mono">Tgt: ${Math.round(expectedSoFar)}m <span class="text-slate-500">(${expectedHrs}h)</span></span>
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
                <div class="flex items-center gap-2" title="Consecutive weeks where total volume was >95%">
                    <i class="fa-solid fa-fire ${getStreakColor(volumeStreak)}"></i>
                    <span class="text-lg font-bold ${getStreakColor(volumeStreak)}">${volumeStreak} Wks</span>
                </div>
            </div>
        </div>
    </div>`;
}
