// js/views/metrics/charts.js
import { METRIC_DEFINITIONS } from './definitions.js';
import { calculateTrend, getTrendIcon } from './utils.js';
import { METRIC_FORMULAS, extractMetricData, calculateSubjectiveEfficiency } from './parser.js';

const buildMetricChart = (displayData, fullData, key) => {
    const def = METRIC_DEFINITIONS[key];
    if (!def) return '';
    const color = def.colorVar;

    const formula = METRIC_FORMULAS[key] || '';
    const titleHtml = `
        <h3 class="text-xs font-bold text-white flex items-center gap-2">
            <i class="fa-solid ${def.icon}" style="color: ${color}"></i> 
            ${def.title}
            ${formula ? `<span class="text-[10px] font-normal opacity-50 ml-1 font-mono">${formula}</span>` : ''}
        </h3>
    `;

    // --- EMPTY STATE ---
    if (!displayData || displayData.length < 2) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col justify-between opacity-60">
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">${titleHtml}</div>
            <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
                <i class="fa-solid fa-chart-simple text-2xl opacity-20"></i>
                <p class="text-[10px] italic">Not enough data</p>
            </div>
        </div>`;
    }

    // Chart Dimensions
    const width = 800, height = 150;
    const pad = { t: 20, b: 30, l: 40, r: 20 };
    const getX = (d, i) => pad.l + (i / (displayData.length - 1)) * (width - pad.l - pad.r);
    
    const vals = displayData.map(d => d.val);
    let minV = Math.min(...vals), maxV = Math.max(...vals);
    if (def.refMin) minV = Math.min(minV, def.refMin);
    if (def.refMax) maxV = Math.max(maxV, def.refMax);
    
    const range = maxV - minV || 1;
    const domainMin = Math.max(0, minV - range * 0.1);
    const domainMax = maxV + range * 0.1;
    const getY = (val) => height - pad.b - ((val - domainMin) / (domainMax - domainMin)) * (height - pad.t - pad.b);

    // SVG
    let pathD = `M ${getX(displayData[0], 0)} ${getY(displayData[0].val)}`;
    let pointsHtml = '';
    displayData.forEach((d, i) => {
        const x = getX(d, i), y = getY(d.val);
        pathD += ` L ${x} ${y}`;
        pointsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="#0f172a" stroke="${color}" stroke-width="2" class="cursor-pointer hover:stroke-white transition-all" onclick="window.showMetricTooltip(event, '${d.dateStr}', '${d.name.replace(/'/g, "")}', '${d.val.toFixed(2)}', '', '${d.breakdown||""}', '${color}')"></circle>`;
    });

    const trend = calculateTrend(displayData);
    let trendHtml = trend ? `<line x1="${getX(null, 0)}" y1="${getY(trend.startVal)}" x2="${getX(null, displayData.length - 1)}" y2="${getY(trend.endVal)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5" />` : '';

    return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <div class="flex items-center gap-2">${titleHtml}</div>
                <div class="flex items-center gap-2">
                    <span class="text-[9px] text-slate-500 font-mono">${displayData.length} Activities</span>
                    <i class="fa-solid fa-circle-info text-slate-500 cursor-pointer hover:text-white" onclick="window.showAnalysisTooltip(event, '${key}')"></i>
                </div>
            </div>
            <div class="flex-1 w-full h-[120px]">
                <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                    <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" />
                    <text x="${pad.l-5}" y="${getY(domainMax)+3}" text-anchor="end" font-size="9" fill="#64748b">${domainMax.toFixed(1)}</text>
                    <text x="${pad.l-5}" y="${getY(domainMin)+3}" text-anchor="end" font-size="9" fill="#64748b">${domainMin.toFixed(1)}</text>
                    ${trendHtml}
                    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.9" />
                    ${pointsHtml}
                </svg>
            </div>
        </div>`;
};

export const updateCharts = (allData, timeRange) => {
    if (!allData || !allData.length) return;
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90);
    else if (timeRange === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (timeRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    
    const render = (id, key) => {
        const el = document.getElementById(id);
        if(!el) return;
        let full = key.startsWith('subjective_') ? calculateSubjectiveEfficiency(allData, key.split('_')[1]) : extractMetricData(allData, key);
        if(full) full.sort((a,b)=>a.date-b.date);
        const display = full ? full.filter(d => d.date >= cutoff) : [];
        el.innerHTML = buildMetricChart(display, full||[], key);
    };

    ['vo2max','tss','anaerobic','subjective_bike','endurance','strength','subjective_run','run','mechanical','gct','vert','subjective_swim','swim'].forEach(k => render(`metric-chart-${k}`, k));
    
    ['30d','90d','6m','1y'].forEach(r => {
        const b = document.getElementById(`btn-metric-${r}`);
        if(b) b.className = timeRange===r ? "bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px]" : "bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded text-[10px]";
    });
};
