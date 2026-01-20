// js/views/metrics/charts.js
import { METRIC_DEFINITIONS } from './definitions.js';
import { calculateTrend, getTrendIcon } from './utils.js';
// Updated import
import { METRIC_FORMULAS, extractMetricData, calculateSubjectiveEfficiency } from './parser.js';

const buildMetricChart = (displayData, fullData, key) => {
    const def = METRIC_DEFINITIONS[key];
    if (!def) return '';

    // --- EMPTY STATE ---
    if (!displayData || displayData.length < 2) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col justify-between opacity-60">
            <h3 class="text-xs font-bold text-slate-400 flex items-center gap-2"><i class="fa-solid ${def.icon}"></i> ${def.title}</h3>
            <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
                <p class="text-[10px] italic">Not enough data</p>
            </div>
        </div>`;
    }

    const width = 800, height = 150;
    const pad = { t: 20, b: 30, l: 40, r: 20 };
    
    // Y-Scale
    const vals = displayData.map(d => d.val);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (def.refMin) min = Math.min(min, def.refMin);
    if (def.refMax) max = Math.max(max, def.refMax);
    const range = max - min || 1;
    const dMin = Math.max(0, min - range * 0.1);
    const dMax = max + range * 0.1;
    const getY = v => height - pad.b - ((v - dMin) / (dMax - dMin)) * (height - pad.t - pad.b);
    const getX = (i) => pad.l + (i / (displayData.length - 1)) * (width - pad.l - pad.r);

    // Chart Lines
    let path = `M ${getX(0)} ${getY(displayData[0].val)}`;
    let points = '';
    displayData.forEach((d, i) => {
        const x = getX(i), y = getY(d.val);
        path += ` L ${x} ${y}`;
        points += `<circle cx="${x}" cy="${y}" r="3" fill="#0f172a" stroke="${def.colorVar}" stroke-width="2" class="cursor-pointer hover:stroke-white transition-all" onclick="window.showMetricTooltip(event, '${d.dateStr}', '${d.name.replace(/'/g, "")}', '${d.val.toFixed(2)}', '', '${d.breakdown||""}', '${def.colorVar}')"></circle>`;
    });

    // Trend
    const trend = calculateTrend(displayData);
    let trendLine = '';
    if (trend) trendLine = `<line x1="${getX(0)}" y1="${getY(trend.startVal)}" x2="${getX(displayData.length-1)}" y2="${getY(trend.endVal)}" stroke="${def.colorVar}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5" />`;

    return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 class="text-xs font-bold text-white flex items-center gap-2"><i class="fa-solid ${def.icon}" style="color:${def.colorVar}"></i> ${def.title}</h3>
                <i class="fa-solid fa-circle-info text-slate-500 cursor-pointer hover:text-white" onclick="window.showAnalysisTooltip(event, '${key}')"></i>
            </div>
            <div class="flex-1 w-full h-[120px]">
                <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                    <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" />
                    <text x="${pad.l-5}" y="${getY(dMax)+3}" text-anchor="end" font-size="9" fill="#64748b">${dMax.toFixed(1)}</text>
                    <text x="${pad.l-5}" y="${getY(dMin)+3}" text-anchor="end" font-size="9" fill="#64748b">${dMin.toFixed(1)}</text>
                    ${trendLine}
                    <path d="${path}" fill="none" stroke="${def.colorVar}" stroke-width="1.5" opacity="0.9" />
                    ${points}
                </svg>
            </div>
        </div>`;
};

export const updateCharts = (data, range) => {
    if (!data || !data.length) return;
    const cutoff = new Date();
    if (range === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (range === '90d') cutoff.setDate(cutoff.getDate() - 90);
    else if (range === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (range === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);

    const render = (id, key) => {
        const el = document.getElementById(id);
        if(!el) return;
        let full = key.startsWith('subjective_') ? calculateSubjectiveEfficiency(data, key.split('_')[1]) : extractMetricData(data, key);
        if(full) full.sort((a,b)=>a.date-b.date);
        const display = full ? full.filter(d => d.date >= cutoff) : [];
        el.innerHTML = buildMetricChart(display, full||[], key);
    };

    ['vo2max','tss','anaerobic','subjective_bike','endurance','strength','subjective_run','run','mechanical','gct','vert','subjective_swim','swim'].forEach(k => render(`metric-chart-${k}`, k));
    
    // Update buttons
    ['30d','90d','6m','1y'].forEach(r => {
        const b = document.getElementById(`btn-metric-${r}`);
        if(b) b.className = range===r ? "bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px]" : "bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded text-[10px]";
    });
};
