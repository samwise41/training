export const FTPTemplates = {
    layout(ids, components) {
        return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-2 gap-4 h-64">
                    <div class="col-span-1 h-full">${components.gauge}</div>
                    <div class="col-span-1 h-full">${components.bikeStats}</div>
                </div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-bolt text-lg" style="color: var(--color-bike)"></i>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Power Curve (Strava)</span>
                    </div>
                    <div id="${ids.cycleCurve}" class="flex-1 w-full relative min-h-0 flex items-center justify-center text-xs text-slate-500 italic">Loading...</div>
                </div>

                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Cycling FTP & W/kg</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0"><canvas id="${ids.bikeHist}"></canvas></div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <div class="h-64">${components.runStats}</div>
                
                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        <i class="fa-solid fa-stopwatch text-lg" style="color: var(--color-run)"></i>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Pace Curve (Strava)</span>
                    </div>
                    <div id="${ids.runCurve}" class="flex-1 w-full relative min-h-0 flex items-center justify-center text-xs text-slate-500 italic">Loading...</div>
                </div>

                <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 h-64 flex flex-col">
                    <div class="flex items-center justify-between mb-2 border-b border-slate-700 pb-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Run FTP Pace & LTHR</span>
                        <span class="text-[9px] text-slate-600 font-mono">Garmin</span>
                    </div>
                    <div class="relative w-full flex-1 min-h-0"><canvas id="${ids.runHist}"></canvas></div>
                </div>
            </div>
        </div>
        
        <div class="pb-20 mt-2">
            ${components.calculator}
        </div>`;
    },

    wkgCalculator() {
        return `
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg lg:col-span-2">
            <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                <i class="fa-solid fa-calculator text-lg text-blue-400"></i>
                <span class="text-sm font-bold text-slate-400 uppercase tracking-widest">W/kg Scenario Calculator</span>
            </div>
            <p class="text-xs text-slate-500 mb-6 italic">Enter exactly 2 values to calculate the 3rd and generate a variance table.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="relative">
                    <div class="flex justify-between items-end mb-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase">Weight (lbs)</label>
                        <span id="calc-weight-kg" class="text-[10px] font-mono font-bold text-blue-400/80"></span>
                    </div>
                    <input type="number" id="calc-weight" step="0.1" class="calc-input w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xl font-mono transition-colors placeholder-slate-600" placeholder="e.g. 175">
                </div>
                <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target W/kg</label>
                    <input type="number" id="calc-wkg" step="0.01" class="calc-input w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xl font-mono transition-colors placeholder-slate-600" placeholder="e.g. 4.0">
                </div>
                <div class="relative">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">FTP (Watts)</label>
                    <input type="number" id="calc-ftp" step="1" class="calc-input w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xl font-mono transition-colors placeholder-slate-600" placeholder="e.g. 300">
                </div>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6 items-stretch min-h-[160px]">
                <div id="calc-result-box" class="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center transition-all duration-300">
                    <span class="text-slate-500 text-sm italic">Awaiting Inputs...</span>
                </div>
                
                <div id="calc-table-container" class="flex-1 overflow-y-auto max-h-48 rounded-lg border border-slate-700 hidden custom-scrollbar bg-slate-900/30">
                </div>
            </div>
        </div>`;
    },

    gauge(wkg, pct, cat) {
        return `<div class="gauge-wrapper w-full h-full flex items-center justify-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg relative overflow-hidden">
            <svg viewBox="0 0 300 160" class="gauge-svg w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
                <path d="M 30 150 A 120 120 0 0 1 64.1 66.2" fill="none" stroke="#ef4444" stroke-width="24" />
                <path d="M 64.1 66.2 A 120 120 0 0 1 98.3 41.8" fill="none" stroke="#f97316" stroke-width="24" />
                <path d="M 98.3 41.8 A 120 120 0 0 1 182.0 34.4" fill="none" stroke="#22c55e" stroke-width="24" />
                <path d="M 182.0 34.4 A 120 120 0 0 1 249.2 82.6" fill="none" stroke="#3b82f6" stroke-width="24" />
                <path d="M 249.2 82.6 A 120 120 0 0 1 270 150" fill="none" stroke="#a855f7" stroke-width="24" />
                <text x="150" y="130" text-anchor="middle" class="text-5xl font-black fill-white">${wkg.toFixed(2)}</text>
                <text x="150" y="155" text-anchor="middle" font-weight="800" fill="${cat?.color||'#ccc'}" style="font-size: 14px;">${(cat?.label||'').toUpperCase()}</text>
                <g style="transform-origin: 150px 150px; transform: rotate(${-90 + (pct * 180)}deg)">
                    <path d="M 147 150 L 150 40 L 153 150 Z" fill="white" />
                    <circle cx="150" cy="150" r="6" fill="white" />
                </g>
            </svg>
        </div>`;
    },

    cyclingStats(bio) {
        return `<div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl text-center shadow-lg flex flex-col justify-center h-full">
            <div class="flex items-center justify-center gap-2 mb-2">
                <i class="fa-solid fa-bicycle text-2xl" style="color: var(--color-bike)"></i>
                <span class="text-sm font-bold text-slate-500 uppercase tracking-widest">Cycling FTP</span>
            </div>
            <div class="flex flex-col mt-2">
                <span class="text-5xl font-black text-white">${bio.ftp_watts > 0 ? bio.ftp_watts : '--'}</span>
                <span class="text-sm text-slate-400 font-mono mt-2">${(bio.wkg || 0).toFixed(2)} W/kg</span>
            </div>
        </div>`;
    },

    runningStats(bio) {
        return `<div class="bg-slate-800/50 border border-slate-700 p-6 rounded-xl text-center shadow-lg h-full flex flex-col justify-center">
            <div class="flex items-center justify-center gap-2 mb-6">
                <i class="fa-solid fa-person-running text-xl" style="color: var(--color-run)"></i>
                <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Running Profile</span>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-500 font-bold uppercase mb-1">Pace</span>
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
        </div>`;
    }
};
