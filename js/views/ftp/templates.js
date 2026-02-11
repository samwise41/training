// js/views/ftp/templates.js

export const FTPTemplates = {
    layout(ids, components) {
        return `
        <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
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
