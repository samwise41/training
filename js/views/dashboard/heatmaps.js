// js/views/dashboard/heatmaps.js
import { toLocalYMD, getSportColorVar, buildCollapsibleSection } from './utils.js';

// --- Internal Helper: Consistency Grid ---
function buildConsistencyGrid(data, start, end, title, containerId = null) {
    const map = {};
    // Map data by date for fast lookup
    data.forEach(d => { 
        const k = d.date;
        map[k] = d;
    });

    let html = '';
    let curr = new Date(start);
    const today = new Date(); today.setHours(0,0,0,0);

    // 1. Build Cells
    while (curr <= end) {
        const k = toLocalYMD(curr);
        const item = map[k];
        
        let color = 'bg-slate-800'; 
        let titleText = `${k}`;
        let style = '';

        if (item) {
            // Use complianceStatus from Python script
            const status = item.complianceStatus;
            if (status === 'Unplanned') {
                color = 'bg-emerald-500';
                style = "background-image: repeating-linear-gradient(45deg, #10b981, #10b981 2px, #065f46 2px, #065f46 4px);";
            } else if (status === 'Completed') {
                color = 'bg-emerald-500';
            } else if (status === 'Partial') {
                color = 'bg-yellow-500';
            } else if (status === 'Missed') {
                color = 'bg-red-500/50';
            } else if (status === 'Rest') {
                color = 'bg-emerald-500/20';
            }
            titleText += `: ${item.activityName || status}`;
        } else if (curr > today) {
            // Future placeholder logic
            color = 'bg-slate-800';
        }

        // -- SUNDAY HIDING (Match Requirements) --
        // Sundays should not show up unless there is a workout that day
        if (curr.getDay() === 0 && !item) {
            style = 'opacity: 0; pointer-events: none;';
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
            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-slate-600"></div> Future</div>
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
            map[d.date] = d.actualSport;
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

    // Month Labels
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
export function renderHeatmaps() {
    const containerId = 'heatmap-grids-container';

    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // FETCH THE NEW PRE-CALCULATED DATA
            const response = await fetch('data/dashboard/heatmaps.json');
            if (!response.ok) throw new Error("Heatmap file not found");
            const unifiedData = await response.json();

            const today = new Date();
            
            // 1. Trailing View (Last 6 Months)
            const endTrailing = new Date(today); 
            endTrailing.setDate(today.getDate() + 7); 
            
            const startTrailing = new Date(today); 
            startTrailing.setMonth(today.getMonth() - 6);
            const day = startTrailing.getDay();
            const diff = startTrailing.getDate() - day + (day == 0 ? -6 : 1);
            startTrailing.setDate(diff);

            // 2. Annual View (Current Year)
            const startYear = new Date(today.getFullYear(), 0, 1);
            const yearDay = startYear.getDay();
            const yearDiff = startYear.getDate() - yearDay + (yearDay == 0 ? -6 : 1);
            startYear.setDate(yearDiff);
            const endYear = new Date(today.getFullYear(), 11, 31);

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 h-72">
                    ${buildConsistencyGrid(unifiedData, startTrailing, endTrailing, "Recent Consistency", "hm-consistency")}
                    ${buildActivityGrid(unifiedData, startTrailing, endTrailing, "Activity Log", "hm-activity")}
                </div>
                <div class="mt-6">
                    ${buildConsistencyGrid(unifiedData, startYear, endYear, `Annual Overview (${today.getFullYear()})`, null)}
                </div>
            `;

            // Auto-scroll
            ['hm-consistency', 'hm-activity'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollLeft = el.scrollWidth;
            });

        } catch (err) {
            console.error("Heatmap Load Error:", err);
            container.innerHTML = `<p class="text-slate-500 italic p-4">Unable to load heatmap data.</p>`;
        }
    }, 100);

    const loadingHtml = `<div id="${containerId}" class="min-h-[300px] flex items-center justify-center text-slate-500 italic">
        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Heatmaps...
    </div>`;

    return buildCollapsibleSection('heatmaps-section', 'Training Heatmaps', loadingHtml, true);
}
