// js/views/metrics/charts.js
import { METRIC_DEFINITIONS } from './definitions.js';
import { calculateTrend } from './utils.js';
import { METRIC_FORMULAS, extractMetricData, calculateSubjectiveEfficiency } from './parser.js';
import { Formatters } from '../../utils/formatting.js'; 

const buildMetricChart = (displayData, fullData, key) => {
    // --- SPECIAL RENDERERS ---
    if (key === 'training_balance') return buildStackedBarChart(displayData, key);
    if (key === 'feeling_load') return buildDualAxisChart(displayData, key);

    const def = METRIC_DEFINITIONS[key];
    if (!def) return '';

    // --- STANDARD CHART LOGIC ---
    // We map keys to CSS Variables for consistency
    const C = Formatters.COLORS;
    const colorMap = {
        'vo2max': 'var(--color-all)', 
        'tss': 'var(--color-tss)', 
        'anaerobic': 'var(--color-anaerobic)', 
        'calories': 'var(--color-all)',
        
        'subjective_bike': 'var(--color-bike)', 
        'endurance': 'var(--color-bike)', 
        'strength': 'var(--color-bike)',
        
        'subjective_run': 'var(--color-run)', 
        'run': 'var(--color-run)', 
        'mechanical': 'var(--color-run)', 
        'gct': 'var(--color-run)', 
        'vert': 'var(--color-run)',
        
        'subjective_swim': 'var(--color-swim)', 
        'swim': 'var(--color-swim)'
    };

    const color = colorMap[key] || 'var(--color-all)';
    const formula = METRIC_FORMULAS[key] || '';

    if (!displayData || displayData.length < 2) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col justify-between opacity-60"><div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2"><h3 class="text-xs font-bold text-slate-400 flex items-center gap-2"><i class="fa-solid ${def.icon}"></i> ${def.title}</h3></div><div class="flex-1 flex flex-col items-center justify-center text-slate-500"><i class="fa-solid fa-chart-simple text-2xl opacity-20"></i><p class="text-[10px] italic">Not enough data</p></div></div>`;
    }

    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 20 };
    const getX = (d, i) => pad.l + (i / (displayData.length - 1)) * (width - pad.l - pad.r);
    
    const vals = displayData.map(d => d.val);
    let minV = Math.min(...vals), maxV = Math.max(...vals);
    if (def.refMin) minV = Math.min(minV, def.refMin);
    if (def.refMax) maxV = Math.max(maxV, def.refMax);
    const range = maxV - minV || 1;
    const dMin = Math.max(0, minV - range * 0.1);
    const dMax = maxV + range * 0.1;
    const getY = (val) => height - pad.b - ((val - dMin) / (dMax - dMin)) * (height - pad.t - pad.b);

    const isInverted = def.invertRanges;
    const colorGood = color;     
    const colorBad = '#ef4444'; 
    
    const maxLineColor = isInverted ? colorBad : colorGood;
    const minLineColor = isInverted ? colorGood : colorBad;

    let targetsHtml = '';
    if (def.refMin !== undefined) {
        const yVal = getY(def.refMin);
        targetsHtml += `<line x1="${pad.l}" y1="${yVal}" x2="${width - pad.r}" y2="${yVal}" stroke="${minLineColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />`;
    }
    if (def.refMax !== undefined) {
        const yVal = getY(def.refMax);
        targetsHtml += `<line x1="${pad.l}" y1="${yVal}" x2="${width - pad.r}" y2="${yVal}" stroke="${maxLineColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />`;
    }

    let pathD = `M ${getX(displayData[0], 0)} ${getY(displayData[0].val)}`;
    let pointsHtml = '';
    
    displayData.forEach((d, i) => {
        const x = getX(d, i), y = getY(d.val);
        pathD += ` L ${x} ${y}`;
        pointsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="#0f172a" stroke="${color}" stroke-width="2" class="cursor-pointer hover:stroke-white transition-all" onclick="window.handleMetricChartClick(event, '${d.dateStr}', '${d.name.replace(/'/g, "")}', '${d.val.toFixed(2)}', '', '${d.breakdown||""}', '${color}')"></circle>`;
    });

    const trend = calculateTrend(displayData);
    let trendHtml = trend ? `<line x1="${getX(null, 0)}" y1="${getY(trend.startVal)}" x2="${getX(null, displayData.length - 1)}" y2="${getY(trend.endVal)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5" />` : '';

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <div class="flex items-center gap-2">
                <h3 class="text-xs font-bold text-white flex items-center gap-2">
                    <i class="fa-solid ${def.icon}" style="color: ${color}"></i> ${def.title} 
                    <span class="text-[10px] font-normal opacity-50 ml-1 font-mono">${formula}</span>
                </h3>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-[9px] text-slate-500 font-mono">${displayData.length} Activities</span>
                <i class="fa-solid fa-circle-info text-slate-500 cursor-pointer hover:text-white" onclick="window.handleMetricInfoClick(event, '${key}')"></i>
            </div>
        </div>
        <div class="flex-1 w-full h-[240px]">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" />
                <text x="${pad.l-5}" y="${getY(dMax)+3}" text-anchor="end" font-size="9" fill="#64748b">${dMax.toFixed(1)}</text>
                <text x="${pad.l-5}" y="${getY(dMin)+3}" text-anchor="end" font-size="9" fill="#64748b">${dMin.toFixed(1)}</text>
                ${targetsHtml}
                ${trendHtml}
                <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.9" />
                ${pointsHtml}
            </svg>
        </div>
    </div>`;
};

// --- NEW RENDERER: Stacked Bar (Training Balance) ---
const buildStackedBarChart = (data, key) => {
    const def = METRIC_DEFINITIONS[key];
    if (!data || data.length === 0) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col items-center justify-center opacity-60"><i class="fa-solid ${def.icon} text-2xl text-slate-500 mb-2"></i><p class="text-xs text-slate-500">No Balance Data</p></div>`;
    }

    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 20 };
    
    // --- UPDATED: Use CSS Variables ---
    const cRec = 'var(--color-z1)';
    const cAer = 'var(--color-z2)';
    const cTem = 'var(--color-z3)';
    const cThr = 'var(--color-z4)';
    const cVO2 = 'var(--color-z5)';

    const barWidth = (width - pad.l - pad.r) / data.length * 0.6;
    let barsHtml = '';

    data.forEach((d, i) => {
        const x = pad.l + (i * ((width - pad.l - pad.r) / data.length)) + 10;
        const dist = d.distribution;
        
        const hRec = (dist.Recovery / 100) * (height - pad.t - pad.b);
        const hAer = (dist.Aerobic / 100) * (height - pad.t - pad.b);
        const hTem = (dist.Tempo / 100) * (height - pad.t - pad.b);
        const hThr = (dist.Threshold / 100) * (height - pad.t - pad.b);
        const hVO2 = (dist.VO2 / 100) * (height - pad.t - pad.b);

        let currentY = height - pad.b;

        const drawSeg = (h, color, label) => {
            if (h <= 0) return '';
            currentY -= h;
            return `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${h}" fill="${color}" opacity="0.9" stroke="#1e293b" stroke-width="1" class="hover:opacity-100 cursor-pointer" onclick="window.handleMetricChartClick(event, '${d.dateStr}', '${label}', '${Math.round(h / (height-pad.t-pad.b) * 100)}%', '', '', '${color}')"><title>${label}: ${Math.round(h / (height-pad.t-pad.b) * 100)}%</title></rect>`;
        };

        barsHtml += drawSeg(hRec, cRec, 'Recovery');
        barsHtml += drawSeg(hAer, cAer, 'Aerobic');
        barsHtml += drawSeg(hTem, cTem, 'Tempo');
        barsHtml += drawSeg(hThr, cThr, 'Threshold');
        barsHtml += drawSeg(hVO2, cVO2, 'VO2 Max');
    });

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
                <i class="fa-solid ${def.icon}" style="color: ${def.colorVar}"></i> ${def.title}
            </h3>
            <div class="flex items-center gap-2">
                <span class="text-[9px] text-slate-500 font-mono">Weekly Distribution</span>
                <i class="fa-solid fa-circle-info text-slate-500 cursor-pointer hover:text-white" onclick="window.handleMetricInfoClick(event, '${key}')"></i>
            </div>
        </div>
        <div class="flex-1 w-full h-[240px]">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" />
                <text x="${pad.l-5}" y="${pad.t}" text-anchor="end" font-size="9" fill="#64748b">100%</text>
                <text x="${pad.l-5}" y="${height-pad.b}" text-anchor="end" font-size="9" fill="#64748b">0%</text>
                ${barsHtml}
            </svg>
        </div>
    </div>`;
};

// --- NEW RENDERER: Dual Axis (Feeling vs Load) ---
const buildDualAxisChart = (data, key) => {
    const def = METRIC_DEFINITIONS[key];
    if (!data || data.length === 0) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col items-center justify-center opacity-60"><i class="fa-solid ${def.icon} text-2xl text-slate-500 mb-2"></i><p class="text-xs text-slate-500">No Feeling Data</p></div>`;
    }

    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 40 };

    // --- UPDATED: Use Existing Variables ---
    const cLoad = 'var(--color-partial)'; // Yellow
    const cFeel = 'var(--color-done)';    // Green

    const maxLoad = Math.max(...data.map(d => d.load || 0)) * 1.1 || 100;
    const maxFeel = 5;

    const getX = (i) => pad.l + (i / (data.length - 1)) * (width - pad.l - pad.r);
    const getYLoad = (v) => height - pad.b - (v / maxLoad) * (height - pad.t - pad.b);
    const getYFeel = (v) => height - pad.b - (v / maxFeel) * (height - pad.t - pad.b);

    const barWidth = (width - pad.l - pad.r) / data.length * 0.4;
    
    let barsHtml = '';
    let linePath = '';
    let pointsHtml = '';
    let firstPoint = true;

    data.forEach((d, i) => {
        const x = getX(i);
        
        // Bar (Load)
        if (d.load > 0) {
            const hBar = (d.load / maxLoad) * (height - pad.t - pad.b);
            barsHtml += `<rect x="${x - barWidth/2}" y="${height - pad.b - hBar}" width="${barWidth}" height="${hBar}" fill="${cLoad}" opacity="0.4" rx="2" />`;
        }

        // Line (Feeling)
        if (d.feeling !== null && d.feeling > 0) {
            const yF = getYFeel(d.feeling);
            if (firstPoint) {
                linePath = `M ${x} ${yF}`;
                firstPoint = false;
            } else {
                linePath += ` L ${x} ${yF}`;
            }
            pointsHtml += `<circle cx="${x}" cy="${yF}" r="4" fill="${cFeel}" stroke="#fff" stroke-width="1" class="cursor-pointer" onclick="window.handleMetricChartClick(event, '${d.dateStr}', 'Feeling Score', '${d.feeling.toFixed(1)}', '/ 5', 'Load: ${d.load} TSS', '${cFeel}')" />`;
        }
    });

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
                <i class="fa-solid ${def.icon}" style="color: ${def.colorVar}"></i> ${def.title}
            </h3>
            <div class="flex items-center gap-3">
                <div class="flex gap-2 text-[9px] font-mono">
                    <span style="color: ${cLoad}">■ Load</span>
                    <span style="color: ${cFeel}">● Feeling</span>
                </div>
                <i class="fa-solid fa-circle-info text-slate-500 cursor-pointer hover:text-white" onclick="window.handleMetricInfoClick(event, '${key}')"></i>
            </div>
        </div>
        <div class="flex-1 w-full h-[240px]">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="${cLoad}" stroke-width="1" opacity="0.3" />
                <line x1="${width - pad.r}" y1="${pad.t}" x2="${width - pad.r}" y2="${height - pad.b}" stroke="${cFeel}" stroke-width="1" opacity="0.3" />
                
                <text x="${pad.l-5}" y="${pad.t}" text-anchor="end" font-size="9" fill="${cLoad}">${Math.round(maxLoad)}</text>
                <text x="${width-pad.r+5}" y="${pad.t}" text-anchor="start" font-size="9" fill="${cFeel}">5.0</text>

                ${barsHtml}
                <path d="${linePath}" fill="none" stroke="${cFeel}" stroke-width="2" />
                ${pointsHtml}
            </svg>
        </div>
    </div>`;
};

// --- Main Update Loop ---
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
        
        let full = [];
        if (key === 'training_balance') full = extractMetricData(allData, 'training_balance');
        else if (key === 'feeling_load') full = extractMetricData(allData, 'feeling_load');
        else if (key.startsWith('subjective_')) full = calculateSubjectiveEfficiency(allData, key.split('_')[1]);
        else full = extractMetricData(allData, key);

        if(full && full.length > 0) full.sort((a,b)=>a.date-b.date);
        
        const display = full ? full.filter(d => d.date >= cutoff) : [];
        
        if (key === 'training_balance') el.innerHTML = buildStackedBarChart(display, key);
        else if (key === 'feeling_load') el.innerHTML = buildDualAxisChart(display, key);
        else el.innerHTML = buildMetricChart(display, full||[], key);
    };

    const metrics = [
        'vo2max','tss','anaerobic','calories', 
        'training_balance', 'feeling_load', 
        'subjective_bike','endurance','strength',
        'subjective_run','run','mechanical','gct','vert',
        'subjective_swim','swim'
    ];

    metrics.forEach(k => render(`metric-chart-${k}`, k));
    
    ['30d','90d','6m','1y'].forEach(r => { 
        const b = document.getElementById(`btn-metric-${r}`); 
        if(b) b.className = timeRange===r ? "bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px]" : "bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded text-[10px]"; 
    });
};
