import { toLocalYMD, getSportColorVar, buildCollapsibleSection } from './utils.js';

// --- 1. Main Render Function ---
export function renderHeatmaps() {
    // Initiate async fetch immediately
    setTimeout(initHeatmaps, 0);

    const loadingHtml = `<div id="heatmaps-container" class="min-h-[300px] flex items-center justify-center text-slate-500 italic">
        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Heatmaps...
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
        const unifiedData = await response.json();

        // Convert Array to Map for fast lookup by date string
        const dataMap = {};
        if (Array.isArray(unifiedData)) {
            unifiedData.forEach(d => {
                dataMap[d.date] = d;
            });
        }

        const today = new Date();
        
        // 1. Trailing View (Last 6 Months)
        // End of week (Saturday) alignment
        const endTrailing = new Date(today); 
        const distToSaturday = 6 - today.getDay(); 
        endTrailing.setDate(today.getDate() + distToSaturday); 

        const startTrailing = new Date(endTrailing); 
        startTrailing.setMonth(startTrailing.getMonth() - 6);
        // Align start to Sunday
        const day = startTrailing.getDay();
        startTrailing.setDate(startTrailing.getDate() - day);

        // 2. Annual View (Current Year)
        const startYear = new Date(today.getFullYear(), 0, 1);
        const yearDay = startYear.getDay();
        startYear.setDate(startYear.getDate() - yearDay); // Align to Sunday
        const endYear = new Date(today.getFullYear(), 11, 31);

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 h-72">
                ${buildGrid(dataMap, startTrailing, endTrailing, "Recent Consistency", "hm-consistency", true)}
                ${buildGrid(dataMap, startTrailing, endTrailing, "Activity Log", "hm-activity", false)}
            </div>
            <div class="mt-6">
                ${buildGrid(dataMap, startYear, endYear, `Annual Overview (${today.getFullYear()})`, null, true)}
            </div>
        `;

        // Auto-scroll logic to right
        setTimeout(() => {
            ['hm-consistency', 'hm-activity'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollLeft = el.scrollWidth;
            });
        }, 50);

    } catch (err) {
        console.error("Heatmap Load Error:", err);
        container.innerHTML = `<p class="text-slate-500 italic p-4">Unable to load heatmap data.</p>`;
    }
}

// --- 3. Generic Grid Builder ---
function buildGrid(dataMap, start, end, title, containerId, isConsistencyMode) {
    let gridCells = '';
    let curr = new Date(start);

    // Loop through days
    while (curr <= end) {
        const dateStr = toLocalYMD(curr);
        const entry = dataMap[dateStr];
        
        // --- DATA MAPPING LOGIC ---
        const status = entry ? entry.complianceStatus : null;
        const sport = entry ? entry.actualSport : null;
        const activityName = entry ? (entry.activityName || status) : 'No Activity';
        const minutes = entry ? (entry.actualDuration || 0) : 0;

        let bgColor = 'bg-slate-800/50'; // Default empty slot
        let opacity = '0.3'; 
        let styleOverride = '';
        let tooltipColor = '#1e293b';

        // --- COLOR LOGIC ---
        if (isConsistencyMode) {
            // Consistency Mode
            if (status === 'Unplanned') {
                tooltipColor = '#10b981';
                opacity = '1';
                // Striped gradient via inline style
                styleOverride = "background-image: repeating-linear-gradient(45deg, #10b981, #10b981 2px, #065f46 2px, #065f46 4px);";
            } else if (status === 'Completed') {
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
            } else if (status === 'Rest') {
                bgColor = 'bg-emerald-500'; 
                opacity = '0.1';
            }
        } else {
            // Activity Mode
            if (minutes > 0 && sport) {
                const sportColor = getSportColorVar(sport); // returns var(--color-xxx)
                styleOverride = `background-color: ${sportColor};`;
                tooltipColor = sportColor;
                opacity = '0.9';
            }
        }

        // --- CELL HTML ---
        // Using gap-0.5 on parent instead of margins on children for tighter grid
        gridCells += `
            <div class="w-3 h-3 rounded-[2px] transition-all hover:scale-125 hover:z-10 relative ${styleOverride ? '' : bgColor}"
                 style="opacity: ${opacity}; ${styleOverride}"
                 onmouseover="window.showDashboardTooltip(event, '${dateStr}', 0, '${minutes}', '${activityName}', '${tooltipColor}', '${isConsistencyMode ? status : sport}', '')"
                 onmouseout="document.getElementById('dashboard-tooltip-popup').classList.add('opacity-0')">
            </div>
        `;

        curr.setDate(curr.getDate() + 1);
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-5 overflow-hidden h-full flex flex-col backdrop-blur-sm">
        <h3 class="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
            <i class="fa-solid ${isConsistencyMode ? 'fa-fire text-orange-400' : 'fa-layer-group text-blue-400'}"></i> ${title}
        </h3>
        
        <div class="flex-1 overflow-x-auto pb-2 custom-scrollbar" ${idAttr}>
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
            <div class="flex flex-wrap gap-4 mt-auto pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> Done</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-yellow-500"></div> Partial</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm bg-red-500 opacity-40"></div> Missed</div>
            </div>
        `;
    } else {
        return `
            <div class="flex flex-wrap gap-4 mt-auto pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm" style="background:var(--color-run)"></div> Run</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm" style="background:var(--color-bike)"></div> Bike</div>
                <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rounded-sm" style="background:var(--color-swim)"></div> Swim</div>
            </div>
        `;
    }
}
