// js/views/metrics/index.js
import { buildCollapsibleSection } from './utils.js';
import { renderSummaryTable } from './table.js';
import { updateCharts } from './charts.js';
import { normalizeMetricsData } from './parser.js';
import { METRIC_DEFINITIONS } from './definitions.js';

let metricsState = { timeRange: '6m' };
let cleanData = [];

// --- Global Interactive Handlers ---

// 1. Chart Data Point Tooltip
window.showMetricTooltip = (e, date, name, val, unit, breakdown, color) => {
    e.stopPropagation(); // Prevent global click from closing immediately
    
    // Close the other popup if open
    const infoPopup = document.getElementById('metric-info-popup');
    if (infoPopup) infoPopup.style.opacity = '0';

    const el = document.getElementById('metric-tooltip-popup');
    if (!el) return;
    
    el.innerHTML = `
        <div class="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">${name}</div>
        <div class="flex justify-between items-end mb-1 gap-4">
            <span class="text-[10px] text-slate-400">${date}</span>
            <span class="text-lg font-bold" style="color: ${color}">${val} <span class="text-[10px] text-slate-500">${unit}</span></span>
        </div>
        ${breakdown ? `<div class="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 italic">${breakdown}</div>` : ''}
    `;
    
    // Simple positioning relative to cursor
    el.style.left = `${e.pageX + 10}px`;
    el.style.top = `${e.pageY + 10}px`;
    el.style.opacity = '1';
};

// 2. Metric Info Tooltip (The 'i' icon)
window.showAnalysisTooltip = (e, key) => {
    e.stopPropagation();
    
    // Close the other popup if open
    const chartPopup = document.getElementById('metric-tooltip-popup');
    if (chartPopup) chartPopup.style.opacity = '0';

    const el = document.getElementById('metric-info-popup');
    const def = METRIC_DEFINITIONS[key];
    if (!el || !def) return;

    el.innerHTML = `
        <div class="flex items-center gap-2 mb-2 pb-2 border-b border-blue-500/30">
            <i class="fa-solid ${def.icon}" style="color: ${def.colorVar}"></i>
            <h3 class="font-bold text-white uppercase tracking-wider">${def.title}</h3>
        </div>
        <div class="space-y-2 text-slate-300">
            <p>${def.description}</p>
            <div class="bg-slate-900/50 p-2 rounded">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Target Range</div>
                <div class="font-mono text-emerald-400">${def.rangeInfo}</div>
            </div>
            <div>
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">To Improve</div>
                <div class="text-xs text-slate-400 pl-2 border-l-2 border-slate-600">${def.improvement}</div>
            </div>
        </div>
    `;
    
    // Position slightly to the left/bottom to avoid covering the icon too much
    // Adjust based on screen width if needed, but basic offset:
    const leftPos = Math.max(10, e.pageX - 300); 
    el.style.left = `${leftPos}px`;
    el.style.top = `${e.pageY + 10}px`;
    el.style.opacity = '1';
};

// 3. Scroll Handler (From Table click)
window.scrollToMetric = (key) => {
    const el = document.getElementById(`metric-chart-${key}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Visual cue
        const container = el.closest('.bg-slate-800\\/30'); // Find the card container
        if (container) {
            container.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => container.classList.remove('ring-2', 'ring-blue-500'), 1500);
        }
    }
};

// 4. Global Click Listener (Close all popups)
document.addEventListener('click', () => {
    const t1 = document.getElementById('metric-tooltip-popup');
    const t2 = document.getElementById('metric-info-popup');
    if (t1) t1.style.opacity = '0';
    if (t2) t2.style.opacity = '0';
});


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
