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

function groupWorkoutsByDate(workouts) {
    const groups = {};
    workouts.forEach(w => {
        const dateKey = w.date; 
        if (!dateKey) return;
        if (!groups[dateKey]) {
            const [y, m, d] = dateKey.split('-').map(Number);
            groups[dateKey] = {
                dateStr: dateKey,
                dateObj: new Date(y, m - 1, d), 
                workouts: [],
                totalDuration: 0,
                isRestDay: true 
            };
        }
        groups[dateKey].workouts.push(w);
        groups[dateKey].totalDuration += (parseFloat(w.plannedDuration) || 0);
        if (w.status !== 'REST' && w.actualSport !== 'Rest') groups[dateKey].isRestDay = false;
    });
    return Object.values(groups).sort((a, b) => a.dateObj - b.dateObj);
}

function generateGroupedCardsHTML(groupedData) {
    if (!groupedData || groupedData.length === 0) return '<p class="text-slate-400 italic p-4">No workouts found.</p>';
    
    let html = '';
    
    // "Today" Helper
    const d = new Date();
    const todayStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

    groupedData.forEach(day => {
        // --- Header Logic ---
        const isToday = day.dateStr === todayStr;
        const dayNameFull = day.dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        // Completion Logic
        const activeWorkouts = day.workouts.filter(w => w.status !== 'REST' && w.actualSport !== 'Rest');
        const completedCount = activeWorkouts.filter(w => w.status === 'COMPLETED' || w.status === 'UNPLANNED').length;
        const isDayComplete = activeWorkouts.length > 0 && activeWorkouts.length === completedCount;

        // --- Header Colors (Overall Status) ---
        // Blue if Today/Incomplete, Green if All Done, Slate otherwise
        let headerClass = "bg-slate-900 border-t-2 border-l-2 border-r-2 border-slate-700";
        if (isDayComplete) {
            headerClass = "bg-slate-900 border-t-2 border-l-2 border-r-2 border-emerald-500/60 shadow-[0_-4px_10px_rgba(16,185,129,0.1)]";
        } else if (isToday) {
            headerClass = "bg-slate-900 border-t-2 border-l-2 border-r-2 border-blue-500/60 shadow-[0_-4px_10px_rgba(59,130,246,0.1)]";
        }

        // --- Rows Logic ---
        const rowsHtml = day.workouts.map((w, index) => {
            const isLast = index === day.workouts.length - 1;
            const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            const sportType = w.actualSport || 'Other';
            const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No details provided.";
            
            // --- STATUS COLORS (Individual Row) ---
            let statusText = w.status;
            let statusColor = "text-slate-400";
            let borderColor = "border-slate-700/50"; // Default Gray

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') {
                statusColor = "text-emerald-400";
                borderColor = "border-emerald-500/60";
            } else if (w.status === 'MISSED') {
                statusColor = "text-red-400";
                borderColor = "border-red-500/60";
            } else if (w.status === 'PLANNED') {
                statusColor = "text-blue-400";
                borderColor = "border-blue-500/50";
            }

            // --- BORDER CONSTRUCTION ---
            // 1. Left/Right borders are always 2px to create the "Card Side" look
            // 2. Bottom border is 1px for separators, 2px for the very bottom
            // 3. Top border is handled by the item above it (or the header)
            let borderClasses = `border-l-2 border-r-2 border-b ${borderColor}`;
            
            if (isLast) {
                // Thicker bottom border for the last item to close the card
                borderClasses = `border-l-2 border-r-2 border-b-2 rounded-b-xl ${borderColor}`;
            }

            const sportColorClass = `icon-${sportType.toLowerCase()}`;

            // --- HTML Structure ---
            // Note: mb-0 ensures they stack perfectly
            return `
                <div class="flex items-start gap-4 p-4 ${borderClasses} bg-slate-800/20 hover:bg-slate-800/40 transition-colors mb-0">
                    
                    <div class="flex flex-col items-center min-w-[70px] border-r border-slate-700/30 pr-3">
                        <div class="flex items-baseline">
                            <span class="text-3xl font-bold text-white leading-none tracking-tight">
                                ${w.plannedDuration > 0 ? Math.round(w.plannedDuration) : '--'}
                            </span>
                            <span class="text-xs font-medium text-slate-400 ml-0.5">min</span>
                        </div>
                        <div class="text-[9px] font-bold uppercase tracking-wider mt-1 ${statusColor} text-center">
                            ${statusText}
                        </div>
                        ${(w.actualDuration > 0 && w.plannedDuration > 0) ? 
                            `<div class="text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-700/30 w-full text-center">
                                Act: ${Math.round(w.actualDuration)}
                             </div>` : ''}
                    </div>

                    <div class="flex-1 min-w-0 pt-0.5">
                        <div class="flex items-center gap-2 mb-2 ${sportColorClass}">
                            <div class="text-sm w-5 text-center mt-0.5 shrink-0">
                                ${Formatters.getIconForSport(sportType)}
                            </div>
                            <h4 class="text-sm font-bold leading-tight uppercase tracking-wide text-slate-200">${planName}</h4>
                        </div>
                        <div class="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3" title="${notes}">
                            ${notes}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // --- ASSEMBLE CARD ---
        // Header + Stacked Body. The header has rounded-t, the last item has rounded-b.
        html += `
            <div class="flex flex-col h-full mb-0 filter drop-shadow-sm">
                <div class="${headerClass} rounded-t-xl px-4 py-2 flex justify-between items-center z-10 relative">
                    <span class="text-[11px] font-bold text-slate-300 uppercase tracking-widest">${dayNameFull}</span>
                    ${isToday ? '<span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Today</span>' : ''}
                </div>
                
                <div class="flex flex-col -mt-[1px]"> ${rowsHtml}
                </div>
            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">${html}</div>`;
}
