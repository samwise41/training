// js/views/dashboard/plannedWorkouts.js
import { getSportColorVar, getIcon, buildCollapsibleSection } from './utils.js';

// Helper: Normalize Sport for matching
function normalizeSport(s) {
    const str = String(s || '').toLowerCase();
    if (str.includes('bike') || str.includes('ride') || str.includes('cycl')) return 'bike';
    if (str.includes('run')) return 'run';
    if (str.includes('swim')) return 'swim';
    return 'other';
}

// Helper: Format Date String YYYY-MM-DD
function toISODate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function renderPlannedWorkouts(plannedData, fullLogData) {
    if (!plannedData || plannedData.length === 0) {
        return '<p class="text-slate-500 italic">No planned workouts found.</p>';
    }

    // 1. Define Week Window (Current Week)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Find Monday of this week
    const dayOfWeek = today.getDay(); // 0=Sun
    const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distToMon);
    
    // Find Sunday
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // 2. Filter & Merge Data
    const weeklyCards = [];
    const loopDate = new Date(monday);

    // Loop through Mon-Sun creating cards
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(loopDate);
        const dateStr = toISODate(currentDate);
        
        // Find Plan for this day
        const planItems = plannedData.filter(p => {
            const pDate = p.date instanceof Date ? toISODate(p.date) : p.date;
            return pDate === dateStr;
        });

        // If no plan, we might still want to show the day or skip. 
        // Showing only days with plans:
        planItems.forEach(plan => {
            // Check for Match in Log (Actuals)
            // Match = Same Date AND Same Sport
            const planSport = normalizeSport(plan.activityType);
            
            const match = fullLogData.find(log => {
                const lDate = log.date instanceof Date ? toISODate(log.date) : log.date;
                const logSport = normalizeSport(log.actualSport || log.activityType);
                return lDate === dateStr && logSport === planSport;
            });

            weeklyCards.push({
                date: currentDate,
                plan: plan,
                actual: match // Attach the actual data if found
            });
        });

        // Next Day
        loopDate.setDate(loopDate.getDate() + 1);
    }

    // 3. Render Cards
    let cardsHtml = '';
    
    weeklyCards.forEach(item => {
        const dateObj = item.date;
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const isToday = dateObj.getTime() === today.getTime();
        
        const w = item.plan;
        const act = item.actual; // The matched actual workout

        const notes = w.notes ? String(w.notes).replace(/\[.*?\]/g, '') : "No specific notes.";
        let displayDuration = w.plannedDuration || "--"; 
        let displayUnit = "mins"; 
        
        // STATUS LOGIC
        let statusText = "PLANNED"; 
        let statusColorClass = "text-white"; 
        let cardBorder = 'border border-slate-700 hover:border-slate-600'; 

        // If matched actual exists, mark COMPLETED
        if (act && act.actualDuration > 0) { 
            statusText = "COMPLETED"; 
            statusColorClass = "text-emerald-500"; 
            
            const pDur = w.plannedDuration || 0;
            const aDur = act.actualDuration || 0;
            const ratio = pDur > 0 ? (aDur / pDur) : 1;
            
            if (ratio >= 0.95) cardBorder = 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900'; 
            else if (ratio >= 0.80) cardBorder = 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-slate-900'; 
            else cardBorder = 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900'; 
        } 
        else if (isToday) { 
            cardBorder = 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'; 
        } 
        else if (w.activityType === 'Rest' || String(w.planName).toLowerCase().includes('rest')) { 
            displayDuration = "--"; 
            statusText = "REST DAY"; 
            statusColorClass = "text-slate-500"; 
        } 
        else if (dateObj < today) {
            statusText = "MISSED";
            statusColorClass = "text-red-500";
            cardBorder = 'border border-red-900/50 opacity-75';
        }

        const titleStyle = `style="color: ${getSportColorVar(w.activityType)}"`;
        const planName = String(w.plannedWorkout || w.planName || 'Workout'); // Handle different naming

        cardsHtml += `
        <div class="bg-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden transition-all ${cardBorder}">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">${dayName}</span>
                ${getIcon(w.activityType)}
            </div>
            <div class="flex justify-between items-center mb-6 mt-1">
                <div class="flex flex-col">
                    <div class="flex items-baseline gap-1">
                        <span class="text-5xl font-bold text-white tracking-tight leading-none">${displayDuration}</span>
                        <span class="text-lg font-medium text-slate-400 font-mono">${displayUnit}</span>
                    </div>
                    <div class="text-sm font-bold ${statusColorClass} uppercase tracking-widest mt-1">${statusText}</div>
                </div>
                <div class="text-right pl-4 max-w-[55%]">
                    <h3 class="text-lg font-bold leading-tight" ${titleStyle}>${planName}</h3>
                </div>
            </div>
            <div class="h-px bg-slate-700 w-full mb-4"></div>
            <div><p class="text-sm text-slate-300 leading-relaxed font-sans">${notes}</p></div>
            
            ${act ? `<div class="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                <span class="text-[10px] font-bold text-slate-500 uppercase">Actual Duration</span>
                <span class="text-sm font-mono font-bold text-emerald-400">${act.actualDuration} min</span>
            </div>` : ''}
        </div>`;
    });

    const cardsContainerHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-0 p-2">${cardsHtml}</div>`;
    return buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', cardsContainerHtml, true);
}
