import { toLocalYMD, getSportColorVar } from './utils.js';

// --- 1. Main Render Function ---
export function renderHeatmaps() {
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
        
        // Use unified array data from your new logic
        const rawData = await response.json();
        
        // Convert Array to Map for fast lookup by date string
        const heatmapData = {};
        if (Array.isArray(rawData)) {
            rawData.forEach(d => {
                heatmapData[d.date] = d;
            });
        }

        // Generate the full HTML
        const html = generateHeatmapHTML(heatmapData);
        container.outerHTML = html;

        // Apply scrolling
        setTimeout(() => {
            ['heatmap-trailing-scroll', 'heatmap-activity-scroll'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollLeft = el.scrollWidth;
            });
        }, 50);

    } catch (e) {
        console.error("Heatmap Load Error:", e);
        container.innerHTML = `<p class="text-red-500 text-xs p-4">Unable to load heatmaps: ${e.message}</p>`;
    }
}

// --- 3. HTML Generator ---
function generateHeatmapHTML(data) {
    const today = new Date();
    
    // Calculate Date Ranges
    const endOfWeek = new Date(today);
    const distToSaturday = 6 - today.getDay(); 
    endOfWeek.setDate(today.getDate() + distToSaturday); 

    // Trailing 6 Months
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
    
    // Normalize start date to Sunday
    const current = new Date(startDate);
    const day = current.getDay();
    current.setDate(current.getDate() - day); 

    const tempEnd = new Date(endDate);
    
    while (current <= tempEnd) {
        const dateStr = toLocalYMD(current);
        const entry = data[dateStr];
        
        // --- DATA MAPPING LOGIC (Updated to match your provided file) ---
        // Uses 'complianceStatus' and 'actualSport' from the JSON
        const status = entry ? entry.complianceStatus : null;
        const sport = entry ? entry.actualSport : null;
        const activityName = entry ? (entry.activityName || status) : 'No Activity';
        const minutes = entry ? (entry.actualDuration || 0) : 0;

        let bgColor = 'var(--color-bg-card)'; 
        let opacity = 0.15; // Default dim for empty
        let styleOverride = '';

        if (isConsistencyMode) {
            // Consistency Logic (Unplanned, Completed, etc.)
            if (status === 'Unplanned') {
                // Striped Green
                bgColor = '#10b981';
                opacity = 1.0;
                styleOverride = "background-image: repeating-linear-gradient(45deg, #10b981, #10b981 2px, #065f46 2px, #065f46 4px);";
            } else if (status === 'Completed') {
                bgColor = '#10b981'; // Emerald
                opacity = 1.0;
            } else if (status === 'Partial') {
                bgColor = '#eab308'; // Yellow
                opacity = 0.9;
            } else if (status === 'Missed') {
                bgColor = '#ef4444'; // Red
                opacity = 0.4;
            } else if (status === 'Rest') {
                bgColor = '#10b981'; 
                opacity = 0.1;
            }
        } else {
            // Activity Mode Logic (Sport Color)
            if (minutes > 0 && sport) {
                bgColor = getSportColorVar(sport);
                opacity = 0.9;
            }
        }

        gridCells += `
            <div class="w-3 h-3 rounded-sm transition-all hover:ring-1 hover:ring-white relative group"
                 style="background-color: ${bgColor}; opacity: ${opacity}; ${styleOverride}"
                 onmouseover="window.showTooltip(event, '${dateStr}', '${minutes}', '${activityName}', '${bgColor}')"
                 onmouseout="window.hideTooltip()">
            </div>
        `;

        current.setDate(current.getDate() + 1);
    }

    return `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm flex flex-col h-full backdrop-blur-sm">
            <h3 class="text-slate-100 font-bold text-sm mb-4 flex items-center gap-2">
                <i class="fa-solid ${isConsistencyMode ? 'fa-fire text-orange-400' : 'fa-layer-group text-blue-400'}"></i> ${title}
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
            <div class="mt-3 flex gap-3 text-[10px] text-slate-400 uppercase tracking-wider overflow-x-auto">
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-emerald-500"></div> Done</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-yellow-500"></div> Partial</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-sm bg-red-500/40"></div> Missed</div>
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
