// js/views/logbook/analyzer.js

export const renderAnalyzer = (rawLogData) => {
    const containerId = 'ag-grid-container';
    const statsId = 'ag-stats-bar';

    setTimeout(() => initAGGrid(containerId, statsId, rawLogData), 0);

    return `
        <div class="flex flex-col gap-6 h-[calc(100vh-140px)]">
            
            <div id="${statsId}" class="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700 shrink-0">
                <div class="text-center text-slate-500 text-sm">Initializing Grid...</div>
            </div>

            <div id="${containerId}" class="ag-theme-alpine-dark flex-1 w-full rounded-xl overflow-hidden border border-slate-700"></div>
            
            <div class="text-[10px] text-slate-500 text-right pr-2">
                * Toggle "Pivot Mode" in the right sidebar to analyze data
            </div>
        </div>
    `;
};

// --- LOGIC ---
const initAGGrid = (gridId, statsId, rawData) => {
    
    // REPLACE WITH YOUR GITHUB SECRET PLACEHOLDER
    const licenseKey = '__AG_GRID_LICENSE_KEY__';
    if (licenseKey && !licenseKey.startsWith('__')) {
        agGrid.LicenseManager.setLicenseKey(licenseKey);
    }

    const gridDiv = document.getElementById(gridId);
    
    // 1. DATA PARSER
    const rowData = rawData.map(d => {
        const dateObj = new Date(d.date);
        const year = isNaN(dateObj) ? 'Unknown' : dateObj.getFullYear();
        const month = isNaN(dateObj) ? 'Unknown' : dateObj.toLocaleString('default', { month: 'short' });
        
        // Conversions
        const durMins = (d.duration || d.actualDuration * 60 || 0) / 60;
        const distMiles = (d.distance || 0) / 1609.34;
        const elevFeet = (d.elevationGain || 0) * 3.28084;
        const speedMph = (d.averageSpeed || 0) * 2.23694;

        return {
            // Identity
            date: d.date, 
            day: d.day,
            year: year,
            month: month,
            type: d.actualSport || d.activityType?.typeKey || 'Unknown',
            workout: d.actualWorkout || d.activityName || 'Untitled',
            planned: d.plannedWorkout || '',
            status: d.status,
            match: d.matchStatus,
            notes: d.notes || '',

            // Volume (Sum)
            duration: durMins,
            distance: distMiles,
            elevation: elevFeet,
            calories: d.calories || 0,
            tss: d.trainingStressScore || 0,

            // Intensity (Avg)
            if: d.intensityFactor || 0,
            avg_hr: d.averageHR || 0,
            max_hr: d.maxHR || 0,
            avg_pwr: d.avgPower || 0,
            max_pwr: d.maxPower || 0,
            norm_pwr: d.normPower || 0,
            avg_spd: speedMph,
            
            // Dynamics
            cadence_run: d.averageRunningCadenceInStepsPerMinute || 0,
            stride: d.avgStrideLength || 0,
            vert_osc: d.avgVerticalOscillation || 0,
            gct: d.avgGroundContactTime || 0,
            cadence_bike: d.averageBikingCadenceInRevPerMinute || 0,

            // Physio
            aerobic_te: d.aerobicTrainingEffect || 0,
            anaerobic_te: d.anaerobicTrainingEffect || 0,
            vo2: d.vO2MaxValue || 0,
            rpe: d.RPE || 0,
            feeling: d.Feeling || 0
        };
    });

    // 2. COLUMN DEFINITIONS
    const columnDefs = [
        // --- Dimensions ---
        { field: "date", headerName: "Date", width: 110, sort: 'desc', comparator: (a,b) => new Date(a) - new Date(b) },
        { field: "year", headerName: "Year", width: 80, enableRowGroup: true, enablePivot: true },
        { field: "month", headerName: "Month", width: 80, enableRowGroup: true, enablePivot: true },
        { field: "day", headerName: "Day", width: 100, enableRowGroup: true, enablePivot: true },
        { 
            field: "type", headerName: "Sport", width: 110, enableRowGroup: true, enablePivot: true, rowGroup: true, // Auto-group by Sport
            cellRenderer: p => {
                if(!p.value) return '';
                const c = p.value.toLowerCase().includes('run') ? 'bg-pink-500' : p.value.toLowerCase().includes('bike') ? 'bg-purple-500' : 'bg-blue-500';
                return `<span class="px-2 py-0.5 rounded text-[10px] text-white ${c}">${p.value}</span>`;
            }
        },
        { field: "workout", headerName: "Workout Name", width: 200, tooltipField: "notes" },
        { field: "status", headerName: "Status", width: 100, enableRowGroup: true, enablePivot: true },

        // --- Metrics (Sum) ---
        { field: "duration", headerName: "Time (hr)", width: 100, aggFunc: 'sum', enableValue: true, valueFormatter: p => p.value?.toFixed(1) },
        { field: "distance", headerName: "Dist (mi)", width: 100, aggFunc: 'sum', enableValue: true, valueFormatter: p => p.value?.toFixed(1) },
        { field: "elevation", headerName: "Elev (ft)", width: 100, aggFunc: 'sum', enableValue: true, valueFormatter: p => Math.round(p.value).toLocaleString() },
        { field: "calories", headerName: "Cals", width: 90, aggFunc: 'sum', enableValue: true },
        { field: "tss", headerName: "TSS", width: 80, aggFunc: 'sum', enableValue: true },

        // --- Metrics (Avg) ---
        { field: "avg_hr", headerName: "Avg HR", width: 90, aggFunc: 'avg', enableValue: true, valueFormatter: p => Math.round(p.value) },
        { field: "avg_pwr", headerName: "Watts", width: 90, aggFunc: 'avg', enableValue: true, valueFormatter: p => Math.round(p.value) },
        { field: "norm_pwr", headerName: "Norm Pwr", width: 90, aggFunc: 'avg', enableValue: true, valueFormatter: p => Math.round(p.value) },
        { field: "if", headerName: "IF", width: 80, aggFunc: 'avg', enableValue: true, valueFormatter: p => p.value?.toFixed(2) },
        { field: "avg_spd", headerName: "MPH", width: 80, aggFunc: 'avg', enableValue: true, valueFormatter: p => p.value?.toFixed(1) },
        { field: "cadence_run", headerName: "Run Cad", width: 90, aggFunc: 'avg', enableValue: true, valueFormatter: p => Math.round(p.value) },
        { field: "rpe", headerName: "RPE", width: 80, aggFunc: 'avg', enableValue: true, valueFormatter: p => p.value?.toFixed(1) },
        { field: "feeling", headerName: "Feel", width: 80, aggFunc: 'avg', enableValue: true, valueFormatter: p => p.value?.toFixed(1) }
    ];

    // 3. GRID OPTIONS
    const gridOptions = {
        columnDefs: columnDefs,
        rowData: rowData,
        animateRows: true,
        
        // --- THIS ENABLES THE SIDEBAR ---
        sideBar: 'columns',  
        pivotMode: true,     // Starts in Pivot Mode automatically

        defaultColDef: {
            sortable: true,
            filter: true,
            resizable: true,
            flex: 1,
            minWidth: 100,
            enableValue: true,
            enableRowGroup: true,
            enablePivot: true,
        },
        autoGroupColumnDef: {
            headerName: 'Group',
            minWidth: 200,
            cellRendererParams: {
                suppressCount: false,
            }
        },
        onGridReady: (params) => {
            updateStats(params.api, statsId);
        },
        onModelUpdated: (params) => {
            updateStats(params.api, statsId);
        }
    };

    agGrid.createGrid(gridDiv, gridOptions);
};

// --- STATS ENGINE ---
const updateStats = (api, statsId) => {
    let count = 0;
    let dur = 0;
    let dist = 0;
    let elev = 0;
    let tss = 0;

    // Use loop through displayed rows to respect pivot/grouping
    api.forEachNodeAfterFilter(node => {
        // Only count LEAF nodes (actual activities) to avoid double counting
        if (!node.group && node.data) {
            count++;
            dur += node.data.duration || 0;
            dist += node.data.distance || 0;
            elev += node.data.elevation || 0;
            tss += node.data.tss || 0;
        }
    });

    const hours = Math.floor(dur);
    const mins = Math.round((dur - hours) * 60);
    
    const card = (label, val, unit, color) => `
        <div class="flex flex-col items-center md:items-start">
            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">${label}</span>
            <span class="text-xl font-bold ${color}">${val}</span>
            <span class="text-[10px] text-slate-400 font-mono">${unit}</span>
        </div>
    `;

    const container = document.getElementById(statsId);
    if (container) {
        container.innerHTML = `
            ${card('Activities', count, 'Count', 'text-white')}
            ${card('Duration', `${hours}h ${mins}m`, 'Total Time', 'text-blue-400')}
            ${card('Distance', dist.toLocaleString(undefined, {maximumFractionDigits: 0}), 'Miles', 'text-emerald-400')}
            ${card('Elevation', elev.toLocaleString(undefined, {maximumFractionDigits: 0}), 'Feet', 'text-purple-400')}
            ${card('TSS Load', Math.round(tss), 'Stress', 'text-orange-400')}
        `;
    }
};
