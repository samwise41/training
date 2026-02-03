import { Formatters } from '../../utils/formatting.js';
import { UI } from '../../utils/ui.js';
import { DataManager } from '../../utils/data.js';

export function renderPlannedWorkouts() {
    setTimeout(async () => {
        const container = document.getElementById('planned-workouts-content');
        if (!container) return;
        try {
            let data = await DataManager.fetchJSON('schedule');
            if (!data) throw new Error("Schedule file missing");
            
            // 1. Group data by date (Stacked Card Logic)
            const groupedData = groupWorkoutsByDate(data);
            
            // 2. Render grouped cards
            container.innerHTML = generateGroupedCardsHTML(groupedData);
            
            // 3. Scroll to today (Blue or Green ring)
            setTimeout(() => {
                const todayCard = container.querySelector('.ring-blue-500, .ring-emerald-500'); 
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

    return UI.buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', loadingHtml, true);
}

/**
 * Groups flat workout list by Date 'YYYY-MM-DD'
 */
function groupWorkoutsByDate(workouts) {
    const groups = {};

    workouts.forEach(w => {
        const dateKey = w.date; 
        if (!dateKey) return;

        if (!groups[dateKey]) {
            groups[dateKey] = {
                dateStr: dateKey,
                dateObj: new Date(dateKey), 
                workouts: [],
                totalDuration: 0,
                isRestDay: true 
            };
        }
        
        groups[dateKey].workouts.push(w);
        
        // Sum planned duration
        const duration = parseFloat(w.plannedDuration) || 0;
        groups[dateKey].totalDuration += duration;
        
        // If any workout is NOT a rest day, the whole day is considered active
        if (w.status !== 'REST' && w.actualSport !== 'Rest') {
            groups[dateKey].isRestDay = false;
        }
    });

    // Sort by Date
    return Object.values(groups).sort((a, b) => a.dateObj - b.dateObj);
}

/**
 * Generates the HTML for Stacked Cards
 */
function generateGroupedCardsHTML(groupedData) {
    if (!groupedData || groupedData.length === 0) return '<p class="text-slate-500 italic p-4">No workouts found.</p>';
    
    let html = '';
    const d = new Date();
    const todayStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

    groupedData.forEach(day => {
        // --- Header Logic ---
        const isToday = day.dateStr === todayStr;
        const dayNameFull = day.dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        // Format Total Duration
        const hours = Math.floor(day.totalDuration / 60);
        const mins = Math.round(day.totalDuration % 60);
        const totalTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        // Check Completion Status of the DAY
        // Day is complete if ALL active workouts are Completed or Unplanned
        const activeWorkouts = day.workouts.filter(w => w.status !== 'REST' && w.actualSport !== 'Rest');
        const completedCount = activeWorkouts.filter(w => w.status === 'COMPLETED' || w.status === 'UNPLANNED').length;
        const isDayComplete = activeWorkouts.length > 0 && activeWorkouts.length === completedCount;

        // --- Card Border Logic (Your Specific Requirements) ---
        let cardBorderClass = "";
        
        if (isDayComplete) {
            // "if the workout is complete the border should be green"
            cardBorderClass = "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900 bg-slate-800";
        } else if (isToday) {
            // "border to be blue if it is the current day and the workout is not complete"
            cardBorderClass = "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-slate-800";
        } else {
            // Standard grey border for other days
            cardBorderClass = "border border-slate-700 hover:border-slate-600 bg-slate-800/60";
        }

        // --- Rows Logic ---
        const rowsHtml = day.workouts.map(w => {
            const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            const sportType = w.actualSport || 'Other';
            const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "";
            
            // Row Styling Logic
            let statusIcon = ''; 
            let titleColor = 'text-slate-200'; // Default Title Color
            let rowOpacity = 'opacity-100';

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') {
                statusIcon = `<i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>`;
                // "I don't want the workout name crossed out" -> Removed line-through
                titleColor = 'text-emerald-400 font-bold'; 
                rowOpacity = 'opacity-100';
            } else if (w.status === 'MISSED') {
                statusIcon = `<i class="fa-solid fa-circle-xmark text-red-500 text-lg"></i>`;
                titleColor = 'text-red-400';
            } else if (w.status === 'REST') {
                titleColor = 'text-slate-500 italic';
                rowOpacity = 'opacity-60';
            }

            // Sport Icon Class (uses your styles.css variables via existing classes)
            // Ensure we use the helper to get the SVG/Icon
            const iconHtml = Formatters.getIconForSport(sportType);
            const iconColorClass = `icon-${sportType.toLowerCase()}`;
            
            return `
                <div class="group flex items-start gap-3 p-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors ${rowOpacity}">
                    <div class="mt-1 ${iconColorClass} text-lg w-6 flex justify-center">
                        ${iconHtml}
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h4 class="text-sm ${titleColor} truncate pr-2">${planName}</h4>
                            ${statusIcon}
                        </div>
                        
                        <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            ${w.plannedDuration > 0 ? `<span class="font-mono bg-slate-700/30 px-1.5 rounded">${Math.round(w.plannedDuration)}m</span>` : ''}
                            ${(w.tss > 0) ? `<span class="px-1.5 py-0.5 rounded bg-slate-700/50 text-[10px] text-slate-300">${w.tss} TSS</span>` : ''}
                        </div>
                        
                        ${notes ? `<p class="text-[11px] text-slate-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all cursor-default" title="${notes}">${notes}</p>` : ''}
                        
                        ${(w.actualDuration > 0 && w.plannedDuration > 0) ? 
                            `<div class="mt-1 text-[10px] font-mono text-emerald-500/70">Actual: ${Math.round(w.actualDuration)}m</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // --- Assemble Card ---
        html += `
            <div class="rounded-xl overflow-hidden shadow-lg transition-all ${cardBorderClass} flex flex-col h-full">
                <div class="px-4 py-2 bg-black/20 border-b border-slate-700/50 flex justify-between items-center backdrop-blur-sm">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${dayNameFull}</span>
                    ${(!day.isRestDay && day.totalDuration > 0) ? `<span class="text-xs font-mono text-slate-500"><i class="fa-regular fa-clock mr-1"></i>${totalTimeStr}</span>` : ''}
                </div>
                
                <div class="flex flex-col flex-1">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-0 p-2">${html}</div>`;
}
