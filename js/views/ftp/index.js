// js/views/ftp/index.js

// --- 1. SETUP & UTILS ---

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    const defaults = { '--color-bike': '#c084fc', '--color-run': '#f472b6' };
    return defaults[varName] || '#888888';
};

// --- 2. HTML RENDERER ---
export function renderFTP(profileData) {
    const bio = profileData || { weight_lbs: 0, ftp_watts: 0, wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } };
    
    // Create unique IDs
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

// --- 3. CHART INITIALIZATION (FIXED) ---
export async function initCharts() {
    const { bikeHist, runHist } = window.ftpChartIds || {};
    const bCanvas = document.getElementById(bikeHist);
    const rCanvas = document.getElementById(runHist);

    if (!bCanvas || !rCanvas) return;

    try {
        const url = 'https://raw.githubusercontent.com/samwise41/training/main/garmin_data/garmin_health.json';
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fetch failed");
        
        const rawData = await res.json();
        
        // Sort Data Chronologically
        const sorted = rawData.sort((a,b) => new Date(a.calendarDate) - new Date(b.calendarDate));

        // --- PREPARE BIKE DATA ---
        // We must separate Labels (Dates) and Data (Values) arrays for Chart.js to work without an adapter
        const bikeEntries = sorted.filter(d => (d.ftp && d.ftp > 0) || (d.cyclingFtp && d.cyclingFtp > 0));
        
        const bikeLabels = bikeEntries.map(d => d.calendarDate.substring(5)); // Remove Year for shorter label "10-14"
        const bikeValues = bikeEntries.map(d => d.ftp || d.cyclingFtp);

        // --- PREPARE RUN DATA ---
        // Filter entries that have EITHER run power OR LTHR
        const runEntries = sorted.filter(d => (d.runningFtp > 0) || (d.thresholdPower > 0) || (d.lactateThresholdHeartRate > 0));
        
        const runLabels = runEntries.map(d => d.calendarDate.substring(5));
        const runFtpValues = runEntries.map(d => d.runningFtp || d.thresholdPower || null); // Use null to span gaps
        const lthrValues = runEntries.map(d => d.lactateThresholdHeartRate || d.lthr || null);

        // Colors
        const bikeColor = getColor('--color-bike');
        const runColor = getColor('--color-run');

        // --- RENDER CYCLING CHART ---
        if (bikeValues.length > 0) {
            new Chart(bCanvas, {
                type: 'line',
                data: {
                    labels: bikeLabels, // Explicit Labels Array
                    datasets: [{
                        label: 'FTP (w)',
                        data: bikeValues, // Explicit Data Array
                        borderColor: bikeColor,
                        backgroundColor: bikeColor + '20',
                        tension: 0.2,
                        borderWidth: 2,
                        pointRadius: 3,
                        spanGaps: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            display: true, // SHOW X AXIS
                            ticks: { maxTicksLimit: 6, color: '#64748b', font: { size: 10 } },
                            grid: { display: false }
                        },
                        y: { 
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' },
                            suggestedMin: 150 // Start scale at 150w so line isn't flat
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        } else {
            // Mock Data for Visual Confirmation if real data is empty
            renderMockChart(bCanvas, bikeColor, 'No Bike Data'); 
        }

        // --- RENDER RUNNING CHART ---
        if (runFtpValues.length > 0 || lthrValues.length > 0) {
            new Chart(rCanvas, {
                type: 'line',
                data: {
                    labels: runLabels,
                    datasets: [
                        {
                            label: 'Run FTP (w)',
                            data: runFtpValues,
                            borderColor: runColor,
                            backgroundColor: runColor + '20',
                            tension: 0.2,
                            borderWidth: 2,
                            pointRadius: 3,
                            spanGaps: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'LTHR (bpm)',
                            data: lthrValues,
                            borderColor: '#ef4444', 
                            borderDash: [4, 4],
                            tension: 0.2,
                            borderWidth: 1.5,
                            pointRadius: 2,
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
                        x: { 
                            display: true, 
                            ticks: { maxTicksLimit: 6, color: '#64748b', font: { size: 10 } },
                            grid: { display: false }
                        },
                        y: {
                            type: 'linear', display: true, position: 'left',
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' },
                            suggestedMin: 200 // Run Power usually higher
                        },
                        y1: {
                            type: 'linear', display: true, position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#ef4444' },
                            suggestedMin: 130 // HR usually 130+
                        }
                    },
                    plugins: { legend: { labels: { color: '#cbd5e1', font: { size: 10 } } } }
                }
            });
        } else {
            renderMockChart(rCanvas, runColor, 'No Run Data');
        }

    } catch (e) {
        console.error("FTP Chart Error:", e);
    }
}

// Fallback to show something if data fetch fails
function renderMockChart(canvas, color, label) {
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: label,
                data: [200, 210, 205, 220, 225],
                borderColor: color,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
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
