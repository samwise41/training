// js/views/ftp/index.js

// --- 1. CONFIG & UTILS ---

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    const defaults = { '--color-bike': '#c084fc', '--color-run': '#f472b6' };
    return defaults[varName] || '#888888';
};

const formatPace = (val) => {
    if (!val) return '--';
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatPaceSeconds = (val) => {
    if (!val) return '';
    const m = Math.floor(val / 60);
    const s = Math.round(val % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- 2. DATA FETCHERS ---

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

const fetchGarminHealth = async () => {
    try {
        const url = 'https://raw.githubusercontent.com/samwise41/training/main/garmin_data/garmin_health.json';
        const res = await fetch(url);
        if (!res.ok) throw new Error("GitHub Raw fetch failed");
        return await res.json();
    } catch (e) { console.error("Garmin Fetch Error:", e); return []; }
};

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
                    const parts = str.replace(/\*\*/g, '').split(':').map(Number);
                    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
                    if (parts.length === 2) return parts[0]*60 + parts[1];
                    return null;
                };
                const timeAllTime = parseTime(cols[2]);
                const time6Week = parseTime(cols[4]);
                const paceAllTime = timeAllTime ? (timeAllTime / 60) / dist : null;
                const pace6Week = time6Week ? (time6Week / 60) / dist : null;
                if (paceAllTime) rows.push({ label: distKey, x: dist, yAll: paceAllTime, y6w: pace6Week });
            }
        }
    });
    return rows.sort((a,b) => a.x - b.x);
};

// --- 3. SVG CHART ENGINE (Restored X-Axis Labels) ---

const getLogX = (val, min, max, width, pad) => {
    const logMin = Math.log(min || 1);
    const logMax = Math.log(max);
    const logVal = Math.log(val || 1);
    return pad.l + ((logVal - logMin) / (logMax - logMin)) * (width - pad.l - pad.r);
};

const getLinY = (val, min, max, height, pad) => {
    return height - pad.b - ((val - min) / (max - min)) * (height - pad.t - pad.b);
};

const renderSvgChart = (containerId, data, options) => {
    const { width = 800, height = 300, colorAll, color6w, xType } = options;
    const pad = { t: 20, b: 40, l: 40, r: 20 }; 
    
    const xValues = data.map(d => d.x);
    const yValues = data.flatMap(d => [d.yAll, d.y6w]).filter(v => v !== null && v > 0);
    
    if (xValues.length === 0 || yValues.length === 0) return `<div class="text-xs text-slate-500 p-4 text-center">No Data</div>`;

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);
    const buf = (maxY - minY) * 0.1;
    minY = Math.max(0, minY - buf);
    maxY = maxY + buf;

    let gridHtml = '';
    
    // Y-Axis Grid & Labels
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
        const pct = i / ySteps;
        const val = minY + (pct * (maxY - minY));
        const y = getLinY(val, minY, maxY, height, pad);
        const label = xType === 'distance' ? formatPace(val) : Math.round(val);
        gridHtml += `<line x1="${pad.l}" y1="${y}" x2="${width - pad.r}" y2="${y}" stroke="#334155" stroke-width="1" opacity="0.3" /><text x="${pad.l - 5}" y="${y + 3}" text-anchor="end" font-size="10" fill="#94a3b8">${label}</text>`;
    }

    // X-Axis Labels
    let xTicks = [];
    if (xType === 'time') {
        const timeMarkers = [{v: 1, l: '1s'}, {v: 5, l: '5s'}, {v: 30, l: '30s'}, {v: 60, l: '1m'}, {v: 300, l: '5m'}, {v: 1200, l: '20m'}, {v: 3600, l: '1h'}, {v: 18000, l: '5h'}];
        xTicks = timeMarkers.filter(m => m.v >= minX && m.v <= maxX);
    } else {
        const distMarkers = [{v: 0.248, l: '400m'}, {v: 1.0, l: '1mi'}, {v: 3.106, l: '5k'}, {v: 6.213, l: '10k'}, {v: 13.109, l: 'Half'}, {v: 26.218, l: 'Full'}];
        xTicks = distMarkers.filter(m => m.v >= minX * 0.9 && m.v <= maxX * 1.1);
    }

    xTicks.forEach(tick => {
        const x = getLogX(tick.v, minX, maxX, width, pad);
        gridHtml += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${height - pad.b}" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" opacity="0.3" /><text x="${x}" y="${height - 15}" text-anchor="middle" font-size="10" fill="#94a3b8">${tick.l}</text>`;
    });

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
    if (options.showPoints) {
        data.forEach(pt => {
            const x = getLogX(pt.x, minX, maxX, width, pad);
            if (pt.yAll) pointsHtml += `<circle cx="${x}" cy="${getLinY(pt.yAll, minY, maxY, height, pad)}" r="3" fill="#0f172a" stroke="${colorAll}" stroke-width="2" />`;
        });
    }

    return `<svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">${gridHtml}<path d="${path6w}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="4,4" opacity="0.7" /><path d="${pathAll}" fill="none" stroke="${colorAll}" stroke-width="2" />${pointsHtml}</svg>`;
};

// --- 4. MAIN EXPORTS ---

export function renderFTP(profileData) {
    const bio = profileData || { wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } };
    
    const ts = Date.now();
    window.ftpChartIds = {
        cycleCurve: `curve-bike-${ts}`,
        runCurve: `curve-run-${ts}`,
        bikeHist: `hist-bike-${ts}`,
        runHist: `hist-run-${ts}`
    };

    const gaugeHtml = renderGauge(bio.wkg, bio.gauge_percent, bio.category);
    const cyclingStatsHtml = renderCyclingStats(bio);
    const runningStatsHtml = renderRunningStats(bio);

    return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4 h-64">
                    <div class="col-span-1 h-full">${gaugeHtml}</div>
                    <div class="col-span-1 h-full">${cyclingStatsHtml}</div>
                </div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-bolt text-purple-400"></i>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Power Curve (Strava)</span>
                    </div>
                    <div id="${window.ftpChartIds.cycleCurve}" class="flex-1 w-full relative min-h-0">
                        <div class="flex items-center justify-center h-full text-slate-500 text-xs italic">Loading...</div>
                    </div>
                </div>

                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Cycling FTP & W/kg</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0">
                        <canvas id="${window.ftpChartIds.bikeHist}"></canvas>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="h-64">${runningStatsHtml}</div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-stopwatch text-pink-400"></i>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Pace Curve (Strava)</span>
                    </div>
                    <div id="${window.ftpChartIds.runCurve}" class="flex-1 w-full relative min-h-0">
                        <div class="flex items-center justify-center h-full text-slate-500 text-xs italic">Loading...</div>
                    </div>
                </div>

                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Run FTP Pace & LTHR</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0">
                        <canvas id="${window.ftpChartIds.runHist}"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initCharts() {
    const ids = window.ftpChartIds;
    if (!ids) return;

    const bikeColor = getColor('--color-bike') || '#c084fc';
    const runColor = getColor('--color-run') || '#f472b6';

    // 1. Strava SVG Charts
    fetchCyclingData().then(data => {
        const el = document.getElementById(ids.cycleCurve);
        if (el && data.length) {
            const chartData = data.map(d => ({ x: d.seconds, yAll: d.all_time_watts, y6w: d.six_week_watts })).filter(d => d.x >= 1);
            el.innerHTML = renderSvgChart(ids.cycleCurve, chartData, { width: 600, height: 250, xType: 'time', colorAll: bikeColor, color6w: bikeColor });
        }
    });

    fetchRunningData().then(data => {
        const el = document.getElementById(ids.runCurve);
        if (el && data.length) {
            el.innerHTML = renderSvgChart(ids.runCurve, data, { width: 600, height: 250, xType: 'distance', colorAll: runColor, color6w: runColor, showPoints: true });
        }
    });

    // 2. Garmin History Charts (Chart.js)
    const bCanvas = document.getElementById(ids.bikeHist);
    const rCanvas = document.getElementById(ids.runHist);

    if (bCanvas && rCanvas) {
        const data = await fetchGarminHealth();
        
        if (data && data.length > 0) {
            const sorted = data.sort((a,b) => new Date(a["Date"]) - new Date(b["Date"]));
            
            // Bike Data
            const bikeEntries = sorted.filter(d => d["FTP"] > 0);
            const bikeDates = bikeEntries.map(d => d["Date"].slice(5));
            const ftpVals = bikeEntries.map(d => d["FTP"]);
            const wkgVals = bikeEntries.map(d => {
                if (d["Weight (lbs)"] > 0) {
                    const kg = d["Weight (lbs)"] / 2.20462;
                    return parseFloat((d["FTP"] / kg).toFixed(2));
                }
                return null;
            });

            // Run Data
            const runEntries = sorted.filter(d => d["Run FTP Pace"] || d["Lactate Threshold HR"]);
            const runDates = runEntries.map(d => d["Date"].slice(5));
            const runVals = runEntries.map(d => {
                const s = d["Run FTP Pace"];
                if (typeof s === 'string' && s.includes(':')) {
                    const [mm, ss] = s.split(':').map(Number);
                    return (mm * 60) + ss;
                }
                return null;
            });
            const lthrVals = runEntries.map(d => d["Lactate Threshold HR"] || null);

            // Render Bike
            new Chart(bCanvas, {
                type: 'line',
                data: {
                    labels: bikeDates,
                    datasets: [
                        { label: 'FTP (w)', data: ftpVals, borderColor: bikeColor, backgroundColor: bikeColor + '20', borderWidth: 2, pointRadius: 2, spanGaps: true, yAxisID: 'y' },
                        { label: 'W/kg', data: wkgVals, borderColor: '#34d399', borderWidth: 1.5, borderDash: [3,3], pointRadius: 2, spanGaps: true, yAxisID: 'y1' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { display: true, ticks: { maxTicksLimit: 6, color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                        y: { position: 'left', grid: { color: '#334155' }, ticks: { color: '#c084fc' }, suggestedMin: 150 },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#34d399' }, suggestedMin: 2.0 }
                    },
                    plugins: { legend: { labels: { color: '#cbd5e1', boxWidth: 10, font: { size: 10 } } } }
                }
            });

            // Render Run
            new Chart(rCanvas, {
                type: 'line',
                data: {
                    labels: runDates,
                    datasets: [
                        { label: 'Pace', data: runVals, borderColor: runColor, backgroundColor: runColor + '20', borderWidth: 2, pointRadius: 2, spanGaps: true, yAxisID: 'y' },
                        { label: 'LTHR', data: lthrVals, borderColor: '#ef4444', borderWidth: 1, borderDash: [3,3], pointRadius: 0, spanGaps: true, yAxisID: 'y1' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { display: true, ticks: { maxTicksLimit: 6, color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                        y: { position: 'left', grid: { color: '#334155' }, ticks: { color: '#f472b6', callback: (val) => formatPaceSeconds(val) }, reverse: true },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#ef4444' }, suggestedMin: 130 }
                    },
                    plugins: { legend: { labels: { color: '#cbd5e1', boxWidth: 10, font: { size: 10 } } } }
                }
            });
        }
    }
}

// --- 5. SUB-COMPONENTS ---

const renderGauge = (wkgNum, percent, cat) => `
    <div class="gauge-wrapper w-full h-full flex items-center justify-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg relative overflow-hidden">
        <svg viewBox="0 0 300 160" class="gauge-svg w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
            <path d="M 30 150 A 120 120 0 0 1 64.1 66.2" fill="none" stroke="#ef4444" stroke-width="24" />
            <path d="M 64.1 66.2 A 120 120 0 0 1 98.3 41.8" fill="none" stroke="#f97316" stroke-width="24" />
            <path d="M 98.3 41.8 A 120 120 0 0 1 182.0 34.4" fill="none" stroke="#22c55e" stroke-width="24" />
            <path d="M 182.0 34.4 A 120 120 0 0 1 249.2 82.6" fill="none" stroke="#3b82f6" stroke-width="24" />
            <path d="M 249.2 82.6 A 120 120 0 0 1 270 150" fill="none" stroke="#a855f7" stroke-width="24" />
            <text x="150" y="130" text-anchor="middle" class="text-5xl font-black fill-white">${(wkgNum || 0).toFixed(2)}</text>
            <text x="150" y="155" text-anchor="middle" font-weight="800" fill="${cat?.color || '#ccc'}" style="font-size: 14px; letter-spacing: 1px;">${(cat?.label || 'UNKNOWN').toUpperCase()}</text>
            <g class="gauge-needle" style="transform-origin: 150px 150px; transform: rotate(${-90 + ((percent || 0) * 180)}deg)">
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
            <span class="text-sm text-slate-400 font-mono mt-2">${(bio.wkg || 0).toFixed(2)} W/kg</span>
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
