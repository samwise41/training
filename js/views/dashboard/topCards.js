// js/views/dashboard/topCards.js

// --- Helper: Parse Markdown Text ---
function parseStats(planMd) {
    // Default State
    let currentPhase = "Training";
    let nextEvent = null;
    
    if (!planMd || typeof planMd !== 'string') {
        return { phase: currentPhase, event: nextEvent };
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    let minDays = 9999;

    const lines = planMd.split('\n');

    for (const line of lines) {
        // 1. Extract Status Line (**Status:** Phase 1...)
        if (line.includes('**Status:**')) {
            currentPhase = line.replace('**Status:**', '').trim();
        }
        
        // 2. Extract Events from Table
        // Looks for rows like: | Date | Event Name | ...
        if (line.trim().startsWith('|') && !line.includes('---') && !line.includes('Event Type')) {
            const parts = line.split('|').map(s => s.trim());
            
            // Ensure we have enough columns (Date is usually col 1, Name col 2)
            if (parts.length >= 3) {
                const evtDateStr = parts[1];
                const evtName = parts[2];
                
                // Validate Date
                const evtDate = new Date(evtDateStr);
                if (!isNaN(evtDate) && evtDate >= today) {
                    // Calculate Days Until
                    const diffTime = Math.abs(evtDate - today);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    // Keep the soonest one
                    if (diffDays < minDays) {
                        minDays = diffDays;
                        nextEvent = { name: evtName, days: diffDays, date: evtDateStr };
                    }
                }
            }
        }
    }
    
    return { phase: currentPhase, event: nextEvent };
}

// --- Main Export: Render the HTML ---
export function renderTopCards(planMd) {
    const { phase, event } = parseStats(planMd);

    // Event HTML
    const eventHtml = event 
        ? `<div class="text-right">
             <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Next Event</div>
             <div class="text-lg font-bold text-white truncate">${event.name}</div>
             <div class="text-sm font-mono text-emerald-400">T-${event.days} Days <span class="text-slate-500 text-xs">(${event.date})</span></div>
           </div>`
        : `<div class="text-right">
             <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Next Event</div>
             <div class="text-sm text-slate-500 italic">No future events found</div>
           </div>`;

    // Final Component HTML
    return `
        <div class="grid grid-cols-2 gap-4 mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-sm">
            <div>
                <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Focus</div>
                <div class="text-xl font-bold text-white tracking-tight">${phase}</div>
                <div class="flex items-center gap-2 mt-1">
                    <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span class="text-xs text-emerald-400 font-mono font-bold">ACTIVE</span>
                </div>
            </div>
            ${eventHtml}
        </div>
    `;
}
