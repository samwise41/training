// js/views/logbook/config.js

export const GRID_CONFIG = {
    // 1. GLOBAL SETTINGS
    themeClass: 'ag-theme-quartz-dark', // The modern "Quartz" Dark theme
    rowHeight: 40,
    headerHeight: 45,
    animateRows: true,
    
    // 2. SIDEBAR CONFIG (The Pivot Panel)
    sideBar: {
        toolPanels: [
            {
                id: 'columns',
                labelDefault: 'Columns',
                labelKey: 'columns',
                iconKey: 'columns',
                toolPanel: 'agColumnsToolPanel',
                toolPanelParams: {
                    suppressRowGroups: false,
                    suppressValues: false,
                    suppressPivots: false,
                    suppressPivotMode: false, // Ensure Pivot Mode toggle is visible
                }
            },
            {
                id: 'filters',
                labelDefault: 'Filters',
                labelKey: 'filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
            }
        ],
        defaultToolPanel: 'columns', // Open "Columns" by default
    },

    // 3. DEFAULT COLUMN BEHAVIOR
    defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
        flex: 1,
        minWidth: 100,
    },

    // 4. COLUMN DEFINITIONS
    columnDefs: [
        // --- IDENTITY ---
        { field: "date", headerName: "Date", width: 120, sort: 'desc', comparator: (a,b) => new Date(a) - new Date(b) },
        { field: "year", headerName: "Year", width: 80, rowGroup: false, hide: true }, // Set rowGroup: true to auto-group by year
        { field: "month", headerName: "Month", width: 90, rowGroup: false, hide: true },
        { 
            field: "type", headerName: "Sport", width: 110, rowGroup: true, // Default Grouping
            cellRenderer: p => {
                if(!p.value) return '';
                const s = p.value.toLowerCase();
                const c = s.includes('run') ? '#f472b6' : s.includes('bike') ? '#c084fc' : '#22d3ee';
                return `<span style="color: ${c}; font-weight: bold;">${p.value}</span>`;
            }
        },
        { field: "workout", headerName: "Workout", width: 200 },

        // --- VOLUME (Summable) ---
        { 
            field: "duration", headerName: "Time (hr)", aggFunc: 'sum', width: 100,
            valueFormatter: p => p.value ? `${Math.floor(p.value)}h ${Math.round((p.value % 1) * 60)}m` : ''
        },
        { field: "distance", headerName: "Dist (mi)", aggFunc: 'sum', width: 100, valueFormatter: p => p.value?.toFixed(1) },
        { field: "elevation", headerName: "Elev (ft)", aggFunc: 'sum', width: 100, valueFormatter: p => Math.round(p.value).toLocaleString() },
        { field: "tss", headerName: "TSS", aggFunc: 'sum', width: 90 },
        { field: "calories", headerName: "Cals", aggFunc: 'sum', width: 90 },

        // --- INTENSITY (Average) ---
        { field: "avg_hr", headerName: "Avg HR", aggFunc: 'avg', width: 90, valueFormatter: p => Math.round(p.value) },
        { field: "norm_pwr", headerName: "Norm Pwr", aggFunc: 'avg', width: 90, valueFormatter: p => Math.round(p.value) },
        { field: "if", headerName: "IF", aggFunc: 'avg', width: 80, valueFormatter: p => p.value?.toFixed(2) },
        
        // --- DYNAMICS ---
        { field: "cadence_run", headerName: "Run Cad", aggFunc: 'avg', width: 90, hide: true },
        { field: "cadence_bike", headerName: "Bike Cad", aggFunc: 'avg', width: 90, hide: true },
        
        // --- PHYSIO ---
        { field: "aerobic_te", headerName: "Aerobic", aggFunc: 'avg', width: 90, hide: true, valueFormatter: p => p.value?.toFixed(1) },
        { field: "rpe", headerName: "RPE", aggFunc: 'avg', width: 80, hide: true }
    ]
};
