// js/views/logbook/config.js

export const GRID_CONFIG = {
    // 1. VISUALS
    themeClass: 'ag-theme-quartz-dark',
    rowHeight: 40,
    headerHeight: 45,
    animateRows: true,

    // --- NEW: ENABLE CHARTS ---
    enableRangeSelection: true, // Required: Allows you to drag-select cells
    enableCharts: true,         // Required: Turns on the Charting engine
    popupParent: document.body, // Optional: Ensures menus/charts don't get clipped

    // 2. PIVOT & GROUPING
    pivotMode: true,
    pivotPanelShow: "always",

    // 3. SIDEBAR CONFIGURATION
    sideBar: {
        toolPanels: [
            {
                id: "columns",
                labelDefault: "Columns",
                labelKey: "columns",
                iconKey: "columns",
                toolPanel: "agColumnsToolPanel",
                toolPanelParams: {
                    suppressRowGroups: false,
                    suppressValues: false,
                    suppressPivots: false,
                    suppressPivotMode: false,
                },
            },
            {
                id: "filters",
                labelDefault: "Filters",
                labelKey: "filters",
                iconKey: "filter",
                toolPanel: "agFiltersToolPanel",
            }
        ],
        defaultToolPanel: "columns",
    },

    // 4. COLUMN DEFAULTS
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        sortable: true,
        filter: true,
        resizable: true,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
    },

    // 5. COLUMN DEFINITIONS
    columnDefs: [
        // --- Dimensions ---
        { field: "year", headerName: "Year", rowGroup: true, hide: true },
        { field: "type", headerName: "Sport", pivot: true, enablePivot: true },
        { field: "month", headerName: "Month", rowGroup: true, hide: true },
        { field: "date", headerName: "Date", sort: 'desc' },
        { field: "workout", headerName: "Workout" },

        // --- Values (Summable for Charts) ---
        { 
            field: "distance", headerName: "Distance (mi)", 
            aggFunc: "sum", enableValue: true, chartDataType: 'series', // Hint to Chart engine
            valueFormatter: p => p.value ? p.value.toFixed(1) : ''
        },
        { 
            field: "elevation", headerName: "Elevation (ft)", 
            aggFunc: "sum", enableValue: true, chartDataType: 'series',
            valueFormatter: p => p.value ? Math.round(p.value).toLocaleString() : ''
        },
        { 
            field: "duration", headerName: "Duration (hrs)", 
            aggFunc: "sum", enableValue: true, chartDataType: 'series',
            valueFormatter: p => p.value ? p.value.toFixed(1) : ''
        },
        { 
            field: "tss", headerName: "TSS", 
            aggFunc: "sum", enableValue: true, chartDataType: 'series'
        }
    ],
    
    // 6. AUTO GROUP
    autoGroupColumnDef: {
        minWidth: 200,
        headerName: 'Timeline', 
        cellRendererParams: { suppressCount: false }
    }
};
