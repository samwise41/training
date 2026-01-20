// js/views/dashboard/progressWidget.js
import { getSportColorVar } from './utils.js';

/**
 * Renders the Progress Widget with Bar Charts and pre-calculated Python Streaks
 */
export async function renderProgressWidget(workouts, fullLogData) {
    // 1. Fetch pre-calculated streaks from Python output
    let streaks = { daily_streak: 0, volume_streak: 0 };
    try {
        const streakRes = await fetch('data/dashboard/streaks.json');
        if (streakRes.ok) {
            streaks = await streakRes.json();
        }
    } catch (e) { 
        console.warn("Streak data not found, defaulting to 0"); 
    }

    // 2. Define Current Week (Sunday - Saturday) to match Python logic
    const today = new Date();
    today.setHours(0,0,0,0);
    const currentDay = today.getDay(); // Sunday is 0
    
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);
    sunday.setHours(0,0,0,0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23,59,59,999);

    // 3. Initialize Stats
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
    const now = new Date(); 

    const detectSport = (txt) => {
        if (!txt) return 'Other';
        const t = txt.toUpperCase();
        if (t.includes('[RUN]')) return 'Run';
        if (t.includes('[BIKE]')) return 'Bike';
        if (t.includes('[SWIM]')) return 'Swim';
        return 'Other';
    };

    // 4. Process PLANNED Data
    if (workouts) {
        workouts.forEach(w => {
            const d = new Date(w.date);
            if (d >= sunday && d <= saturday) {
                const planDur = w.plannedDuration || 0;
                const dateKey = w.date.toISOString().split('T')[0];
                
                totalPlanned += planDur;
                if (d < now) expectedSoFar += planDur;

                if (!totalDailyMarkers[dateKey]) totalDailyMarkers[dateKey] = 0;
                totalDailyMarkers[dateKey] += planDur;

                const planSport = detectSport(w.planName);
                if (sportStats[planSport]) {
                    sportStats[planSport].planned += planDur;
                    if (!sportStats[planSport].dailyMarkers[dateKey]) sportStats[planSport].dailyMarkers[dateKey] = 0;
                    sportStats[planSport].dailyMarkers[dateKey] += planDur;
                }
            }
        });
    }

    // 5. Process ACTUAL Data
    if (fullLogData) {
        fullLogData.forEach(item => {
            if (!item.date) return;
            const d = new Date(item.date);
            if (d >= sunday && d <= saturday) {
                const actDur = parseFloat(item.actualDuration) || 0;
                if (actDur > 0) {
                    totalActual += actDur;
                    const nameToCheck = item.actualName || "";
                    const actSport = detectSport(nameToCheck);
                    if (sportStats[actSport]) {
                        sportStats[actSport].actual += actDur;
                    } else {
                        sportStats.Other.actual += actDur;
                    }
                }
            }
        });
    }

    // 6. Formatting Helper for Bar Charts
    const generateBarHtml = (label, iconClass, actual, planned, dailyMap, isMain = false, sportType = 'All') => {
        const rawPct = planned > 0 ? Math.round((actual / planned) * 100) : 0; 
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
        const iconHtml = iconClass ? `<i class="fa-solid ${iconClass} mr-2 w-4 text-center" style="color: ${getSportColorVar(sportType)}"></i>` : ''; 
        const heightClass = isMain ? 'h-3' : 'h-2.5'; 
        const mbClass = isMain ? 'mb-4' : 'mb-3'; 
        const pctColor = rawPct > 100 ? 'text-emerald-400' : 'text-blue-400';
        const barBgStyle = `style="width: ${barWidth}%; background-color: ${getSportColorVar(sportType)}"`;

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

    const getStreakColor = (val) => {
        if (val >= 8) return "text-red-500";
        if (val >= 3) return "text-orange-400";
        return "text-slate-500";
    };
    
    // Final Template
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
                    <i class="fa-solid fa-calendar-day ${getStreakColor(streaks.daily_streak)}"></i>
                    <span class="text-lg font-bold ${getStreakColor(streaks.daily_streak)}">${streaks.daily_streak} Wks</span>
                </div>
            </div>

            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Volume Streak</span>
                <div class="flex items-center gap-2" title="Consecutive weeks where total volume was >95%">
                    <i class="fa-solid fa-fire ${getStreakColor(streaks.volume_streak)}"></i>
                    <span class="text-lg font-bold ${getStreakColor(streaks.volume_streak)}">${streaks.volume_streak} Wks</span>
                </div>
            </div>
        </div>
    </div>`;
}
