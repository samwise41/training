// js/views/ftp/index.js

// --- DATA FETCHING FOR CHARTS (Keeps Strava Logic) ---

const getColor = (varName) => {
    // Check if we are in a browser environment
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    // Fallback colors if CSS isn't loaded yet
    const defaults = {
        '--color-swim': '#22d3ee',     // Cyan-400
        '--color-bike': '#c084fc',     // Purple-400
        '--color-run': '#f472b6',      // Pink-400
        '--color-strength': '#94a3b8', // Slate-400
        '--color-all': '#34d399'       // Emerald-400 (New for General metrics)
    };
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

// Parser to extract Date and ID from Markdown Links (Run PRs)
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
                    rows.push({ 
                        label: distKey, 
                        dist, 
                        paceAllTime, 
                        pace6Week,
                        atMeta: metaAllTime,
                        swMeta: meta6Week
                    });
                }
            }
        }
    });
    return rows.sort((a,b) => a.dist - b.dist);
};

// --- CHART MATH & RENDERING ---
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
    let xTicks = [];
    if (xType === 'time') {
        const timeMarkers = [
            {v: 1, l: '1s'}, {v: 60, l: '1m'}, {v: 300, l: '5m'}, 
            {v: 1200, l: '20m'}, {v: 3600, l: '1h'}, {v: 14400, l: '4h'}
        ];
        xTicks = timeMarkers.filter(m => m.v >= minX && m.v <= maxX);
    } else {
        const distMarkers = [
            {v: 0.248, l: '400m'}, {v: 1.0, l: '1mi'}, {v: 3.106, l: '5k'}, 
            {v: 6.213, l: '10k'}, {v: 13.109, l: 'Half'}, {v: 26.218, l: 'Full'}
        ];
        xTicks = distMarkers.filter(m => m.v >= minX * 0.9 && m.v <= maxX * 1.1);
    }

    xTicks.forEach(tick => {
        const x = getLogX(tick.v, minX, maxX, width, pad);
        gridHtml += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${height - pad.b}" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" /><text x="${x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#94a3b8">${tick.l}</text>`;
    });

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

    return `<div class="relative w-full h-full group select-none"><svg id="${containerId}-svg" viewBox="0 0 ${width} ${height}" class="w-full h-full cursor-crosshair" preserveAspectRatio="none">${gridHtml}<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#475569" stroke-width="1" /><path d="${path6w}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="5,5" /><path d="${pathAll}" fill="none" stroke="${colorAll}" stroke-width="2" />${pointsHtml}<line id="${containerId}-guide" x1="0" y1="${pad.t}" x2="0" y2="${height - pad.b}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4,4" opacity="0" style="pointer-events: none;" /><circle id="${containerId}-lock-dot" cx="0" cy="${pad.t}" r="3" fill="#ef4444" opacity="0" /><rect x="${pad.l}" y="${pad.t}" width="${width - pad.l - pad.r}" height="${height - pad.t - pad.b}" fill="transparent" /></svg><div id="${containerId}-tooltip" class="absolute hidden bg-slate-900/95 border border-slate-700 rounded shadow-xl p-3 z-50 min-w-[140px]"></div><div class="absolute top-2 right-4 flex gap-3 pointer-events-none"><div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background-color: ${colorAll}"></div><span class="text-[10px] text-slate-300">All Time</span></div><div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full border" style="border-color: ${color6w}"></div><span class="text-[10px] text-slate-300">6 Weeks</span></div></div></div>`;
};

// --- INTERACTION LOGIC (Simplified) ---
const setupChartInteractions = (containerId, data, options) => {
    const svg = document.getElementById(`${containerId}-svg`);
    const guide = document.getElementById(`${containerId}-guide`);
    const lockDot = document.getElementById(`${containerId}-lock-dot`);
    const tooltip = document.getElementById(`${containerId}-tooltip`);
    if (!svg || !guide || !tooltip) return;

    const { width = 800, height = 300, colorAll, color6w, xType } = options;
    const pad = { t: 30, b: 30, l: 50, r: 20 };
    const xValues = data.map(d => d.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const lookup = data.map(d => ({ ...d, px: getLogX(d.x, minX, maxX, width, pad) }));
    let isLocked = false;

    const updateUI = (closest) => {
        guide.setAttribute('x1', closest.px);
        guide.setAttribute('x2', closest.px);
        guide.style.opacity = '1';

        const label = closest.label || (xType === 'time' ? formatDuration(closest.x) : `${closest.x} mi`);
        const valAll = xType === 'distance' ? formatPace(closest.yAll) : `${closest.yAll}w`;
        const val6w = closest.y6w ? (xType === 'distance' ? formatPace(closest.y6w) : `${closest.y6w}w`) : '--';
        
        // Safe access to URLs
        const linkAll = closest.atMeta ? closest.atMeta.url : `https://www.strava.com/activities/${closest.at_id || ''}`;
        const dateAll = closest.atMeta ? closest.atMeta.date : (closest.at_date || '--');
        const link6w = closest.swMeta ? closest.swMeta.url : `https://www.strava.com/activities/${closest.sw_id || ''}`;
        const date6w = closest.swMeta ? closest.swMeta.date : (closest.sw_date || '--');

        tooltip.innerHTML = `
            <div class="flex justify-between items-center border-b border-slate-700 pb-1 mb-2">
                <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider">${label}</span>
                ${isLocked ? '<i class="fa-solid fa-lock text-[10px] text-red-400"></i>' : ''}
            </div>
            <div class="flex flex-col gap-2">
                <div><div class="flex justify-between items-center text-xs mb-0.5"><span style="color: ${colorAll}">All Time</span><span class="font-mono text-white font-bold">${valAll}</span></div><a href="${linkAll}" target="_blank" class="text-[9px] text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"><i class="fa-solid fa-calendar-days"></i> ${dateAll} <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i></a></div>
                <div><div class="flex justify-between items-center text-xs mb-0.5"><span style="color: ${color6w}">6 Week</span><span class="font-mono text-white font-bold">${val6w}</span></div>${closest.y6w ? `<a href="${link6w}" target="_blank" class="text-[9px] text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1"><i class="fa-solid fa-calendar-days"></i> ${date6w} <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i></a>` : '<span class="text-[9px] text-slate-600">No recent record</span>'}</div>
            </div>`;
        tooltip.classList.remove('hidden');
        const tooltipX = (closest.px / width) * 100;
        if (tooltipX > 60) { tooltip.style.left = 'auto'; tooltip.style.right = `${100 - tooltipX + 3}%`; } else { tooltip.style.right = 'auto'; tooltip.style.left = `${tooltipX + 3}%`; }
        tooltip.style.top = '10%';
        if (isLocked) { lockDot.setAttribute('cx', closest.px); lockDot.style.opacity = '1'; } else { lockDot.style.opacity = '0'; }
    };

    svg.addEventListener('mousemove', (e) => { if (isLocked) return; const rect = svg.getBoundingClientRect(); const mouseX = (e.clientX - rect.left) * (width / rect.width); let closest = null, minDist = Infinity; for (const pt of lookup) { const dist = Math.abs(pt.px - mouseX); if (dist < minDist) { minDist = dist; closest = pt; } } if (closest && minDist < 50) updateUI(closest); else { guide.style.opacity = '0'; tooltip.classList.add('hidden'); } });
    svg.addEventListener('click', (e) => { const rect = svg.getBoundingClientRect(); const mouseX = (e.clientX - rect.left) * (width / rect.width); let closest = null, minDist = Infinity; for (const pt of lookup) { const dist = Math.abs(pt.px - mouseX); if (dist < minDist) { minDist = dist; closest = pt; } } if (closest && minDist < 50) { isLocked = !isLocked; updateUI(closest); } else { isLocked = false; guide.style.opacity = '0'; lockDot.style.opacity = '0'; tooltip.classList.add('hidden'); } });
    svg.addEventListener('mouseleave', () => { if (!isLocked) { guide.style.opacity = '0'; tooltip.classList.add('hidden'); } });
};

// --- HELPERS ---
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

// --- MAIN RENDER ---
export function renderFTP(profileData) {
    // 1. USE CLEAN JSON DATA
    const bio = profileData || { 
        weight_lbs: 0, ftp_watts: 0, run_ftp_pace: '--', lthr: '--', five_k_time: '--', 
        wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } 
    };
    
    const style = getComputedStyle(document.documentElement);
    const bikeColor = style.getPropertyValue('--color-bike').trim() || getColor('--color-bike'); 
    const runColor = style.getPropertyValue('--color-run').trim() || getColor('--color-run');   
    
    const gaugeHtml = renderGauge(bio.wkg, bio.gauge_percent, bio.category);
    const cyclingStatsHtml = renderCyclingStats(bio);
    const runningStatsHtml = renderRunningStats(bio);
    
    const cyclingChartId = `cycle-chart-${Date.now()}`;
    const runningChartId = `run-chart-${Date.now()}`;

    // Load Charts Async (Still fetch Strava data directly as logic is separate)
    (async () => {
        const cyclingData = await fetchCyclingData();
        const cEl = document.getElementById(cyclingChartId);
        if (cEl && cyclingData.length) {
            const chartData = cyclingData.map(d => ({
                x: d.seconds,
                yAll: d.all_time_watts,
                at_id: d.at_id, at_date: d.at_date,
                y6w: d.six_week_watts || null,
                sw_id: d.sw_id, sw_date: d.sw_date
            })).filter(d => d.x >= 1);
            const opts = { width: 800, height: 300, xType: 'time', colorAll: bikeColor, color6w: bikeColor, showPoints: false };
            cEl.innerHTML = renderLogChart(cyclingChartId, chartData, opts);
            setupChartInteractions(cyclingChartId, chartData, opts);
        }

        const runningData = await fetchRunningData();
        const rEl = document.getElementById(runningChartId);
        if (rEl && runningData.length) {
            const chartData = runningData.map(d => ({
                x: d.dist,
                yAll: d.paceAllTime,
                atMeta: d.atMeta, 
                y6w: d.pace6Week || null,
                swMeta: d.swMeta,
                label: d.label
            }));
            const opts = { width: 800, height: 300, xType: 'distance', colorAll: runColor, color6w: runColor, showPoints: true };
            rEl.innerHTML = renderLogChart(runningChartId, chartData, opts);
            setupChartInteractions(runningChartId, chartData, opts);
        }
    })();

    return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4 h-64">
                    <div class="col-span-1 h-full">${gaugeHtml}</div>
                    <div class="col-span-1 h-full">${cyclingStatsHtml}</div>
                </div>
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80 flex flex-col">
                    <div class="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-bolt icon-bike"></i>
                        <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">Cycling Power Curve</span>
                    </div>
                    <div id="${cyclingChartId}" class="flex-1 w-full relative min-h-0">
                        <div class="flex items-center justify-center h-full text-slate-500 text-xs italic">Loading...</div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="h-64">
                    ${runningStatsHtml}
                </div>
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80 flex flex-col">
                    <div class="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-stopwatch icon-run"></i>
                        <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">Running Pace vs Distance</span>
                    </div>
                    <div id="${runningChartId}" class="flex-1 w-full relative min-h-0">
                        <div class="flex items-center justify-center h-full text-slate-500 text-xs italic">Loading...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- SUB-COMPONENTS ---
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
                <span class="text-xl font-bold text-white leading-none">${bio.run_ftp_pace}</span>
            </div>
            <div class="flex flex-col border-l border-slate-700 pl-4">
                <span class="text-[10px] text-slate-500 font-bold uppercase mb-1">LTHR</span>
                <span class="text-xl font-bold text-white leading-none">${bio.lthr}</span>
            </div>
            <div class="flex flex-col border-l border-slate-700 pl-4">
                <span class="text-[10px] text-slate-500 font-bold uppercase mb-1">5K Est</span>
                <span class="text-xl font-bold text-white leading-none">${bio.five_k_time}</span>
            </div>
        </div>
    </div>
`;
