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
        const isToday = day.dateStr === todayStr;
        const dayNameFull = day.dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        // --- 1. HEADER LOGIC ---
        // The header is the "Cap" of the stack. It usually has neutral borders, 
        // but its bottom border will merge with the top border of the first workout.
        // To keep it clean, we give the header a generic slate border.
        let headerClass = "bg-slate-900 border-t-2 border-l-2 border-r-2 border-slate-700 rounded-t-xl p-2 px-4";
        
        // --- 2. ROW LOGIC ---
        const rowsHtml = day.workouts.map((w, index) => {
            const isLast = index === day.workouts.length - 1;
            const planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            const sportType = w.actualSport || 'Other';
            const notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No details provided.";
            
            // --- STATUS COLORS (THE CORE LOGIC) ---
            let statusText = w.status;
            let statusColor = "text-slate-400";
            let borderClass = ""; // We will build this string manually

            // Define colors
            const greenBorder = "border-emerald-500/60";
            const blueBorder = "border-blue-500/50";
            const redBorder = "border-red-500/60";
            const grayBorder = "border-slate-700/50";

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') {
                statusColor = "text-emerald-400";
                borderClass = greenBorder;
            } else if (w.status === 'MISSED') {
                statusColor = "text-red-400";
                borderClass = redBorder;
            } else if (w.status === 'PLANNED') {
                statusColor = "text-blue-400";
                borderClass = blueBorder;
            } else {
                // Rest or other
                borderClass = grayBorder;
            }

            // --- BORDER CONSTRUCTION ---
            // We apply border-2 to Left/Right to make the sides visible "card sides".
            // We apply border-t and border-b for the dividers.
            // Result: border-l-2 border-r-2 border-t border-b
            let fullBorderClasses = `border-l-2 border-r-2 border-t border-b ${borderClass}`;
            
            // Rounding logic: Only the LAST item gets rounded bottoms
            let roundClass = isLast ? "rounded-b-xl border-b-2" : ""; // thicker bottom for last item

            const sportColorClass = `icon-${sportType.toLowerCase()}`;

            return `
                <div class="flex items-start gap-4 p-4 ${fullBorderClasses} ${roundClass} bg-slate-800/20 hover:bg-slate-800/40 transition-colors mb-0">
                    
                    <div class="flex flex-col items-center min-w-[70px] border-r border-slate-700/30 pr-3">
                        <div class="flex items-baseline">
                            <span class="text-3xl font-bold text-white leading-none tracking-tight">
                                ${w.plannedDuration > 0 ? Math.round(w.plannedDuration) : '--'}
                            </span>
                            <span class="text-xs font-medium text-slate-400 ml-0.5">m</span>
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

        // --- ASSEMBLE STACK ---
        // Notice: The container has NO border. The children provide the borders.
        html += `
            <div class="flex flex-col h-full mb-4 shadow-lg filter drop-shadow-md">
                <div class="${headerClass} flex justify-between items-baseline">
                    <span class="text-[11px] font-bold text-slate-300 uppercase tracking-widest">${dayNameFull}</span>
                    ${isToday ? '<span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Today</span>' : ''}
                </div>
                
                <div class="flex flex-col">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">${html}</div>`;
}
