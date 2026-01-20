// js/views/dashboard/topCards.js

// Helper: Parse Markdown Text
function parseStats(planMd) {
    // Default State
    let currentPhase = "Unknown Phase";
    let nextEvent = null;
    
    if (!planMd || typeof planMd !== 'string') {
        console.warn("⚠️ TopCards: No Markdown content received.");
        return { phase: currentPhase, event: nextEvent };
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    let minDays = 9999;

    // Split lines and clean them
    const lines = planMd.split('\n').map(l => l.trim());
    let inEventTable = false;

    console.groupCollapsed("🔎 TopCards Parser Debug");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // --- 1. FIND CURRENT STATUS ---
        // Looks for: "**Current Status:** Base Phase 1" or similar
        if (line.toLowerCase().startsWith('**current status:**') || line.toLowerCase().startsWith('**status:**')) {
            const rawStatus = line.split(':')[1] || '';
            currentPhase = rawStatus.trim().replace(/\*\*/g, ''); // Remove bold markers
            console.log(`✅ Found Status: "${currentPhase}"`);
        }

        // --- 2. FIND NEXT EVENT ---
        // Detect Start of Event Table
        if (line.toLowerCase().includes('event schedule') || line.toLowerCase().includes('upcoming events')) {
            inEventTable = true;
            continue;
        }

        // Stop if we hit a new section
        if (inEventTable && line.startsWith('#')) {
            inEventTable = false;
        }

        // Parse Table Rows: | Date | Event Name | ...
        if (inEventTable && line.startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('event name')) {
            const parts = line.split('|').map(s => s.trim());
            
            // Allow flexible column positions, but usually: | Date | Name | ...
            if (parts.length >= 3) {
                const dateStr = parts[1];
                const nameStr = parts[2];
                
                // Try to parse the date
                const evtDate = new Date(dateStr);
                
                if (!isNaN(evtDate.getTime())) {
                    // Check if Future
                    if (evtDate >= today) {
                        const diffTime = Math.abs(evtDate - today);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                        
                        if (diffDays < minDays) {
                            minDays = diffDays;
                            nextEvent = { name: nameStr, days: diffDays, date: dateStr };
                            console.log(`✅ Found Next Event: ${nameStr} (${dateStr})`);
                        }
                    }
                }
            }
        }
    }
    console.groupEnd();
    
    return { phase: currentPhase, event: nextEvent };
}

// Main Render Function
export function renderTopCards(planMd) {
    const { phase, event } = parseStats(planMd);

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
