// js/views/dashboard/heatmaps.js
import { Formatters } from '../../utils/formatting.js';
import { UI } from '../../utils/ui.js';
import { DataManager } from '../../utils/data.js';

export function renderHeatmaps() {
    setTimeout(initHeatmaps, 0);
    const loadingHtml = `
    <div id="heatmaps-container" class="flex flex-col gap-6">
        <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 flex items-center justify-center min-h-[100px]">
            <span class="text-slate-500 text-xs animate-pulse">Loading Heatmaps...</span>
        </div>
    </div>`;
    return UI.buildCollapsibleSection('heatmaps-section', 'Training Heatmaps', loadingHtml, true);
}

async function initHeatmaps() {
    const container = document.getElementById('heatmaps-container');
    if (!container) return;
    try {
        const rawData = await DataManager.fetchJSON('heatmaps');
        if (!rawData) throw new Error("Heatmap file empty or missing");

        const dateMap = {};
        if (Array.isArray(rawData)) {
            rawData.forEach(d => { dateMap[d.date] = d; });
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        
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

        setupDelegation(container);
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

function setupDelegation(container) {
    container.addEventListener('click', (e) => {
        const cell = e.target.closest('.heatmap-cell');
        if (!cell) return;
        e.stopPropagation();

        const d = cell.dataset;
        const dateObj = new Date(d.date + 'T12:00:00'); 
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        let detailsHtml = '';
        if (d.details) {
            try {
                const decoded = decodeURIComponent(d.details);
                detailsHtml = `<div class="mt-2 border-t border-slate-700 pt-2 space-y-1">${decoded}</div>`;
            } catch (err) { console.warn("Detail decode error", err); }
        }

        const tooltipHtml = `
            <div class="min-w-[180px]">
                <div class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">${dateStr}</div>
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-white text-xs flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" style="background:${d.color}"></span> ${d.label}
                    </span>
                </div>
                <div class="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                    <span>Duration:</span>
                    <span class="${parseInt(d.act) >= parseInt(d.plan) ? 'text-emerald-400' : 'text-slate-300'}">
                        ${d.act}m <span class="text-slate-500">/</span> ${d.plan}m
                    </span>
                </div>
                ${detailsHtml}
            </div>`;

        if (window.TooltipManager) {
            window.TooltipManager.show(cell, tooltipHtml, e);
        }
    });
}

function buildGrid(dataMap, start, end, title, containerId, isConsistencyMode, targetYear) {
    let gridCells = '';
    let curr = new Date(start);
    const today = new Date();
    const CELL_PX = 12, GAP_PX = 2, STRIDE_PX = CELL_PX + GAP_PX;

    let monthLabels = '', dayCount = 0;
    const addedMonths = new Set();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0,0,0,0);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23,59,59,999);

    while (curr <= end) {
        const dateStr = Formatters.toLocalYMD(curr);
        const entry = dataMap[dateStr];
        const isSunday = curr.getDay() === 0;
        
        if (curr.getDate() === 1 || (dayCount === 0 && curr.getDate() <= 7)) {
            const mStr = curr.toLocaleString('default', { month: 'short' });
            const colIndex = Math.floor(dayCount / 7);
            const monthKey = mStr + curr.getFullYear();
            if (!addedMonths.has(monthKey)) {
                const leftPos = colIndex * STRIDE_PX;
                monthLabels += `<span class="absolute text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap" style="left: ${leftPos}px; top: 0;">${mStr}</span>`;
                addedMonths.add(monthKey);
            }
        }

        // --- NEW: CSS Class Logic ---
        let bgClass = 'hm-empty', styleOverride = '', visibility = ''; 
        const isFuture = curr > today;
        const isCurrentWeek = curr >= currentWeekStart && curr <= currentWeekEnd;

        if (targetYear && curr.getFullYear() < targetYear) visibility = 'opacity: 0; pointer-events: none;';
        if (isSunday && (!entry || !entry.actualDuration || entry.actualDuration <= 0)) visibility = 'opacity: 0; pointer-events: none;';

        // Base Context Colors
        if (isConsistencyMode) {
            if (isFuture) {
                bgClass = isCurrentWeek ? 'hm-future-current' : 'hm-future';
            } else { 
                bgClass = 'hm-rest'; 
            }
        }

        let label = isFuture ? 'Future' : 'Rest', plan = 0, act = 0, detailsJson = '', tooltipColor = '#64748b'; 

        if (entry) {
            plan = entry.plannedDuration || 0;
            act = entry.actualDuration || 0;
            const status = entry.complianceStatus;
            
            if (entry.activities && entry.activities.length > 0) {
                const lines = entry.activities.map(a => {
                    const icon = Formatters.getIconForSport(a.sport); 
                    const colorStyle = ['Run','Bike','Swim'].includes(a.sport) ? `style="color: ${Formatters.COLORS[a.sport]}"` : `class="text-slate-400"`;
                    return `<div class='flex justify-between items-center gap-2 text-xs'><span ${colorStyle}>${icon}</span> <span>${a.name}</span><span class='font-mono text-emerald-400'>${Math.round(a.actual)}m</span></div>`;
                }).join('');
                detailsJson = encodeURIComponent(lines);
            }

            if (isConsistencyMode) {
                // Use new CSS classes
                if (status === 'Event') { bgClass = 'hm-event'; tooltipColor = '#a855f7'; label = `Event: ${entry.eventName}`; }
                else if (status === 'Completed') { bgClass = 'hm-done'; tooltipColor = '#34d399'; label = "Completed"; }
                else if (status === 'Partial') { bgClass = 'hm-partial'; tooltipColor = '#facc15'; label = "Partial"; }
                else if (status === 'Missed') { bgClass = 'hm-missed'; tooltipColor = '#ef4444'; label = "Missed"; }
                else if (status === 'Unplanned') { bgClass = 'hm-unplanned'; tooltipColor = '#10b981'; label = "Unplanned"; }
            } else {
                if (act > 0) {
                    const sports = entry.sports || [];
                    if (sports.length > 1) {
                        const count = sports.length;
                        const stops = sports.map((s, i) => {
                            let c = ['Run','Bike','Swim'].includes(s) ? Formatters.COLORS[s] : Formatters.COLORS.All;
                            return `${c} ${(i / count) * 100}%, ${c} ${((i + 1) / count) * 100}%`;
                        });
                        styleOverride = `background: linear-gradient(135deg, ${stops.join(', ')});`;
                        label = "Multi-Sport"; tooltipColor = '#ffffff';
                    } else if (sports.length === 1) {
                        const s = sports[0];
                        // Map sport string to CSS class if possible, or fallback to style
                        if(s === 'Run') { bgClass = 'hm-run'; tooltipColor = '#f472b6'; }
                        else if(s === 'Bike') { bgClass = 'hm-bike'; tooltipColor = '#c084fc'; }
                        else if(s === 'Swim') { bgClass = 'hm-swim'; tooltipColor = '#22d3ee'; }
                        else { bgClass = 'hm-other'; tooltipColor = '#34d399'; }
                        label = s; 
                    }
                }
            }
        }

        gridCells += `<div class="heatmap-cell rounded-[2px] transition-all hover:scale-125 hover:z-10 relative cursor-pointer ${bgClass}"
                 style="width: ${CELL_PX}px !important; height: ${CELL_PX}px !important; ${styleOverride} ${visibility}"
                 data-date="${dateStr}" data-plan="${Math.round(plan)}" data-act="${Math.round(act)}"
                 data-label="${label.replace(/"/g, '&quot;')}" data-color="${tooltipColor}" data-details="${detailsJson}"></div>`;

        curr.setDate(curr.getDate() + 1);
        dayCount++;
    }

    const idAttr = containerId ? `id="${containerId}"` : '';
    return `<div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex flex-col backdrop-blur-sm">
        <h3 class="text-xs font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
            <i class="fa-solid ${isConsistencyMode ? 'fa-calendar-check text-emerald-400' : 'fa-chart-simple text-blue-400'}"></i> ${title}
        </h3>
        <div class="flex-1 overflow-x-auto pb-3 custom-scrollbar flex" ${idAttr}>
            <div class="relative m-auto group">
                <div class="relative h-5 w-full mb-1">${monthLabels}</div>
                <div style="display: inline-grid; grid-template-rows: repeat(7, ${CELL_PX}px); grid-auto-flow: column; gap: ${GAP_PX}px !important;">${gridCells}</div>
            </div>
        </div>
        ${renderLegend(isConsistencyMode)}
    </div>`;
}

function renderLegend(isConsistencyMode) {
    if (isConsistencyMode) {
        return `<div class="flex flex-wrap justify-center gap-4 mt-3 pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] hm-done"></div> Done</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] hm-partial"></div> Partial</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] hm-missed"></div> Missed</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] hm-unplanned"></div> Unplanned</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-[2px] hm-event"></div> Event</div>
        </div>`;
    } else {
        return `<div class="flex flex-wrap justify-center gap-4 mt-3 pt-3 text-[10px] text-slate-400 font-mono border-t border-slate-700/30">
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full hm-run"></div> Run</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full hm-bike"></div> Bike</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full hm-swim"></div> Swim</div>
            <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded-full hm-other"></div> Other</div>
        </div>`;
    }
}
