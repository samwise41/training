export function renderTopCards() {
    const containerId = 'top-cards-container';

    // Helper: Parse Duration Strings (e.g. "1h 30m", "45m")
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

    // Helper: Parse Elevation Strings (e.g. "5,000 ft")
    const parseElev = (str) => {
        if (!str) return 0;
        const cleanStr = str.toString().replace(/,/g, ''); 
        const match = cleanStr.match(/[\d\.]+/);
        return match ? parseFloat(match[0]) : 0;
    };

    // Initiate the fetch
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Fetch both Top Cards (summary) and Readiness (logic/stats)
            const [cardsRes, readinessRes] = await Promise.all([
                fetch('data/dashboard/top_cards.json'),
                fetch('data/readiness/readiness.json')
            ]);

            if (!cardsRes.ok) throw new Error("Top cards data not found");
            
            const data = await cardsRes.json();
            const readinessData = readinessRes.ok ? await readinessRes.json() : null;

            // --- Readiness Calculation Logic ---
            let readinessHtml = '';
            
            if (readinessData && readinessData.upcomingEvents) {
                const targetEvent = readinessData.upcomingEvents.find(e => e.name === data.next_event) 
                                    || readinessData.upcomingEvents[0]; 

                if (targetEvent) {
                    const stats = readinessData.trainingStats || {};
                    
                    const metrics = [
                        { name: 'Swim',       current: stats.maxSwim || 0,     target: parseDur(targetEvent.swimGoal) },
                        { name: 'Bike',       current: stats.maxBike || 0,     target: parseDur(targetEvent.bikeGoal) },
                        { name: 'Run',        current: stats.maxRun || 0,      target: parseDur(targetEvent.runGoal) },
                        { name: 'Bike Climb', current: stats.maxBikeElev || 0, target: parseElev(targetEvent.bikeElevGoal) }
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
                        let icon = "fa-circle-check";

                        if (lowestPct < 60) {
                            colorClass = "text-red-500";
                            icon = "fa-circle-exclamation";
                        } else if (lowestPct < 85) {
                            colorClass = "text-yellow-500";
                            icon = "fa-triangle-exclamation";
                        }

                        // Formatted exactly like the requested style (Line item below days)
                        readinessHtml = `
                            <div class="mt-1 text-xs font-bold ${colorClass} flex items-center gap-1.5">
                                <i class="fa-solid ${icon}"></i>
                                <span>${lowestMetric.name}: ${lowestPct}% Ready</span>
                            </div>
                        `;
                    }
                }
            }

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
                        <div class="flex items-start gap-3">
                            <i class="fa-solid fa-flag-checkered text-2xl text-emerald-400 mt-1"></i>
                            <div class="flex flex-col">
                                <span class="text-xl font-bold text-white leading-tight">${data.next_event}</span>
                                <span class="text-xs text-slate-400 font-mono mt-1">${data.days_to_go} days to go</span>
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
