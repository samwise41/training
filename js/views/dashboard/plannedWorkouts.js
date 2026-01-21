import { getIcon, getSportColorVar, buildCollapsibleSection } from './utils.js';

export function renderPlannedWorkouts(data) {
    setTimeout(() => {
        const container = document.getElementById('planned-workouts-content');
        if (!container) return;
        
        try {
            if (!data || data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 italic p-4">No planned workouts found.</p>';
                return;
            }

            const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
            container.innerHTML = generateCardsHTML(sortedData);
            
            setTimeout(() => {
                const todayCard = container.querySelector('.ring-blue-500'); 
                if (todayCard) todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
            
        } catch (error) {
            console.error("Failed to render schedule:", error);
            container.innerHTML = `<p class="text-slate-500 italic p-4">Unable to load schedule.</p>`;
        }
    }, 50);

    const loadingHtml = `<div id="planned-workouts-content" class="min-h-[100px] flex items-center justify-center text-slate-500">
        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Schedule...
    </div>`;

    return buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', loadingHtml, true);
}

function generateCardsHTML(data) {
    let cardsHtml = '';
    
    // TIMEZONE FIX: Use local calendar date (YYYY-MM-DD) instead of UTC
    const todayStr = new Date().toLocaleDateString('en-CA'); 

    data.forEach(w => {
        const dayName = w.day || w.date; 
        const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
        const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No specific notes.";
        
        const sportType = w.actualSport || w.activityType || 'Other'; 
        const titleStyle = `style="color: ${getSportColorVar(sportType)}"`;
        const iconHtml = getIcon(sportType);

        let statusText = w.status || "PLANNED";
        let statusColorClass = "text-slate-400";
        let cardBorderClass = "border border-slate-700 hover:border-slate-600";
        let displayDuration = Math.round(w.plannedDuration || 0);
        let displayUnit = "min";

        const isToday = w.date.startsWith ? w.date.startsWith(todayStr) : w.date === todayStr;
        
        if (isToday && statusText !== 'COMPLETED') {
            cardBorderClass = "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900";
        }

        if (statusText === 'COMPLETED' || statusText === 'UNPLANNED') {
            statusText = "COMPLETED";
            statusColorClass = "text-emerald-400";
            cardBorderClass = "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900";
            
            if (w.plannedDuration === 0) {
                displayDuration = Math.round(w.actualDuration || 0);
                statusText = "UNPLANNED";
            }
        } 
        else if (statusText === 'MISSED') {
            statusColorClass = "text-red-500";
            cardBorderClass = "border border-red-900/50 opacity-75";
        }
        else if (statusText === 'REST' || sportType === 'Rest') {
            statusText = "REST DAY";
            displayDuration = "--";
            displayUnit = "";
            cardBorderClass = "border border-slate-800 opacity-50";
        }

        cardsHtml += `
            <div class="bg-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden transition-all ${cardBorderClass} flex flex-col h-full">
                
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
                        <h3 class="text-lg font-bold leading-tight line-clamp-2" ${titleStyle}>${planName}</h3>
                    </div>
                </div>

                <div class="h-px bg-slate-700 w-full mb-4"></div>

                <div class="flex-grow">
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
