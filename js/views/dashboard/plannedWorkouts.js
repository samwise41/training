// js/views/dashboard/plannedWorkouts.js
import { getIcon, getSportColorVar, toLocalYMD, buildCollapsibleSection } from './utils.js';

export function renderPlannedWorkouts(unifiedData) {
    // 1. Calculate Current Week Window
    const today = new Date(); 
    today.setHours(0,0,0,0);
    const day = today.getDay();
    const monday = new Date(today); 
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday); 
    sunday.setDate(monday.getDate() + 6);

    // 2. Filter Data for This Week
    // We sort by date to ensure Monday -> Sunday order
    const weeklyData = unifiedData
        .filter(d => d.date >= monday && d.date <= sunday)
        .sort((a, b) => a.date - b.date);

    if (weeklyData.length === 0) {
        return buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', '<p class="text-slate-500 italic p-4">No workouts found for this week.</p>', true);
    }

    let cardsHtml = '';
    
    weeklyData.forEach(w => {
        const isToday = w.date.getTime() === today.getTime();
        const dayName = w.date.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Data Normalization (Handle fields from both Plan and Actual sources)
        const planName = w.plannedWorkout || w.planName || w.actualWorkout || "Workout";
        const sportType = w.activityType || w.actualSport || 'Other';
        const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '') : "No specific notes.";
        
        let displayDur = w.plannedDuration || 0;
        let displayUnit = "min";

        // Status Logic
        let statusText = "PLANNED";
        let statusColor = "text-white";
        let cardBorder = "border border-slate-700 hover:border-slate-600";
        
        // A. Completed (Has Actual Duration)
        if (w.actualDuration > 0) {
            statusText = "COMPLETED";
            statusColor = "text-emerald-500";
            displayDur = w.actualDuration; // Show what you actually did

            // Compliance Coloring
            const ratio = w.plannedDuration > 0 ? (w.actualDuration / w.plannedDuration) : 1;
            if (ratio >= 0.95) cardBorder = "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900";
            else if (ratio >= 0.8) cardBorder = "ring-2 ring-yellow-500 ring-offset-2 ring-offset-slate-900";
            else cardBorder = "ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900";

            // Unplanned Workout Case
            if (w.plannedDuration === 0) {
                statusText = "UNPLANNED";
                cardBorder = "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900";
            }
        } 
        // B. Not Completed Yet
        else {
            if (w.date < today && w.plannedDuration > 0) {
                statusText = "MISSED";
                statusColor = "text-red-500";
                cardBorder = "border border-red-900/50 opacity-75";
            } else if (isToday) {
                cardBorder = "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900";
            }
            
            // Rest Day Handling
            if (String(sportType).toLowerCase() === 'rest') {
                statusText = "REST DAY";
                statusColor = "text-slate-500";
                displayDur = "--";
                displayUnit = "";
            }
        }

        const titleStyle = `style="color: ${getSportColorVar(sportType)}"`;

        cardsHtml += `
            <div class="bg-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden transition-all ${cardBorder}">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">${dayName}</span>
                    ${getIcon(sportType)}
                </div>
                <div class="flex justify-between items-center mb-6 mt-1">
                    <div class="flex flex-col">
                        <div class="flex items-baseline gap-1">
                            <span class="text-5xl font-bold text-white tracking-tight leading-none">${displayDur}</span>
                            <span class="text-lg font-medium text-slate-400 font-mono">${displayUnit}</span>
                        </div>
                        <div class="text-sm font-bold ${statusColor} uppercase tracking-widest mt-1">${statusText}</div>
                    </div>
                    <div class="text-right pl-4 max-w-[55%]">
                        <h3 class="text-lg font-bold leading-tight" ${titleStyle}>${planName}</h3>
                    </div>
                </div>
                <div class="h-px bg-slate-700 w-full mb-4"></div>
                <div><p class="text-sm text-slate-300 leading-relaxed font-sans line-clamp-3">${notes}</p></div>
                
                ${w.actualDuration > 0 && w.plannedDuration > 0 ? `
                <div class="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <span class="text-[10px] font-bold text-slate-500 uppercase">Plan vs Act</span>
                    <span class="text-sm font-mono font-bold text-emerald-400">${w.plannedDuration}m / ${w.actualDuration}m</span>
                </div>` : ''}
            </div>
        `;
    });

    const container = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-0 p-2">${cardsHtml}</div>`;
    
    // Return wrapped in the collapsible builder
    return buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', container, true);
}
