// js/views/logbook/config.js

export const GRID_CONFIG = {
    // 1. VISUALS
    themeClass: 'ag-theme-quartz-dark', // Modern Dark Theme
    rowHeight: 40,
    headerHeight: 45,
    animateRows: true,

    // 2. PIVOT & GROUPING DEFAULTS (Matches your snippet)
    pivotMode: true,  // <--- Starts in Pivot Mode like the docs
    pivotPanelShow: "always", // Shows the "drop zones" at the top

    // 3. SIDEBAR CONFIGURATION (Matches your snippet)
    sideBar: {
        toolPanels: [
            {
                id: "columns",
                labelDefault: "Columns",
                labelKey: "columns",
                iconKey: "columns",
                toolPanel: "agColumnsToolPanel",
                toolPanelParams: {
                    // Start with these FALSE so you can actually interact with them
                    suppressRowGroups: false,
                    suppressValues: false,
                    suppressPivots: false,
                    suppressPivotMode: false, // Set to TRUE if you want to hide the toggle switch
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

    // 5. COLUMN DEFINITIONS (Mapped to YOUR data)
    columnDefs: [
        // --- Dimensions (Rows/Columns) ---
        { 
            field: "year", 
            headerName: "Year", 
            rowGroup: true, // <--- Group by Year first
            hide: true      // Hide from grid view (standard when grouping)
        },
        { 
            field: "type", 
            headerName: "Sport", 
            pivot: true,    // <--- Pivot the columns by Sport (Bike/Run/Swim)
            enablePivot: true 
        },
        { 
            field: "month", 
            headerName: "Month", 
            rowGroup: true, // <--- Group by Month second
            hide: true 
        },
        { field: "date", headerName: "Date", sort: 'desc' },
        { field: "workout", headerName: "Workout" },

        // --- Values (The Numbers) ---
        { 
            field: "distance", 
            headerName: "Distance (mi)", 
            aggFunc: "sum", 
            enableValue: true,
            valueFormatter: p => p.value ? p.value.toFixed(1) : ''
        },
        { 
            field: "elevation", 
            headerName: "Elevation (ft)", 
            aggFunc: "sum", 
            enableValue: true,
            valueFormatter: p => p.value ? Math.round(p.value).toLocaleString() : ''
        },
        { 
            field: "duration", 
            headerName: "Duration (hrs)", 
            aggFunc: "sum", 
            enableValue: true,
            valueFormatter: p => p.value ? p.value.toFixed(1) : ''
        },
        { 
            field: "tss", 
            headerName: "TSS", 
            aggFunc: "sum", 
            enableValue: true 
        }
    ],
    
    // 6. AUTO GROUP COLUMN (The first column with the caret >)
    autoGroupColumnDef: {
        minWidth: 200,
        headerName: 'Timeline', 
        cellRendererParams: {
            suppressCount: false, // Shows (12) count next to groups
        }
    }
};
