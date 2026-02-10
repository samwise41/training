import { DataManager } from '../../utils/data.js';
import { extractMetricData, calculateSubjectiveEfficiency } from './parser.js';

// --- VISUAL TREND CALCULATION ---
const calculateVisualTrend = (data) => {
    if (!data || data.length < 2) return null;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach((d, i) => {
        sumX += i;
        sumY += d.val;
        sumXY += i * d.val;
        sumXX += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { start: intercept, end: intercept + slope * (n - 1) };
};

// --- CHART BUILDER (GENERIC) ---
const buildMetricChart = (displayData, key, def, timeRange) => {
    if (key === 'training_balance') return buildStackedBarChart(displayData, def);
    if (key === 'feeling_load') return buildDualAxisChart(displayData, def);

    const color = def.colorVar || 'var(--color-all)';
    const title = def.title || key;
    const icon = def.icon || 'fa-chart-line';
    const unit = def.unit || '';
    
    // --- NEW: 3-TIER STATUS BADGE ---
    let statusHtml = '';
    if (def.status && def.status !== 'Neutral' && def.status !== 'No Data') {
        const s = def.status.toLowerCase();
        let badgeClass = '';
        let badgeIcon = '';

        if (s === 'on target') {
            badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/50';
            badgeIcon = 'fa-check';
        } else if (s === 'warning') {
            badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/50';
            badgeIcon = 'fa-triangle-exclamation';
        } else {
            // Off Target (or undefined)
            badgeClass = 'text-red-400 bg-red-500/10 border-red-500/50';
            badgeIcon = 'fa-circle-xmark';
        }
        
        statusHtml = `
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded border ${badgeClass} ml-3">
                <i class="fa-solid ${badgeIcon} text-[10px]"></i>
                <span class="text-[10px] font-bold uppercase tracking-wide">${def.status}</span>
            </div>
        `;
    }
    // ------------------------------------

    if (!displayData || displayData.length < 2) {
        return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col justify-center items-center opacity-60">
            <i class="fa-solid ${icon} text-2xl text-slate-500 mb-2"></i>
            <p class="text-[10px] text-slate-500 italic">Not enough data</p>
        </div>`;
    }

    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 40 };
    const getX = (i) => pad.l + (i / (displayData.length - 1)) * (width - pad.l - pad.r);
    
    const vals = displayData.map(d => d.val);
    let minV = Math.min(...vals), maxV = Math.max(...vals);
    
    if (def.good_min != null) minV = Math.min(minV, def.good_min);
    if (def.good_max != null) maxV = Math.max(maxV, def.good_max);
    
    const range = maxV - minV || 1;
    const dMin = Math.max(0, minV - range * 0.1);
    const dMax = maxV + range * 0.1;
    const getY = (val) => height - pad.b - ((val - dMin) / (dMax - dMin)) * (height - pad.t - pad.b);

    const isInverted = def.higher_is_better === false;
    const colorGood = 'var(--color-done)';     
    const colorBad = 'var(--color-missed'; 
    const maxLineColor = isInverted ? colorBad : colorGood;
    const minLineColor = isInverted ? colorGood : colorBad;

    let targetsHtml = '';
    if (def.good_min != null) {
        const yVal = getY(def.good_min);
        targetsHtml += `<line x1="${pad.l}" y1="${yVal}" x2="${width - pad.r}" y2="${yVal}" stroke="${minLineColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />`;
    }
    if (def.good_max != null) {
        const yVal = getY(def.good_max);
        targetsHtml += `<line x1="${pad.l}" y1="${yVal}" x2="${width - pad.r}" y2="${yVal}" stroke="${maxLineColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />`;
    }

    let pathD = `M ${getX(0)} ${getY(displayData[0].val)}`;
    let pointsHtml = '';
    
    displayData.forEach((d, i) => {
        const x = getX(i), y = getY(d.val);
        pathD += ` L ${x} ${y}`;
        
        pointsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="#0f172a" stroke="${color}" stroke-width="2" 
            class="cursor-pointer hover:stroke-white transition-all" 
            onclick="window.handleMetricChartClick(event, '${d.dateStr}', '${d.name.replace(/'/g, "")}', '${d.val.toFixed(2)}', '${unit}', '${d.breakdown||""}', '${color}')">
        </circle>`;
    });

    const trend = calculateVisualTrend(displayData);
    let trendHtml = '';
    if (trend) {
        const yStart = getY(trend.start);
        const yEnd = getY(trend.end);
        trendHtml = `<line x1="${getX(0)}" y1="${yStart}" x2="${getX(displayData.length - 1)}" y2="${yEnd}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5" />`;
    }

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <div class="flex items-center">
                <h3 class="text-xs font-bold text-white flex items-center gap-2">
                    <i class="fa-solid ${icon}" style="color: ${color}"></i> ${title}
                </h3>
                ${statusHtml}
            </div>
            <div class="flex items-center gap-2">
                <span class="text-[9px] text-slate-500 font-mono">${displayData.length} pts</span>
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

const buildStackedBarChart = (data, def) => {
    if (!data || data.length === 0) return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center opacity-60"><p class="text-xs text-slate-500">No Balance Data</p></div>`;

    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 20 };
    const barWidth = (width - pad.l - pad.r) / data.length * 0.6;
    let barsHtml = '';
    const colors = { Recovery: 'var(--color-z1)', Aerobic: 'var(--color-z2)', Tempo: 'var(--color-z3)', Threshold: 'var(--color-z4)', VO2: 'var(--color-z5)' };

    data.forEach((d, i) => {
        const x = pad.l + (i * ((width - pad.l - pad.r) / data.length)) + 10;
        let currentY = height - pad.b;
        ['Recovery', 'Aerobic', 'Tempo', 'Threshold', 'VO2'].forEach(zone => {
            const val = d.distribution[zone];
            if (val > 0) {
                const h = (val / 100) * (height - pad.t - pad.b);
                currentY -= h;
                barsHtml += `<rect x="${x}" y="${currentY}" width="${barWidth}" height="${h}" fill="${colors[zone]}" opacity="0.9" stroke="#1e293b" stroke-width="1"><title>${zone}: ${val}%</title></rect>`;
            }
        });
    });

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
                <i class="fa-solid ${def.icon || 'fa-chart-pie'}" style="color: ${def.colorVar}"></i> ${def.title}
            </h3>
        </div>
        <div class="flex-1 w-full h-[240px]">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" />
                <text x="${pad.l-5}" y="${pad.t}" text-anchor="end" font-size="9" fill="#64748b">100%</text>
                ${barsHtml}
            </svg>
        </div>
    </div>`;
};

const buildDualAxisChart = (data, def) => {
    if (!data || data.length === 0) return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center opacity-60"><p class="text-xs text-slate-500">No Feeling Data</p></div>`;

    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 40 };
    const cLoad = 'var(--color-z2)', cFeel = 'var(--color-done)';
    const maxLoad = Math.max(...data.map(d => d.load || 0)) * 1.1 || 100;
    const getX = (i) => pad.l + (i / (data.length - 1)) * (width - pad.l - pad.r);
    const getYLoad = (v) => height - pad.b - (v / maxLoad) * (height - pad.t - pad.b);
    const getYFeel = (v) => height - pad.b - (v / 5) * (height - pad.t - pad.b);
    const barWidth = (width - pad.l - pad.r) / data.length * 0.4;
    
    let barsHtml = '', linePath = '', pointsHtml = '', firstPoint = true;

    data.forEach((d, i) => {
        const x = getX(i);
        if (d.load > 0) {
            const hBar = (d.load / maxLoad) * (height - pad.t - pad.b);
            barsHtml += `<rect x="${x - barWidth/2}" y="${height - pad.b - hBar}" width="${barWidth}" height="${hBar}" fill="${cLoad}" opacity="0.4" rx="2" />`;
        }
        if (d.feeling != null) {
            const yF = getYFeel(d.feeling);
            linePath += (firstPoint ? `M ${x} ${yF}` : ` L ${x} ${yF}`);
            pointsHtml += `<circle cx="${x}" cy="${yF}" r="4" fill="${cFeel}" stroke="#fff" stroke-width="1" class="cursor-pointer" onclick="window.handleMetricChartClick(event, '${d.dateStr}', 'Feeling', '${d.feeling}', '/ 5', 'Load: ${d.load}', '${cFeel}')" />`;
            firstPoint = false;
        }
    });

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 class="text-xs font-bold text-white flex items-center gap-2">
                <i class="fa-solid ${def.icon || 'fa-face-smile-beam'}" style="color: ${def.colorVar}"></i> ${def.title}
            </h3>
            <div class="flex gap-2 text-[9px] font-mono"><span style="color: ${cLoad}">■ Load</span><span style="color: ${cFeel}">● Feeling</span></div>
        </div>
        <div class="flex-1 w-full h-[240px]">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                ${barsHtml}<path d="${linePath}" fill="none" stroke="${cFeel}" stroke-width="2" />${pointsHtml}
            </svg>
        </div>
    </div>`;
};

export const updateCharts = async (allData, timeRange) => {
    if (!allData || !allData.length) return;

    let config = null;
    let coachingView = null;

    try {
        config = await DataManager.fetchJSON('METRICS_CONFIG');
        coachingView = await DataManager.fetchJSON('COACHING_VIEW');

        if (!config) {
            const res = await fetch('data/metrics/metrics_config.json');
            if (res.ok) config = await res.json();
        }
    } catch (e) { 
        console.warn("Charts: Failed to fetch metrics config.", e); 
    }

    if (!config || !config.metrics) return;

    if (coachingView && coachingView.metrics_summary) {
        const statusMap = {};
        coachingView.metrics_summary.forEach(group => {
            group.metrics.forEach(m => {
                if (m.id && m.status) statusMap[m.id] = m.status;
            });
        });

        Object.keys(config.metrics).forEach(k => {
            if (statusMap[k]) config.metrics[k].status = statusMap[k];
        });
    }

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0); 

    if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90);
    else if (timeRange === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (timeRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    
    Object.keys(config.metrics).forEach(key => {
        const def = config.metrics[key];
        const elementId = `metric-chart-${key}`;
        const el = document.getElementById(elementId);
        
        if (!el) return;

        let sourceData = allData;
        if (def.filters) {
            if (def.filters.min_duration_minutes) {
                sourceData = sourceData.filter(d => d._dur >= def.filters.min_duration_minutes);
            }
            if (def.filters.require_hr) {
                sourceData = sourceData.filter(d => d._hr > 0);
            }
        }

        let full = [];
        if (key.startsWith('subjective_')) {
            full = calculateSubjectiveEfficiency(sourceData, key.split('_')[1]);
        } else {
            full = extractMetricData(sourceData, key);
        }

        if (!full) full = [];

        if (full.length > 0) {
            full.sort((a,b) => a.date - b.date);
            
            if (def.filters && def.filters.ignore_zero) {
                full = full.filter(d => d.val !== 0);
            }
            
            const display = full.filter(d => d.date >= cutoff);
            el.innerHTML = buildMetricChart(display, key, def, timeRange);
        } else {
            el.innerHTML = buildMetricChart([], key, def, timeRange);
        }
    });

    ['30d','90d','6m','1y'].forEach(r => { 
        const b = document.getElementById(`btn-metric-${r}`); 
        if(b) b.className = timeRange===r 
            ? "bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px]" 
            : "bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded text-[10px]"; 
    });
};
