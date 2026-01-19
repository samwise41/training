import { COLOR_MAP } from './utils.js';
import { getRollingPoints } from './analysis.js';

// --- LOCAL STATE ---
const chartState = {
    All: true,
    Bike: false,
    Run: false,
    Swim: false,
    timeRange: '60d',
    showWeekly: true, 
    show30d: true,    
    show60d: false    
};

let currentLogData = [];

// --- TOGGLE HANDLERS ---
// Attached to window for HTML access
window.toggleTrendSeries = (type) => {
    if (chartState.hasOwnProperty(type)) {
        chartState[type] = !chartState[type];
        renderDynamicCharts('trend-charts-container', currentLogData); 
    }
};

window.toggleTrendTime = (range) => {
    chartState.timeRange = range;
    renderDynamicCharts('trend-charts-container', currentLogData);
};

window.toggleTrendLine = (lineType) => {
    if (chartState.hasOwnProperty(lineType)) {
        chartState[lineType] = !chartState[lineType];
        renderDynamicCharts('trend-charts-container', currentLogData);
    }
};

window.resetTrendDefaults = () => {
    chartState.All = true;
    chartState.Bike = false;
    chartState.Run = false;
    chartState.Swim = false;
    chartState.timeRange = '60d';
    chartState.showWeekly = true;
    chartState.show30d = true;
    chartState.show60d = false; 
    renderDynamicCharts('trend-charts-container', currentLogData);
};


// --- CHART BUILDER ---
const buildTrendChart = (title, isCount, logData) => {
    const height = 200; const width = 800; 
    const padding = { top: 20, bottom: 30, left: 40, right: 20 };
    const chartW = width - padding.left - padding.right; const chartH = height - padding.top - padding.bottom;

    const activeTypes = Object.keys(chartState).filter(k => chartState[k] && k !== 'timeRange' && !k.startsWith('show')); 
    let allValues = [];
    
    activeTypes.forEach(type => {
        const pts = getRollingPoints(logData, type, isCount, chartState.timeRange);
        pts.forEach(p => {
            if(chartState.showWeekly && p.val7 > 0) allValues.push(p.val7);
            if(chartState.show30d && p.val30 > 0) allValues.push(p.val30);
            if(chartState.show60d && p.val60 > 0) allValues.push(p.val60);
        });
    });

    if (allValues.length === 0) allValues = [0, 10]; 

    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    
    let spread = dataMax - dataMin;
    if (spread < 20) spread = 20; 
    
    const domainMin = Math.max(0, dataMin - (spread * 0.1)); 
    const domainMax = dataMax + (spread * 0.1);

    const getY = (val) => padding.top + chartH - ((val - domainMin) / (domainMax - domainMin)) * chartH;
    const getX = (idx, total) => padding.left + (idx / (total - 1)) * chartW;

    const gridLinesDef = [
        { val: 100, color: '#ffffff' }, // White
        { val: 80, color: '#eab308' },  // Yellow
        { val: 60, color: '#ef4444' }   // Red
    ];

    let gridHtml = '';
    gridLinesDef.forEach(line => {
        if (line.val <= domainMax && line.val >= domainMin) {
            const y = getY(line.val);
            gridHtml += `
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${line.color}" stroke-width="1" stroke-dasharray="8,8" opacity="0.3" />
                <text x="${padding.left - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="${line.color}" font-weight="bold" opacity="0.8">${line.val}%</text>
            `;
        }
    });

    let pathsHtml = '';
    let circlesHtml = '';

    activeTypes.forEach(type => {
        const dataPoints = getRollingPoints(logData, type, isCount, chartState.timeRange);
        const color = COLOR_MAP[type]; 
        if (dataPoints.length < 2) return;

        let d7 = `M ${getX(0, dataPoints.length)} ${getY(dataPoints[0].val7)}`;
        let d30 = `M ${getX(0, dataPoints.length)} ${getY(dataPoints[0].val30)}`;
        let d60 = `M ${getX(0, dataPoints.length)} ${getY(dataPoints[0].val60)}`;
        
        dataPoints.forEach((p, i) => {
            const x = getX(i, dataPoints.length);
            const y7 = getY(p.val7);
            const y30 = getY(p.val30);
            const y60 = getY(p.val60);

            d7 += ` L ${x} ${y7}`;
            d30 += ` L ${x} ${y30}`;
            d60 += ` L ${x} ${y60}`;

            if (chartState.showWeekly) {
                circlesHtml += `<circle cx="${x}" cy="${y7}" r="2.5" fill="${color}" stroke="#1e293b" stroke-width="1" class="cursor-pointer hover:r-4 transition-all" onclick="window.showTrendTooltip(event, '${p.label}', 'Weekly (${type})', ${p.val7}, '${color}')"></circle>`;
            }
            if (chartState.show30d) {
                circlesHtml += `<circle cx="${x}" cy="${y30}" r="2" fill="${color}" stroke="none" opacity="0.6" class="cursor-pointer hover:r-5 transition-all" onclick="window.showTrendTooltip(event, '${p.label}', '30d (${type})', ${p.val30}, '${color}')"></circle>`;
            }
            if (chartState.show60d) {
                circlesHtml += `<circle cx="${x}" cy="${y60}" r="2" fill="${color}" stroke="none" opacity="0.3" class="cursor-pointer hover:r-5 transition-all" onclick="window.showTrendTooltip(event, '${p.label}', '60d (${type})', ${p.val60}, '${color}')"></circle>`;
            }
        });

        if (chartState.showWeekly) pathsHtml += `<path d="${d7}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />`;
        if (chartState.show30d) pathsHtml += `<path d="${d30}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,4" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />`;
        if (chartState.show60d) pathsHtml += `<path d="${d60}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="2,2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />`;
    });

    const axisPoints = getRollingPoints(logData, 'All', isCount, chartState.timeRange);
    let labelsHtml = '';
    let modVal = 4;
    if (chartState.timeRange === '30d') modVal = 1;
    else if (chartState.timeRange === '60d') modVal = 2;
    else if (chartState.timeRange === '90d') modVal = 3;
    else if (chartState.timeRange === '1y') modVal = 8;
    
    axisPoints.forEach((p, i) => {
        if (i % modVal === 0 || i === axisPoints.length - 1) {
            labelsHtml += `<text x="${getX(i, axisPoints.length)}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748b">${p.label}</text>`;
        }
    });

    return `
        <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4 relative overflow-hidden">
            <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-chart-line text-slate-400"></i> ${title}
                </h3>
            </div>
            <div class="w-full relative">
                <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto overflow-visible">
                    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#334155" stroke-width="1" />
                    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#334155" stroke-width="1" />
                    ${gridHtml}
                    ${pathsHtml}
                    ${circlesHtml}
                    ${labelsHtml}
                </svg>
            </div>
        </div>
    `;
};


export const renderDynamicCharts = (containerId, logData) => {
    currentLogData = logData; // Update local ref
    const container = document.getElementById(containerId);
    if (!container) return;

    const buildSportToggle = (type, label, colorClass) => {
        const isActive = chartState[type];
        const bg = isActive ? colorClass : 'bg-slate-800';
        const text = isActive ? 'text-slate-900 font-bold' : 'text-slate-400';
        const border = isActive ? 'border-transparent' : 'border-slate-600';
        return `<button onclick="window.toggleTrendSeries('${type}')" class="${bg} ${text} ${border} border px-3 py-1 rounded text-xs transition-all hover:opacity-90">${label}</button>`;
    };

    const buildTimeToggle = (range, label) => {
        const isActive = chartState.timeRange === range;
        const bg = isActive ? 'bg-slate-200' : 'bg-slate-800';
        const text = isActive ? 'text-slate-900 font-bold' : 'text-slate-400';
        const border = isActive ? 'border-transparent' : 'border-slate-600';
        return `<button onclick="window.toggleTrendTime('${range}')" class="${bg} ${text} ${border} border px-3 py-1 rounded text-xs transition-all hover:opacity-90">${label}</button>`;
    };

    const buildLineToggle = (lineType, label) => {
        const isActive = chartState[lineType];
        const bg = isActive ? 'bg-slate-600' : 'bg-slate-800';
        const text = isActive ? 'text-white font-bold' : 'text-slate-400';
        const border = isActive ? 'border-transparent' : 'border-slate-600';
        return `<button onclick="window.toggleTrendLine('${lineType}')" class="${bg} ${text} ${border} border px-3 py-1 rounded text-xs transition-all hover:opacity-90">${label}</button>`;
    };

    const controlsHtml = `
        <div class="flex flex-col gap-4 mb-6">
            <div class="flex flex-col sm:flex-row gap-4 justify-between">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-2">Sports:</span>
                    ${buildSportToggle('All', 'All', 'bg-icon-all')}
                    ${buildSportToggle('Bike', 'Bike', 'bg-icon-bike')}
                    ${buildSportToggle('Run', 'Run', 'bg-icon-run')}
                    ${buildSportToggle('Swim', 'Swim', 'bg-icon-swim')}
                    
                    <div class="w-px h-4 bg-slate-700 mx-1"></div>
                    <button onclick="window.resetTrendDefaults()" class="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-600 px-3 py-1 rounded text-xs transition-all shadow-sm" title="Reset to Defaults">
                        <i class="fa-solid fa-rotate-left text-[10px]"></i> Default
                    </button>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-2">Range:</span>
                    ${buildTimeToggle('30d', '30d')}
                    ${buildTimeToggle('60d', '60d')}
                    ${buildTimeToggle('90d', '90d')}
                    ${buildTimeToggle('6m', '6m')}
                    ${buildTimeToggle('1y', '1y')}
                </div>
            </div>
            
            <div class="flex items-center justify-between border-t border-slate-700 pt-3 mt-2">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-2">Lines:</span>
                    ${buildLineToggle('showWeekly', 'Weekly')}
                    ${buildLineToggle('show30d', '30d Avg')}
                    ${buildLineToggle('show60d', '60d Avg')}
                </div>
            </div>
        </div>
        <div id="trend-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-2 rounded shadow-xl text-xs pointer-events-none opacity-0 transition-opacity"></div>
    `;

    const legendHtml = `
        <div class="flex gap-4 text-[10px] text-slate-400 font-mono justify-end mb-2">
            <span class="flex items-center gap-1"><div class="w-4 h-0.5 bg-slate-400"></div> Weekly</span>
            <span class="flex items-center gap-1"><div class="w-4 h-0.5 border-t-2 border-dashed border-slate-400"></div> 30d Avg</span>
            <span class="flex items-center gap-1"><div class="w-4 h-0.5 border-t-2 border-dotted border-slate-400"></div> 60d Avg</span>
        </div>
    `;

    const chart1 = buildTrendChart("Rolling Adherence (Duration Based)", false, logData);
    const chart2 = buildTrendChart("Rolling Adherence (Count Based)", true, logData);

    container.innerHTML = `${controlsHtml}${legendHtml}${chart1}${chart2}`;
};
