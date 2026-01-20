// --- CONFIGURATION ---
const CONFIG = {
    WKG_SCALE: { min: 1.0, max: 6.0 },
    CATEGORIES: [
        { threshold: 5.05, label: "Exceptional", color: "#a855f7" },
        { threshold: 3.93, label: "Very Good",   color: "#3b82f6" },
        { threshold: 2.79, label: "Good",        color: "#22c55e" },
        { threshold: 2.23, label: "Fair",        color: "#f97316" },
        { threshold: 0.00, label: "Untrained",   color: "#ef4444" }
    ]
};

// --- INTERNAL PARSING LOGIC (Moved from parser.js) ---

/**
 * Extracts a specific section from Markdown text based on a header title.
 */
const getSection = (md, title) => {
    if (!md) return "";
    const lines = md.split('\n');
    let capturing = false, section = [];
    for (let line of lines) {
        const trimmed = line.trim();
        const isHeader = trimmed.startsWith('#');
        if (isHeader) {
            if (trimmed.toLowerCase().includes(title.toLowerCase())) {
                capturing = true;
                continue;
            }
            if (capturing && !trimmed.startsWith('###')) {
                break;
            }
        }
        if (capturing) section.push(line);
    }
    return section.join('\n').trim();
};

/**
 * Parses biometrics (FTP, Weight, Pace) from the provided Markdown.
 */
const extractBiometrics = (md) => {
    const profileSection = getSection(md, "Profile") || getSection(md, "Biometrics");
    
    const ftp = profileSection.match(/Cycling FTP[^0-9]*(\d{1,3})/i);
    const weight = profileSection.match(/Weight[^0-9]*(\d{1,3})/i);
    const lthr = profileSection.match(/Lactate Threshold HR[^0-9]*(\d{2,3})/i);
    const runFtp = profileSection.match(/Functional Threshold Pace.*?(\d{1,2}:\d{2})/i);
    const fiveK = profileSection.match(/5K Prediction.*?(\d{1,2}:\d{2})/i);

    const watts = ftp ? parseInt(ftp[1]) : 0;
    const weightLbs = weight ? parseInt(weight[1]) : 0;
    const weightKg = weightLbs * 0.453592;
    const wkgNum = weightKg > 0 ? (watts / weightKg) : 0;
    
    const cat = CONFIG.CATEGORIES.find(c => wkgNum >= c.threshold) || CONFIG.CATEGORIES[CONFIG.CATEGORIES.length - 1];
    const percent = Math.min(Math.max((wkgNum - CONFIG.WKG_SCALE.min) / (CONFIG.WKG_SCALE.max - CONFIG.WKG_SCALE.min), 0), 1);

    return { 
        watts, 
        weight: weightLbs, 
        lthr: lthr ? lthr[1] : "--", 
        runFtp: runFtp ? runFtp[1] : "--", 
        fiveK: fiveK ? fiveK[1] : "--",
        wkgNum, 
        cat, 
        percent 
    };
};

// --- DATA FETCHING ---
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
                const paceAllTime = timeAllTime ? (timeAllTime / 60) / dist : null;

                if (paceAllTime) {
                    rows.push({ 
                        label: distKey, 
                        dist, 
                        paceAllTime, 
                        pace6Week: parseTime(cols[4]) ? (parseTime(cols[4]) / 60) / dist : null,
                        atMeta: extractLink(cols[3]),
                        swMeta: extractLink(cols[5])
                    });
                }
            }
        }
    });
    return rows.sort((a,b) => a.dist - b.dist);
};

// --- CHART MATH & RENDERING (Kept from original) ---

const getLogX = (val, min, max, width, pad) => {
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logVal = Math.log(val);
    const pct = (logVal - logMin) / (logMax - logMin);
    return pad.l + pct * (width - pad.l - pad.r);
};

const getLinY = (val, min, max, height, pad) => {
    const pct = (val - min) / (max - min);
    return height - pad.b - (pct * (height - pad.t - pad.b));
};

const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}m`;
    return `${Math.floor(seconds/3600)}h`;
};

const formatPace = (val) => {
    if(!val) return '--';
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
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
    let xTicks = (xType === 'time') 
        ? [{v: 1, l: '1s'}, {v: 60, l: '1m'}, {v: 300, l: '5m'}, {v: 1200, l: '20m'}, {v: 3600, l: '1h'}, {v: 14400, l: '4h'}].filter(m => m.v >= minX && m.v <= maxX)
        : [{v: 0.248, l: '400m'}, {v: 1.0, l: '1mi'}, {v: 3.106, l: '5k'}, {v: 6.213, l: '10k'}, {v: 13.109, l: 'Half'}, {v: 26.218, l: 'Full'}].filter(m => m.v >= minX * 0.9 && m.v <= maxX * 1.1);

    xTicks.forEach(tick => {
        const x = getLogX(tick.v, minX, maxX, width, pad);
        gridHtml += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${height - pad.b}" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" />
                     <text x="${x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#94a3b8">${tick.l}</text>`;
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

    const pointsHtml = showPoints ? data.map(pt => {
        const x = getLogX(pt.x, minX, maxX, width, pad);
        let pts = '';
        if (pt.y6w !== null) pts += `<circle cx="${x}" cy="${getLinY(pt.y6w, minY, maxY, height, pad)}" r="3" fill="#0f172a" stroke="${color6w}" stroke-width="2" />`;
        if (pt.yAll !== null) pts += `<circle cx="${x}" cy="${getLinY(pt.yAll, minY, maxY, height, pad)}" r="3" fill="#0f172a" stroke="${colorAll}" stroke-width="2" />`;
        return pts;
    }).join('') : '';

    return `
        <div class="relative w-full h-full select-none">
            <svg id="${containerId}-svg" viewBox="0 0 ${width} ${height}" class="w-full h-full cursor-crosshair" preserveAspectRatio="none">
                ${gridHtml}
                <path d="${genPath('y6w')}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="5,5" />
                <path d="${genPath('yAll')}" fill="none" stroke="${colorAll}" stroke-width="2" />
                ${pointsHtml}
                <line id="${containerId}-guide" x1="0" y1="${pad.t}" x2="0" y2="${height - pad.b}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4,4" opacity="0" style="pointer-events: none;" />
                <rect x="${pad.l}" y="${pad.t}" width="${width - pad.l - pad.r}" height="${height - pad.t - pad.b}" fill="transparent" />
            </svg>
            <div id="${containerId}-tooltip" class="absolute hidden bg-slate-900/95 border border-slate-700 rounded shadow-xl p-3 z-50 min-w-[140px]"></div>
        </div>
    `;
};

// --- MAIN RENDER EXPORT ---
export function renderFTP(planMd) {
    // 1. Process biometrics using internal function
    const bio = extractBiometrics(planMd);
    
    const style = getComputedStyle(document.documentElement);
    const bikeColor = style.getPropertyValue('--color-bike').trim() || '#8b5cf6';
    const runColor = style.getPropertyValue('--color-run').trim() || '#ec4899';
    
    const cyclingChartId = `cycle-chart-${Date.now()}`;
    const runningChartId = `run-chart-${Date.now()}`;

    // Load Charts Async
    (async () => {
        const cyclingData = await fetchCyclingData();
        const cEl = document.getElementById(cyclingChartId);
        if (cEl && cyclingData.length) {
            const chartData = cyclingData.map(d => ({
                x: d.seconds, yAll: d.all_time_watts, y6w: d.six_week_watts || null,
                at_id: d.at_id, at_date: d.at_date, sw_id: d.sw_id, sw_date: d.sw_date
            })).filter(d => d.x >= 1);
            cEl.innerHTML = renderLogChart(cyclingChartId, chartData, { width: 800, height: 300, xType: 'time', colorAll: bikeColor, color6w: bikeColor, showPoints: false });
        }

        const runningData = await fetchRunningData();
        const rEl = document.getElementById(runningChartId);
        if (rEl && runningData.length) {
            const chartData = runningData.map(d => ({ x: d.dist, yAll: d.paceAllTime, y6w: d.pace6Week || null, atMeta: d.atMeta, swMeta: d.swMeta, label: d.label }));
            rEl.innerHTML = renderLogChart(runningChartId, chartData, { width: 800, height: 300, xType: 'distance', colorAll: runColor, color6w: runColor, showPoints: true });
        }
    })();

    return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4 h-64">
                    ${renderGauge(bio.wkgNum, bio.percent, bio.cat)}
                    <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl text-center shadow-lg flex flex-col justify-center h-full">
                        <span class="text-sm font-bold text-slate-500 uppercase tracking-widest">Cycling FTP</span>
                        <span class="text-5xl font-black text-white">${bio.watts > 0 ? bio.watts + ' W' : '--'}</span>
                        <span class="text-sm text-slate-400 font-mono mt-2">${bio.wkgNum.toFixed(2)} W/kg</span>
                    </div>
                </div>
                <div id="${cyclingChartId}" class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80"></div>
            </div>
            <div class="flex flex-col gap-6">
                <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl text-center shadow-lg h-64 flex flex-col justify-center">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Running Profile</span>
                    <div class="grid grid-cols-3 gap-4">
                        <div><span class="text-[10px] text-slate-500 font-bold uppercase">Pace (FTP)</span><br><span class="text-xl font-bold text-white">${bio.runFtp}</span></div>
                        <div class="border-l border-slate-700"><span class="text-[10px] text-slate-500 font-bold uppercase">LTHR</span><br><span class="text-xl font-bold text-white">${bio.lthr}</span></div>
                        <div class="border-l border-slate-700"><span class="text-[10px] text-slate-500 font-bold uppercase">5K Est</span><br><span class="text-xl font-bold text-white">${bio.fiveK}</span></div>
                    </div>
                </div>
                <div id="${runningChartId}" class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80"></div>
            </div>
        </div>
    `;
}

const renderGauge = (wkgNum, percent, cat) => `
    <div class="gauge-wrapper w-full h-full flex items-center justify-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg relative overflow-hidden">
        <svg viewBox="0 0 300 160" class="gauge-svg w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
            <path d="M 30 150 A 120 120 0 0 1 64.1 66.2" fill="none" stroke="#ef4444" stroke-width="24" />
            <path d="M 64.1 66.2 A 120 120 0 0 1 98.3 41.8" fill="none" stroke="#f97316" stroke-width="24" />
            <path d="M 98.3 41.8 A 120 120 0 0 1 182.0 34.4" fill="none" stroke="#22c55e" stroke-width="24" />
            <path d="M 182.0 34.4 A 120 120 0 0 1 249.2 82.6" fill="none" stroke="#3b82f6" stroke-width="24" />
            <path d="M 249.2 82.6 A 120 120 0 0 1 270 150" fill="none" stroke="#a855f7" stroke-width="24" />
            <text x="150" y="130" text-anchor="middle" class="text-5xl font-black fill-white">${wkgNum.toFixed(2)}</text>
            <text x="150" y="155" text-anchor="middle" font-weight="800" fill="${cat.color}" style="font-size: 14px;">${cat.label.toUpperCase()}</text>
            <g style="transform-origin: 150px 150px; transform: rotate(${-90 + (percent * 180)}deg)"><path d="M 147 150 L 150 40 L 153 150 Z" fill="white" /><circle cx="150" cy="150" r="6" fill="white" /></g>
        </svg>
    </div>
`;
