// js/views/dashboard/progressWidget.js
import { getSportColorVar } from './utils.js';

export function renderProgressWidget(workouts, fullLogData) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const currentDay = today.getDay(); 
    
    // Define Current Week (Sunday - Saturday)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);
    sunday.setHours(0,0,0,0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23,59,59,999);

    // Initialize Stats
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

    // Process Data
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

    if (fullLogData) {
        fullLogData.forEach(item => {
            if (!item.date) return;
            const d = new Date(item.date);
            if (d >= sunday && d <= saturday) {
                const actDur = parseFloat(item.actualDuration) || 0;
                if (actDur > 0) {
                    totalActual += actDur;
                    const actSport = detectSport(item.actualName || "");
                    if (sportStats[actSport]) sportStats[actSport].actual += actDur;
                    else sportStats.Other.actual += actDur;
                }
            }
        });
    }

    // Async Fetch for Streaks only
    setTimeout(async () => {
        try {
            const res = await fetch('data/dashboard/streaks.json');
            if (res.ok) {
                const data = await res.json();
                const dailyEl = document.getElementById('streak-daily-val');
                const volumeEl = document.getElementById('streak-volume-val');
                if (dailyEl) dailyEl.innerText = `${data.daily_streak} Wks`;
                if (volumeEl) volumeEl.innerText = `${data.volume_streak} Wks`;
                
                // Update colors based on streak value
                [dailyEl, volumeEl].forEach(el => {
                    const val = parseInt(el.innerText);
                    if (val >= 8) el.className = 'text-lg font-bold text-red-500';
                    else if (val >= 3) el.className = 'text-lg font-bold text-orange-400';
                });
            }
        } catch (e) { console.warn("Streak load failed"); }
    }, 100);

    const generateBarHtml = (label, iconClass, actual, planned, dailyMap, isMain = false, sportType = 'All') => {
        const rawPct = planned > 0 ? Math.round((actual / planned) * 100) : 0; 
        const barWidth = Math.min(rawPct, 100); 
        const color = getSportColorVar(sportType);
        
        let markersHtml = ''; 
        if (planned > 0) { 
            let runningTotal = 0;
            Object.keys(dailyMap).sort().forEach(day => {
                runningTotal += dailyMap[day];
                const pct = (runningTotal / planned) * 100;
                if (pct < 100) markersHtml += `<div class="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10" style="left: ${pct}%"></div>`;
            });
        }
        
        if (!isMain && planned === 0 && actual === 0) return '';

        return `
        <div class="flex-1 w-full ${isMain ? 'mb-4' : 'mb-3'}">
            <div class="flex justify-between items-end mb-1">
                <div class="flex flex-col">
                    ${isMain ? `<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">${label}</span>` : ''}
                    <div class="flex items-center">
                        ${iconClass ? `<i class="fa-solid ${iconClass} mr-2 w-4 text-center" style="color: ${color}"></i>` : ''}
                        <span class="text-sm font-bold text-white flex items-baseline gap-1">
                            ${Math.round(actual)} / ${Math.round(planned)} mins
                        </span>
                    </div>
                </div>
                <span class="text-xs font-bold ${rawPct >= 100 ? 'text-emerald-400' : 'text-blue-400'}">${rawPct}%</span>
            </div>
            <div class="relative w-full ${isMain ? 'h-3' : 'h-2.5'} bg-slate-700 rounded-full overflow-hidden">
                ${markersHtml}
                <div class="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" style="width: ${barWidth}%; background-color: ${color}"></div>
            </div>
        </div>`;
    };

    const pacingDiff = totalActual - expectedSoFar; 
    const pacingColor = pacingDiff >= 15 ? "text-emerald-400" : (pacingDiff <= -15 ? "text-orange-400" : "text-slate-400");

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
                    <i class="fa-solid ${pacingDiff >= 15 ? 'fa-arrow-trend-up' : (pacingDiff <= -15 ? 'fa-triangle-exclamation' : 'fa-check')} ${pacingColor}"></i>
                    <span class="text-lg font-bold ${pacingColor}">${pacingDiff >= 15 ? 'Ahead' : (pacingDiff <= -15 ? 'Behind' : 'On Track')}</span>
                </div>
            </div>
            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Daily Streak</span>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-calendar-day text-slate-500"></i>
                    <span id="streak-daily-val" class="text-lg font-bold text-slate-500">-- Wks</span>
                </div>
            </div>
            <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Volume Streak</span>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-fire text-slate-500"></i>
                    <span id="streak-volume-val" class="text-lg font-bold text-slate-500">-- Wks</span>
                </div>
            </div>
        </div>
    </div>`;
}
