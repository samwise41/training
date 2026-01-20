// js/views/dashboard/plannedWorkouts.js

// --- HELPER: Parse Duration ---
const parseDur = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = val.toString().toLowerCase();
    let mins = 0;
    if (str.includes('h')) {
        const parts = str.split('h');
        mins += parseInt(parts[0]) * 60;
        if (parts[1] && parts[1].includes('m')) mins += parseInt(parts[1]);
    } else if (str.includes('m')) {
        mins += parseInt(str);
    } else {
        mins = parseInt(str);
    }
    return isNaN(mins) ? 0 : mins;
};

// --- HELPER: Markdown Renderer ---
const renderMarkdown = (text) => {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded text-orange-300 font-mono text-[10px]">$1</code>')
        .replace(/\n/g, '<br>');
};

// --- COMPONENT: Single Card ---
const renderCard = (w) => {
    const isDone = w.status === 'completed';
    const borderColor = isDone ? 'border-emerald-500' : 'border-blue-500';
    const bgColor = isDone ? 'bg-emerald-900/10' : 'bg-blue-900/10';
    const textColor = isDone ? 'text-emerald-400' : 'text-blue-400';
    const label = isDone ? 'COMPLETED' : 'PLANNED';
    
    // Icon Selection
    const typeStr = (w.type || "").toLowerCase();
    let icon = 'fa-dumbbell'; 
    if (typeStr.includes('run')) icon = 'fa-person-running';
    if (typeStr.includes('bike') || typeStr.includes('cycl')) icon = 'fa-person-biking';
    if (typeStr.includes('swim')) icon = 'fa-person-swimming';

    // Duration / Status Line
    let durHtml = '';
    if (isDone) {
        // Show Plan vs Act if matched
        const planVal = parseDur(w.planDur || w.duration); // Fallback to duration if planDur missing
        const actVal = parseDur(w.actDur || w.actualDuration);
        
        durHtml = `
            <div class="flex justify-between items-end mt-4 pt-3 border-t border-slate-700/50">
                <span class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Plan vs Act</span>
                <div class="text-xs font-mono text-slate-300">
                    <span class="text-slate-500">${planVal}m</span> <span class="text-slate-600">/</span> <span class="text-emerald-400 font-bold">${actVal}m</span>
                </div>
            </div>`;
    } 

    // Main Big Duration Number (Top Left)
    const mainDur = isDone ? (w.actDur || w.actualDuration) : (w.planDur || w.duration);
    
    // Day Name (e.g., MONDAY)
    const d = new Date(w.date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

    return `
    <div class="relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-5 transition-all hover:shadow-lg hover:shadow-${isDone ? 'emerald' : 'blue'}-900/20 flex flex-col h-full">
        <div class="flex justify-between items-start mb-3">
            <div>
                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">${dayName}</div>
                <div>
                    <span class="text-4xl font-black text-white tracking-tighter">${mainDur}</span>
                    <span class="text-xs text-slate-400 ml-1 font-bold">min</span>
                </div>
                <div class="text-[10px] font-bold ${textColor} uppercase mt-1 tracking-wide">${label}</div>
            </div>
            <div class="text-right">
                <i class="fa-solid ${icon} ${textColor} text-xl mb-1 opacity-80"></i>
                <div class="text-[10px] font-bold text-slate-500 text-right max-w-[80px] leading-tight mt-1">
                    [${(w.type || "Workout").toUpperCase()}] ${w.title}
                </div>
            </div>
        </div>
        
        <div class="text-xs text-slate-400 leading-relaxed mt-auto">
            ${renderMarkdown(w.details)}
        </div>

        ${durHtml}
    </div>
    `;
};

// --- MAIN EXPORT ---
export const renderPlannedWorkouts = (unifiedData) => {
    if (!unifiedData || !Array.isArray(unifiedData) || unifiedData.length === 0) {
        return `<div class="p-8 text-center text-slate-500">No scheduled workouts found.</div>`;
    }

    // --- DEDUPLICATION LOGIC (The Fix) ---
    // Problem: The list has both "Planned" (Blue) and "Merged" (Green) items for the same day.
    // Solution: If a "Completed" item exists for Date X + Sport Y, remove the "Planned" item for Date X + Sport Y.
    
    const cleanList = [];
    const completedMap = new Set(); // Stores "YYYY-MM-DD|Sport" keys

    // 1. First Pass: Identify all COMPLETED items
    unifiedData.forEach(w => {
        if (w.status === 'completed') {
            const dateKey = w.date.split('T')[0]; // Simple YYYY-MM-DD
            const typeKey = (w.type || "workout").toLowerCase().trim();
            // We use a simplified type key (run, bike, swim) to match loosely
            let sport = 'other';
            if (typeKey.includes('run')) sport = 'run';
            else if (typeKey.includes('bike')) sport = 'bike';
            else if (typeKey.includes('swim')) sport = 'swim';
            
            completedMap.add(`${dateKey}|${sport}`);
            cleanList.push(w); // Keep the completed item
        }
    });

    // 2. Second Pass: Add PLANNED items ONLY if not in map
    unifiedData.forEach(w => {
        if (w.status !== 'completed') {
            const dateKey = w.date.split('T')[0];
            const typeKey = (w.type || "workout").toLowerCase().trim();
            let sport = 'other';
            if (typeKey.includes('run')) sport = 'run';
            else if (typeKey.includes('bike')) sport = 'bike';
            else if (typeKey.includes('swim')) sport = 'swim';

            // Check if we already have a completed entry for this day/sport
            if (!completedMap.has(`${dateKey}|${sport}`)) {
                cleanList.push(w);
            }
        }
    });

    // 3. Sort by Date
    cleanList.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 4. Render
    const cardsHtml = cleanList.map(w => renderCard(w)).join('');

    return `
        <div class="mt-8">
            <div class="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-calendar-check text-blue-400"></i>
                    <h3 class="text-sm font-bold text-white uppercase tracking-widest">Planned Workouts</h3>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${cardsHtml}
            </div>
        </div>
    `;
};
