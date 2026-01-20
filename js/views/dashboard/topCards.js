// js/views/dashboard/topCards.js

export function renderTopCards(planMd) {
    // --- 1. BASIC PARSING (Just to get the text) ---
    let phaseTitle = "Unknown Phase";
    let phaseSubtitle = "No active block";
    let eventName = "No events scheduled";
    let eventDate = "--";
    let daysToGo = "--";

    if (planMd && typeof planMd === 'string') {
        const lines = planMd.split('\n');
        const today = new Date(); today.setHours(0,0,0,0);
        let minDays = 9999;

        for (const line of lines) {
            // Parse Status
            if (line.includes('**Status:**')) {
                // Example: **Status:** Phase 1 (Base) - Block 2 Week 1
                const raw = line.replace('**Status:**', '').trim();
                const parts = raw.split('-');
                phaseTitle = parts[0] ? parts[0].trim() : raw;
                phaseSubtitle = parts[1] ? parts[1].trim() : "";
            }

            // Parse Events
            if (line.trim().startsWith('|') && !line.includes('---') && !line.includes('Event Name')) {
                const parts = line.split('|').map(s => s.trim());
                if (parts.length >= 3) {
                    const dStr = parts[1];
                    const name = parts[2];
                    const d = new Date(dStr);
                    if (!isNaN(d) && d >= today) {
                        const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                        if (diff < minDays) {
                            minDays = diff;
                            eventName = name;
                            eventDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            daysToGo = `${Math.floor(diff / 7)}W ${diff % 7}D`;
                        }
                    }
                }
            }
        }
    }

    // --- 2. THE VISUALS (Matching your screenshot) ---
    return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-center h-32">
            <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Current Phase</div>
            
            <div class="text-2xl font-bold text-blue-400 tracking-tight leading-none mb-1">
                ${phaseTitle}
            </div>
            
            <div class="text-sm font-bold text-white tracking-wide">
                ${phaseSubtitle}
            </div>
        </div>

        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm relative overflow-hidden flex items-center justify-between h-32">
            
            <div class="flex flex-col justify-center z-10">
                <div class="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Next Event</div>
                
                <div class="text-xl font-bold text-white tracking-tight leading-none mb-2 truncate max-w-[200px] md:max-w-[280px]" title="${eventName}">
                    ${eventName}
                </div>
                
                <div class="flex items-center gap-3 text-xs font-mono">
                    <span class="text-slate-400 font-bold">${eventDate}</span>
                    <span class="text-slate-600">|</span>
                    <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <i class="fa-solid fa-hourglass-half text-[10px]"></i>
                        <span>${daysToGo} TO GO</span>
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-center justify-center border-l border-slate-700 pl-6 ml-4">
                <span class="text-3xl font-black text-emerald-500 tracking-tighter leading-none">100%</span>
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Readiness</span>
                <div class="mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    Ready
                </div>
            </div>

            <div class="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
        </div>

    </div>`;
}
