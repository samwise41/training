// js/views/logbook/analyzer.js

export const renderAnalyzer = (rawLogData) => {
    // 1. Container Structure
    const containerId = 'ag-grid-container';
    const statsId = 'ag-stats-bar';

    // Delayed init to let HTML render first
    setTimeout(() => initAGGrid(containerId, statsId, rawLogData), 0);

    return `
        <div class="flex flex-col gap-6 h-[calc(100vh-140px)]">
            
            <div id="${statsId}" class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700 shrink-0">
                <div class="text-center text-slate-500 text-sm">Loading Stats...</div>
            </div>

            <div id="${containerId}" class="ag-theme-alpine-dark flex-1 w-full rounded-xl overflow-hidden border border-slate-700"></div>
            
            <div class="text-[10px] text-slate-500 text-right pr-2">
                * Hold SHIFT to sort by multiple columns
            </div>
        </div>
    `;
};

// --- LOGIC ---
const initAGGrid = (gridId, statsId, rawData) => {
    const gridDiv = document.getElementById(gridId);
    
    // 1. Data Parsing Helper (Same logic, new destination)
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

        return {
            date: d.date, // Keep string for display, use comparator for sort
            type: d.type,
            distance: dist,
            elevation: elev,
            duration: min,
            tss: d.tss || 0,
            notes: d.notes || ''
        };
    });

    // 2. Column Definitions
    const columnDefs = [
        { 
            field: "date", 
            headerName: "Date", 
            width: 120,
            sort: 'desc',
            comparator: (valueA, valueB) => {
                return new Date(valueA) - new Date(valueB);
            },
            filter: 'agDateColumnFilter',
            filterParams: {
                comparator: (filterLocalDateAtMidnight, cellValue) => {
                    const dateParts = cellValue.split("-"); // Assuming YYYY-MM-DD
                    const cellDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
                    if (cellDate < filterLocalDateAtMidnight) return -1;
                    if (cellDate > filterLocalDateAtMidnight) return 1;
                    return 0;
                }
            }
        },
        { 
            field: "type", 
            headerName: "Sport", 
            width: 110,
            filter: true,
            cellRenderer: params => {
                // Add color dots based on sport
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
            width: 100,
            aggFunc: 'sum',
            valueFormatter: params => {
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
            valueFormatter: params => params.value.toFixed(1)
        },
        { 
            field: "elevation", 
            headerName: "Elev (ft)", 
            width: 110,
            filter: 'agNumberColumnFilter',
            valueFormatter: params => params.value.toLocaleString()
        },
        { 
            field: "tss", 
            headerName: "TSS", 
            width: 90,
            filter: 'agNumberColumnFilter'
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
        defaultColDef: {
            sortable: true,
            filter: true,
            resizable: true,
        },
        // Event Listener: Recalculate stats whenever the filter changes
        onModelUpdated: () => updateStats(gridOptions.api, statsId),
    };

    // 4. Create Grid
    new agGrid.Grid(gridDiv, gridOptions);
    
    // Initial Stat Calc
    updateStats(gridOptions.api, statsId);
};

// --- STATS ENGINE ---
const updateStats = (api, statsId) => {
    let count = 0;
    let dur = 0;
    let dist = 0;
    let elev = 0;

    // Loop through only the rows CURRENTLY visible after filtering
    api.forEachNodeAfterFilter(node => {
        const d = node.data;
        count++;
        dur += d.duration;
        dist += d.distance;
        elev += d.elevation;
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

    document.getElementById(statsId).innerHTML = `
        ${card('Activities', count, 'Filtered Rows', 'text-white')}
        ${card('Duration', `${hours}h ${mins}m`, 'Total Time', 'text-blue-400')}
        ${card('Distance', dist.toFixed(1), 'Miles', 'text-pink-400')}
        ${card('Elevation', elev.toLocaleString(), 'Feet', 'text-purple-400')}
    `;
};
