// js/views/dashboard/heatmaps.js
import { toLocalYMD } from './utils.js';

// --- CSS Vars for Activity Types ---
const getSportColorVar = (type) => {
    if (type === 'Bike') return 'var(--color-bike)';
    if (type === 'Run') return 'var(--color-run)';
    if (type === 'Swim') return 'var(--color-swim)';
    if (type === 'Strength') return 'var(--color-strength, #a855f7)';
    return 'var(--color-all)';
};

// --- Heatmap 1: Consistency (Planned vs Actual) ---
function buildGenericHeatmap(logData, startDate, endDate, title, dateToKeyFn, containerId = null) {
    if (!logData) logData = [];
    
    // 1. Group Data
    const dataMap = {}; 
    logData.forEach(item => { 
        if (!item.date) return;
        const dateKey = dateToKeyFn(item.date); 
        if (!dataMap[dateKey]) dataMap[dateKey] = []; 
        dataMap[dateKey].push(item); 
    });
    
    const today = new Date(); 
    today.setHours(0,0,0,0);
    
    // Styles
    const stripeStyle = "background-image: repeating-linear-gradient(45deg, #10b981, #10b981 3px, #065f46 3px, #065f46 6px);";
    
    const getHexColor = (cls) => {
        if (cls.includes('emerald-500')) return '#10b981';
        if (cls.includes('yellow-500')) return '#eab308';
        if (cls.includes('red-500')) return '#ef4444';
        if (cls.includes('purple-500')) return '#a855f7';
        if (cls.includes('slate-700')) return '#334155';
        return '#94a3b8';
    };

    // 2. Build Grid
    const startDay = startDate.getDay(); 
    let cellsHtml = ''; 
    for (let i = 0; i < startDay; i++) { 
        cellsHtml += `<div class="w-3 h-3 m-[1px] opacity-0"></div>`; 
    }
    
    let currentDate = new Date(startDate);
    const maxLoops = 400; let loops = 0;
    
    while (currentDate <= endDate && loops < maxLoops) {
        loops++; 
        const dateKey = dateToKeyFn(currentDate); 
        const dayOfWeek = currentDate.getDay(); 
        const dayData = dataMap[dateKey]; 
        
        let colorClass = 'bg-slate-800'; 
        let statusLabel = "Empty"; 
        let inlineStyle = ""; 
        
        let totalPlan = 0; 
        let totalAct = 0; 
        let isRestType = false; 
        let sportLabel = "--";
        const uniqueTypes = new Set();
        let detailList = [];

        // 3. Aggregate Day Data
        if (dayData && dayData.length > 0) { 
            dayData.forEach(d => { 
                const pDur = parseFloat(d.plannedDuration) || 0;
                const aDur = parseFloat(d.actualDuration) || 0;
                totalPlan += pDur; 
                totalAct += aDur; 
                
                const type = d.activityType || d.actualSport || 'Other';
                if (type === 'Rest') isRestType = true;
                if (type && type !== 'Rest') uniqueTypes.add(type);

                const name = (d.actualWorkout || d.plannedWorkout || d.planName || 'Workout').replace(/['"]/g, ""); 
                const durDisplay = aDur > 0 ? `${aDur}m` : `${pDur}m`;
                detailList.push(`${name} (${durDisplay})`);
            }); 
            
            if (uniqueTypes.size > 0) sportLabel = Array.from(uniqueTypes).join(' + ');
            else if (isRestType) sportLabel = "Rest Day";
        }
        
        const detailStr = detailList.join('<br>');
        const hasActivity = (totalPlan > 0 || totalAct > 0);
        
        // 4. Determine Cell Color
        if (totalAct > 0 && totalPlan === 0) { 
            colorClass = 'bg-emerald-500'; 
            inlineStyle = stripeStyle; 
            statusLabel = "Unplanned"; 
        } 
        else if (totalPlan > 0) {
            if (totalAct === 0) { 
                // Only mark missed if it's in the past
                if (currentDate < today) {
                    colorClass = 'bg-red-500/80'; 
                    statusLabel = "Missed";
                } else {
                    colorClass = 'bg-slate-700';
                    statusLabel = "Planned";
                }
            } else { 
                const ratio = totalAct / totalPlan; 
                if (ratio >= 0.95) { colorClass = 'bg-emerald-500'; statusLabel = "Completed"; } 
                else { colorClass = 'bg-yellow-500'; statusLabel = `Partial (${Math.round(ratio*100)}%)`; } 
            }
        } 
        else {
            // No Plan, No Actual
            if (isRestType) {
                colorClass = 'bg-emerald-500/50'; 
                statusLabel = "Rest Day";
            } else {
                // Infer Rest Day if in the past
                if (currentDate <= today) {
                    colorClass = 'bg-emerald-500/50';
                    statusLabel = "Rest Day";
                } else {
                    colorClass = 'bg-slate-800'; // Future empty
                    statusLabel = "Future";
                }
            }
        }

        // 5. Hide Empty Sundays
        // Hide if Sunday AND no real work done/planned
        if (dayOfWeek === 0 && !hasActivity) { 
            // If it was inferred as Rest Day, we still hide it on Sunday for layout cleanliness
            // unless there is explicit data.
            inlineStyle = 'opacity: 0;'; 
            colorClass = '';
        }

        const hexColor = getHexColor(colorClass);
        const isVisible = !(dayOfWeek === 0 && !hasActivity);
        
        const clickAttr = isVisible ? 
            `onclick="window.showDashboardTooltip(event, '${dateKey}', ${totalPlan}, ${totalAct}, '${statusLabel.replace(/'/g, "\\'")}', '${hexColor}', '${sportLabel}', '${detailStr}')"` : '';
        const cursorClass = isVisible ? 'cursor-pointer hover:opacity-80' : '';

        cellsHtml += `<div class="w-3 h-3 rounded-sm ${colorClass} ${cursorClass} m-[1px]" style="${inlineStyle}" ${clickAttr}></div>`;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 6. Build Month Labels
    let monthsHtml = '';
    let loopDate = new Date(startDate);
    loopDate.setDate(loopDate.getDate() - loopDate.getDay());
    let lastMonth = -1;
    const labelLoopsMax = 60; let labelLoops = 0;
    while (loopDate <= endDate && labelLoops < labelLoopsMax) {
        labelLoops++;
        const m = loopDate.getMonth();
        let label = "";
        if (m !== lastMonth) {
            label = loopDate.toLocaleDateString('en-US', { month: 'short' });
            lastMonth = m;
        }
        monthsHtml += `<div class="w-3 m-[1px] text-[9px] font-bold text-slate-500 overflow-visible whitespace-nowrap">${label}</div>`;
        loopDate.setDate(loopDate.getDate() + 7);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col">
            <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-calendar-check text-slate-400"></i> ${title}
            </h3>
            <div ${idAttr} class="overflow-x-auto pb-4 flex-grow">
                <div class="grid grid-rows-1 grid-flow-col gap-1 w-max mx-auto mb-1">
                    ${monthsHtml}
                </div>
                <div class="grid grid-rows-7 grid-flow-col gap-1 w-max mx-auto">
                    ${cellsHtml}
                </div>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-slate-700"></div> Planned</div>
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-emerald-500"></div> Done</div>
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-yellow-500"></div> Partial</div>
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-red-500/80"></div> Missed</div>
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-emerald-500/50"></div> Rest</div>
            </div>
        </div>
    `;
}

// --- Heatmap 2: Activity Types (Actuals Only) ---
function buildActivityHeatmap(logData, startDate, endDate, title, dateToKeyFn, containerId = null) {
    if (!logData) logData = [];

    // Sport Detector
    const detectSport = (item) => {
        const raw = item.actualSport || item.activityType || item.sport || '';
        const name = String(item.actualWorkout || item.activityName || raw).toUpperCase();
        const type = String(raw).toUpperCase();

        if (type.includes('RUN') || name.includes('[RUN]')) return 'Run';
        if (type.includes('BIKE') || type.includes('RIDE') || type.includes('CYCL') || name.includes('[BIKE]')) return 'Bike';
        if (type.includes('SWIM') || name.includes('[SWIM]')) return 'Swim';
        if (type.includes('STRENGTH') || name.includes('STRENGTH')) return 'Strength';
        return 'Other';
    };
    
    // Group Actuals
    const activityMap = {};
    logData.forEach(item => {
        const dur = parseFloat(item.actualDuration) || 0;
        // Only count if meaningful duration exists
        if (dur > 0 && item.date) {
            const key = dateToKeyFn(item.date);
            if (!activityMap[key]) activityMap[key] = { sports: new Set(), totalAct: 0, details: [] };
            
            const detected = detectSport(item);
            activityMap[key].sports.add(detected);
            activityMap[key].totalAct += dur;

            const name = (item.actualWorkout || item.activityName || 'Activity').replace(/['"]/g, "");
            activityMap[key].details.push(`${name} (${dur}m)`);
        }
    });

    const startDay = startDate.getDay();
    let cellsHtml = '';
    
    for (let i = 0; i < startDay; i++) {
        cellsHtml += `<div class="w-3 h-3 m-[1px] opacity-0"></div>`; 
    }

    let currentDate = new Date(startDate);
    const maxLoops = 400; let loops = 0;
    
    while (currentDate <= endDate && loops < maxLoops) {
        loops++;
        const dateKey = dateToKeyFn(currentDate);
        const dayOfWeek = currentDate.getDay();
        const entry = activityMap[dateKey];
        
        let style = '';
        let colorClass = 'bg-slate-800'; 
        let detailStr = '';
        let totalMinutes = 0;
        let hasActivity = false;

        if (entry) {
            hasActivity = true;
            totalMinutes = entry.totalAct;
            const sports = Array.from(entry.sports);
            detailStr = entry.details.join('<br>');

            if (sports.length === 1) {
                style = `background-color: ${getSportColorVar(sports[0])};`;
                colorClass = ''; 
            } else if (sports.length > 1) {
                // Gradient for multisport
                const step = 100 / sports.length;
                let gradientStr = 'linear-gradient(135deg, ';
                sports.forEach((s, idx) => {
                    const c = getSportColorVar(s);
                    const startPct = idx * step;
                    const endPct = (idx + 1) * step;
                    gradientStr += `${c} ${startPct}% ${endPct}%,`;
                });
                style = `background: ${gradientStr.slice(0, -1)});`;
                colorClass = '';
            }
        }

        // VISIBILITY: Hide Sundays unless a workout happened
        if (dayOfWeek === 0 && !hasActivity) {
            style = 'opacity: 0;';
            colorClass = '';
        }

        const clickAttr = hasActivity ? 
            `onclick="window.showDashboardTooltip(event, '${dateKey}', 0, ${totalMinutes}, 'Completed', '#fff', 'Activity', '${detailStr}')"` : '';
        const cursorClass = hasActivity ? 'cursor-pointer hover:opacity-80' : '';

        cellsHtml += `<div class="w-3 h-3 rounded-sm ${colorClass} ${cursorClass} m-[1px]" style="${style}" ${clickAttr}></div>`;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Month Labels
    let monthsHtml = '';
    let loopDate = new Date(startDate);
    loopDate.setDate(loopDate.getDate() - loopDate.getDay());
    let lastMonth = -1;
    while (loopDate <= endDate) {
        const m = loopDate.getMonth();
        let label = "";
        if (m !== lastMonth) {
            label = loopDate.toLocaleDateString('en-US', { month: 'short' });
            lastMonth = m;
        }
        monthsHtml += `<div class="w-3 m-[1px] text-[9px] font-bold text-slate-500 overflow-visible whitespace-nowrap">${label}</div>`;
        loopDate.setDate(loopDate.getDate() + 7);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col">
            <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <i class="fa-solid fa-heart-pulse text-slate-400"></i> ${title}
            </h3>
            <div ${idAttr} class="overflow-x-auto pb-4 flex-grow">
                <div class="grid grid-rows-1 grid-flow-col gap-1 w-max mx-auto mb-1">
                    ${monthsHtml}
                </div>
                <div class="grid grid-rows-7 grid-flow-col gap-1 w-max mx-auto">
                    ${cellsHtml}
                </div>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm" style="background-color: var(--color-swim)"></div> Swim</div>
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm" style="background-color: var(--color-bike)"></div> Bike</div>
                <div class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm" style="background-color: var(--color-run)"></div> Run</div>
            </div>
        </div>
    `;
}

// --- Main Render Function (Simplified) ---
export function renderHeatmaps(logData) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const endOfWeek = new Date(today); 
    const dayOfWeek = endOfWeek.getDay(); 
    const distToSaturday = 6 - dayOfWeek;
    endOfWeek.setDate(endOfWeek.getDate() + distToSaturday); 

    const startTrailing = new Date(endOfWeek); 
    startTrailing.setMonth(startTrailing.getMonth() - 6);
    
    const startYear = new Date(today.getFullYear(), 0, 1); 
    const endYear = new Date(today.getFullYear(), 11, 31);
    
    // 1. Consistency Heatmap
    const heatmapTrailingHtml = buildGenericHeatmap(logData, startTrailing, endOfWeek, "Recent Consistency (Trailing 6 Months)", toLocalYMD, "heatmap-trailing-scroll");
    
    // 2. Activity Heatmap
    const heatmapActivityHtml = buildActivityHeatmap(logData, startTrailing, endOfWeek, "Activity Log (Workout Types)", toLocalYMD, "heatmap-activity-scroll");

    // 3. Annual Overview
    const heatmapYearHtml = buildGenericHeatmap(logData, startYear, endYear, `Annual Overview (${today.getFullYear()})`, toLocalYMD, null);

    setTimeout(() => {
        const scrollIds = ['heatmap-trailing-scroll', 'heatmap-activity-scroll'];
        scrollIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.scrollLeft = el.scrollWidth;
        });
    }, 50);

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            ${heatmapTrailingHtml}
            ${heatmapActivityHtml}
        </div>
        <div class="mt-8">
            ${heatmapYearHtml}
        </div>
    `;
}
