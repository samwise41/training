// js/views/readiness/components.js
import { parseDur, formatTime } from './utils.js';

const SPORT_CONFIG = {
    swim: { color: 'text-blue-400', icon: 'fa-person-swimming', label: 'Swim', bar: 'bg-blue-500' },
    bike: { color: 'text-purple-400', icon: 'fa-person-biking', label: 'Bike', bar: 'bg-purple-500' },
    bikeElev: { color: 'text-purple-400', icon: 'fa-mountain', label: 'Bike (Climb)', bar: 'bg-purple-500' },
    run:  { color: 'text-pink-400',  icon: 'fa-person-running',  label: 'Run', bar: 'bg-pink-500' }
};

const parseElev = (str) => {
    if (!str) return 0;
    const cleanStr = str.replace(/,/g, ''); 
    const match = cleanStr.match(/[\d\.]+/);
    return match ? parseFloat(match[0]) : 0;
};

const formatElev = (ft) => {
    return Math.round(ft).toLocaleString() + " ft";
};

export const renderGuide = () => `
    <div class="max-w-5xl mx-auto bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div class="bg-slate-900/80 p-3 border-b border-slate-700 flex items-center gap-2">
            <i class="fa-solid fa-circle-info text-blue-400"></i>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Readiness Guide</span>
        </div>
        <div class="grid grid-cols-3 text-center py-4 px-2">
            <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-red-500 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <span class="text-[10px] font-black text-red-500 uppercase">Warning</span>
                <span class="text-[10px] text-slate-400">&lt; 60%</span>
            </div>
            <div class="flex flex-col items-center border-x border-slate-700">
                <div class="w-3 h-3 rounded-full bg-yellow-500 mb-2 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span class="text-[10px] font-black text-yellow-500 uppercase">Developing</span>
                <span class="text-[10px] text-slate-400">60% - 84%</span>
            </div>
            <div class="flex flex-col items-center">
                <div class="w-3 h-3 rounded-full bg-emerald-500 mb-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span class="text-[10px] font-black text-emerald-500 uppercase">Race Ready</span>
                <span class="text-[10px] text-slate-400">85% - 100%</span>
            </div>
        </div>
        <div class="bg-slate-900/30 p-2 text-center border-t border-slate-700/50">
            <p class="text-[9px] text-slate-500 italic">Score = (Longest Session in 30 Days / Goal) for your <strong>weakest</strong> discipline.</p>
        </div>
    </div>`;

export const renderEventList = (events, stats) => {
    if (events.length === 0) {
        return '<div class="p-8 text-center text-slate-500 text-lg">No upcoming events found in your plan.</div>';
    }

    let html = '';
    const today = new Date();
    today.setHours(0,0,0,0);

    events.forEach(e => {
        const raceDate = new Date(e.dateStr);
        const tgtSwim = parseDur(e.swimGoal);
        const tgtBike = parseDur(e.bikeGoal);
        const tgtRun  = parseDur(e.runGoal);
        const tgtBikeElev = parseElev(e.bikeElevGoal); 

        // Convert stats (meters -> feet if needed, assume raw is feet for now based on typical MD)
        // Adjust if your log uses meters but plan uses feet. For now assuming explicit values.
        const currentBikeElev = stats.maxBikeElev || 0;

        const getPct = (curr, tgt) => tgt > 0 ? Math.min(Math.round((curr/tgt)*100), 100) : 0;
        
        const swimPct = getPct(stats.maxSwim, tgtSwim);
        const bikePct = getPct(stats.maxBike, tgtBike);
        const runPct  = getPct(stats.maxRun, tgtRun);
        const bikeElevPct = getPct(currentBikeElev, tgtBikeElev);

        const activePcts = [];
        if (tgtSwim > 0) activePcts.push(swimPct);
        if (tgtBike > 0) activePcts.push(bikePct);
        if (tgtRun > 0)  activePcts.push(runPct);
        if (tgtBikeElev > 0) activePcts.push(bikeElevPct);
        
        const readinessScore = activePcts.length > 0 ? Math.min(...activePcts) : 0;

        let scoreColor = "text-red-500";
        let scoreLabel = "Warning";
        if (readinessScore >= 85) { scoreColor = "text-emerald-500"; scoreLabel = "Race Ready"; }
        else if (readinessScore >= 60) { scoreColor = "text-yellow-500"; scoreLabel = "Developing"; }

        const daysDiff = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(daysDiff / 7);
        const days = daysDiff % 7;
        const timeString = `${weeks}W ${days}D TO GO`;

        const buildBar = (type, current, target, pct, isElev = false) => {
            if (!target || target === 0) return ''; 
            
            const config = SPORT_CONFIG[type];
            // Use specific bar color if ready, else use config default
            const barColor = pct >= 85 ? 'bg-emerald-500' : (pct >= 60 ? 'bg-yellow-500' : 'bg-red-500');
            
            const displayCurrent = isElev ? formatElev(current) : formatTime(current);
            const displayTarget  = isElev ? formatElev(target) : formatTime(target);

            return `
                <div class="mb-5 last:mb-0">
                    <div class="flex justify-between items-end mb-1">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid ${config.icon} ${config.color}"></i>
                            <span class="text-xs font-bold text-slate-400">${config.label}</span>
                        </div>
                        <div class="text-right">
                             <span class="text-xs font-bold text-white">${displayCurrent} / ${displayTarget}</span>
                        </div>
                    </div>
                    <div class="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden relative">
                        <div class="${barColor} h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.3)]" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        };

        html += `
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-0 mb-8 overflow-hidden shadow-lg relative max-w-5xl mx-auto">
            <div class="bg-slate-900/50 border-b border-slate-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex items-center gap-3">
                    <div class="bg-slate-700 p-2 rounded-lg text-white"><i class="fa-solid fa-flag-checkered"></i></div>
                    <div>
                        <h3 class="text-lg font-bold text-white leading-none">${e.name}</h3>
                        <div class="text-xs text-slate-500 font-mono mt-1">${e.priority} Event</div>
                    </div>
                </div>
                <div class="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <div class="flex items-center gap-2"><i class="fa-regular fa-calendar"></i> ${raceDate.toLocaleDateString()}</div>
                    <div class="w-px h-3 bg-slate-600"></div>
                    <div class="flex items-center gap-2 font-bold text-white"><i class="fa-solid fa-hourglass-half"></i> ${timeString}</div>
                </div>
            </div>
            <div class="p-6 flex flex-col md:flex-row gap-8 items-center">
                <div class="md:w-1/4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-700 pb-6 md:pb-0 md:pr-6 w-full">
                    <div class="text-6xl font-black ${scoreColor} tracking-tighter drop-shadow-sm">${readinessScore}%</div>
                    <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Readiness</div>
                    <div class="text-[10px] font-mono ${scoreColor} mt-1 border border-slate-700/50 px-2 py-0.5 rounded bg-slate-900/30">${scoreLabel}</div>
                </div>
                <div class="md:w-3/4 w-full">
                    ${buildBar('swim', stats.maxSwim, tgtSwim, swimPct)}
                    ${buildBar('bike', stats.maxBike, tgtBike, bikePct)}
                    ${buildBar('bikeElev', currentBikeElev, tgtBikeElev, bikeElevPct, true)}
                    ${buildBar('run', stats.maxRun, tgtRun, runPct)}
                </div>
            </div>
        </div>`;
    });

    return html;
};
