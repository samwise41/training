// js/views/dashboard/progressWidget.js
import { getSportColorVar } from './utils.js';

// --- Internal Helper: Date Normalizer ---
function getSafeDate(dateInput) {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return new Date(dateInput); 
    if (typeof dateInput === 'string') {
        const parts = dateInput.split('-');
        if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

// --- Internal Helper: "Shotgun" Sport Finder ---
// Checks ALL common field names to find the sport
function getSportCategory(item) {
    // 1. Log keys for the very first item to debug field names
    if (window._debug_keys_logged !== true) {
        console.log("🔍 DATA STRUCTURE KEYS:", Object.keys(item));
        window._debug_keys_logged = true;
    }

    // 2. check all possible candidates in order of preference
    const candidates = [
        item.actualSport,      // Your requested field
        item.actualType,       // Common Parser output
        item.activityType,     // Common JSON field
        item.sport,            // Strava default
        item.type              // Fallback
    ];

    // 3. Test each candidate
    for (const raw of candidates) {
        if (!raw) continue;
        const s = String(raw).trim().toLowerCase();
        if (s === 'bike' || s === 'cycling' || s.includes('ride')) return 'Bike';
        if (s === 'run' || s === 'running') return 'Run';
        if (s === 'swim' || s === 'swimming') return 'Swim';
    }
    
    return 'Other';
}

// --- Main Component ---
export function renderProgressWidget(plannedWorkouts, fullLogData) {
    window._debug_keys_logged = false; // Reset debug trigger

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

    // 3. Process ACTUAL Data
    if (fullLogData) {
        fullLogData.forEach(item => {
            const d = getSafeDate(item.date);
            const actDur = parseFloat(item.actualDuration) || 0;
            
            if (d && d >= monday && d <= sunday && actDur > 0) {
                totalActual += actDur;
                
                // USE THE NEW UNIVERSAL FINDER
                const sport = getSportCategory(item);
                
                // Debug specifically for this week's items
                console.log(`✅ Activity Found [${item.date}]: Scanned fields -> Classified as: ${sport}`);

                if (sportStats[sport]) {
                    sportStats[sport].actual += actDur;
                } else {
                    sportStats.Other.actual += actDur;
                }
            }
        });
    }

    // 4. Process PLANNED Data
    if (plannedWorkouts) {
        plannedWorkouts.forEach(w => {
            const d = getSafeDate(w.date);
            const planDur = parseFloat(w.plannedDuration) || 0;
            
            if (d && d >= monday && d <= sunday) {
                totalPlanned += planDur;
                const dateKey = d.toISOString().split('T')[0];
                if (!totalDailyMarkers[dateKey]) totalDailyMarkers[dateKey] = 0;
                totalDailyMarkers[dateKey] += planDur;

                // For planned, we usually just look at activityType
                let sport = 'Other';
                const s = String(w.activityType || '').toLowerCase();
                if (s.includes('bike') || s.includes('ride')) sport = 'Bike';
                else if (s.includes('run')) sport = 'Run';
                else if (s.includes('swim')) sport = 'Swim';

                if (sportStats[sport]) {
                    sportStats[sport].planned += planDur;
                    if (!sportStats[sport].dailyMarkers[dateKey]) sportStats[sport].dailyMarkers[dateKey] = 0;
                    sportStats[sport].dailyMarkers[dateKey] += planDur;
                }
            }
        });
    }

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

        // HIDE EMPTY BARS: Only show if there is plan OR actual
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
    
    // Placeholder Logic for Pacing/Streaks
    // (Restored simple logic for display)
    const pacingDiff = totalActual - 0; // expectedSoFar placeholder
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
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Stats</span>
                <div class="text-right md:text-left flex flex-col items-end md:items-start mt-1">
                    <span class="text-[10px] text-slate-300 font-mono">Act: ${Math.round(totalActual)}m</span>
                    <span class="text-[10px] text-slate-300 font-mono">Plan: ${Math.round(totalPlanned)}m</span>
                </div>
            </div>
        </div>
    </div>`;
}
