import { getIcon, getSportColorVar, buildCollapsibleSection } from './utils.js';

export function renderPlannedWorkouts() {
    setTimeout(async () => {
        const container = document.getElementById('planned-workouts-content');
        if (!container) return;
        
        try {
            // 1. Fetch the merged data
            const response = await fetch('data/dashboard/plannedWorkouts.json');
            if (!response.ok) throw new Error("Schedule file not found");
            
            let data = await response.json();
            
            // 2. Sort Chronologically (Oldest -> Newest)
            data.sort((a, b) => new Date(a.date) - new Date(b.date));

            // 3. Render
            container.innerHTML = generateCardsHTML(data);
            
            // Scroll Today into view
            setTimeout(() => {
                const todayCard = container.querySelector('.ring-blue-500'); // Today's marker
                if (todayCard) todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
        } catch (error) {
            console.error("Failed to load schedule:", error);
            container.innerHTML = `<p class="text-slate-500 italic p-4">Unable to load schedule.</p>`;
        }
    }, 50);

    const loadingHtml = `<div id="planned-workouts-content" class="min-h-[100px] flex items-center justify-center text-slate-500">
        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Schedule...
    </div>`;

    return buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', loadingHtml, true);
}

function generateCardsHTML(data) {
    if (!data || data.length === 0) {
        return '<p class="text-slate-500 italic p-4">No workouts found.</p>';
    }

    let cardsHtml = '';
    const todayStr = new Date().toISOString().split('T')[0];

    data.forEach(w => {
        // --- 1. Data Prep ---
        const dayName = w.day || w.date; // e.g. "MONDAY"
        const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
        const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No specific notes.";
        
        // Icon & Color based on Actual Sport (falls back to Plan if not completed)
        const sportType = w.actualSport || 'Other'; 
        const titleStyle = `style="color: ${getSportColorVar(sportType)}"`;
        const iconHtml = getIcon(sportType);

        // --- 2. Status & Styling Logic ---
        let statusText = w.status;
        let statusColorClass = "text-slate-400";
        let cardBorderClass = "border border-slate-700 hover:border-slate-600";
        let displayDuration = Math.round(w.plannedDuration);
        let displayUnit = "min";

        // Logic: Today
        if (w.date === todayStr && statusText !== 'COMPLETED') {
            cardBorderClass = "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900";
        }

        // Logic: Completed (Green Outline)
        if (statusText === 'COMPLETED' || statusText === 'UNPLANNED') {
            statusText = "COMPLETED";
            statusColorClass = "text-emerald-400";
            
            // THE REQUESTED FORMATTING: Green Outline for completed
            cardBorderClass = "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900";
            
            // Optionally show Actual Duration as the big number? 
            // The snippet showed Plan usually, but let's stick to Plan as big number 
            // and Actual in footer, unless it was Unplanned.
            if (w.plannedDuration === 0) {
                displayDuration = Math.round(w.actualDuration);
                statusText = "UNPLANNED";
            }
        } 
        // Logic: Missed
        else if (statusText === 'MISSED') {
            statusColorClass = "text-red-500";
            cardBorderClass = "border border-red-900/50 opacity-75";
        }
        // Logic: Rest
        else if (statusText === 'REST' || sportType === 'Rest') {
            statusText = "REST DAY";
            displayDuration = "--";
            displayUnit = "";
            cardBorderClass = "border border-slate-800 opacity-50";
        }

        // --- 3. HTML Generation (Matching your Snippet) ---
        cardsHtml += `
            <div class="bg-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden transition-all ${cardBorderClass}">
                
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">${dayName}</span>
                    ${iconHtml}
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

                <div>
                    <p class="text-sm text-slate-300 leading-relaxed font-sans line-clamp-3" title="${notes}">${notes}</p>
                </div>

                ${(w.actualDuration > 0 && w.plannedDuration > 0) ? `
                <div class="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <span class="text-[10px] font-bold text-slate-500 uppercase">Actual Duration</span>
                    <span class="text-sm font-mono font-bold text-emerald-400">${Math.round(w.actualDuration)} min</span>
                </div>` : ''}

            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-0 p-2">${cardsHtml}</div>`;
}
