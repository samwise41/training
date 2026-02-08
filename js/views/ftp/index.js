// js/views/ftp/index.js

// --- 1. SETUP & UTILS ---

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    const defaults = { '--color-bike': '#c084fc', '--color-run': '#f472b6' };
    return defaults[varName] || '#888888';
};

// --- 2. HTML RENDERER (Skeleton Only) ---
export function renderFTP(profileData) {
    const bio = profileData || { weight_lbs: 0, ftp_watts: 0, wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } };
    
    // Unique IDs for this render cycle
    const ts = Date.now();
    window.ftpChartIds = {
        bikeHist: `bike-hist-${ts}`,
        runHist: `run-hist-${ts}`
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
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Cycling FTP History</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0">
                        <canvas id="${window.ftpChartIds.bikeHist}"></canvas>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="h-64">${runningStatsHtml}</div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-80 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Run FTP & LTHR</span>
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

// --- 3. CHART INITIALIZATION (Called by App.js) ---
export async function initCharts() {
    console.log("📊 Init FTP Charts...");
    
    // Get IDs from the render step
    const { bikeHist, runHist } = window.ftpChartIds || {};
    const bCanvas = document.getElementById(bikeHist);
    const rCanvas = document.getElementById(runHist);

    if (!bCanvas || !rCanvas) {
        console.warn("❌ Canvas elements not found. DOM might not be ready.");
        return;
    }

    try {
        // Fetch Data
        const url = 'https://raw.githubusercontent.com/samwise41/training/main/garmin_data/garmin_health.json';
        console.log("Fetching:", url);
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const rawData = await res.json();
        console.log(`✅ Loaded ${rawData.length} records`);

        // Sort Chronologically
        const sorted = rawData.sort((a,b) => new Date(a.calendarDate) - new Date(b.calendarDate));

        // Process Data Arrays
        const labels = [];
        const bikeData = [];
        const runData = [];
        const hrData = [];

        sorted.forEach(d => {
            const dateStr = d.calendarDate || d.date;
            if(!dateStr) return;

            // Check for valid data in this entry
            const bikeVal = d.ftp || d.cyclingFtp || d.cycling_ftp;
            const runVal = d.runningFtp || d.running_ftp || d.thresholdPower;
            const hrVal = d.lactateThresholdHeartRate || d.lthr;

            // Only add point if at least one metric exists (prevents empty dates clogging chart)
            if (bikeVal || runVal || hrVal) {
                labels.push(dateStr); // X-Axis Label
                
                // Add data (or null to span gaps)
                bikeData.push(bikeVal || null);
                runData.push(runVal || null);
                hrData.push(hrVal || null);
            }
        });

        // Colors
        const bikeColor = getColor('--color-bike');
        const runColor = getColor('--color-run');

        // --- RENDER CYCLING CHART ---
        new Chart(bCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cycling FTP (w)',
                    data: bikeData,
                    borderColor: bikeColor,
                    backgroundColor: bikeColor + '20',
                    tension: 0.2,
                    borderWidth: 2,
                    pointRadius: 2,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { display: false }, // Clean look
                    y: { 
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index', intersect: false,
                        backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1
                    }
                }
            }
        });

        // --- RENDER RUNNING CHART (Dual Axis) ---
        new Chart(rCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Run FTP (w)',
                        data: runData,
                        borderColor: runColor,
                        backgroundColor: runColor + '20',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 2,
                        spanGaps: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'LTHR (bpm)',
                        data: hrData,
                        borderColor: '#ef4444', // Red
                        borderDash: [4, 4],
                        tension: 0.2,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        spanGaps: true,
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
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        grid: { drawOnChartArea: false }, // Don't clutter grid
                        ticks: { color: '#ef4444' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e1', font: { size: 10 } } },
                    tooltip: {
                        backgroundColor: '#1e293b', borderColor: '#475569', borderWidth: 1
                    }
                }
            }
        });

    } catch (e) {
        console.error("FTP Chart Error:", e);
        if(bCanvas) bCanvas.parentNode.innerHTML = `<div class="text-red-500 text-xs p-4">Error loading data: ${e.message}</div>`;
        if(rCanvas) rCanvas.parentNode.innerHTML = `<div class="text-red-500 text-xs p-4">Error loading data</div>`;
    }
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
