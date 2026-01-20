// js/views/dashboard/heatmaps.js
import { toLocalYMD, getSportColorVar } from './utils.js';

// --- Internal Helper: Build Consistency Grid ---
function buildConsistencyGrid(data, start, end, title, containerId = null) {
    const map = {};
    data.forEach(d => { 
        const k = toLocalYMD(d.date);
        if (!map[k]) map[k] = { p: 0, a: 0, type: '' };
        map[k].p += d.plannedDuration || 0;
        map[k].a += d.actualDuration || 0;
        // Capture type for Rest Day detection
        if (!map[k].type) map[k].type = d.activityType || d.actualSport;
    });

    let html = '';
    let curr = new Date(start);
    const today = new Date(); today.setHours(0,0,0,0);

    // Header Month Labels
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
        monthsHtml += `<div class="w-3 m-[1px] text-[9px] font-bold text-slate-500 overflow-visible whitespace-nowrap">${label}</div>`;
        loopDate.setDate(loopDate.getDate() + 7);
    }

    // Grid Cells
    while (curr <= end) {
        const k = toLocalYMD(curr);
        const vals = map[k] || { p: 0, a: 0, type: '' };
        
        let color = 'bg-slate-800'; // Default Empty
        let titleText = `${k}`;
        let style = '';

        const isRest = String(vals.type).toLowerCase() === 'rest';

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
            // Partial check
            if (vals.p > 0 && (vals.a / vals.p) < 0.9) {
                color = 'bg-yellow-500';
                titleText += ` (Partial)`;
            }
        } 
        else if (curr > today) {
            // Future
            if (vals.p > 0) {
                color = 'bg-slate-600'; 
                titleText += `: Planned ${Math.round(vals.p)}m`;
            } else {
                color = 'bg-slate-800';
            }
        } 
        else if (curr <= today) {
            // Past
            if (vals.p > 0 && !isRest) {
                color = 'bg-red-500/50'; // Missed
                titleText += `: Missed Plan (${Math.round(vals.p)}m)`;
            } else if (isRest || (!vals.p && !vals.a)) {
                color = 'bg-emerald-500/20'; // Rest/Recovery
                titleText += `: Rest Day`;
            }
        }

        // Hide empty Sundays for cleaner look (optional)
        if (curr.getDay() === 0 && color === 'bg-slate-800') style = 'opacity:0';

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" style="${style}" title="${titleText}"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 overflow-hidden h-full flex flex-col">
        <h3 class="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <i class="fa-solid fa-calendar-check"></i> ${title}
        </h3>
        <div ${idAttr} class="overflow-x-auto flex-grow pb-2">
            <div class="flex gap-1 mb-1 w-max">${monthsHtml}</div>
            <div class="grid grid-rows-7 grid-flow-col gap-0 w-max">
                ${html}
            </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-auto pt-2 text-[10px] text-slate-400 font-mono">
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-emerald-500"></div> Done</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-yellow-500"></div> Partial</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-red-500/50"></div> Missed</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-emerald-500/20"></div> Rest</div>
        </div>
    </div>`;
}

// --- Internal Builder: Activity Type Grid ---
function buildActivityGrid(data, start, end, title, containerId = null) {
    const map = {};
    data.forEach(d => { 
        if (d.actualDuration > 0) {
            const k = toLocalYMD(d.date);
            const type = d.actualSport || d.activityType || 'Other';
            map[k] = type;
        }
    });

    let html = '';
    let curr = new Date(start);

    // Header Month Labels
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
        monthsHtml += `<div class="w-3 m-[1px] text-[9px] font-bold text-slate-500 overflow-visible whitespace-nowrap">${label}</div>`;
        loopDate.setDate(loopDate.getDate() + 7);
    }

    // Grid Cells
    while (curr <= end) {
        const k = toLocalYMD(curr);
        const sport = map[k];
        
        let color = 'bg-slate-800';
        let style = '';
        
        if (sport) {
            style = `background-color: ${getSportColorVar(sport)}`;
            color = ''; 
        } else if (curr.getDay() === 0) {
            style = 'opacity:0'; 
        }

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" style="${style}" title="${k}: ${sport || 'No Activity'}"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 overflow-hidden h-full flex flex-col">
        <h3 class="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <i class="fa-solid fa-heart-pulse"></i> ${title}
        </h3>
        <div ${idAttr} class="overflow-x-auto flex-grow pb-2">
            <div class="flex gap-1 mb-1 w-max">${monthsHtml}</div>
            <div class="grid grid-rows-7 grid-flow-col gap-0 w-max">
                ${html}
            </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-auto pt-2 text-[10px] text-slate-400 font-mono">
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-swim)"></div> Swim</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-bike)"></div> Bike</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-run)"></div> Run</div>
        </div>
    </div>`;
}

// --- Main Export ---
export function renderHeatmaps(unifiedData) {
    const today = new Date();
    
    // 1. Trailing View (Last 6 Months)
    const endTrailing = new Date(today); 
    endTrailing.setDate(today.getDate() + 7); // Show next week
    
    const startTrailing = new Date(today); 
    startTrailing.setMonth(today.getMonth() - 6);
    // Align to Monday
    const day = startTrailing.getDay();
    const diff = startTrailing.getDate() - day + (day == 0 ? -6 : 1);
    startTrailing.setDate(diff);

    // 2. Annual View (Current Year)
    const startYear = new Date(today.getFullYear(), 0, 1);
    // Align start of year to Monday for clean grid
    const yearDay = startYear.getDay();
    const yearDiff = startYear.getDate() - yearDay + (yearDay == 0 ? -6 : 1);
    startYear.setDate(yearDiff);
    
    const endYear = new Date(today.getFullYear(), 11, 31);

    // Auto-scroll logic
    setTimeout(() => {
        ['hm-consistency', 'hm-activity'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.scrollLeft = el.scrollWidth;
        });
    }, 100);

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-6 h-64">
            ${buildConsistencyGrid(unifiedData, startTrailing, endTrailing, "Recent Consistency", "hm-consistency")}
            ${buildActivityGrid(unifiedData, startTrailing, endTrailing, "Activity Log", "hm-activity")}
        </div>

        <div class="mt-6">
            ${buildConsistencyGrid(unifiedData, startYear, endYear, `Annual Overview (${today.getFullYear()})`, null)}
        </div>
    `;
}
