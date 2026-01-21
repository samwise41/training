// js/views/logbook/analyzer.js
import { GRID_CONFIG } from './config.js';

export const renderAnalyzer = (rawLogData) => {
    const containerId = 'ag-grid-container';
    const statsId = 'ag-stats-bar';

    // Wait for DOM
    setTimeout(() => initAGGrid(containerId, statsId, rawLogData), 50);

    return `
        <div class="flex flex-col gap-4 h-[calc(100vh-140px)]">
            <div id="${statsId}" class="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700 shrink-0">
                <div class="text-slate-500 text-sm">Loading Data...</div>
            </div>

            <div id="${containerId}" class="${GRID_CONFIG.themeClass} flex-1 w-full rounded-xl overflow-hidden border border-slate-700"></div>
        </div>
    `;
};

const initAGGrid = (gridId, statsId, rawData) => {
    // 1. Set License
    const licenseKey = '__AG_GRID_LICENSE_KEY__';
    if (licenseKey && !licenseKey.startsWith('__')) {
        agGrid.LicenseManager.setLicenseKey(licenseKey);
    }

    const gridDiv = document.getElementById(gridId);
    if (!gridDiv) return;

    // 2. Parse Your Data
    const rowData = rawData.map(d => {
        const dateObj = new Date(d.date);
        const durHrs = (d.duration || d.actualDuration * 60 || 0) / 3600;
        const distMiles = (d.distance || 0) / 1609.34;
        const elevFeet = (d.elevationGain || 0) * 3.28084;

        return {
            date: d.date, 
            year: dateObj.getFullYear(),
            month: dateObj.toLocaleString('default', { month: 'short' }),
            type: d.actualSport || d.activityType?.typeKey || 'Other',
            workout: d.actualWorkout || d.activityName || 'Untitled',
            
            duration: durHrs,
            distance: distMiles,
            elevation: elevFeet,
            calories: d.calories || 0,
            tss: d.trainingStressScore || 0,
            
            avg_hr: d.averageHR || 0,
            norm_pwr: d.normPower || 0,
            if: d.intensityFactor || 0,
            rpe: d.RPE || 0
        };
    });

    // 3. Initialize Grid with Config
    const gridOptions = {
        ...GRID_CONFIG,
        rowData: rowData,
        
        // Listeners for Top Bar Stats
        onGridReady: (params) => updateStats(params.api, statsId),
        onModelUpdated: (params) => updateStats(params.api, statsId)
    };

    agGrid.createGrid(gridDiv, gridOptions);
};

// --- Custom Stats Bar Logic ---
const updateStats = (api, statsId) => {
    let count = 0, dur = 0, dist = 0, elev = 0, tss = 0;

    api.forEachNodeAfterFilter(node => {
        // Only sum LEAF nodes (actual activities) to avoid double counting groups
        if (!node.group && node.data) {
            count++;
            dur += node.data.duration || 0;
            dist += node.data.distance || 0;
            elev += node.data.elevation || 0;
            tss += node.data.tss || 0;
        }
    });

    const card = (label, val, sub, color) => `
        <div class="flex flex-col">
            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">${label}</span>
            <span class="text-xl font-bold ${color}">${val}</span>
            <span class="text-[10px] text-slate-400 font-mono">${sub}</span>
        </div>
    `;

    const el = document.getElementById(statsId);
    if(el) {
        el.innerHTML = `
            ${card('Activities', count, 'Rows', 'text-white')}
            ${card('Duration', `${Math.round(dur)}h`, 'Total Time', 'text-blue-400')}
            ${card('Distance', Math.round(dist).toLocaleString(), 'Miles', 'text-pink-400')}
            ${card('Elevation', Math.round(elev).toLocaleString(), 'Feet', 'text-purple-400')}
            ${card('TSS', Math.round(tss), 'Load', 'text-yellow-400')}
        `;
    }
};
