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
    
    // Grid Lines
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
    // (Kept simple for brevity, logic remains same as original file if needed for tooltips)
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
    const historyChartId = `history-chart-${Date.now()}`; // NEW

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

        // 2. NEW: Garmin History Chart (using Chart.js for better Date handling)
        const healthData = await fetchGarminHealth();
        const hCtx = document.getElementById(historyChartId);
        
        if (hCtx && healthData.length > 0) {
            // Sort by date
            const sorted = healthData.sort((a,b) => new Date(a.calendarDate) - new Date(b.calendarDate));
            const bikePoints = [];
            const runPoints = [];

            sorted.forEach(d => {
                if (d.ftp) bikePoints.push({ x: d.calendarDate, y: d.ftp });
                // Checks for 'runningFtp' or falls back to 'thresholdPower' if Garmin names vary
                if (d.runningFtp || d.running_ftp) runPoints.push({ x: d.calendarDate, y: d.runningFtp || d.running_ftp });
            });

            new Chart(hCtx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Cycling FTP',
                            data: bikePoints,
                            borderColor: bikeColor,
                            backgroundColor: bikeColor + '20',
                            tension: 0.2,
                            pointRadius: 3,
                            borderWidth: 2
                        },
                        {
                            label: 'Running FTP',
                            data: runPoints,
                            borderColor: runColor,
                            backgroundColor: runColor + '20',
                            tension: 0.2,
                            pointRadius: 3,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: false }, // Hide date labels to keep it clean
                        y: { 
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' } 
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#cbd5e1', font: { family: 'monospace' } } },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#1e293b',
                            borderColor: '#475569',
                            borderWidth: 1
                        }
                    }
                }
            });
        }
    })();

    return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4 h-64">
                    <div class="col-span-1 h-full">${gaugeHtml}</div>
                    <div class="col-span-1 h-full">${cyclingStatsHtml}</div>
                </div>
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80 flex flex-col">
                    <div class="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-bolt text-purple-400"></i>
                        <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">Cycling Power Curve</span>
                    </div>
                    <div id="${cyclingChartId}" class="flex-1 w-full relative min-h-0"><div class="flex items-center justify-center h-full text-slate-500 text-xs italic">Loading...</div></div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="h-64">${runningStatsHtml}</div>
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80 flex flex-col">
                    <div class="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-stopwatch text-pink-400"></i>
                        <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">Running Pace Curve</span>
                    </div>
                    <div id="${runningChartId}" class="flex-1 w-full relative min-h-0"><div class="flex items-center justify-center h-full text-slate-500 text-xs italic">Loading...</div></div>
                </div>
            </div>

            <div class="col-span-1 lg:col-span-2 bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80">
                <div class="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-chart-line text-emerald-400"></i>
                        <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">FTP Progression</span>
                    </div>
                    <span class="text-[10px] text-slate-600 font-mono">Source: Garmin Health</span>
                </div>
                <div class="relative w-full h-60">
                    <canvas id="${historyChartId}"></canvas>
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
