// js/views/logbook/config.js

export const GRID_CONFIG = {
    // 1. VISUALS
    themeClass: 'ag-theme-quartz-dark',
    rowHeight: 40,
    headerHeight: 45,
    animateRows: true,

    // 2. CHARTING & SELECTION (Critical)
    enableRangeSelection: true, 
    enableCharts: true,         
    popupParent: document.body,

    // 3. FORCE CONTEXT MENU (This fixes the missing Chart option)
    getContextMenuItems: (params) => {
        return [
            'copy',
            'copyWithHeaders',
            'separator',
            'chartRange', // <--- Explicitly adds the Chart menu
            'separator',
            'export'
        ];
    },

    // 4. PIVOT DEFAULTS
    pivotMode: true,
    pivotPanelShow: "always",

    // 5. SIDEBAR (Standard Config)
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

    columnDefs: [
        { field: "year", headerName: "Year", rowGroup: true, hide: true },
        { field: "type", headerName: "Sport", pivot: true, enablePivot: true },
        { field: "month", headerName: "Month", rowGroup: true, hide: true },
        { field: "date", headerName: "Date", sort: 'desc' },
        { field: "workout", headerName: "Workout" },

        // Values
        { 
            field: "distance", headerName: "Distance (mi)", 
            aggFunc: "sum", enableValue: true, chartDataType: 'series',
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
    
    autoGroupColumnDef: {
        minWidth: 200,
        headerName: 'Timeline', 
        cellRendererParams: { suppressCount: false }
    }
};
