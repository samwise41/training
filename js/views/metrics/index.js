// js/views/metrics/index.js
import { buildCollapsibleSection } from './utils.js';
import { renderSummaryTable } from './table.js';
import { updateCharts } from './charts.js';
import { normalizeMetricsData } from './parser.js';

let metricsState = { timeRange: '6m' };
let cleanData = [];

window.toggleMetricsTime = (range) => {
    metricsState.timeRange = range;
    updateCharts(cleanData, metricsState.timeRange);
};

export function renderMetrics(rawData) {
    // 1. Normalize Data (Fixes keys once)
    cleanData = normalizeMetricsData(rawData || []);
    
    setTimeout(() => {
        updateCharts(cleanData, metricsState.timeRange);
    }, 50);

    const buildToggle = (range, label) => `<button id="btn-metric-${range}" onclick="window.toggleMetricsTime('${range}')" class="bg-slate-800 text-slate-400 px-3 py-1 rounded text-[10px] transition-all hover:text-white">${label}</button>`;
    
    const headerHtml = `
        <div class="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800 backdrop-blur-sm sticky top-0 z-10 mb-6">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-bullseye text-emerald-500"></i> Performance Lab
            </h2>
            <div class="flex gap-1.5">${buildToggle('30d', '30d')}${buildToggle('90d', '90d')}${buildToggle('6m', '6m')}${buildToggle('1y', '1y')}</div>
        </div>`;

    // 2. Render Table
    let tableHtml = "";
    try {
        tableHtml = renderSummaryTable(cleanData);
    } catch (e) {
        tableHtml = `<div class="p-4 text-red-400 text-xs">Error loading table: ${e.message}</div>`;
    }
    const tableSection = buildCollapsibleSection('metrics-table-section', 'Physiological Trends', tableHtml, true);

    // 3. Render Charts
    const buildSectionHeader = (title, icon, color) => `
        <div class="col-span-full mt-6 mb-2 flex items-center gap-2 border-b border-slate-700/50 pb-2">
            <i class="fa-solid ${icon} ${color}"></i>
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">${title}</h3>
        </div>`;

    const chartsGrid = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            ${buildSectionHeader('General Fitness', 'fa-heart-pulse', 'text-emerald-400')}
            <div id="metric-chart-vo2max"></div>
            <div id="metric-chart-tss"></div>
            <div id="metric-chart-anaerobic"></div>

            ${buildSectionHeader('Cycling Metrics', 'fa-person-biking', 'text-purple-400')}
            <div id="metric-chart-subjective_bike"></div>
            <div id="metric-chart-endurance"></div>
            <div id="metric-chart-strength"></div>

            ${buildSectionHeader('Running Metrics', 'fa-person-running', 'text-pink-400')}
            <div id="metric-chart-subjective_run"></div>
            <div id="metric-chart-run"></div>
            <div id="metric-chart-mechanical"></div>
            <div id="metric-chart-gct"></div>
            <div id="metric-chart-vert"></div>

            ${buildSectionHeader('Swimming Metrics', 'fa-person-swimming', 'text-blue-400')}
            <div id="metric-chart-subjective_swim"></div>
            <div id="metric-chart-swim"></div> 
        </div>`;
    
    const chartsSection = buildCollapsibleSection('metrics-charts-section', 'Detailed Charts', chartsGrid, true);

    return `
        <div class="max-w-7xl mx-auto space-y-6 pb-12 relative">
            ${headerHtml}
            ${tableSection}
            ${chartsSection}
        </div>
        <div id="metric-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-3 rounded-md shadow-xl text-xs opacity-0 transition-opacity absolute pointer-events-auto cursor-pointer"></div>
        <div id="metric-info-popup" class="z-50 bg-slate-800 border border-blue-500/50 p-4 rounded-xl shadow-2xl text-xs opacity-0 transition-opacity absolute pointer-events-auto cursor-pointer max-w-[320px]"></div>
    `;
}
