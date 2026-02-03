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
            
            // 1. Group data by date
            const groupedData = groupWorkoutsByDate(data);
            
            // 2. Render groups
            container.innerHTML = generateGroupedCardsHTML(groupedData);
            
            // 3. Scroll to today
            setTimeout(() => {
                const todayCard = container.querySelector('.ring-blue-500'); 
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
 * Helper: Groups flat workout list by Date 'YYYY-MM-DD'
 */
function groupWorkoutsByDate(workouts) {
    const groups = {};

    workouts.forEach(w => {
        // Ensure we have a valid date string
        const dateKey = w.date; 
        if (!dateKey) return;

        if (!groups[dateKey]) {
            groups[dateKey] = {
                dateStr: dateKey,
                dateObj: new Date(dateKey), // Assuming ISO format or compatible
                workouts: [],
                totalDuration: 0
            };
        }
        
        groups[dateKey].workouts.push(w);
        
        // Sum planned duration (handle Rest days which might be 0 or null)
        const duration = parseFloat(w.plannedDuration) || 0;
        groups[dateKey].totalDuration += duration;
    });

    // Sort by Date
    return Object.values(groups).sort((a, b) => a.dateObj - b.dateObj);
}

/**
 * Generates the Stacked Card HTML
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
        
        // Format Total Duration (e.g., "1h 30m" or "45m")
        const hours = Math.floor(day.totalDuration / 60);
        const mins = Math.round(day.totalDuration % 60);
        const totalTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        // Card Styling
        let cardBorderClass = isToday 
            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-slate-800" 
            : "border border-slate-700 hover:border-slate-600 bg-slate-800/60";

        // --- Rows Logic ---
        const rowsHtml = day.workouts.map(w => {
            const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            const sportType = w.actualSport || 'Other';
            const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "";
            
            // Status Logic (Completed, Missed, etc.)
            let statusIcon = ''; 
            let rowOpacity = 'opacity-100';
            let titleColor = 'text-slate-200';

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') {
                statusIcon = `<i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>`;
                titleColor = 'text-emerald-100 line-through decoration-emerald-500/50';
                rowOpacity = 'opacity-75';
            } else if (w.status === 'MISSED') {
                statusIcon = `<i class="fa-solid fa-circle-xmark text-red-500/50 text-lg"></i>`;
                titleColor = 'text-red-200/50';
            } else if (w.status === 'REST') {
                titleColor = 'text-slate-500 italic';
            }

            // Sport Icon Class (uses your existing styles.css classes like .icon-run)
            const iconClass = `icon-${sportType.toLowerCase()}`;
            
            return `
                <div class="group flex items-start gap-3 p-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors ${rowOpacity}">
                    <div class="mt-1 ${iconClass} text-lg w-6 text-center">
                        ${Formatters.getIconForSport(sportType)}
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h4 class="text-sm font-bold ${titleColor} truncate pr-2">${planName}</h4>
                            ${statusIcon}
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span class="font-mono">${w.plannedDuration > 0 ? Math.round(w.plannedDuration) + 'm' : ''}</span>
                            ${(w.tss > 0) ? `<span class="px-1.5 py-0.5 rounded bg-slate-700/50 text-[10px] text-slate-300">${w.tss} TSS</span>` : ''}
                        </div>
                        ${notes ? `<p class="text-[11px] text-slate-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">${notes}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // --- Assemble Card ---
        html += `
            <div class="rounded-xl overflow-hidden shadow-lg transition-all ${cardBorderClass}">
                <div class="px-4 py-2 bg-black/20 border-b border-slate-700/50 flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${dayNameFull}</span>
                    ${day.totalDuration > 0 ? `<span class="text-xs font-mono text-slate-500"><i class="fa-regular fa-clock mr-1"></i>${totalTimeStr}</span>` : ''}
                </div>
                
                <div class="flex flex-col">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-0 p-2">${html}</div>`;
}
