export function renderTopCards() {
    const containerId = 'top-cards-container';

    // --- Helpers ---
    const parseDur = (str) => {
        if (!str || str === '-' || str.toLowerCase() === 'n/a') return 0;
        if (typeof str === 'number') return str;
        let mins = 0;
        const clean = str.toString().toLowerCase().trim();
        if (clean.includes('h')) {
            const parts = clean.split('h');
            mins += parseInt(parts[0]) * 60;
            if (parts[1] && parts[1].includes('m')) mins += parseInt(parts[1]);
        } else if (clean.includes('m')) {
            mins += parseInt(clean);
        } else if (clean.includes(':')) {
            const parts = clean.split(':');
            mins += parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        }
        return Math.round(mins);
    };

    const parseElev = (str) => {
        if (!str) return 0;
        const cleanStr = str.toString().replace(/,/g, ''); 
        const match = cleanStr.match(/[\d\.]+/);
        return match ? parseFloat(match[0]) : 0;
    };

    // Sport Color Mapping
    const getSportColor = (name) => {
        const n = name.toLowerCase();
        if (n.includes('swim')) return 'text-sky-400';
        if (n.includes('bike') || n.includes('cycling')) return 'text-orange-400';
        if (n.includes('run')) return 'text-teal-400';
        if (n.includes('climb')) return 'text-fuchsia-400';
        return 'text-slate-400';
    };

    // --- Main Render Logic ---
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const [cardsRes, readinessRes] = await Promise.all([
                fetch('data/dashboard/top_cards.json'),
                fetch('data/readiness/readiness.json')
            ]);

            if (!cardsRes.ok) throw new Error("Top cards data not found");
            
            const data = await cardsRes.json();
            const readinessData = readinessRes.ok ? await readinessRes.json() : null;

            let readinessHtml = '';
            
            // --- Calculate Readiness ---
            if (readinessData && readinessData.upcomingEvents) {
                const targetEvent = readinessData.upcomingEvents.find(e => e.name === data.next_event) 
                                    || readinessData.upcomingEvents[0]; 

                if (targetEvent) {
                    const stats = readinessData.trainingStats || {};
                    
                    const metrics = [
                        { name: 'Swim',       current: stats.maxSwim || 0,     target: parseDur(targetEvent.swimGoal), icon: 'fa-person-swimming' },
                        { name: 'Bike',       current: stats.maxBike || 0,     target: parseDur(targetEvent.bikeGoal), icon: 'fa-person-biking' },
                        { name: 'Run',        current: stats.maxRun || 0,      target: parseDur(targetEvent.runGoal),  icon: 'fa-person-running' },
                        { name: 'Climb',      current: stats.maxBikeElev || 0, target: parseElev(targetEvent.bikeElevGoal), icon: 'fa-mountain' }
                    ];

                    let lowestMetric = null;
                    let lowestPct = 999;

                    metrics.forEach(m => {
                        if (m.target > 0) {
                            const pct = Math.min(Math.round((m.current / m.target) * 100), 100);
                            if (pct < lowestPct) {
                                lowestPct = pct;
                                lowestMetric = m;
                            }
                        }
                    });

                    if (lowestMetric) {
                        let colorClass = "text-emerald-400";
                        let label = "Race Ready";

                        if (lowestPct < 60) {
                            colorClass = "text-red-500";
                            label = "Warning";
                        } else if (lowestPct < 85) {
                            colorClass = "text-yellow-500";
                            label = "Developing";
                        }

                        const sportColor = getSportColor(lowestMetric.name);

                        // Right-aligned readiness block with added margin-right (mr-4) to scoot left
                        readinessHtml = `
                            <div class="flex flex-col items-end text-right mr-6">
                                <div class="text-3xl font-black ${colorClass} tracking-tighter leading-none">${lowestPct}%</div>
                                <div class="text-[10px] font-bold ${colorClass} uppercase leading-tight mt-1">${label}</div>
                                <div class="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5 justify-end">
                                    <span class="text-slate-600">Weakness:</span> 
                                    <span class="flex items-center gap-1 ${sportColor}">
                                        <i class="fa-solid ${lowestMetric.icon}"></i>
                                        <span>${lowestMetric.name}</span>
                                    </span>
                                </div>
                            </div>
                        `;
                    }
                }
            }

            // --- Render HTML ---
            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Training Status</span>
                        <div class="flex items-start gap-3">
                            <i class="fa-solid fa-layer-group text-2xl text-blue-400 mt-1"></i>
                            <div class="flex flex-col">
                                <span class="text-xl font-bold text-white leading-tight">${data.phase}</span>
                                <span class="text-sm font-medium text-slate-400 mt-0.5">${data.block}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-sm relative overflow-hidden">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Next Priority Event</span>
                        
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-3 overflow-hidden">
                                <div class="shrink-0">
                                    <i class="fa-solid fa-flag-checkered text-2xl text-emerald-400"></i>
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-xl font-bold text-white leading-tight truncate pr-2" title="${data.next_event}">${data.next_event}</span>
                                    <span class="text-xs text-slate-400 font-mono mt-0.5">${data.days_to_go} days to go</span>
                                </div>
                            </div>

                            <div class="shrink-0">
                                ${readinessHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Top Cards Error:", err);
            container.innerHTML = `<p class="text-slate-500 italic p-4 text-center">Event data temporarily unavailable.</p>`;
        }
    }, 50);

    return `<div id="${containerId}" class="min-h-[100px] bg-slate-800 rounded-xl mb-6"></div>`;
}
