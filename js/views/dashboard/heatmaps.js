import { toLocalYMD, getSportColorVar, buildCollapsibleSection } from './utils.js';

export function renderHeatmaps() {
    setTimeout(initHeatmaps, 0);
    const loadingHtml = `
    <div id="heatmaps-container" class="flex flex-col gap-6">
        <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 flex items-center justify-center min-h-[100px]">
            <span class="text-slate-500 text-xs animate-pulse">Loading Heatmaps...</span>
        </div>
    </div>`;
    return buildCollapsibleSection('heatmaps-section', 'Training Heatmaps', loadingHtml, true);
}

async function initHeatmaps() {
    const container = document.getElementById('heatmaps-container');
    if (!container) return;

    try {
        // Cache bust the JSON to ensure fresh data
        const response = await fetch(`data/dashboard/heatmaps.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("Heatmap file not found");
        const rawData = await response.json();

        const dateMap = {};
        if (Array.isArray(rawData)) {
            rawData.forEach(d => { dateMap[d.date] = d; });
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        
        // --- Ranges ---
        const endTrailing = new Date(today); 
        const distToSaturday = 6 - today.getDay(); 
        endTrailing.setDate(today.getDate() + distToSaturday); 

        const startTrailing = new Date(endTrailing); 
        startTrailing.setMonth(startTrailing.getMonth() - 6);
        startTrailing.setDate(startTrailing.getDate() - startTrailing.getDay());

        const startYear = new Date(currentYear, 0, 1);
        startYear.setDate(startYear.getDate() - startYear.getDay());
        const endYear = new Date(currentYear, 11, 31);

        container.innerHTML = `
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                ${buildGrid(dateMap, startTrailing, endTrailing, "Recent Consistency", "hm-consistency", true, null)}
                ${buildGrid(dateMap, startTrailing, endTrailing, "Activity Log", "hm-activity", false, null)}
            </div>
            <div class="mt-4">
                ${buildGrid(dateMap, startYear, endYear, `Annual Overview (${currentYear})`, null, true, currentYear)}
            </div>
        `;

        setTimeout(() => {
            ['hm-consistency', 'hm-activity'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollLeft = el.scrollWidth;
            });
        }, 50);

    } catch (err) {
        console.error("Heatmap Error:", err);
        container.innerHTML = `<p class="text-slate-500 text-xs p-4">Error: ${err.message}</p>`;
    }
}

function buildGrid(dataMap, start, end, title, containerId, isConsistencyMode, targetYear) {
    let gridCells = '';
    let curr = new Date(start);
    const today = new Date();
    
    // --- PIXEL PERFECT CONFIGURATION ---
    // These match the inline styles below exactly
    const CELL_PX = 12;
    const GAP_PX = 2;
    const STRIDE_PX = CELL_PX + GAP_PX; // 14px

    let monthLabels = '';
    let dayCount = 0;
    const addedMonths = new Set();

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0,0,0,0);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23,59,59,999);

    while (curr <= end) {
        const dateStr = toLocalYMD(curr);
        const entry = dataMap[dateStr];
        const isSunday = curr.getDay() === 0;
        
        // --- Month Labels ---
        if (curr.getDate() === 1 || (dayCount === 0 && curr.getDate() <= 7)) {
            const mStr = curr.toLocaleString('default', { month: 'short' });
            const colIndex = Math.floor(dayCount / 7);
            const monthKey = mStr + curr.getFullYear();
            
            if (!addedMonths.has(monthKey)) {
                // Precision absolute positioning
                const leftPos = colIndex * STRIDE_PX;
                monthLabels += `<span class="absolute text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap" style="left: ${leftPos}px; top: 0;">${mStr}</span>`;
                addedMonths.add(monthKey);
            }
        }

        // --- Cell Logic ---
        let bgColor = 'bg-slate-800/50'; 
        let opacity = '1'; 
        let styleOverride = '';
        let extraClasses = '';
        let visibility = ''; 
        
        const isFuture = curr > today;
        const isCurrentWeek = curr >= currentWeekStart && curr <= currentWeekEnd;

        // Hide Prior Year
        if (targetYear && curr.getFullYear() < targetYear) {
            visibility = 'opacity: 0; pointer-events: none;';
        }

        // Hide Sunday if no actual workout
        if (isSunday) {
            if (!entry || !entry.actualDuration || entry.actualDuration <= 0) {
                visibility = 'opacity: 0; pointer-events: none;';
            }
        }

        if (isConsistencyMode) {
            if (isFuture) {
                if (isCurrentWeek) {
                    bgColor = 'bg-slate-700'; 
                    opacity = '0.5';
                } else {
                    bgColor = 'bg-slate-800/30';
                    opacity = '0.3';
                }
            } else {
                bgColor = 'bg-emerald-500';
                opacity = '0.2'; 
            }
        }

        let label = isFuture ? 'Future' : 'Rest';
        let plan = 0;
        let act = 0;
        let detailsJson = '';

        if (entry) {
            plan = entry.plannedDuration || 0;
            act = entry.actualDuration || 0;
            const status = entry.complianceStatus;
            
            if (entry.activities && entry.activities.length > 0) {
                const lines = entry.activities.map(a => {
                    const icon = getIconForSport(a.sport); 
                    return `<div class='flex justify-between items-center gap-2 text-xs'><span>${icon} ${a.name}</span><span class='font-mono text-emerald-400'>${Math.round(a.actual)}m</span></div>`;
                }).join('');
                detailsJson = encodeURIComponent(lines);
            }

            if (isConsistencyMode) {
                if (status === 'Event') {
                    bgColor = 'bg-purple-600';
                    opacity = '1';
                    label = `Event: ${entry.eventName}`;
                } else if (status === 'Completed') {
                    bgColor = 'bg-emerald-500';
                    opacity = '1';
                    label = "Completed";
                } else if (status === 'Partial') {
                    bgColor = 'bg-yellow-500';
                    opacity = '1';
                    label = "Partial";
                } else if (status === 'Missed') {
                    bgColor = 'bg-red-600';
                    opacity = '1';
                    label = "Missed";
                } else if (status === 'Unplanned') {
                    bgColor = 'bg-emerald-600';
                    extraClasses = 'bg-striped'; 
                    opacity = '1';
                    label = "Unplanned";
                }
            } else {
                if (act > 0) {
                    const sports = entry.sports || [];
                    if (sports.length > 1) {
                        // Hard Stop Gradient
                        const count = sports.length;
                        const stops = sports.map((s, i) => {
                            let c = ['Run','Bike','Swim'].includes(s) ? getSportColorVar(s) : 'var(--color-all)';
                            const startPct = (i / count) * 100;
                            const endPct = ((i + 1) / count) * 100;
                            return `${c} ${startPct}%, ${c} ${endPct}%`;
                        });
                        styleOverride = `background: linear-gradient(135deg, ${stops.join(', ')});`;
                        label = "Multi-Sport";
                    } else if (sports.length === 1) {
                        const s = sports[0];
                        let colorVar = getSportColorVar(s);
                        if (!['Run','Bike','Swim'].includes(s)) colorVar = 'var(--color-all)'; 
                        styleOverride = `background-color: ${colorVar};`;
                        label = s;
                    }
                    opacity = '1';
                }
            }
        }

        const clickFn = `window.handleHeatmapClick(event, '${dateStr}', ${Math.round(plan)}, ${Math.round(act)}, '${label}', '', '', '${detailsJson}')`;

        // Explicit width/height to force shape
        gridCells += `
            <div class="rounded-[2px] transition-all hover:scale-125 hover:z-10 relative cursor-pointer ${bgColor} ${extraClasses}"
                 style="width: ${CELL_PX}px !important; height: ${CELL_PX}px !important; opacity: ${opacity}; ${styleOverride} ${visibility}"
                 title="${dateStr}: ${label}"
                 onclick="${clickFn}">
            </div>
        `;

        curr.setDate(curr.getDate() + 1);
        dayCount++;
    }

    const idAttr = containerId ? `id="${containerId}"` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex flex-col backdrop-blur-sm">
        <h3 class="text-xs font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
            <i class="fa-solid ${isConsistencyMode ? 'fa-calendar-check text-emerald-400' : 'fa-chart-simple text-blue-400'}"></i> ${title}
        </h3>
        
        <div class="flex-1 overflow-x-auto pb-3 custom-scrollbar" ${idAttr}>
            <div class="min-w-max">
                <div class="relative h-5 w-full mb-1">
                    ${monthLabels}
                </div>
                
                <div style="display: grid; grid-template-rows: repeat(7, ${CELL_PX}px); grid-auto-flow: column; gap: ${GAP_PX}px !important;">
                    ${gridCells}
                </div>
            </div>
        </div>
        
        ${renderLegend(isConsistencyMode)}
    </div>`;
}

function getIconForSport(sport) {
    const s = (sport || '').toLowerCase();
    if(s.includes('run')) return '<i class="fa-solid fa-person-running"></i>';
    if(s.includes('bike')) return '<i class="fa-solid fa-bicycle"></i>';
    if(s.includes('swim')) return '<i class="fa-solid fa-person-swimming"></i>';
    return '<i class="fa-solid fa-dumbbell"></i>';
}

function renderLegend(isConsistencyMode) {
    if (isConsistencyMode) {
        return `
            <div class="flex flex-wrap justify-center gap-4 mt-3 pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] bg-emerald-500"></div> Done</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] bg-yellow-500"></div> Partial</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] bg-red-600"></div> Missed</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] bg-emerald-600 bg-striped"></div> Unplanned</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] bg-purple-600"></div> Event</div>
            </div>
        `;
    } else {
        return `
            <div class="flex flex-wrap justify-center gap-4 mt-3 pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full" style="background:var(--color-run)"></div> Run</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full" style="background:var(--color-bike)"></div> Bike</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full" style="background:var(--color-swim)"></div> Swim</div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full" style="background:var(--color-all)"></div> Other</div>
            </div>
        `;
    }
}
