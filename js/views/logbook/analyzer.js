// js/views/logbook/analyzer.js

export const renderAnalyzer = (logData) => {
    // 1. Initial Render: Create the container and UI skeleton
    const containerId = 'log-analyzer-container';
    
    // We render the layout immediately, then populate data
    setTimeout(() => initLogic(containerId, logData), 0);

    return `
        <div id="${containerId}" class="flex flex-col gap-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Timeframe</label>
                    <select id="filter-time" class="bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none">
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                        <option value="ytd">Year to Date</option>
                        <option value="all">All Time</option>
                    </select>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sport</label>
                    <select id="filter-sport" class="bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none">
                        <option value="all">All Sports</option>
                        <option value="Bike">Bike</option>
                        <option value="Run">Run</option>
                        <option value="Swim">Swim</option>
                        <option value="Strength">Strength</option>
                    </select>
                </div>

                 <div class="flex flex-col gap-1 opacity-50 cursor-not-allowed">
                    <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Group By</label>
                    <select disabled class="bg-slate-900 text-slate-500 border border-slate-700 rounded p-2 text-sm">
                        <option>Summary Totals</option>
                    </select>
                </div>
            </div>

            <div id="analyzer-results" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="col-span-full text-center text-slate-500 py-10">Loading Data...</div>
            </div>

             <div class="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
                <div class="p-3 bg-slate-800/80 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase">
                    Recent Activities (Filtered)
                </div>
                <div id="analyzer-table" class="max-h-96 overflow-y-auto">
                    </div>
            </div>
        </div>
    `;
};

// --- LOGIC ENGINE ---
const initLogic = (containerId, rawData) => {
    const timeSelect = document.getElementById('filter-time');
    const sportSelect = document.getElementById('filter-sport');
    
    // Parse Data Helper
    const parseData = (data) => {
        return data.map(d => {
            // Parse Date
            const date = new Date(d.date);
            
            // Parse Duration (e.g., "1h 30m" -> 90)
            let min = 0;
            if (typeof d.duration === 'string') {
                const h = d.duration.match(/(\d+)h/);
                const m = d.duration.match(/(\d+)m/);
                if (h) min += parseInt(h[1]) * 60;
                if (m) min += parseInt(m[1]);
                if (!h && !m && !isNaN(d.duration)) min = parseInt(d.duration); // Handle raw numbers
            }

            // Parse Distance (e.g., "15.5 mi" -> 15.5)
            let dist = 0;
            if (typeof d.distance === 'string') {
                const clean = d.distance.replace(/[^\d.]/g, '');
                dist = parseFloat(clean) || 0;
            } else if (typeof d.distance === 'number') {
                dist = d.distance;
            }

            // Parse Elevation (e.g., "1,200 ft" -> 1200)
            let elev = 0;
            if (typeof d.elevation === 'string') {
                const clean = d.elevation.replace(/[^\d]/g, ''); // Remove commas/letters
                elev = parseInt(clean) || 0;
            } else if (typeof d.elevation === 'number') {
                elev = d.elevation;
            }

            return { ...d, _date: date, _min: min, _dist: dist, _elev: elev };
        }).filter(d => !isNaN(d._date)); // Remove bad rows
    };

    const parsedLog = parseData(rawData);

    // Update Function
    const update = () => {
        const timeVal = timeSelect.value;
        const sportVal = sportSelect.value;
        const now = new Date();

        // 1. FILTER
        const filtered = parsedLog.filter(d => {
            // Sport Filter
            if (sportVal !== 'all' && !d.type.includes(sportVal)) return false;

            // Time Filter
            const diffDays = (now - d._date) / (1000 * 60 * 60 * 24);
            if (timeVal === '30' && diffDays > 30) return false;
            if (timeVal === '90' && diffDays > 90) return false;
            if (timeVal === 'ytd' && d._date.getFullYear() !== now.getFullYear()) return false;
            
            return true;
        });

        // 2. AGGREGATE
        const stats = filtered.reduce((acc, curr) => {
            acc.count++;
            acc.duration += curr._min;
            acc.distance += curr._dist;
            acc.elevation += curr._elev;
            return acc;
        }, { count: 0, duration: 0, distance: 0, elevation: 0 });

        // 3. RENDER CARDS
        const resDiv = document.getElementById('analyzer-results');
        
        // Format Duration
        const hours = Math.floor(stats.duration / 60);
        const mins = stats.duration % 60;
        const durStr = `${hours}h ${mins}m`;

        const card = (label, val, sub, colorClass) => `
            <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between">
                <div class="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">${label}</div>
                <div class="text-2xl font-bold ${colorClass}">${val}</div>
                <div class="text-xs text-slate-400 font-mono mt-1">${sub}</div>
            </div>
        `;

        resDiv.innerHTML = `
            ${card('Activities', stats.count, 'Total Sessions', 'text-white')}
            ${card('Duration', durStr, 'Total Time', 'text-blue-400')}
            ${card('Distance', stats.distance.toFixed(1), 'Miles / Km', 'text-emerald-400')}
            ${card('Elevation', stats.elevation.toLocaleString(), 'Feet / Meters', 'text-purple-400')}
        `;

        // 4. RENDER TABLE ROWS (Top 20 recent)
        const tableDiv = document.getElementById('analyzer-table');
        const sorted = filtered.sort((a,b) => b._date - a._date).slice(0, 50);
        
        tableDiv.innerHTML = sorted.map(d => `
            <div class="grid grid-cols-4 gap-2 p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors text-sm">
                <div class="text-slate-300">${d._date.toLocaleDateString()}</div>
                <div class="font-bold text-white">${d.type}</div>
                <div class="text-right text-slate-400 font-mono">${d.distance}</div>
                <div class="text-right text-slate-500 font-mono">${d.duration}</div>
            </div>
        `).join('') || '<div class="p-4 text-center text-slate-500 italic">No activities found for this filter.</div>';
    };

    // Listeners
    timeSelect.addEventListener('change', update);
    sportSelect.addEventListener('change', update);

    // Initial Run
    update();
};
