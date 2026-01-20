import { toLocalYMD, getSportColorVar } from './utils.js';

// --- 1. Main Render Function ---
// Returns a placeholder immediately so the dashboard doesn't break/wait.
// Fetches data in the background and updates itself.
export function renderHeatmaps() {
    // Trigger the fetch and render process after the placeholder is in the DOM
    setTimeout(initHeatmaps, 0);

    return `
        <div id="heatmaps-container">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm h-48 flex items-center justify-center">
                    <span class="text-slate-500 text-xs animate-pulse">Loading Consistency...</span>
                </div>
                <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm h-48 flex items-center justify-center">
                    <span class="text-slate-500 text-xs animate-pulse">Loading Activities...</span>
                </div>
            </div>
            <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm h-48 mb-8 flex items-center justify-center">
                <span class="text-slate-500 text-xs animate-pulse">Loading Annual View...</span>
            </div>
        </div>
    `;
}

// --- 2. Data Fetching & Initialization ---
async function initHeatmaps() {
    const container = document.getElementById('heatmaps-container');
    if (!container) return;

    try {
        const response = await fetch('data/dashboard/heatmaps.json');
        if (!response.ok) throw new Error("Heatmap data missing");
        
        const heatmapData = await response.json();
        
        // Generate the full HTML
        const html = generateHeatmapHTML(heatmapData);
        container.outerHTML = html;

        // Apply scrolling to show the latest date (right side)
        setTimeout(() => {
            ['heatmap-trailing-scroll', 'heatmap-activity-scroll'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollLeft = el.scrollWidth;
            });
        }, 50);

    } catch (e) {
        console.error("Heatmap Load Error:", e);
        container.innerHTML = `<p class="text-red-500 text-xs p-4">Unable to load heatmaps.</p>`;
    }
}

// --- 3. HTML Generator ---
function generateHeatmapHTML(data) {
    const today = new Date();
    
    // Calculate Date Ranges
    // End of week (Saturday) to align the grid perfectly
    const endOfWeek = new Date(today);
    const distToSaturday = 6 - today.getDay(); 
    endOfWeek.setDate(today.getDate() + distToSaturday); 

    // Trailing 6 Months Start
    const startTrailing = new Date(endOfWeek);
    startTrailing.setMonth(startTrailing.getMonth() - 6);
    
    // Annual Start (Jan 1)
    const startYear = new Date(today.getFullYear(), 0, 1); 
    const endYear = new Date(today.getFullYear(), 11, 31);

    // 1. Recent Consistency (Trailing)
    const trailingHtml = buildGrid(
        data, 
        startTrailing, 
        endOfWeek, 
        "Recent Consistency (Trailing 6 Months)", 
        "heatmap-trailing-scroll",
        true // isConsistencyMode
    );
    
    // 2. Activity Types (Trailing)
    const activityHtml = buildGrid(
        data, 
        startTrailing, 
        endOfWeek, 
        "Activity Log (Workout Types)", 
        "heatmap-activity-scroll",
        false // isConsistencyMode
    );

    // 3. Annual Overview (Full Year)
    const yearHtml = buildGrid(
        data, 
        startYear, 
        endYear, 
        `Annual Overview (${today.getFullYear()})`, 
        null,
        true // isConsistencyMode
    );

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            ${trailingHtml}
            ${activityHtml}
        </div>
        <div class="mb-8">
            ${yearHtml}
        </div>
    `;
}

// --- 4. Generic Grid Builder ---
function buildGrid(data, startDate, endDate, title, scrollId, isConsistencyMode) {
    let gridCells = '';
    
    // Normalize start date to Sunday to ensure columns align correctly in grid-flow-col
    const current = new Date(startDate);
    const day = current.getDay();
    current.setDate(current.getDate() - day); 

    const tempEnd = new Date(endDate);
    
    while (current <= tempEnd) {
        const dateStr = toLocalYMD(current);
        const entry = data[dateStr];
        
        const minutes = entry ? (entry.minutes || 0) : 0;
        const type = entry ? (entry.type || 'Other') : 'Rest';
        const sportColor = entry ? getSportColorVar(type) : 'var(--color-bg-card)';
        
        let bgColor = 'var(--color-bg-card)'; 
        let opacity = 0.3; // Default dimness for empty/future cells

        // Coloring Logic
        if (minutes > 0) {
            if (isConsistencyMode) {
                // Consistency Mode: Heatmap intensity (Green/Theme color)
                bgColor = sportColor; // Uses sport color but varies opacity
                if (minutes < 30) opacity = 0.4;
                else if (minutes < 60) opacity = 0.6;
                else if (minutes < 90) opacity = 0.8;
                else opacity = 1.0;
            } else {
                // Activity Mode: Solid color for sport type
                bgColor = sportColor;
                opacity = 0.9;
            }
        } else {
            // Empty Cell
            opacity = 0.15;
        }

        gridCells += `
            <div class="w-3 h-3 rounded-sm transition-all hover:ring-1 hover:ring-white relative group"
                 style="background-color: ${bgColor}; opacity: ${opacity};"
                 onmouseover="window.showTooltip(event, '${dateStr}', '${minutes}', '${type}', '${sportColor}')"
                 onmouseout="window.hideTooltip()">
            </div>
        `;

        current.setDate(current.getDate() + 1);
    }

    // Grid Layout: 7 rows (days), auto columns
    return `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm flex flex-col h-full backdrop-blur-sm">
            <h3 class="text-slate-100 font-bold text-sm mb-4 flex items-center gap-2">
                <i class="fa-solid fa-fire text-orange-400"></i> ${title}
            </h3>
            
            <div class="flex-1 overflow-x-auto pb-2 custom-scrollbar" id="${scrollId || ''}">
                <div class="grid grid-rows-7 grid-flow-col gap-0.5" style="min-width: max-content;">
                    ${gridCells}
                </div>
            </div>
            
            ${renderLegend(isConsistencyMode)}
        </div>
    `;
}

function renderLegend(isConsistencyMode) {
    if (isConsistencyMode) {
        return `
            <div class="mt-3 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Less</span>
                <div class="flex gap-1">
                    <div class="w-2 h-2 rounded-sm bg-slate-700/30"></div>
                    <div class="w-2 h-2 rounded-sm" style="background: var(--color-run); opacity: 0.4"></div>
                    <div class="w-2 h-2 rounded-sm" style="background: var(--color-run); opacity: 0.7"></div>
                    <div class="w-2 h-2 rounded-sm" style="background: var(--color-run); opacity: 1.0"></div>
                </div>
                <span>More</span>
            </div>
        `;
    } else {
        return `
            <div class="mt-3 flex gap-3 text-[10px] text-slate-400 uppercase tracking-wider overflow-x-auto">
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-run)"></div> Run</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-bike)"></div> Bike</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-swim)"></div> Swim</div>
            </div>
        `;
    }
}
