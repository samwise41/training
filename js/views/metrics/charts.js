// js/views/metrics/charts.js
import { METRIC_DEFINITIONS } from './definitions.js';
import { calculateTrend, getTrendIcon } from './utils.js';
import { METRIC_FORMULAS, extractMetricData, calculateSubjectiveEfficiency } from './parser.js';

const buildMetricChart = (displayData, fullData, key) => {
    const def = METRIC_DEFINITIONS[key];
    if (!def) return `<div class="p-4 text-red-500 text-xs">Error: Definition missing for ${key}</div>`;

    const unitLabel = def.rangeInfo.split(' ').pop(); 
    const color = def.colorVar;

    const formula = METRIC_FORMULAS[key] || '';
    const titleHtml = `
        <h3 class="text-xs font-bold text-white flex items-center gap-2">
            <i class="fa-solid ${def.icon}" style="color: ${color}"></i> 
            ${def.title}
            ${formula ? `<span class="text-[10px] font-normal opacity-50 ml-1 font-mono">${formula}</span>` : ''}
        </h3>
    `;

    // Empty State
    if (!displayData || displayData.length < 2) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col justify-between opacity-75">
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                ${titleHtml}
            </div>
            <div class="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                <i class="fa-solid fa-chart-simple text-2xl opacity-20"></i>
                <p class="text-xs italic">Not enough data</p>
                </div>
        </div>`;
    }

    // Chart Dimensions
    const width = 800, height = 150;
    const pad = { t: 20, b: 30, l: 50, r: 20 };
    const getX = (d, i) => pad.l + (i / (displayData.length - 1)) * (width - pad.l - pad.r);
    
    const dataValues = displayData.map(d => d.val);
    let minV = Math.min(...dataValues);
    let maxV = Math.max(...dataValues);

    // Apply Reference Floor/Ceiling
    if (def.refMin !== undefined) minV = Math.min(minV, def.refMin);
    if (def.refMax !== undefined) maxV = Math.max(maxV, def.refMax);

    const range = maxV - minV;
    const buf = range * 0.15 || (maxV * 0.1) || 1; 
    const domainMin = Math.max(0, minV - buf);
    const domainMax = maxV + buf;

    const getY = (val) => height - pad.b - ((val - domainMin) / (domainMax - domainMin)) * (height - pad.t - pad.b);

    // Trend Lines
    const now = new Date();
    const getSlope = (days) => {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - days);
        const subset = fullData.filter(d => d.date >= cutoff);
        const trend = calculateTrend(subset);
        return trend ? getTrendIcon(trend.slope, def.invertRanges) : { icon: 'fa-minus', color: 'text-slate-600' };
    };
    const t30 = getSlope(30);
    const t90 = getSlope(90);
    const t6m = getSlope(180);

    const indicatorsHtml = `
        <div class="flex gap-1 ml-auto">
            <div class="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50" title="30d Trend">
                <span class="text-[8px] font-bold text-slate-400">30d</span><i class="fa-solid ${t30.icon} ${t30.color} text-[8px]"></i>
            </div>
            <div class="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50" title="90d Trend">
                <span class="text-[8px] font-bold text-slate-400">90d</span><i class="fa-solid ${t90.icon} ${t90.color} text-[8px]"></i>
            </div>
            <div class="flex items-center gap-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50" title="6m Trend">
                <span class="text-[8px] font-bold text-slate-400">6m</span><i class="fa-solid ${t6m.icon} ${t6m.color} text-[8px]"></i>
            </div>
        </div>`;

    // SVG Parts
    const yAxisLine = `<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" />`;
    const yMid = (domainMin + domainMax) / 2;
    const axisLabelsHtml = `
        <text x="${pad.l - 6}" y="${getY(domainMax) + 4}" text-anchor="end" font-size="9" fill="#64748b">${domainMax.toFixed(1)}</text>
        <text x="${pad.l - 6}" y="${getY(yMid) + 4}" text-anchor="end" font-size="9" fill="#64748b">${yMid.toFixed(1)}</text>
        <text x="${pad.l - 6}" y="${getY(domainMin) + 4}" text-anchor="end" font-size="9" fill="#64748b">${domainMin.toFixed(1)}</text>
    `;

    // X-Axis
    let xAxisLabelsHtml = '';
    const targetCount = 5; 
    const step = (displayData.length - 1) / (targetCount - 1);
    const indices = new Set();
    for (let j = 0; j < targetCount; j++) indices.add(Math.round(j * step));
    
    indices.forEach(index => {
        if (index < displayData.length) {
            const d = displayData[index];
            const xPos = getX(d, index);
            const dateObj = new Date(d.date);
            const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            let anchor = 'middle';
            if (index === 0) anchor = 'start';
            if (index === displayData.length - 1) anchor = 'end';
            
            xAxisLabelsHtml += `<text x="${xPos}" y="${height - 5}" text-anchor="${anchor}" font-size="9" fill="#64748b">${label}</text>`;
        }
    });

    const chartTrend = calculateTrend(displayData);
    let trendHtml = chartTrend ? `<line x1="${getX(null, 0)}" y1="${getY(chartTrend.startVal)}" x2="${getX(null, displayData.length - 1)}" y2="${getY(chartTrend.endVal)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.5" />` : '';
    
    let pathD = `M ${getX(displayData[0], 0)} ${getY(displayData[0].val)}`;
    let pointsHtml = '';
    displayData.forEach((d, i) => {
        const x = getX(d, i), y = getY(d.val);
        pathD += ` L ${x} ${y}`;
        pointsHtml += `<circle cx="${x}" cy="${y}" r="3.5" fill="#0f172a" stroke="${color}" stroke-width="2" class="cursor-pointer hover:stroke-white transition-all" onclick="window.showMetricTooltip(event, '${d.dateStr}', '${d.name.replace(/'/g, "")}', '${d.val.toFixed(2)}', '${unitLabel}', '${d.breakdown || ""}', '${color}')"></circle>`;
    });

    return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <div class="flex items-center gap-2">
                    ${titleHtml}
                </div>
                <div class="flex items-center gap-3">
                    ${indicatorsHtml}
                    <div class="cursor-pointer text-slate-500 hover:text-white transition-colors p-1" onclick="window.showAnalysisTooltip(event, '${key}')">
                        <i class="fa-solid fa-circle-info text-sm"></i>
                    </div>
                </div>
            </div>
            <div class="flex-1 w-full h-[120px]">
                <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                    ${yAxisLine}
                    ${axisLabelsHtml}
                    ${xAxisLabelsHtml}
                    ${trendHtml}
                    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.9" />
                    ${pointsHtml}
                </svg>
            </div>
        </div>
    `;
};

export const updateCharts = (normalizedData, timeRange) => {
    if (!normalizedData || normalizedData.length === 0) return;
    
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90);
    else if (timeRange === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (timeRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    
    const render = (id, key) => {
        const el = document.getElementById(id);
        if (el) {
            let full;
            // Calculations assume strict data keys now
            if (key.startsWith('subjective_')) {
                const mode = key.split('_')[1]; 
                full = calculateSubjectiveEfficiency(normalizedData, mode);
            } else {
                full = extractMetricData(normalizedData, key);
            }
            
            if (full) full.sort((a,b) => a.date - b.date);
            const display = full ? full.filter(d => d.date >= cutoff) : [];
            el.innerHTML = buildMetricChart(display, full || [], key);
        }
    };

    // Render grouped charts
    render('metric-chart-vo2max', 'vo2max');
    render('metric-chart-tss', 'tss');
    render('metric-chart-anaerobic', 'anaerobic');

    render('metric-chart-subjective_bike', 'subjective_bike');
    render('metric-chart-endurance', 'endurance');
    render('metric-chart-strength', 'strength');

    render('metric-chart-subjective_run', 'subjective_run');
    render('metric-chart-run', 'run');
    render('metric-chart-mechanical', 'mechanical');
    render('metric-chart-gct', 'gct');
    render('metric-chart-vert', 'vert');

    render('metric-chart-subjective_swim', 'subjective_swim');
    render('metric-chart-swim', 'swim');

    ['30d', '90d', '6m', '1y'].forEach(range => {
        const btn = document.getElementById(`btn-metric-${range}`);
        if(btn) {
            btn.className = timeRange === range ? 
                "bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] transition-all shadow-lg" : 
                "bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded text-[10px] transition-all hover:bg-slate-700";
        }
    });
};
