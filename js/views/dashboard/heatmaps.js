// js/views/dashboard/heatmaps.js
import { toLocalYMD, getSportColorVar } from './utils.js';

// --- Internal Builder: Consistency Grid ---
function buildConsistencyGrid(data, start, end, title) {
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

        const isRest = String(vals.type).toLowerCase() === 'rest';

        if (vals.a > 0) {
            // Activity Done
            color = 'bg-emerald-500';
            titleText += `: Completed ${Math.round(vals.a)}m`;
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
        let style = '';
        if (curr.getDay() === 0 && color === 'bg-slate-800') style = 'opacity:0';

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" style="${style}" title="${titleText}"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4 overflow-hidden">
        <h3 class="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <i class="fa-solid fa-calendar-check"></i> ${title}
        </h3>
        <div class="overflow-x-auto">
            <div class="flex gap-1 mb-1 w-max">${monthsHtml}</div>
            <div class="grid grid-rows-7 grid-flow-col gap-0 w-max">
                ${html}
            </div>
        </div>
    </div>`;
}

// --- Internal Builder: Activity Type Grid ---
function buildActivityGrid(data, start, end, title) {
    const map = {};
    data.forEach(d => { 
        if (d.actualDuration > 0) {
            const k = toLocalYMD(d.date);
            // Prioritize Actual Sport -> then Activity Type
            const type = d.actualSport || d.activityType || 'Other';
            map[k] = type;
        }
    });

    let html = '';
    let curr = new Date(start);

    // Grid Cells
    while (curr <= end) {
        const k = toLocalYMD(curr);
        const sport = map[k];
        
        let color = 'bg-slate-800';
        let style = '';
        
        if (sport) {
            style = `background-color: ${getSportColorVar(sport)}`;
            color = ''; // Override class
        } else if (curr.getDay() === 0) {
            style = 'opacity:0'; // Hide empty Sundays
        }

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" style="${style}" title="${k}: ${sport || 'No Activity'}"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4 overflow-hidden">
        <h3 class="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <i class="fa-solid fa-heart-pulse"></i> ${title}
        </h3>
        <div class="overflow-x-auto">
            <div class="grid grid-rows-7 grid-flow-col gap-0 w-max">
                ${html}
            </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-swim)"></div> Swim</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-bike)"></div> Bike</div>
            <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-run)"></div> Run</div>
        </div>
    </div>`;
}

// --- Main Export ---
export function renderHeatmaps(unifiedData) {
    const today = new Date();
    // Show next 7 days
    const end = new Date(today); 
    end.setDate(today.getDate() + 7); 
    
    // Show last 6 months
    const start = new Date(today); 
    start.setMonth(today.getMonth() - 6);
    // Align start to Monday
    const day = start.getDay();
    const diff = start.getDate() - day + (day == 0 ? -6 : 1);
    start.setDate(diff);

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            ${buildConsistencyGrid(unifiedData, start, end, "Consistency")}
            ${buildActivityGrid(unifiedData, start, end, "Activity Log")}
        </div>
    `;
}
