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
            // FIX: Force Local Time parsing
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
        
        // Completion Logic (Outer Card)
        const activeWorkouts = day.workouts.filter(w => w.status !== 'REST' && w.actualSport !== 'Rest');
        const completedCount = activeWorkouts.filter(w => w.status === 'COMPLETED' || w.status === 'UNPLANNED').length;
        const isDayComplete = activeWorkouts.length > 0 && activeWorkouts.length === completedCount;

        // --- Outer Card Border ---
        let cardBorderClass = "border border-slate-700 bg-slate-900"; 
        
        if (isDayComplete) {
            cardBorderClass = "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900 bg-slate-900";
        } else if (isToday) {
            cardBorderClass = "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 bg-slate-900";
        }

        // --- Workout Rows ---
        const rowsHtml = day.workouts.map(w => {
            const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            const sportType = w.actualSport || 'Other';
            const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No details provided.";
            
            // --- BOX BORDER LOGIC ---
            // Here is the "Box" logic you requested:
            let statusColorClass = "text-slate-400";
            let boxBorderClass = "border border-slate-700/50"; // Default (Rest/Neutral)

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') {
                statusColorClass = "text-emerald-400";
                boxBorderClass = "border-2 border-emerald-500/50 bg-emerald-500/5"; // Green Box
            } else if (w.status === 'PLANNED') {
                statusColorClass = "text-blue-400";
                boxBorderClass = "border-2 border-blue-500/40 bg-blue-500/5"; // Blue Box
            } else if (w.status === 'MISSED') {
                statusColorClass = "text-red-400";
                boxBorderClass = "border-2 border-red-500/50 bg-red-500/5"; // Red Box
            }

            const sportColorClass = `icon-${sportType.toLowerCase()}`;

            return `
                <div class="flex items-start gap-4 p-3 mb-2 rounded-lg ${boxBorderClass} hover:bg-slate-800/50 transition-colors">
                    
                    <div class="flex flex-col items-start min-w-[85px] border-r border-slate-700/50 pr-3">
                        <div class="flex items-baseline">
                            <span class="text-3xl font-bold text-white leading-none tracking-tight">
                                ${w.plannedDuration > 0 ? Math.round(w.plannedDuration) : '--'}
                            </span>
                            <span class="text-xs font-medium text-slate-400 ml-0.5">m</span>
                        </div>
                        
                        <div class="text-[10px] font-bold uppercase tracking-wider mt-1 ${statusColorClass} break-words w-full">
                            ${w.status}
                        </div>

                        ${(w.actualDuration > 0 && w.plannedDuration > 0) ? 
                            `<div class="text-[10px] font-mono text-slate-300 mt-2 pt-2 border-t border-slate-700/50 w-full">
                                <div>Act: ${Math.round(w.actualDuration)}m</div>
                             </div>` : ''}
                    </div>

                    <div class="flex-1 min-w-0 pt-0.5">
                        <div class="flex items-start gap-2 mb-2 ${sportColorClass}">
                            <div class="text-sm w-5 text-center mt-0.5 shrink-0">
                                ${Formatters.getIconForSport(sportType)}
                            </div>
                            <h4 class="text-sm font-bold leading-tight uppercase tracking-wide">${planName}</h4>
                        </div>

                        <div class="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                            ${notes}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // --- Assemble Card ---
        html += `
            <div class="rounded-xl overflow-hidden shadow-lg transition-all ${cardBorderClass} flex flex-col h-full min-h-[180px]">
                <div class="px-4 py-1.5 bg-slate-900/60 border-b border-slate-700 flex justify-between items-center backdrop-blur-sm">
                    <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">${dayNameFull}</span>
                </div>
                
                <div class="p-2 flex flex-col flex-1">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-0 p-2">${html}</div>`;
}
