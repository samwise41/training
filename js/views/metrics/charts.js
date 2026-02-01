import { DataManager } from '../../utils/data.js';
import { extractMetricData, calculateSubjectiveEfficiency } from './parser.js';

// --- Chart Builder ---
const buildMetricChart = (displayData, key, config, timeRange) => {
    // 1. Config Safeguard
    const def = config || { 
        title: key, 
        icon: 'fa-chart-line', 
        unit: '', 
        description: 'No config found',
        improvement: '',
        formula: ''
    };

    if (key === 'training_balance') return buildStackedBarChart(displayData, def);
    if (key === 'feeling_load') return buildDualAxisChart(displayData, def);

    const colorMap = {
        'Bike': 'var(--color-bike)',
        'Run': 'var(--color-run)',
        'Swim': 'var(--color-swim)',
        'All': 'var(--color-all)'
    };
    const color = colorMap[def.sport] || 'var(--color-all)';

    if (!displayData || displayData.length < 2) {
        return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex flex-col justify-between opacity-60"><div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2"><h3 class="text-xs font-bold text-slate-400 flex items-center gap-2"><i class="fa-solid ${def.icon||'fa-chart-line'}"></i> ${def.title||key}</h3></div><div class="flex-1 flex flex-col items-center justify-center text-slate-500"><i class="fa-solid fa-chart-simple text-2xl opacity-20"></i><p class="text-[10px] italic">Not enough data</p></div></div>`;
    }

    // 2. Dimensions
    const width = 800, height = 240;
    const pad = { t: 20, b: 30, l: 40, r: 40 };
    const getX = (d, i) => pad.l + (i / (displayData.length - 1)) * (width - pad.l - pad.r);
    
    const vals = displayData.map(d => d.val);
    let minV = Math.min(...vals), maxV = Math.max(...vals);
    
    // Scale Y-Axis to targets
    if (def.good_min !== undefined && def.good_min !== null) minV = Math.min(minV, def.good_min);
    if (def.good_max !== undefined && def.good_max !== null) maxV = Math.max(maxV, def.good_max);
    
    const range = maxV - minV || 1;
    const dMin = Math.max(0, minV - range * 0.1);
    const dMax = maxV + range * 0.1;
    const getY = (val) => height - pad.b - ((val - dMin) / (dMax - dMin)) * (height - pad.t - pad.b);

    // 3. Target Lines
    const isInverted = def.higher_is_better === false;
    const colorGood = 'var(--color-done)';     
    const colorBad = '#ef4444'; 
    const maxLineColor = isInverted ? colorBad : colorGood;
    const minLineColor = isInverted ? colorGood : colorBad;

    let targetsHtml = '';
    if (def.good_min !== undefined && def.good_min !== null) {
        const yVal = getY(def.good_min);
        targetsHtml += `<line x1="${pad.l}" y1="${yVal}" x2="${width - pad.r}" y2="${yVal}" stroke="${minLineColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />`;
    }
    if (def.good_max !== undefined && def.good_max !== null) {
        const yVal = getY(def.good_max);
        targetsHtml += `<line x1="${pad.l}" y1="${yVal}" x2="${width - pad.r}" y2="${yVal}" stroke="${maxLineColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />`;
    }

    // 4. Data Line
    let pathD = `M ${getX(displayData[0], 0)} ${getY(displayData[0].val)}`;
    let pointsHtml = '';
    displayData.forEach((d, i) => {
        const x = getX(d, i), y = getY(d.val);
        pathD += ` L ${x} ${y}`;
        pointsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="#0f172a" stroke="${color}" stroke-width="2" class="cursor-pointer hover:stroke-white transition-all" onclick="window.handleMetricChartClick(event, '${d.dateStr}', '${d.name.replace(/'/g, "")}', '${d.val.toFixed(2)}', '', '${d.breakdown||""}', '${color}')"></circle>`;
    });

    // 5. Trend Line (FROM PYTHON)
    let trendHtml = '';
    // Look up the trend for the CURRENT timeRange (e.g. "30d", "90d")
    const trendData = def.trends ? def.trends[timeRange] : null;

    if (trendData && trendData.slope !== 0) {
        // Python gives us start_val (at index 0) and end_val (at index N-1)
        const y1 = getY(trendData.start_val);
        const y2 = getY(trendData.end_val);
        
        // Draw dashed line from first point to last point
        trendHtml = `<line x1="${getX(null, 0)}" y1="${y1}" x2="${getX(null, displayData.length - 1)}" y2="${y2}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6" />`;
    }

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-full flex flex-col hover:border-slate-600 transition-colors">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <div class="flex items-center gap-2">
                <h3 class="text-xs font-bold text-white flex items-center gap-2">
                    <i class="fa-solid ${def.icon || 'fa-chart-line'}" style="color: ${color}"></i> ${def.title} 
                    <span class="text-[10px] font-normal opacity-50 ml-1 font-mono hidden sm:inline">${def.formula || ''}</span>
                </h3>
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

// --- Helper Charts ---
const buildStackedBarChart = (data, def) => {
    // Placeholder - Logic requires porting if needed for Training Balance
    return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center opacity-60"><i class="fa-solid ${def.icon} text-2xl text-slate-500 mb-2"></i><p class="text-xs text-slate-500">Balance Chart</p></div>`;
};
const buildDualAxisChart = (data, def) => {
    return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center opacity-60"><i class="fa-solid ${def.icon} text-2xl text-slate-500 mb-2"></i><p class="text-xs text-slate-500">Feeling Chart</p></div>`;
};

// --- Main Update ---
export const updateCharts = async (allData, timeRange) => {
    if (!allData || !allData.length) return;

    let metricsSummary = [];
    try {
        const coachingData = await DataManager.fetchJSON('COACHING_VIEW');
        if (coachingData && coachingData.metrics_summary) {
            coachingData.metrics_summary.forEach(group => {
                metricsSummary = [...metricsSummary, ...group.metrics];
            });
        }
    } catch (e) {
        console.warn("Charts: Failed to fetch coaching view.");
    }

    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90);
    else if (timeRange === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (timeRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    
    const render = (id, key) => {
        const el = document.getElementById(id);
        if(!el) return;
        
        const config = metricsSummary.find(m => m.id === key);

        let full = [];
        if (key === 'training_balance') full = extractMetricData(allData, 'training_balance');
        else if (key === 'feeling_load') full = extractMetricData(allData, 'feeling_load');
        else if (key.startsWith('subjective_')) full = calculateSubjectiveEfficiency(allData, key.split('_')[1]);
        else full = extractMetricData(allData, key);

        if(full && full.length > 0) full.sort((a,b)=>a.date-b.date);
        const display = full ? full.filter(d => d.date >= cutoff) : [];
        
        // Pass timeRange so we know WHICH trend line to draw
        el.innerHTML = buildMetricChart(display, key, config, timeRange);
    };

    const metrics = [
        'vo2max','tss','anaerobic','calories', 
        'training_balance', 'feeling_load', 
        'subjective_bike','endurance','strength',
        'subjective_run','run','mechanical','gct','vert',
        'subjective_swim','swim'
    ];

    metrics.forEach(k => render(`metric-chart-${k}`, k));
    
    // Update Button State
    ['30d','90d','6m','1y'].forEach(r => { 
        const b = document.getElementById(`btn-metric-${r}`); 
        if(b) b.className = timeRange===r ? "bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px]" : "bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded text-[10px]"; 
    });
};
