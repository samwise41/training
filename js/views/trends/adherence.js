
import { COLOR_MAP } from './utils.js';

// --- LOCAL STATE ---
const chartState = {
    All: true,
    Bike: false,
    Run: false,
    Swim: false,
    timeRange: '30d', // Matches the keys in JSON (7d, 30d, 60d...)
    showWeekly: true // Only one line style needed now, simplification
};

let currentRollingData = [];

// --- TOGGLE HANDLERS ---
window.toggleTrendSeries = (type) => {
    if (chartState.hasOwnProperty(type)) {
        chartState[type] = !chartState[type];
        renderDynamicCharts('trend-charts-container', currentRollingData); 
    }
};

window.toggleTrendTime = (range) => {
    chartState.timeRange = range;
    renderDynamicCharts('trend-charts-container', currentRollingData);
};

window.resetTrendDefaults = () => {
    chartState.All = true;
    chartState.Bike = false;
    chartState.Run = false;
    chartState.Swim = false;
    chartState.timeRange = '30d';
    renderDynamicCharts('trend-charts-container', currentRollingData);
};


// --- CHART BUILDER ---
const buildTrendChart = (title, isCount, rollingData) => {
    const height = 200; const width = 800; 
    const padding = { top: 20, bottom: 30, left: 40, right: 20 };
    const chartW = width - padding.left - padding.right; const chartH = height - padding.top - padding.bottom;

    const activeTypes = Object.keys(chartState).filter(k => chartState[k] && k !== 'timeRange' && !k.startsWith('show')); 
    const targetMetric = isCount ? 'count_pct' : 'duration_pct';
    const rangeKey = chartState.timeRange; 

    let allValues = [];
    
    // Collect values for Scale
    activeTypes.forEach(type => {
        rollingData.forEach(pt => {
             // Access: Week -> Sport -> Window -> Metric
             if (pt[type] && pt[type][rangeKey]) {
                 allValues.push(pt[type][rangeKey][targetMetric]);
             }
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

    // Grid
    const gridLinesDef = [
        { val: 100, color: '#ffffff' }, 
        { val: 80, color: '#eab308' },  
        { val: 50, color: '#ef4444' }   
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
        const color = COLOR_MAP[type]; 
        let dPath = '';
        
        rollingData.forEach((pt, i) => {
            if (!pt[type] || !pt[type][rangeKey]) return;
            
            const val = pt[type][rangeKey][targetMetric];
            const label = pt[type][rangeKey][isCount ? 'count_label' : 'duration_label'];
            const x = getX(i, rollingData.length);
            const y = getY(val);

            if (i === 0) dPath = `M ${x} ${y}`;
            else dPath += ` L ${x} ${y}`;

            circlesHtml += `<circle cx="${x}" cy="${y}" r="2.5" fill="${color}" stroke="#1e293b" stroke-width="1" class="cursor-pointer hover:r-4 transition-all" onclick="window.showTrendTooltip(event, '${pt.display_date}', '${type}', '${val}%', '${color}', '${label}')"></circle>`;
        });

        pathsHtml += `<path d="${dPath}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />`;
    });

    // X Axis Labels
    let labelsHtml = '';
    const modVal = 4; // Monthly-ish labels
    
    rollingData.forEach((p, i) => {
        if (i % modVal === 0 || i === rollingData.length - 1) {
            labelsHtml += `<text x="${getX(i, rollingData.length)}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748b">${p.display_date}</text>`;
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


export const renderDynamicCharts = (containerId, rollingData) => {
    currentRollingData = rollingData;
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
                    <button onclick="window.resetTrendDefaults()" class="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-600 px-3 py-1 rounded text-xs transition-all shadow-sm" title="Reset">
                        <i class="fa-solid fa-rotate-left text-[10px]"></i>
                    </button>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-2">Rolling Avg:</span>
                    ${buildTimeToggle('7d', '7d')}
                    ${buildTimeToggle('30d', '30d')}
                    ${buildTimeToggle('60d', '60d')}
                    ${buildTimeToggle('90d', '90d')}
                    ${buildTimeToggle('6m', '6m')}
                    ${buildTimeToggle('1y', '1y')}
                </div>
            </div>
        </div>
        <div id="trend-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-2 rounded shadow-xl text-xs pointer-events-none opacity-0 transition-opacity"></div>
    `;

    const chart1 = buildTrendChart("Rolling Adherence (Duration Based)", false, rollingData);
    const chart2 = buildTrendChart("Rolling Adherence (Count Based)", true, rollingData);

    container.innerHTML = `${controlsHtml}${chart1}${chart2}`;
};
