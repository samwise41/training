
import { COLOR_MAP } from './utils.js';

// --- LOCAL STATE ---
const chartState = {
    // Sport Toggles
    All: true,
    Bike: false,
    Run: false,
    Swim: false,
    
    // Line Toggles (Metrics)
    show7d: true,
    show30d: true,
    show60d: false,
    show90d: false,

    // X-Axis Zoom
    dateRange: '6m' 
};

let currentRollingData = [];

// --- TOGGLE HANDLERS ---
window.toggleTrendSeries = (type) => {
    if (chartState.hasOwnProperty(type)) {
        chartState[type] = !chartState[type];
        renderDynamicCharts('trend-charts-container', currentRollingData); 
    }
};

window.toggleTrendMetric = (metric) => {
    if (chartState.hasOwnProperty(metric)) {
        chartState[metric] = !chartState[metric];
        renderDynamicCharts('trend-charts-container', currentRollingData);
    }
};

window.toggleTrendDateRange = (range) => {
    chartState.dateRange = range;
    renderDynamicCharts('trend-charts-container', currentRollingData);
};

window.resetTrendDefaults = () => {
    chartState.All = true;
    chartState.Bike = false;
    chartState.Run = false;
    chartState.Swim = false;
    
    chartState.show7d = true;
    chartState.show30d = true;
    chartState.show60d = false;
    chartState.show90d = false;
    
    chartState.dateRange = '6m';
    
    renderDynamicCharts('trend-charts-container', currentRollingData);
};

// --- HELPER: Filter Data by Date Range ---
const filterDataByDate = (data, range) => {
    if (!data || data.length === 0) return [];
    
    const fullData = [...data]; 
    const now = new Date();
    let cutoff = new Date();

    switch(range) {
        case '30d': cutoff.setDate(now.getDate() - 30); break;
        case '60d': cutoff.setDate(now.getDate() - 60); break;
        case '90d': cutoff.setDate(now.getDate() - 90); break;
        case '6m': cutoff.setMonth(now.getMonth() - 6); break;
        case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
        default: cutoff.setMonth(now.getMonth() - 6);
    }

    return fullData.filter(d => {
        const date = new Date(d.week_ending);
        return date >= cutoff;
    });
};

// --- CHART BUILDER ---
const buildTrendChart = (title, isCount, rawData) => {
    const height = 200; const width = 800; 
    const padding = { top: 20, bottom: 30, left: 40, right: 20 };
    const chartW = width - padding.left - padding.right; const chartH = height - padding.top - padding.bottom;

    // 1. Filter Data (X-Axis Zoom)
    const displayData = filterDataByDate(rawData, chartState.dateRange);
    if (displayData.length < 2) return `<div class="p-4 text-slate-500 italic text-xs">Not enough data for this range</div>`;

    const activeSports = Object.keys(chartState).filter(k => ['All','Bike','Run','Swim'].includes(k) && chartState[k]); 
    const activeMetrics = ['7d', '30d', '60d', '90d'].filter(m => chartState[`show${m}`]);

    // 2. Determine Y-Axis Scale
    const targetKey = isCount ? 'count_pct' : 'duration_pct';
    let allValues = [];
    
    activeSports.forEach(sport => {
        displayData.forEach(pt => {
            activeMetrics.forEach(metric => {
                if (pt[sport] && pt[sport][metric]) {
                    allValues.push(pt[sport][metric][targetKey]);
                }
            });
        });
    });

    if (allValues.length === 0) allValues = [0, 100];

    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    let spread = dataMax - dataMin;
    if (spread < 20) spread = 20;
    
    const domainMin = Math.max(0, dataMin - (spread * 0.1)); 
    const domainMax = dataMax + (spread * 0.1);

    const getY = (val) => padding.top + chartH - ((val - domainMin) / (domainMax - domainMin)) * chartH;
    const getX = (idx, total) => padding.left + (idx / (total - 1)) * chartW;

    // 3. Draw Grid
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

    // 4. Draw Lines & Points
    let pathsHtml = '';
    let circlesHtml = '';

    activeSports.forEach(sport => {
        const color = COLOR_MAP[sport];
        
        activeMetrics.forEach(metric => {
            // Style Logic: 7d Solid, 30d Dotted, 90d Dashed
            let dashArray = 'none';
            let strokeWidth = '2';
            let opacity = '1';

            if (metric === '7d') { dashArray = 'none'; strokeWidth = '2'; opacity = '0.9'; } 
            if (metric === '30d') { dashArray = '1,2'; strokeWidth = '1.5'; opacity = '0.75'; } 
            if (metric === '60d') { dashArray = '4,3,1,2'; strokeWidth = '1'; opacity = '0.55'; } // Dash-Dot fallback
            if (metric === '90d') { dashArray = '6,4'; strokeWidth = '.6'; opacity = '0.45'; } 

            let dPath = '';
            
            displayData.forEach((pt, i) => {
                if (!pt[sport] || !pt[sport][metric]) return;
                
                const val = pt[sport][metric][targetKey];
                const label = pt[sport][metric][isCount ? 'count_label' : 'duration_label'];
                
                const x = getX(i, displayData.length);
                const y = getY(val);

                if (i === 0) dPath = `M ${x} ${y}`;
                else dPath += ` L ${x} ${y}`;

                circlesHtml += `<circle cx="${x}" cy="${y}" r="2.5" fill="${color}" stroke="none" opacity="${opacity}" class="cursor-pointer hover:r-4 transition-all" onclick="window.showTrendTooltip(event, '${pt.display_date}', '${sport} ${metric}', '${val}%', '${color}', '${label}')"></circle>`;
            });

            pathsHtml += `<path d="${dPath}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />`;
        });
    });

    // 5. Draw X-Axis Labels
    let labelsHtml = '';
    let modVal = 4;
    if (chartState.dateRange === '30d') modVal = 1;
    else if (chartState.dateRange === '60d') modVal = 2;
    else if (chartState.dateRange === '90d') modVal = 2;
    else if (chartState.dateRange === '6m') modVal = 4;
    else modVal = 8;

    displayData.forEach((p, i) => {
        if (i % modVal === 0 || i === displayData.length - 1) {
            labelsHtml += `<text x="${getX(i, displayData.length)}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#64748b">${p.display_date}</text>`;
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

    // --- BUTTON BUILDERS ---
    const buildToggle = (key, label, type, activeClass) => {
        const isActive = chartState[key];
        const bg = isActive ? activeClass : 'bg-slate-800';
        const text = isActive ? 'text-slate-900 font-bold' : 'text-slate-400';
        const border = isActive ? 'border-transparent' : 'border-slate-600';
        const fn = type === 'sport' ? `window.toggleTrendSeries('${key}')` : `window.toggleTrendMetric('${key}')`;
        
        return `<button onclick="${fn}" class="${bg} ${text} ${border} border px-3 py-1 rounded text-xs transition-all hover:opacity-90 shadow-sm">${label}</button>`;
    };

    const buildDateToggle = (range, label) => {
        const isActive = chartState.dateRange === range;
        const bg = isActive ? 'bg-blue-500' : 'bg-slate-800';
        const text = isActive ? 'text-white font-bold' : 'text-slate-400';
        const border = isActive ? 'border-transparent' : 'border-slate-600';
        return `<button onclick="window.toggleTrendDateRange('${range}')" class="${bg} ${text} ${border} border px-3 py-1 rounded text-xs transition-all hover:opacity-90 shadow-sm">${label}</button>`;
    };

    const controlsHtml = `
        <div class="flex flex-col gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            
            <div class="flex flex-col md:flex-row justify-between gap-4">
                
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-1">Sports</span>
                    ${buildToggle('All', 'All', 'sport', 'bg-icon-all')}
                    ${buildToggle('Bike', 'Bike', 'sport', 'bg-icon-bike')}
                    ${buildToggle('Run', 'Run', 'sport', 'bg-icon-run')}
                    ${buildToggle('Swim', 'Swim', 'sport', 'bg-icon-swim')}
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-1">Zoom</span>
                    ${buildDateToggle('30d', '30d')}
                    ${buildDateToggle('60d', '60d')}
                    ${buildDateToggle('90d', '90d')}
                    ${buildDateToggle('6m', '6m')}
                    ${buildDateToggle('1y', '1y')}
                </div>
            </div>

            <div class="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-700/50 pt-3">
                
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mr-1">Averages</span>
                    ${buildToggle('show7d', '7d', 'metric', 'bg-slate-200')}
                    ${buildToggle('show30d', '30d', 'metric', 'bg-slate-200')}
                    ${buildToggle('show60d', '60d', 'metric', 'bg-slate-200')}
                    ${buildToggle('show90d', '90d', 'metric', 'bg-slate-200')}
                </div>

                <button onclick="window.resetTrendDefaults()" class="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                    <i class="fa-solid fa-rotate-left"></i> Reset View
                </button>
            </div>
        </div>
        
        <div class="flex justify-end gap-4 text-[10px] text-slate-400 font-mono mb-2 px-2">
            <span class="flex items-center gap-1"><div class="w-6 h-0.5 bg-slate-400"></div> 7d</span>
            <span class="flex items-center gap-1"><div class="w-6 h-0.5 border-t-2 border-dotted border-slate-400"></div> 30d</span>
            <span class="flex items-center gap-1"><div class="w-6 h-0.5 border-t-2 border-dashed border-slate-400"></div> 90d</span>
        </div>

        <div id="trend-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-3 rounded-lg shadow-xl text-xs pointer-events-none opacity-0 transition-opacity"></div>
    `;

    const chart1 = buildTrendChart("Adherence % (Duration)", false, rollingData);
    const chart2 = buildTrendChart("Adherence % (Count)", true, rollingData);

    container.innerHTML = `${controlsHtml}${chart1}${chart2}`;
};
