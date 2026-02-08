// js/views/ftp/index.js

// --- DATA FETCHING ---

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    const defaults = { '--color-bike': '#c084fc', '--color-run': '#f472b6' };
    return defaults[varName] || '#888888';
};

const fetchCyclingData = async () => {
    try {
        const res = await fetch('strava_data/cycling/power_curve_graph.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) { return []; }
};

const fetchRunningData = async () => {
    try {
        const res = await fetch('strava_data/running/my_running_prs.md');
        if (!res.ok) return [];
        const text = await res.text();
        return parseRunningMarkdown(text);
    } catch (e) { return []; }
};

// NEW: Fetch Garmin Data from GitHub
const fetchGarminHealth = async () => {
    try {
        const url = 'https://raw.githubusercontent.com/samwise41/training/main/garmin_data/garmin_health.json';
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) { console.error("Garmin Data Error", e); return []; }
};

// Parser for Running PRs
const parseRunningMarkdown = (md) => {
    const rows = [];
    const distMap = { 
        '400m': 0.248, '1/2 mile': 0.5, '1 mile': 1.0, '2 mile': 2.0, 
        '5k': 3.106, '10k': 6.213, '15k': 9.32, '10 mile': 10.0, 
        '20k': 12.42, 'Half-Marathon': 13.109, '30k': 18.64, 'Marathon': 26.218, '50k': 31.06
    };

    md.split('\n').forEach(line => {
        const cols = line.split('|').map(c => c.trim());
        if (cols.length >= 6 && !line.includes('---') && cols[1] !== 'Distance') {
            const label = cols[1];
            const distKey = Object.keys(distMap).find(k => label.toLowerCase().includes(k.toLowerCase())) || label;
            const dist = distMap[distKey];
            
            if (dist) {
                const parseTime = (str) => {
                    if (!str || str === '--') return null;
                    const clean = str.replace(/\*\*/g, '');
                    const parts = clean.split(':').map(Number);
                    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
                    if (parts.length === 2) return parts[0]*60 + parts[1];
                    return null;
                };
                const extractLink = (str) => {
                    const match = str.match(/\[(.*?)\]\((.*?)\)/);
                    return match ? { date: match[1], url: match[2] } : { date: '--', url: '#' };
                };

                const timeAllTime = parseTime(cols[2]);
                const metaAllTime = extractLink(cols[3]);
                const time6Week = parseTime(cols[4]);
                const meta6Week = extractLink(cols[5]);

                const paceAllTime = timeAllTime ? (timeAllTime / 60) / dist : null;
                const pace6Week = time6Week ? (time6Week / 60) / dist : null;

                if (paceAllTime) {
                    rows.push({ label: distKey, dist, paceAllTime, pace6Week, atMeta: metaAllTime, swMeta: meta6Week });
                }
            }
        }
    });
    return rows.sort((a,b) => a.dist - b.dist);
};

// --- CHART MATH (For Existing SVG Charts) ---
const getLogX = (val, min, max, width, pad) => {
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logVal = Math.log(val);
    return pad.l + ((logVal - logMin) / (logMax - logMin)) * (width - pad.l - pad.r);
};

const getLinY = (val, min, max, height, pad) => {
    return height - pad.b - ((val - min) / (max - min)) * (height - pad.t - pad.b);
};

const renderLogChart = (containerId, data, options) => {
    const { width = 800, height = 300, colorAll = '#a855f7', color6w = '#22c55e', xType = 'time', showPoints = true } = options;
    const pad = { t: 30, b: 30, l: 50, r: 20 };
    
    const xValues = data.map(d => d.x);
    const yValues = data.flatMap(d => [d.yAll, d.y6w]).filter(v => v !== null);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);
    const buf = (maxY - minY) * 0.1;
    minY = Math.max(0, minY - buf);
    maxY = maxY + buf;

    let gridHtml = '';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const pct = i / ySteps;
        const val = minY + (pct * (maxY - minY));
        const y = getLinY(val, minY, maxY, height, pad);
        const yLabel = xType === 'distance' ? formatPace(val) : Math.round(val);
        gridHtml += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#334155" stroke-width="1" opacity="0.3" /><text x="${pad.l - 8}" y="${y + 3}" text-anchor="end" font-size="10" fill="#94a3b8">${yLabel}</text>`;
    }

    const genPath = (key) => {
        let d = '';
        data.forEach((pt, i) => {
            if (pt[key] === null) return;
            const x = getLogX(pt.x, minX, maxX, width, pad);
            const y = getLinY(pt[key], minY, maxY, height, pad);
            d += (i === 0 || d === '') ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
        return d;
    };

    const path6w = genPath('y6w');
    const pathAll = genPath('yAll');

    let pointsHtml = '';
    if (showPoints) {
        data.forEach(pt => {
            const x = getLogX(pt.x, minX, maxX, width, pad);
            if (pt.y6w !== null) pointsHtml += `<circle cx="${x}" cy="${getLinY(pt.y6w, minY, maxY, height, pad)}" r="3" fill="#0f172a" stroke="${color6w}" stroke-width="2" />`;
            if (pt.yAll !== null) pointsHtml += `<circle cx="${x}" cy="${getLinY(pt.yAll, minY, maxY, height, pad)}" r="3" fill="#0f172a" stroke="${colorAll}" stroke-width="2" />`;
        });
    }

    return `<div class="relative w-full h-full group select-none"><svg id="${containerId}-svg" viewBox="0 0 ${width} ${height}" class="w-full h-full cursor-crosshair" preserveAspectRatio="none">${gridHtml}<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" /><path d="${path6w}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="5,5" /><path d="${pathAll}" fill="none" stroke="${colorAll}" stroke-width="2" />${pointsHtml}</svg></div>`;
};

// --- INTERACTION LOGIC ---
const setupChartInteractions = (containerId, data, options) => {
    // (Kept simple for brevity)
};

// --- HELPERS ---
const formatPace = (val) => {
    if(!val) return '--';
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- MAIN RENDER ---
export function renderFTP(profileData) {
    const bio = profileData || { weight_lbs: 0, ftp_watts: 0, wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } };
    
    const bikeColor = getColor('--color-bike'); 
    const runColor = getColor('--color-run');   
    
    const gaugeHtml = renderGauge(bio.wkg, bio.gauge_percent, bio.category);
    const cyclingStatsHtml = renderCyclingStats(bio);
    const runningStatsHtml = renderRunningStats(bio);
    
    const cyclingChartId = `cycle-chart-${Date.now()}`;
    const runningChartId = `run-chart-${Date.now()}`;
    const bikeHistoryId = `bike-hist-${Date.now()}`; // NEW
    const runHistoryId = `run-hist-${Date.now()}`;   // NEW

    // Load Charts Async
    (async () => {
        // 1. Existing Strava Charts
        const cyclingData = await fetchCyclingData();
        const cEl = document.getElementById(cyclingChartId);
        if (cEl && cyclingData.length) {
            const chartData = cyclingData.map(d => ({ x: d.seconds, yAll: d.all_time_watts, y6w: d.six_week_watts || null })).filter(d => d.x >= 1);
            cEl.innerHTML = renderLogChart(cyclingChartId, chartData, { width: 800, height: 300, xType: 'time', colorAll: bikeColor, color6w: bikeColor, showPoints: false });
        }

        const runningData = await fetchRunningData();
        const rEl = document.getElementById(runningChartId);
        if (rEl && runningData.length) {
            const chartData = runningData.map(d => ({ x: d.dist, yAll: d.paceAllTime, y6w: d.pace6Week || null }));
            rEl.innerHTML = renderLogChart(runningChartId, chartData, { width: 800, height: 300, xType: 'distance', colorAll: runColor, color6w: runColor, showPoints: true });
        }

        // 2. NEW: Garmin History Charts (Separated)
        const healthData = await fetchGarminHealth();
        
        if (healthData.length > 0) {
            // Sort by date
            const sorted = healthData.sort((a,b) => new Date(a.calendarDate) - new Date(b.calendarDate));
            const bikePoints = [];
            
            // Run Data: FTP Pace (or Power) AND LTHR
            const runFtpPoints = [];
            const lthrPoints = [];

            sorted.forEach(d => {
                const date = d.calendarDate || d.date;
                
                // Bike FTP
                if (d.ftp) bikePoints.push({ x: date, y: d.ftp });
                
                // Run FTP (Garmin 'runningFtp' is usually watts, 'thresholdPower' is watts)
                // If you want Pace, we might need a converter, but raw data is safer.
                // Assuming watts for consistency with standard Garmin export.
                const rVal = d.runningFtp || d.running_ftp || d.thresholdPower;
                if (rVal) runFtpPoints.push({ x: date, y: rVal });

                // LTHR
                const lthr = d.lactateThresholdHeartRate || d.lthr;
                if (lthr) lthrPoints.push({ x: date, y: lthr });
            });

            // CHART 1: BIKE HISTORY
            const bCtx = document.getElementById(bikeHistoryId);
            if(bCtx) {
                new Chart(bCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Cycling FTP (w)',
                            data: bikePoints,
                            borderColor: bikeColor,
                            backgroundColor: bikeColor + '20',
                            tension: 0.2,
                            borderWidth: 2,
                            pointRadius: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { display: false }, y: { grid: { color: '#334155' } } },
                        plugins: { legend: { display: false } }
                    }
                });
            }

            // CHART 2: RUN HISTORY (Dual Axis: Power vs HR)
            const rCtx = document.getElementById(runHistoryId);
            if(rCtx) {
                new Chart(rCtx, {
                    type: 'line',
                    data: {
                        datasets: [
                            {
                                label: 'Run FTP',
                                data: runFtpPoints,
                                borderColor: runColor,
                                backgroundColor: runColor + '20',
                                tension: 0.2,
                                borderWidth: 2,
                                yAxisID: 'y'
                            },
                            {
                                label: 'LTHR (bpm)',
                                data: lthrPoints,
                                borderColor: '#ef4444', // Red for Heart Rate
                                borderDash: [5, 5],
                                tension: 0.2,
                                borderWidth: 1.5,
                                pointRadius: 0,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: { 
                            x: { display: false }, 
                            y: { 
                                type: 'linear', display: true, position: 'left',
                                grid: { color: '#334155' } 
                            },
                            y1: { 
                                type: 'linear', display: true, position: 'right',
                                grid: { drawOnChartArea: false } // only want the grid lines for one axis
                            }
                        },
                        plugins: { legend: { labels: { color: '#cbd5e1' } } }
                    }
                });
            }
        }
    })();

    return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4 h-64">
                    <div class="col-span-1 h-full">${gaugeHtml}</div>
                    <div class="col-span-1 h-full">${cyclingStatsHtml}</div>
                </div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Power Curve</span>
                    </div>
                    <div id="${cyclingChartId}" class="flex-1 w-full relative min-h-0"><div class="text-xs text-slate-500 italic p-4">Loading...</div></div>
                </div>

                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Cycling FTP History</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0">
                        <canvas id="${bikeHistoryId}"></canvas>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="h-64">${runningStatsHtml}</div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Pace Curve</span>
                    </div>
                    <div id="${runningChartId}" class="flex-1 w-full relative min-h-0"><div class="text-xs text-slate-500 italic p-4">Loading...</div></div>
                </div>

                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Run FTP & LTHR</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0">
                        <canvas id="${runHistoryId}"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- SUB-COMPONENTS (Unchanged) ---
const renderGauge = (wkgNum, percent, cat) => `
    <div class="gauge-wrapper w-full h-full flex items-center justify-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg relative overflow-hidden">
        <svg viewBox="0 0 300 160" class="gauge-svg w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
            <path d="M 30 150 A 120 120 0 0 1 64.1 66.2" fill="none" stroke="#ef4444" stroke-width="24" />
            <path d="M 64.1 66.2 A 120 120 0 0 1 98.3 41.8" fill="none" stroke="#f97316" stroke-width="24" />
            <path d="M 98.3 41.8 A 120 120 0 0 1 182.0 34.4" fill="none" stroke="#22c55e" stroke-width="24" />
            <path d="M 182.0 34.4 A 120 120 0 0 1 249.2 82.6" fill="none" stroke="#3b82f6" stroke-width="24" />
            <path d="M 249.2 82.6 A 120 120 0 0 1 270 150" fill="none" stroke="#a855f7" stroke-width="24" />
            <text x="150" y="130" text-anchor="middle" class="text-5xl font-black fill-white">${wkgNum.toFixed(2)}</text>
            <text x="150" y="155" text-anchor="middle" font-weight="800" fill="${cat.color}" style="font-size: 14px; letter-spacing: 1px;">${cat.label.toUpperCase()}</text>
            <g class="gauge-needle" style="transform-origin: 150px 150px; transform: rotate(${-90 + (percent * 180)}deg)">
                <path d="M 147 150 L 150 40 L 153 150 Z" fill="white" />
                <circle cx="150" cy="150" r="6" fill="white" />
            </g>
        </svg>
    </div>
`;

const renderCyclingStats = (bio) => `
    <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl text-center shadow-lg flex flex-col justify-center h-full">
        <div class="flex items-center justify-center gap-2 mb-2">
            <i class="fa-solid fa-bicycle icon-bike text-2xl"></i>
            <span class="text-sm font-bold text-slate-500 uppercase tracking-widest">Cycling FTP</span>
        </div>
        <div class="flex flex-col mt-2">
            <span class="text-5xl font-black text-white">${bio.ftp_watts > 0 ? bio.ftp_watts : '--'}</span>
            <span class="text-sm text-slate-400 font-mono mt-2">${bio.wkg.toFixed(2)} W/kg</span>
        </div>
    </div>
`;

const renderRunningStats = (bio) => `
    <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl text-center shadow-lg h-full flex flex-col justify-center">
        <div class="flex items-center justify-center gap-2 mb-6">
            <i class="fa-solid fa-person-running icon-run text-xl"></i>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Running Profile</span>
        </div>
        <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col">
                <span class="text-[10px] text-slate-500 font-bold uppercase mb-1">Pace (FTP)</span>
                <span class="text-xl font-bold text-white leading-none">${bio.run_ftp_pace || '--'}</span>
            </div>
            <div class="flex flex-col border-l border-slate-700 pl-4">
                <span class="text-[10px] text-slate-500 font-bold uppercase mb-1">LTHR</span>
                <span class="text-xl font-bold text-white leading-none">${bio.lthr || '--'}</span>
            </div>
            <div class="flex flex-col border-l border-slate-700 pl-4">
                <span class="text-[10px] text-slate-500 font-bold uppercase mb-1">5K Est</span>
                <span class="text-xl font-bold text-white leading-none">${bio.five_k_time || '--'}</span>
            </div>
        </div>
    </div>
`;
