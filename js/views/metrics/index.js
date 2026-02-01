import { UI } from '../../utils/ui.js';
import { renderSummaryTable } from './table.js';
import { updateCharts } from './charts.js';
import { normalizeMetricsData } from './parser.js';
import { METRIC_DEFINITIONS } from './definitions.js';

let metricsState = { timeRange: '6m' };
let cleanData = [];

// --- Global Handlers (Chart Tooltips) ---
// (These handlers allow the charts to be interactive)

window.handleMetricChartClick = (e, date, name, val, unit, breakdown, color) => {
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
    if (window.TooltipManager) window.TooltipManager.show(e.currentTarget, html, e);
};

window.handleMetricInfoClick = (e, key) => {
    e.stopPropagation();
    const def = METRIC_DEFINITIONS[key];
    if (!def) return;
    const html = `
        <div class="max-w-[280px]">
            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-blue-500/30">
                <i class="fa-solid ${def.icon}" style="color: ${def.colorVar}"></i>
                <h3 class="font-bold text-white uppercase tracking-wider">${def.title}</h3>
            </div>
            <div class="space-y-3 text-slate-300">
                <p>${def.description}</p>
                <div class="bg-slate-800/80 p-2 rounded border border-slate-700">
                    <div class="text-[10px] text-slate-500 uppercase font-bold">Target Range</div>
                    <div class="font-mono text-emerald-400">${def.rangeInfo}</div>
                </div>
                <div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">How to Improve</div>
                    <div class="text-xs text-slate-400 pl-2 border-l-2 border-slate-600">${def.improvement}</div>
                </div>
            </div>
        </div>`;
    if (window.TooltipManager) window.TooltipManager.show(e.currentTarget, html, e);
};

window.scrollToMetric = (key) => {
    const el = document.getElementById(`metric-chart-${key}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const container = el.closest('.bg-slate-800\\/30');
        if (container) {
            container.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => container.classList.remove('ring-2', 'ring-blue-500'), 1500);
        }
    }
};

window.toggleMetricsTime = (range) => {
    metricsState.timeRange = range;
    updateCharts(cleanData, metricsState.timeRange);
    
    // Update active button state
    document.querySelectorAll('[id^="btn-metric-"]').forEach(btn => {
        if(btn.id === `btn-metric-${range}`) {
            btn.classList.add('text-white', 'bg-slate-700');
            btn.classList.remove('text-slate-400', 'bg-slate-800');
        } else {
            btn.classList.remove('text-white', 'bg-slate-700');
            btn.classList.add('text-slate-400', 'bg-slate-800');
        }
    });
};

// --- MAIN RENDERER ---

export async function renderMetrics(rawData) {
    try {
        console.log("🚀 Rendering Metrics View...");

        // 1. Prepare Data for Charts (Historical)
        // We parse raw logs for charts, even though Table uses JSON
        cleanData = normalizeMetricsData(rawData || []);
        
        // 2. Schedule Charts to render after DOM insertion
        setTimeout(() => {
            console.log("📈 Updating Charts with data points:", cleanData.length);
            updateCharts(cleanData, metricsState.timeRange);
            // Set initial button state
            window.toggleMetricsTime(metricsState.timeRange);
        }, 100);

        // 3. Build Header
        const buildToggle = (range, label) => `<button id="btn-metric-${range}" onclick="window.toggleMetricsTime('${range}')" class="bg-slate-800 text-slate-400 px-3 py-1 rounded text-[10px] transition-all hover:text-white">${label}</button>`;
        
        const headerHtml = `
            <div class="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800 backdrop-blur-sm sticky top-0 z-10 mb-6">
                <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-bullseye text-emerald-500"></i> Performance Lab
                </h2>
                <div class="flex gap-1.5">${buildToggle('30d', '30d')}${buildToggle('90d', '90d')}${buildToggle('6m', '6m')}${buildToggle('1y', '1y')}</div>
            </div>`;

        // 4. Build Table (ASYNC - fetches coaching_view.json)
        // We await this so the Promise resolves to actual HTML string
        let tableHtml = "";
        try {
            tableHtml = await renderSummaryTable(); 
        } catch (e) {
            console.error("Table Render Error:", e);
            tableHtml = `<div class="p-4 text-rose-400 text-xs bg-rose-900/10 border border-rose-900/20 rounded">Error loading table</div>`;
        }
        
        const tableSection = UI.buildCollapsibleSection('metrics-table-section', 'Physiological Trends', tableHtml, true);

        // 5. Build Charts Grid
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

                ${buildSectionHeader('Running Metrics', 'fa-person-running', 'icon-run')}
                <div id="metric-chart-subjective_run"></div>
                <div id="metric-chart-run"></div>
                <div id="metric-chart-mechanical"></div>
                <div id="metric-chart-gct"></div>
                <div id="metric-chart-vert"></div>

                ${buildSectionHeader('Swimming Metrics', 'fa-person-swimming', 'icon-swim')}
                <div id="metric-chart-subjective_swim"></div>
                <div id="metric-chart-swim"></div> 
            </div>`;
        
        const chartsSection = UI.buildCollapsibleSection('metrics-charts-section', 'Detailed Charts', chartsGrid, true);

        // 6. Return Final HTML
        return `
            <div class="max-w-7xl mx-auto space-y-6 pb-12 relative">
                ${headerHtml}
                ${tableSection}
                ${chartsSection}
            </div>
        `;
    } catch (e) {
        console.error(e);
        return `<div class="p-4 text-red-400">Metrics Render Failed: ${e.message}</div>`;
    }
}
