import { Formatters } from '../../utils/formatting.js'; 
import { DataManager } from '../../utils/data.js';

export function renderTopCards() {
    const containerId = 'top-cards-container';
    const parseElev = (str) => {
        if (!str) return 0;
        const cleanStr = str.toString().replace(/,/g, ''); 
        const match = cleanStr.match(/[\d\.]+/);
        return match ? parseFloat(match[0]) : 0;
    };

    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;
        try {
            const [data, readinessData] = await Promise.all([
                DataManager.fetchJSON('topCards'),
                DataManager.fetchJSON('readiness')
            ]);
            if (!data) throw new Error("Top cards data not found");
            
            let readinessHtml = '';
            if (readinessData && readinessData.upcomingEvents) {
                let targetName = data.next_event_name;
                if (!targetName && data.next_event) targetName = data.next_event.replace(/\s\([ABC] Race\)$/, '');
                const targetEvent = readinessData.upcomingEvents.find(e => e.name === targetName) || readinessData.upcomingEvents[0]; 

                if (targetEvent) {
                    const stats = readinessData.trainingStats || {};
                    const metrics = [
                        { name: 'Swim', current: stats.maxSwim || 0, target: Formatters.parseDuration(targetEvent.swimGoal), icon: 'fa-person-swimming', cssClass: 'icon-swim' },
                        { name: 'Bike', current: stats.maxBike || 0, target: Formatters.parseDuration(targetEvent.bikeGoal), icon: 'fa-person-biking', cssClass: 'icon-bike' },
                        { name: 'Run', current: stats.maxRun || 0, target: Formatters.parseDuration(targetEvent.runGoal), icon: 'fa-person-running', cssClass: 'icon-run' },
                        { name: 'Climb', current: stats.maxBikeElev || 0, target: parseElev(targetEvent.bikeElevGoal), icon: 'fa-mountain', cssClass: 'icon-bike' } 
                    ];
                    
                    let lowestMetric = null, lowestPct = 999;
                    metrics.forEach(m => {
                        if (m.target > 0) {
                            const pct = Math.min(Math.round((m.current / m.target) * 100), 100);
                            if (pct < lowestPct) { lowestPct = pct; lowestMetric = m; }
                        }
                    });

                    if (lowestMetric) {
                        let colorClass = "text-emerald-400", label = "Race Ready";
                        if (lowestPct < 60) { colorClass = "text-red-500"; label = "Warning"; } else if (lowestPct < 85) { colorClass = "text-yellow-500"; label = "Developing"; }

                        readinessHtml = `
                            <div class="flex flex-col items-end text-right mr-8">
                                <div class="text-3xl font-black ${colorClass} tracking-tighter leading-none">${lowestPct}%</div>
                                <div class="text-[10px] font-bold ${colorClass} uppercase leading-tight mt-1">${label}</div>
                                <div class="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5 justify-end">
                                    <span class="text-slate-600">Weakness:</span> 
                                    <span class="flex items-center gap-1 ${lowestMetric.cssClass}"><i class="fa-solid ${lowestMetric.icon}"></i><span>${lowestMetric.name}</span></span>
                                </div>
                            </div>`;
                    }
                }
            }

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Training Status</span>
                        <div class="flex items-start gap-3"><i class="fa-solid fa-layer-group text-2xl text-blue-400 mt-1"></i><div class="flex flex-col"><span class="text-xl font-bold text-white leading-tight">${data.phase}</span><span class="text-sm font-medium text-slate-400 mt-0.5">${data.block}</span></div></div>
                    </div>
                    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Next Priority Event</span>
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-3 overflow-hidden"><div class="shrink-0"><i class="fa-solid fa-flag-checkered text-2xl text-emerald-400"></i></div><div class="flex flex-col min-w-0"><span class="text-xl font-bold text-white leading-tight truncate pr-2" title="${data.next_event}">${data.next_event}</span><span class="text-xs text-slate-400 font-mono mt-0.5">${data.days_to_go} days to go</span></div></div>
                            <div class="shrink-0">${readinessHtml}</div>
                        </div>
                    </div>
                </div>`;
        } catch (err) {
            console.error("Top Cards Error:", err);
            container.innerHTML = `<p class="text-slate-500 italic p-4 text-center">Event data temporarily unavailable.</p>`;
        }
    }, 50);

    return `<div id="${containerId}" class="min-h-[100px] bg-slate-800 rounded-xl mb-6"></div>`;
}
