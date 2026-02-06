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
            container.innerHTML = `<p class="text-slate-400 italic p-4">Unable to load schedule.</p>`;
        }
    }, 50);

    const loadingHtml = `<div id="planned-workouts-content" class="min-h-[100px] flex items-center justify-center text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Schedule...
    </div>`;

    return UI.buildCollapsibleSection('planned-workouts-section', 'Planned Workouts', loadingHtml, true);
}

/**
 * Groups flat workout list by Date
 */
function groupWorkoutsByDate(workouts) {
    const groups = {};

    workouts.forEach(w => {
        const dateKey = w.date; 
        if (!dateKey) return;

        if (!groups[dateKey]) {
            // Force Local Time parsing to avoid UTC offsets
            const [y, m, d] = dateKey.split('-').map(Number);
            const localDate = new Date(y, m - 1, d); 

            groups[dateKey] = {
                dateStr: dateKey,
                dateObj: localDate, 
                workouts: [],
                totalDuration: 0,
                isRestDay: true 
            };
        }
        
        groups[dateKey].workouts.push(w);
        
        const duration = parseFloat(w.plannedDuration) || 0;
        groups[dateKey].totalDuration += duration;
        
        if (w.status !== 'REST' && w.actualSport !== 'Rest') {
            groups[dateKey].isRestDay = false;
        }
    });

    return Object.values(groups).sort((a, b) => a.dateObj - b.dateObj);
}

/**
 * Generates the HTML
 */
function generateGroupedCardsHTML(groupedData) {
    if (!groupedData || groupedData.length === 0) return '<p class="text-slate-400 italic p-4">No workouts found.</p>';
    
    let html = '';
    
    // Calculate "Today"
    const d = new Date();
    const todayStr = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
    ].join('-');

    groupedData.forEach(day => {
        // --- Header Logic ---
        const isToday = day.dateStr === todayStr;
        const dayNameFull = day.dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        // Completion Logic (For the OUTER Card)
        const activeWorkouts = day.workouts.filter(w => w.status !== 'REST' && w.actualSport !== 'Rest');
        const completedCount = activeWorkouts.filter(w => w.status === 'COMPLETED' || w.status === 'UNPLANNED').length;
        
        // The day is strictly "Complete" only if ALL workouts are done
        const isDayComplete = activeWorkouts.length > 0 && activeWorkouts.length === completedCount;

        // --- Outer Card Styling ---
        let cardBorderClass = "border border-slate-700 bg-slate-900"; 
        
        if (isDayComplete) {
            // All Done -> Green Ring
            cardBorderClass = "ring-1 ring-emerald-500/50 bg-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
        } else if (isToday) {
            // Today (In Progress) -> Blue Ring
            cardBorderClass = "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-slate-900";
        }

        // --- Inner Workout Rows ---
        const rowsHtml = day.workouts.map(w => {
            const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            const sportType = w.actualSport || 'Other';
            const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No details provided.";
            
            // --- Individual Box Styling ---
            let statusText = w.status; 
            let statusColorClass = "text-slate-400"; 
            
            // Default Box: Slate (for Rest or Unknown)
            let boxClass = "border border-slate-700 bg-slate-800/50"; 

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') {
                statusColorClass = "text-emerald-400";
                // Green Box
                boxClass = "border border-emerald-500/40 bg-emerald-500/5 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]";
            } else if (w.status === 'MISSED') {
                statusColorClass = "text-red-400";
                // Red Box
                boxClass = "border border-red-500/40 bg-red-500/5";
            } else if (w.status === 'PLANNED') {
                statusColorClass = "text-blue-400";
                // Blue Box (Planned)
                boxClass = "border border-blue-500/40 bg-blue-500/5 border-dashed";
            }

            const sportColorClass = `icon-${sportType.toLowerCase()}`;

            return `
                <div class="${boxClass} rounded-lg p-3 mb-2 flex items-start gap-3 transition-all hover:brightness-110">
                    
                    <div class="flex flex-col items-center min-w-[60px] border-r border-slate-700/50 pr-2">
                        <div class="flex items-baseline">
                            <span class="text-2xl font-bold text-white leading-none">
                                ${w.plannedDuration > 0 ? Math.round(w.plannedDuration) : '--'}
                            </span>
                            <span class="text-[10px] font-medium text-slate-400 ml-0.5">m</span>
                        </div>
                        
                        <div class="text-[9px] font-bold uppercase tracking-wider mt-1 ${statusColorClass}">
                            ${statusText}
                        </div>

                        ${(w.actualDuration > 0 && w.plannedDuration > 0) ? 
                            `<div class="text-[9px] font-mono text-slate-300 mt-1 pt-1 border-t border-slate-700/50 w-full text-center">
                                Act: ${Math.round(w.actualDuration)}
                             </div>` : ''}
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1.5 ${sportColorClass}">
                            <div class="text-xs shrink-0">
                                ${Formatters.getIconForSport(sportType)}
                            </div>
                            <h4 class="text-xs font-bold leading-tight uppercase tracking-wide text-slate-100">${planName}</h4>
                        </div>

                        <div class="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-3">
                            ${notes}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // --- Assemble Final Card ---
        html += `
            <div class="rounded-xl overflow-hidden transition-all ${cardBorderClass} flex flex-col h-full min-h-[150px]">
                <div class="px-4 py-2 bg-slate-950/30 border-b border-slate-800 flex justify-between items-center">
                    <span class="text-[11px] font-bold text-slate-300 uppercase tracking-widest">${dayNameFull}</span>
                    
                    ${isDayComplete ? 
                        '<span class="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ALL DONE</span>' : ''
                    }
                </div>
                
                <div class="p-3 flex flex-col flex-1">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-0 p-2">${html}</div>`;
}
