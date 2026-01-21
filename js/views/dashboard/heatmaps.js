import { toLocalYMD, getSportColorVar, buildCollapsibleSection } from './utils.js';

// --- 1. Main Render Function ---
export function renderHeatmaps() {
    // Initiate async fetch immediately
    setTimeout(initHeatmaps, 0);

    const loadingHtml = `
    <div id="heatmaps-container" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
                <span class="text-slate-500 text-xs animate-pulse">Loading Consistency...</span>
            </div>
            <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
                <span class="text-slate-500 text-xs animate-pulse">Loading Activity...</span>
            </div>
        </div>
        <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
            <span class="text-slate-500 text-xs animate-pulse">Loading Annual View...</span>
        </div>
    </div>`;

    return buildCollapsibleSection('heatmaps-section', 'Training Heatmaps', loadingHtml, true);
}

// --- 2. Data Fetching & Initialization ---
async function initHeatmaps() {
    const container = document.getElementById('heatmaps-container');
    if (!container) return;

    try {
        const response = await fetch('data/dashboard/heatmaps.json');
        if (!response.ok) throw new Error("Heatmap file not found");
        const rawData = await response.json();

        // --- PRE-PROCESSING DATA ---
        
        // 1. Activity Map: Contains EVERYTHING (for "Activity Log")
        const activityMap = {};
        if (Array.isArray(rawData)) {
            rawData.forEach(d => { activityMap[d.date] = d; });
        }

        // 2. Consistency Map: FILTERED (Only days where a workout was PLANNED)
        // This ensures the Consistency charts only show planned days.
        const consistencyMap = {};
        if (Array.isArray(rawData)) {
            rawData.forEach(d => {
                // The Filter: Must have planned minutes to appear in Consistency/Annual Plan view
                if (d.plannedDuration > 0) {
                    consistencyMap[d.date] = d;
                }
            });
        }

        // --- DATE RANGES ---
        const today = new Date();
        
        // Trailing 6 Months
        const endTrailing = new Date(today); 
        const distToSaturday = 6 - today.getDay(); 
        endTrailing.setDate(today.getDate() + distToSaturday); 

        const startTrailing = new Date(endTrailing); 
        startTrailing.setMonth(startTrailing.getMonth() - 6);
        const day = startTrailing.getDay();
        startTrailing.setDate(startTrailing.getDate() - day); // Align to Sunday

        // Annual View
        const startYear = new Date(today.getFullYear(), 0, 1);
        const yearDay = startYear.getDay();
        startYear.setDate(startYear.getDate() - yearDay); // Align to Sunday
        const endYear = new Date(today.getFullYear(), 11, 31);

        // --- RENDER ---
        container.innerHTML = `
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                ${buildGrid(consistencyMap, startTrailing, endTrailing, "Recent Consistency (Plan Only)", "hm-consistency", true)}
                ${buildGrid(activityMap, startTrailing, endTrailing, "Activity Log (All Activity)", "hm-activity", false)}
            </div>
            <div>
                ${buildGrid(consistencyMap, startYear, endYear, `Annual Overview (${today.getFullYear()})`, null, true)}
            </div>
        `;

        // Auto-scroll to end
        setTimeout(() => {
            ['hm-consistency', 'hm-activity'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollLeft = el.scrollWidth;
            });
        }, 50);

    } catch (err) {
        console.error("Heatmap Load Error:", err);
        container.innerHTML = `<p class="text-slate-500 italic p-4">Unable to load heatmap data: ${err.message}</p>`;
    }
}

// --- 3. Generic Grid Builder ---
function buildGrid(dataMap, start, end, title, containerId, isConsistencyMode) {
    let gridCells = '';
    let curr = new Date(start);

    // Loop through days
    while (curr <= end) {
        const dateStr = toLocalYMD(curr);
        const entry = dataMap[dateStr]; // This is now pre-filtered based on the mode
        
        let bgColor = 'bg-slate-800/50'; // Default empty
        let opacity = '0.3'; 
        let styleOverride = '';
        let tooltipColor = '#1e293b';
        
        // Metadata for Tooltip
        const status = entry ? entry.complianceStatus : null;
        const sport = entry ? entry.actualSport : null;
        const activityName = entry ? (entry.activityName || status) : 'No Activity';
        const actMins = entry ? (entry.actualDuration || 0) : 0;
        const planMins = entry ? (entry.plannedDuration || 0) : 0;

        // --- COLOR LOGIC ---
        if (entry) {
            if (isConsistencyMode) {
                // DATASET IS ALREADY FILTERED to Planned > 0.
                // Just map status to color.
                if (status === 'Completed') {
                    bgColor = 'bg-emerald-500';
                    tooltipColor = '#10b981';
                    opacity = '1';
                } else if (status === 'Partial') {
                    bgColor = 'bg-yellow-500';
                    tooltipColor = '#eab308';
                    opacity = '0.9';
                } else if (status === 'Missed') {
                    bgColor = 'bg-red-500';
                    tooltipColor = '#ef4444';
                    opacity = '0.4';
                } else {
                    // Fallback (e.g. if status is weird but plan > 0)
                    bgColor = 'bg-slate-700'; 
                    opacity = '0.5';
                }
            } else {
                // Activity Mode (Unfiltered)
                // Only color if there was movement
                if (actMins > 0 && sport) {
                    const sportColor = getSportColorVar(sport); 
                    styleOverride = `background-color: ${sportColor};`;
                    tooltipColor = sportColor;
                    opacity = '0.9';
                }
            }
        }

        // --- CELL RENDER ---
        gridCells += `
            <div class="w-3 h-3 rounded-[2px] transition-all hover:scale-125 hover:z-10 relative ${styleOverride ? '' : bgColor}"
                 style="opacity: ${opacity}; ${styleOverride}"
                 onmouseover="window.showDashboardTooltip(event, '${dateStr}', ${Math.round(planMins)}, '${Math.round(actMins)}', '${activityName}', '${tooltipColor}', '${isConsistencyMode ? (status || 'Rest') : (sport || 'Rest')}', '')"
                 onmouseout="document.getElementById('dashboard-tooltip-popup').classList.add('opacity-0')">
            </div>
        `;

        curr.setDate(curr.getDate() + 1);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex flex-col backdrop-blur-sm">
        <h3 class="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
            <i class="fa-solid ${isConsistencyMode ? 'fa-fire text-orange-400' : 'fa-layer-group text-blue-400'}"></i> ${title}
        </h3>
        
        <div class="flex-1 overflow-x-auto pb-1 custom-scrollbar" ${idAttr}>
            <div class="grid grid-rows-7 grid-flow-col gap-0.5 w-max">
                ${gridCells}
            </div>
        </div>
        
        ${renderLegend(isConsistencyMode)}
    </div>`;
}

function renderLegend(isConsistencyMode) {
    if (isConsistencyMode) {
        return `
            <div class="flex flex-wrap gap-4 mt-3 pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-[2px] bg-emerald-500"></div> Done</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-[2px] bg-yellow-500"></div> Partial</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-[2px] bg-red-500 opacity-40"></div> Missed</div>
            </div>
        `;
    } else {
        return `
            <div class="flex flex-wrap gap-4 mt-3 pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full" style="background:var(--color-run)"></div> Run</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full" style="background:var(--color-bike)"></div> Bike</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-full" style="background:var(--color-swim)"></div> Swim</div>
            </div>
        `;
    }
}
