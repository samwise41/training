// js/views/logbook/analyzer.js

export const renderAnalyzer = (rawLogData) => {
    const containerId = 'ag-grid-container';
    const statsId = 'ag-stats-bar';

    // Delayed init to let HTML render first
    setTimeout(() => initAGGrid(containerId, statsId, rawLogData), 0);

    return `
        <div class="flex flex-col gap-6 h-[calc(100vh-140px)]">
            
            <div id="${statsId}" class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700 shrink-0">
                <div class="text-center text-slate-500 text-sm">Initializing Grid...</div>
            </div>

            <div id="${containerId}" class="ag-theme-alpine-dark flex-1 w-full rounded-xl overflow-hidden border border-slate-700"></div>
            
            <div class="text-[10px] text-slate-500 text-right pr-2">
                * Drag columns to top to Group • Right Sidebar for Pivot Mode
            </div>
        </div>
    `;
};



// --- LOGIC ---
const initAGGrid = (gridId, statsId, rawData) => {
    agGrid.LicenseManager.setLicenseKey("MTc3MTU0NTYwMDAwMA==00161e219ce2062df968d7b521e69b85");
    const gridDiv = document.getElementById(gridId);
    
    // 1. Data Parsing Helper
    const rowData = rawData.map(d => {
        // Parse Duration
        let min = 0;
        if (typeof d.duration === 'string') {
            const h = d.duration.match(/(\d+)h/);
            const m = d.duration.match(/(\d+)m/);
            if (h) min += parseInt(h[1]) * 60;
            if (m) min += parseInt(m[1]);
            if (!h && !m && !isNaN(d.duration)) min = parseInt(d.duration);
        } else { min = d.duration || 0; }

        // Parse Distance
        let dist = 0;
        if (typeof d.distance === 'string') {
            dist = parseFloat(d.distance.replace(/[^\d.]/g, '')) || 0;
        } else { dist = d.distance || 0; }

        // Parse Elevation
        let elev = 0;
        if (typeof d.elevation === 'string') {
            elev = parseInt(d.elevation.replace(/[^\d]/g, '')) || 0;
        } else { elev = d.elevation || 0; }

        // Add Year/Month for better Grouping
        const dateObj = new Date(d.date);
        const year = isNaN(dateObj) ? 'Unknown' : dateObj.getFullYear();
        const month = isNaN(dateObj) ? 'Unknown' : dateObj.toLocaleString('default', { month: 'short' });

        return {
            date: d.date, 
            year: year,
            month: month,
            type: d.type,
            distance: dist,
            elevation: elev,
            duration: min,
            tss: d.tss || 0,
            notes: d.notes || ''
        };
    });

    // 2. Column Definitions (Enterprise Features Enabled)
    const columnDefs = [
        { 
            field: "date", 
            headerName: "Date", 
            width: 120,
            sort: 'desc',
            filter: 'agDateColumnFilter',
            comparator: (valueA, valueB) => new Date(valueA) - new Date(valueB)
        },
        { 
            field: "year", 
            headerName: "Year", 
            width: 90,
            enableRowGroup: true, // Allows grouping by Year
            hide: true // Hidden by default (useful when dragging to group)
        },
        { 
            field: "month", 
            headerName: "Month", 
            width: 90,
            enableRowGroup: true,
            hide: true 
        },
        { 
            field: "type", 
            headerName: "Sport", 
            width: 140,
            filter: true,
            enableRowGroup: true, // Allows grouping by Sport
            enablePivot: true,    // Allows pivoting
            cellRenderer: params => {
                if (!params.value) return '';
                const s = params.value.toLowerCase();
                let color = 'bg-slate-500';
                if(s.includes('run')) color = 'bg-pink-500';
                if(s.includes('bike')) color = 'bg-purple-500';
                if(s.includes('swim')) color = 'bg-blue-500';
                return `<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full ${color}"></div>${params.value}</div>`;
            }
        },
        { 
            field: "duration", 
            headerName: "Time", 
            width: 110,
            aggFunc: 'sum', // Automatically Sums when grouped
            enableValue: true,
            valueFormatter: params => {
                if (!params.value) return '';
                const h = Math.floor(params.value / 60);
                const m = params.value % 60;
                return h > 0 ? `${h}h ${m}m` : `${m}m`;
            }
        },
        { 
            field: "distance", 
            headerName: "Dist (mi)", 
            width: 110,
            filter: 'agNumberColumnFilter',
            aggFunc: 'sum', // Auto Sum
            enableValue: true,
            valueFormatter: params => params.value ? params.value.toFixed(1) : ''
        },
        { 
            field: "elevation", 
            headerName: "Elev (ft)", 
            width: 110,
            filter: 'agNumberColumnFilter',
            aggFunc: 'sum', // Auto Sum
            enableValue: true,
            valueFormatter: params => params.value ? params.value.toLocaleString() : ''
        },
        { 
            field: "tss", 
            headerName: "TSS", 
            width: 90,
            filter: 'agNumberColumnFilter',
            aggFunc: 'sum',
            enableValue: true
        },
        { 
            field: "notes", 
            headerName: "Notes", 
            flex: 1, 
            sortable: false 
        }
    ];

    // 3. Grid Options
    const gridOptions = {
        columnDefs: columnDefs,
        rowData: rowData,
        animateRows: true,
        sideBar: true, // Shows the Pivot/Columns sidebar on the right
        rowGroupPanelShow: 'always', // Shows the "Drag here to group" bar at top
        
        defaultColDef: {
            sortable: true,
            filter: true,
            resizable: true,
            flex: 1,
            minWidth: 100
        },

        // Event: Fix "Loading..." bug by waiting for Grid Ready
        onGridReady: (params) => {
            updateStats(params.api, statsId);
        },

        // Event: Recalculate stats whenever the filter or data changes
        onModelUpdated: (params) => {
            updateStats(params.api, statsId);
        }
    };

    // 4. Create Grid (Modern Syntax)
    agGrid.createGrid(gridDiv, gridOptions);
};

// --- STATS ENGINE ---
const updateStats = (api, statsId) => {
    let count = 0;
    let dur = 0;
    let dist = 0;
    let elev = 0;

    // Loop through currently visible rows (respects filters & groups)
    api.forEachNodeAfterFilter(node => {
        // Only count leaf nodes (actual data rows), ignore group headers for stats
        if (!node.group && node.data) {
            count++;
            dur += node.data.duration || 0;
            dist += node.data.distance || 0;
            elev += node.data.elevation || 0;
        }
    });

    const hours = Math.floor(dur / 60);
    const mins = dur % 60;
    
    const card = (label, val, unit, color) => `
        <div class="flex flex-col">
            <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">${label}</span>
            <span class="text-xl font-bold ${color}">${val}</span>
            <span class="text-[10px] text-slate-400 font-mono">${unit}</span>
        </div>
    `;

    const container = document.getElementById(statsId);
    if (container) {
        container.innerHTML = `
            ${card('Activities', count, 'Visible Rows', 'text-white')}
            ${card('Duration', `${hours}h ${mins}m`, 'Total Time', 'text-blue-400')}
            ${card('Distance', dist.toFixed(1), 'Miles', 'text-pink-400')}
            ${card('Elevation', elev.toLocaleString(), 'Feet', 'text-purple-400')}
        `;
    }
};
