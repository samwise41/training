import { UI } from '../../utils/ui.js';
import { DataManager } from '../../utils/data.js';
import { renderSummaryTable } from './table.js';
import { updateCharts } from './charts.js';
import { normalizeMetricsData } from './parser.js';

// Global state
let metricsState = { timeRange: '6m', configMap: {} };
let cleanData = [];

// --- Global Handlers ---

window.handleMetricChartClick = (e, date, name, val, unit, breakdown, color) => {
    if(window.TooltipManager) {
        e.stopPropagation();
        const breakdownHtml = breakdown ? `<div class="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic">${breakdown}</div>` : '';
        const html = `
            <div class="min-w-[150px]">
                <div class="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">${name}</div>
                <div class="flex justify-between items-end mb-1 gap-4">
                    <span class="text-[10px] text-slate-400">${date}</span>
                    <span class="text-lg font-bold" style="color: ${color}">${val} <span class="text-[10px] text-slate-500">${unit}</span></span>
                </div>
                ${breakdownHtml}
            </div>`;
        window.TooltipManager.show(e.currentTarget, html, e);
    }
};

window.handleMetricInfoClick = (e, key) => {
    if(window.TooltipManager) {
        e.stopPropagation();
        const def = metricsState.configMap[key] || { title: key, description: 'Loading...' };
        const icon = def.icon || 'fa-circle-info';
        const color = def.colorVar || 'var(--text-main)';
        const range = (def.good_min !== undefined) ? `${def.good_min} – ${def.good_max}` : 'N/A';

        const html = `
            <div class="max-w-[280px]">
                <div class="flex items-center gap-2 mb-2 pb-2 border-b border-blue-500/30">
                    <i class="fa-solid ${icon}" style="color: ${color}"></i>
                    <h3 class="font-bold text-white uppercase tracking-wider">${def.title}</h3>
                </div>
                <div class="space-y-3 text-slate-300">
                    <p>${def.description || ''}</p>
                    <div class="bg-slate-800/80 p-2 rounded border border-slate-700">
                        <div class="text-[10px] text-slate-500 uppercase font-bold">Target Range</div>
                        <div class="font-mono text-emerald-400">${range} ${def.unit || ''}</div>
                    </div>
                    ${def.improvement ? `<div class="text-xs text-slate-400 pl-2 border-l-2 border-slate-600">${def.improvement}</div>` : ''}
                </div>
            </div>`;
        window.TooltipManager.show(e.currentTarget, html, e);
    }
};

window.scrollToMetric = (key) => {
    const el = document.getElementById(`metric-chart-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.toggleMetricsTime = (range) => {
    metricsState.timeRange = range;
    if (cleanData.length > 0) updateCharts(cleanData, metricsState.timeRange);
    
    document.querySelectorAll('[id^="btn-metric-"]').forEach(btn => {
        const isActive = btn.id === `btn-metric-${range}`;
        btn.className = isActive 
            ? "bg-slate-700 text-white px-3 py-1 rounded text-[10px] transition-all" 
            : "bg-slate-800 text-slate-400 px-3 py-1 rounded text-[10px] transition-all hover:text-white";
    });
};

function resolveCssVar(colorString) {
    if (!colorString || !colorString.startsWith('var(')) return colorString;
    const varName = colorString.replace(/^var\((--[^)]+)\)$/, '$1');
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// --- ASYNC LOGIC ---
async function populateView(rawData) {
    try {
        // 1. Fetch Config
        const coachingData = await DataManager.fetchJSON('COACHING_VIEW');
        if (coachingData && coachingData.metrics_summary) {
            metricsState.configMap = {};
            coachingData.metrics_summary.forEach(group => {
                group.metrics.forEach(m => {
                    // --- THE FIX: RESOLVE COLORS HERE ---
                    // If the config says "var(--color-bad)", we resolve it to "#ef4444"
                    // so the charting library can actually use it.
                    if (m.colorVar && m.colorVar.startsWith('var(--')) {
                        m.colorVar = resolveCssVar(m.colorVar);
                    }
                    // ------------------------------------
                    metricsState.configMap[m.id] = m;
                });
            });
        }

        // 2. Fetch Drift History (NEW)
        let driftData = [];
        try {
            const res = await fetch('data/metrics/drift_history.json');
            if (res.ok) driftData = await res.json();
        } catch (e) { 
            console.warn("Could not load drift history", e); 
        }

        // 3. Render Table
        const tableContainer = document.getElementById('metrics-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = await renderSummaryTable();
        }

        // 4. Render Charts
        if (!rawData || rawData.length === 0) rawData = await DataManager.fetchJSON('log');

        if (rawData && rawData.length > 0) {
            cleanData = normalizeMetricsData(rawData);

            // --- MERGE DRIFT DATA (Sport-Aware) ---
            if (driftData.length > 0) {
                const driftMap = {};
                driftData.forEach(d => {
                    if (!d.date) return;
                    if (!driftMap[d.date]) driftMap[d.date] = {};
                    driftMap[d.date][d.sport] = d.val;
                });

                cleanData.forEach(day => {
                    const dateKey = day.dateStr || (day.date ? day.date.split('T')[0] : null);
                    if (dateKey && driftMap[dateKey]) {
                        if (driftMap[dateKey].Bike !== undefined) {
                            day._drift_bike = driftMap[dateKey].Bike;
                        }
                        if (driftMap[dateKey].Run !== undefined) {
                            day._drift_run = driftMap[dateKey].Run;
                        }
                    }
                });
            }
            // --------------------------------------

            setTimeout(() => {
                updateCharts(cleanData, metricsState.timeRange);
                window.toggleMetricsTime(metricsState.timeRange);
            }, 50);
        }
    } catch (e) {
        console.error("Hydration Error:", e);
    }
}

// --- MAIN RENDERER (Must return string synchronously) ---
export function renderMetrics(rawData) {
    try {
        // Ensure UI exists before using it
        if (!UI || typeof UI.buildCollapsibleSection !== 'function') {
            throw new Error("UI Utility is missing or invalid imports.");
        }

        const buildToggle = (range, label) => `<button id="btn-metric-${range}" onclick="window.toggleMetricsTime('${range}')" class="bg-slate-800 text-slate-400 px-3 py-1 rounded text-[10px] transition-all hover:text-white">${label}</button>`;
        
        const headerHtml = `
            <div class="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800 backdrop-blur-sm sticky top-0 z-10 mb-6">
                <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-bullseye text-emerald-500"></i> Performance Lab
                </h2>
                <div class="flex gap-1.5">${buildToggle('30d', '30d')}${buildToggle('90d', '90d')}${buildToggle('6m', '6m')}${buildToggle('1y', '1y')}</div>
            </div>`;

        const tableSection = UI.buildCollapsibleSection('metrics-table-section', 'Physiological Trends', '<div id="metrics-table-container" class="min-h-[100px] flex items-center justify-center text-slate-500 text-xs">Loading Analysis...</div>', true);

        const buildSectionHeader = (title, icon, color) => `
            <div class="col-span-full mt-6 mb-2 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                <i class="fa-solid ${icon} ${color}"></i>
                <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">${title}</h3>
            </div>`;

        const chartsGrid = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${buildSectionHeader('General Fitness', 'fa-heart-pulse', 'icon-all')}
                <div id="metric-chart-vo2max"></div>
                <div id="metric-chart-tss"></div>
                <div id="metric-chart-anaerobic"></div>
                <div id="metric-chart-calories"></div> 
                <div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div id="metric-chart-training_balance"></div>
                    <div id="metric-chart-feeling_load"></div>
                </div>

                ${buildSectionHeader('Cycling Metrics', 'fa-person-biking', 'icon-bike')}
                <div id="metric-chart-subjective_bike"></div>
                <div id="metric-chart-endurance"></div>
                <div id="metric-chart-strength"></div>
                <div id="metric-chart-drift_bike"></div> <div id="metric-chart-strength"></div>

                ${buildSectionHeader('Running Metrics', 'fa-person-running', 'icon-run')}
                <div id="metric-chart-subjective_run"></div>
                <div id="metric-chart-run"></div>
                <div id="metric-chart-mechanical"></div>
                <div id="metric-chart-gct"></div>
                <div id="metric-chart-vert"></div>
                <div id="metric-chart-drift_run"></div>  <div id="metric-chart-mechanical"></div>

                ${buildSectionHeader('Swimming Metrics', 'fa-person-swimming', 'icon-swim')}
                <div id="metric-chart-subjective_swim"></div>
                <div id="metric-chart-swim"></div> 
            </div>`;
        
        const chartsSection = UI.buildCollapsibleSection('metrics-charts-section', 'Detailed Charts', chartsGrid, true);

        // Trigger Async Load
        setTimeout(() => populateView(rawData), 0);

        return `
            <div class="max-w-7xl mx-auto space-y-6 pb-12 relative">
                ${headerHtml}
                ${tableSection}
                ${chartsSection}
            </div>
        `;
    } catch (e) {
        console.error(e);
        return `<div class="p-8 text-center text-rose-400 border border-rose-900 bg-rose-900/10 rounded">
            <h3 class="font-bold">View Error</h3>
            <p class="text-sm font-mono mt-2">${e.message}</p>
        </div>`;
    }
}
