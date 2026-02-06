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
                const todayCard = container.querySelector('.ring-offset-slate-900'); 
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

/**
 * Returns the border color class based on status
 */
function getStatusBorderColor(status) {
    if (status === 'COMPLETED' || status === 'UNPLANNED') return "border-emerald-500";
    if (status === 'MISSED') return "border-red-500";
    if (status === 'PLANNED') return "border-blue-500"; 
    return "border-slate-700";
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
        
        // Overall Day Status
        const activeWorkouts = day.workouts.filter(w => w.status !== 'REST' && w.actualSport !== 'Rest');
        const completedCount = activeWorkouts.filter(w => w.status === 'COMPLETED' || w.status === 'UNPLANNED').length;
        const isDayComplete = activeWorkouts.length > 0 && activeWorkouts.length === completedCount;

        // 1. Header Border Colors (Top/Left/Right)
        // If day is complete -> Green. If day is Today (incomplete) -> Blue. Else -> Slate.
        let headerBorderColor = "border-slate-700";
        let shadowClass = "";
        
        if (isDayComplete) {
            headerBorderColor = "border-emerald-500";
            shadowClass = "shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]";
        } else if (isToday) {
            headerBorderColor = "border-blue-500";
            shadowClass = "shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]";
        }

        // --- Header HTML ---
        // bg-slate-950 matches the dark background in your screenshot
        const headerHtml = `
            <div class="bg-slate-950 rounded-t-xl px-4 py-2 flex justify-between items-center z-10 relative border-t-2 border-l-2 border-r-2 border-b-0 ${headerBorderColor} ${shadowClass} flex-none">
                <span class="text-[11px] font-bold text-slate-300 uppercase tracking-widest">${dayNameFull}</span>
                ${isToday ? '<span class="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-blue-500/30">Today</span>' : ''}
            </div>
        `;

        // --- Rows Logic ---
        const rowsHtml = day.workouts.map((w, index) => {
            const isLast = index === day.workouts.length - 1;
            
            // Formatting
            const sportType = w.actualSport || 'Other';
            
            // Dynamic Sport Color Class (e.g. icon-run, icon-bike)
            const sportClass = `icon-${sportType.toLowerCase()}`;
            
            // Title Parsing: Colorize [SPORT] tag using the dynamic class
            let planName = w.plannedWorkout || (w.status === 'REST' ? 'Rest Day' : 'Workout');
            
            // Wrap [SPORT] in a span that uses the generic icon class for color
            planName = planName.replace(/\[(.*?)\]/g, (match) => {
                return `<span class="${sportClass} font-bold">${match}</span>`;
            });

            // Notes Parsing
            let notes = w.notes ? w.notes.replace(/\[.*?\]/g, '').trim() : "No details provided.";
            notes = notes.replace(/\*\*(.*?)\*\*/g, '<span class="text-slate-200 font-semibold">$1</span>');

            // --- Status Colors ---
            let statusText = w.status;
            let statusTextColor = "text-slate-400";
            const myBorderColor = getStatusBorderColor(w.status);

            if (w.status === 'COMPLETED' || w.status === 'UNPLANNED') statusTextColor = "text-emerald-400";
            else if (w.status === 'MISSED') statusTextColor = "text-red-400";
            else if (w.status === 'PLANNED') statusTextColor = "text-blue-400";

            // --- Stack Borders ---
            // Left/Right/Top/Bottom borders are colored by THIS item's status.
            // border-t ensures a crisp line separating it from the item above.
            // border-b ensures a crisp line separating it from the item below.
            let borderClasses = `border-l-2 border-r-2 border-t border-b ${myBorderColor}`;
            
            // Rounding & Height Logic for Last Item
            let extraClasses = "";
            if (isLast) {
                borderClasses = borderClasses.replace("border-b", "border-b-2"); // Thicker bottom for end
                extraClasses = "rounded-b-xl flex-grow"; // flex-grow fills the remaining height
            }

            const iconHtml = Formatters.getIconForSport(sportType);
            const statusLabel = w.status === 'COMPLETED' ? 'COMPLETED' : w.status;

            // Row HTML
            return `
                <div class="flex items-start gap-4 p-4 ${borderClasses} ${extraClasses} bg-slate-950 hover:bg-slate-900 transition-colors mb-0 -mt-[0px]">
                    
                    <div class="flex flex-col items-center min-w-[70px] border-r border-slate-800 pr-3">
                        <div class="flex items-baseline">
                            <span class="text-3xl font-bold text-white leading-none tracking-tight">
                                ${w.plannedDuration > 0 ? Math.round(w.plannedDuration) : '--'}
                            </span>
                            <span class="text-xs font-medium text-slate-500 ml-0.5">min</span>
                        </div>
                        <div class="text-[9px] font-bold uppercase tracking-wider mt-1 ${statusTextColor} text-center">
                            ${statusLabel}
                        </div>
                        ${(w.actualDuration > 0 && w.plannedDuration > 0) ? 
                            `<div class="text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800 w-full text-center">
                                Act: ${Math.round(w.actualDuration)}
                                ${w.compliance ? `<div class="mt-0.5 opacity-70">${w.compliance}%</div>` : ''}
                             </div>` : ''}
                    </div>

                    <div class="flex-1 min-w-0 pt-0.5">
                        <div class="flex items-center gap-2 mb-1.5">
                            <div class="text-sm w-5 text-center shrink-0 ${sportClass}">
                                ${iconHtml}
                            </div>
                            <h4 class="text-sm font-bold leading-tight uppercase tracking-wide text-white">${planName}</h4>
                        </div>
                        <div class="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
                            ${notes}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // --- ASSEMBLE CARD ---
        // h-full on wrapper ensures equal height cards in the grid
        html += `
            <div class="flex flex-col h-full mb-0 filter drop-shadow-lg">
                ${headerHtml}
                <div class="flex flex-col flex-1">
                    ${rowsHtml}
                </div>
            </div>
        `;
    });

    // Grid Container needs items-stretch (default) to ensure equal height columns
    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 pb-10 auto-rows-fr">${html}</div>`;
}
