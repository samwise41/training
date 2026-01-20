import { toLocalYMD, getSportColorVar } from './utils.js';

// --- 1. Main Render Function ---
export function renderHeatmaps(heatmapData) {
    if (!heatmapData) return '<p class="text-slate-500">Loading heatmaps...</p>';

    const today = new Date();
    
    // Calculate Date Ranges
    // End of week (Saturday) to align the grid
    const endOfWeek = new Date(today);
    const distToSaturday = 6 - today.getDay(); 
    endOfWeek.setDate(today.getDate() + distToSaturday); 

    // Trailing 6 Months Start
    const startTrailing = new Date(endOfWeek);
    startTrailing.setMonth(startTrailing.getMonth() - 6);
    
    // Annual Start (Jan 1)
    const startYear = new Date(today.getFullYear(), 0, 1); 
    const endYear = new Date(today.getFullYear(), 11, 31);

    // --- Generate Views ---

    // 1. Recent Consistency (Trailing)
    const heatmapTrailingHtml = buildHeatmapGrid(
        heatmapData, 
        startTrailing, 
        endOfWeek, 
        "Recent Consistency (Trailing 6 Months)", 
        "heatmap-trailing-scroll",
        true // isTrailing
    );
    
    // 2. Activity Types (Trailing)
    const heatmapActivityHtml = buildActivityGrid(
        heatmapData, 
        startTrailing, 
        endOfWeek, 
        "Activity Log (Workout Types)", 
        "heatmap-activity-scroll"
    );

    // 3. Annual Overview (Full Year)
    const heatmapYearHtml = buildHeatmapGrid(
        heatmapData, 
        startYear, 
        endYear, 
        `Annual Overview (${today.getFullYear()})`, 
        null,
        false // isAnnual
    );

    // --- Auto-Scroll Logic ---
    setTimeout(() => {
        const scrollIds = ['heatmap-trailing-scroll', 'heatmap-activity-scroll'];
        scrollIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.scrollLeft = el.scrollWidth;
        });
    }, 50);

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            ${heatmapTrailingHtml}
            ${heatmapActivityHtml}
        </div>
        <div class="mb-8">
            ${heatmapYearHtml}
        </div>
    `;
}

// --- 2. Generic Heatmap Builder (Volume/Consistency) ---
function buildHeatmapGrid(data, startDate, endDate, title, scrollId, isTrailing) {
    let gridHtml = '';
    
    // Create a robust date iterator
    const current = new Date(startDate);
    // Align start to Sunday if it's a grid view to prevent offset issues
    if (isTrailing) {
        const day = current.getDay();
        const diff = current.getDate() - day; 
        current.setDate(diff); 
    }

    const tempEnd = new Date(endDate);
    
    while (current <= tempEnd) {
        const dateStr = toLocalYMD(current);
        const entry = data[dateStr];
        
        // Data Extraction
        const minutes = entry ? entry.minutes || 0 : 0;
        const type = entry ? entry.type || 'Other' : 'Rest';
        const rawColor = entry ? getSportColorVar(type) : 'var(--color-bg-card)';
        
        // Color Logic (Opacity based on duration)
        // If data exists, we use the sport color. If 0 minutes, we check if it was a planned rest or just empty.
        let bgColor = 'var(--color-bg-card)'; 
        let opacity = 0.3; // base dimness for empty slots

        if (minutes > 0) {
            bgColor = rawColor;
            // Opacity scale: 0-30m = 0.4, 30-60m = 0.6, 60-90m = 0.8, 90+ = 1.0
            if (minutes < 30) opacity = 0.5;
            else if (minutes < 60) opacity = 0.7;
            else if (minutes < 90) opacity = 0.85;
            else opacity = 1.0;
        }

        // Cell Construction
        gridHtml += `
            <div class="w-3 h-3 rounded-sm transition-all hover:ring-1 hover:ring-white relative group"
                 style="background-color: ${bgColor}; opacity: ${minutes > 0 ? opacity : 0.15};"
                 onmouseover="window.showTooltip(event, '${dateStr}', '${minutes}', '${type}', '${rawColor}')"
                 onmouseout="window.hideTooltip()">
            </div>
        `;

        current.setDate(current.getDate() + 1);
    }

    // Grid Container with specific 'grid-cols-53' from your old code
    // Note: 'grid-cols-53' needs to be defined in your Tailwind config or CSS. 
    // If it's missing, we fallback to flex/wrap or generic grid, but your old code used it specifically.
    const containerClass = isTrailing 
        ? "grid grid-rows-7 grid-flow-col gap-0.5" 
        : "grid grid-rows-7 grid-flow-col gap-0.5";

    return `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm flex flex-col h-full backdrop-blur-sm">
            <h3 class="text-slate-100 font-bold text-sm mb-4 flex items-center gap-2">
                <i class="fa-solid fa-fire text-orange-400"></i> ${title}
            </h3>
            
            <div class="flex-1 overflow-x-auto pb-2 custom-scrollbar" id="${scrollId || ''}">
                <div class="${containerClass}" style="min-width: max-content;">
                    ${gridHtml}
                </div>
            </div>
            
            <div class="mt-3 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Less</span>
                <div class="flex gap-1">
                    <div class="w-2 h-2 rounded-sm bg-slate-700"></div>
                    <div class="w-2 h-2 rounded-sm" style="background: var(--color-run); opacity: 0.4"></div>
                    <div class="w-2 h-2 rounded-sm" style="background: var(--color-run); opacity: 0.7"></div>
                    <div class="w-2 h-2 rounded-sm" style="background: var(--color-run); opacity: 1.0"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    `;
}

// --- 3. Activity Type Grid ---
function buildActivityGrid(data, startDate, endDate, title, scrollId) {
    let gridHtml = '';
    
    // Align start to Sunday
    const current = new Date(startDate);
    const day = current.getDay(); 
    current.setDate(current.getDate() - day);
    
    const tempEnd = new Date(endDate);

    while (current <= tempEnd) {
        const dateStr = toLocalYMD(current);
        const entry = data[dateStr];
        
        const minutes = entry ? entry.minutes || 0 : 0;
        const type = entry ? entry.type || '' : '';
        const color = type ? getSportColorVar(type) : 'var(--color-bg-card)';

        // For activity type map, we just show the color if activity exists
        const opacity = minutes > 0 ? 0.9 : 0.15;

        gridHtml += `
            <div class="w-3 h-3 rounded-sm transition-all hover:scale-125 hover:z-10 relative"
                 style="background-color: ${color}; opacity: ${opacity};"
                 onmouseover="window.showTooltip(event, '${dateStr}', '${minutes}', '${type}', '${color}')"
                 onmouseout="window.hideTooltip()">
            </div>
        `;
        current.setDate(current.getDate() + 1);
    }

    return `
        <div class="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 shadow-sm flex flex-col h-full backdrop-blur-sm">
            <h3 class="text-slate-100 font-bold text-sm mb-4 flex items-center gap-2">
                <i class="fa-solid fa-layer-group text-blue-400"></i> ${title}
            </h3>
            
            <div class="flex-1 overflow-x-auto pb-2 custom-scrollbar" id="${scrollId}">
                <div class="grid grid-rows-7 grid-flow-col gap-0.5" style="min-width: max-content;">
                    ${gridHtml}
                </div>
            </div>

            <div class="mt-3 flex gap-3 text-[10px] text-slate-400 uppercase tracking-wider overflow-x-auto">
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-run)"></div> Run</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-bike)"></div> Bike</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-swim)"></div> Swim</div>
                <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background:var(--color-strength)"></div> Lift</div>
            </div>
        </div>
    `;
}
