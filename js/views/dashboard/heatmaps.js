// js/views/dashboard/heatmaps.js
import { toLocalYMD, getSportColorVar } from './utils.js';

// --- Internal Helper: Consistency Grid ---
function buildConsistencyGrid(data, start, end, title, containerId = null) {
    const map = {};
    data.forEach(d => { 
        const k = toLocalYMD(d.date);
        if (!map[k]) map[k] = { p: 0, a: 0, type: '' };
        map[k].p += d.plannedDuration || 0;
        map[k].a += d.actualDuration || 0;
        if (!map[k].type) map[k].type = d.activityType || d.actualSport;
    });

    let html = '';
    let curr = new Date(start);
    const today = new Date(); today.setHours(0,0,0,0);

    // 1. Build Cells
    while (curr <= end) {
        const k = toLocalYMD(curr);
        const vals = map[k] || { p: 0, a: 0, type: '' };
        const isRest = String(vals.type).toLowerCase() === 'rest';
        
        let color = 'bg-slate-800'; 
        let titleText = `${k}`;
        let style = '';

        // -- LOGIC --
        if (vals.a > 0 && vals.p === 0) {
             // Unplanned
             color = 'bg-emerald-500';
             style = "background-image: repeating-linear-gradient(45deg, #10b981, #10b981 2px, #065f46 2px, #065f46 4px);";
             titleText += `: Unplanned ${Math.round(vals.a)}m`;
        }
        else if (vals.a > 0) {
            // Completed
            color = 'bg-emerald-500';
            titleText += `: Completed ${Math.round(vals.a)}m`;
            if (vals.p > 0 && (vals.a / vals.p) < 0.9) color = 'bg-yellow-500'; // Partial
        } 
        else if (curr > today) {
            // Future
            color = vals.p > 0 ? 'bg-slate-600' : 'bg-slate-800';
        } 
        else if (curr <= today) {
            // Past
            if (vals.p > 0 && !isRest) color = 'bg-red-500/50'; // Missed
            else if (isRest || (!vals.p && !vals.a)) color = 'bg-emerald-500/20'; // Rest
        }

        // -- SUNDAY HIDING --
        // Hide Sunday (Day 0) if no Activity and no Future Plan
        // "Ghost" the cell
        if (curr.getDay() === 0) {
            const hasAction = vals.a > 0 || (vals.p > 0 && curr >= today);
            if (!hasAction) style = 'opacity: 0; pointer-events: none;';
        }

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" style="${style}" title="${titleText}"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    // 2. Build Month Labels
    let monthsHtml = '';
    let loopDate = new Date(start);
    let lastMonth = -1;
    while (loopDate <= end) {
        const m = loopDate.getMonth();
        let label = "";
        if (m !== lastMonth) {
            label = loopDate.toLocaleDateString('en-US', { month: 'short' });
            lastMonth = m;
        }
        monthsHtml += `<div class="w-3 m-[1px] text-[9px] font-bold text-slate-500 overflow-visible whitespace-nowrap text-center">${label}</div>`;
        loopDate.setDate(loopDate.getDate() + 7);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-5 overflow-hidden h-full flex flex-col">
        <h3 class="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
            <i class="fa-solid fa-calendar-check text-slate-400"></i> ${title}
        </h3>
        <div ${idAttr} class="overflow-x-auto flex-grow pb-1 custom-scrollbar">
            <div class="flex gap-1 mb-1 w-max">${monthsHtml}</div>
            <div class="grid grid-rows-7 grid-flow-col gap-0 w-max">
                ${html}
            </div>
        </div>
        <div class="flex flex-wrap gap-4 mt-auto pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-slate-600"></div> Planned</div>
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> Done</div>
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-yellow-500"></div> Partial</div>
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-red-500/50"></div> Missed</div>
        </div>
    </div>`;
}

// --- Internal Helper: Activity Grid ---
function buildActivityGrid(data, start, end, title, containerId = null) {
    const map = {};
    data.forEach(d => { 
        if (d.actualDuration > 0) {
            const k = toLocalYMD(d.date);
            map[k] = d.actualSport || d.activityType || 'Other';
        }
    });

    let html = '';
    let curr = new Date(start);

    while (curr <= end) {
        const k = toLocalYMD(curr);
        const sport = map[k];
        
        let color = 'bg-slate-800';
        let style = '';
        
        if (sport) {
            style = `background-color: ${getSportColorVar(sport)}`;
            color = ''; 
        } 
        
        // Hide Sunday if empty
        if (curr.getDay() === 0 && !sport) {
            style = 'opacity: 0; pointer-events: none;';
        }

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" style="${style}" title="${k}: ${sport || 'No Activity'}"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    // Month Labels (Same logic)
    let monthsHtml = '';
    let loopDate = new Date(start);
    let lastMonth = -1;
    while (loopDate <= end) {
        const m = loopDate.getMonth();
        let label = "";
        if (m !== lastMonth) {
            label = loopDate.toLocaleDateString('en-US', { month: 'short' });
            lastMonth = m;
        }
        monthsHtml += `<div class="w-3 m-[1px] text-[9px] font-bold text-slate-500 overflow-visible whitespace-nowrap text-center">${label}</div>`;
        loopDate.setDate(loopDate.getDate() + 7);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-5 overflow-hidden h-full flex flex-col">
        <h3 class="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
            <i class="fa-solid fa-heart-pulse text-slate-400"></i> ${title}
        </h3>
        <div ${idAttr} class="overflow-x-auto flex-grow pb-1 custom-scrollbar">
            <div class="flex gap-1 mb-1 w-max">${monthsHtml}</div>
            <div class="grid grid-rows-7 grid-flow-col gap-0 w-max">
                ${html}
            </div>
        </div>
        <div class="flex flex-wrap gap-4 mt-auto pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm" style="background:#3b82f6"></div> Swim</div>
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm" style="background:#a855f7"></div> Bike</div>
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm" style="background:#ec4899"></div> Run</div>
        </div>
    </div>`;
}

// --- Main Export ---
export function renderHeatmaps(unifiedData) {
    const today = new Date();
    
    // 1. Trailing View (Last 6 Months)
    const endTrailing = new Date(today); 
    endTrailing.setDate(today.getDate() + 7); 
    
    const startTrailing = new Date(today); 
    startTrailing.setMonth(today.getMonth() - 6);
    // Align to Monday
    const day = startTrailing.getDay();
    const diff = startTrailing.getDate() - day + (day == 0 ? -6 : 1);
    startTrailing.setDate(diff);

    // 2. Annual View (Current Year)
    const startYear = new Date(today.getFullYear(), 0, 1);
    const yearDay = startYear.getDay();
    const yearDiff = startYear.getDate() - yearDay + (yearDay == 0 ? -6 : 1);
    startYear.setDate(yearDiff);
    
    const endYear = new Date(today.getFullYear(), 11, 31);

    // Auto-scroll
    setTimeout(() => {
        ['hm-consistency', 'hm-activity'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.scrollLeft = el.scrollWidth;
        });
    }, 100);

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-6 h-72">
            ${buildConsistencyGrid(unifiedData, startTrailing, endTrailing, "Recent Consistency", "hm-consistency")}
            ${buildActivityGrid(unifiedData, startTrailing, endTrailing, "Activity Log", "hm-activity")}
        </div>

        <div class="mt-6">
            ${buildConsistencyGrid(unifiedData, startYear, endYear, `Annual Overview (${today.getFullYear()})`, null)}
        </div>
    `;
}
