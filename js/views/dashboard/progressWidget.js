import { getSportColorVar } from './utils.js';

export function renderProgressWidget() {
    // 1. Placeholder while loading
    const loadingHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-pulse">
            <div class="bg-slate-800 h-24 rounded-xl"></div>
            <div class="bg-slate-800 h-24 rounded-xl"></div>
            <div class="bg-slate-800 h-24 rounded-xl"></div>
            <div class="bg-slate-800 h-24 rounded-xl"></div>
        </div>`;
        
    // Insert placeholder immediately if container exists
    setTimeout(async () => {
        const container = document.getElementById('progress-widget-container');
        if (!container) return;
        
        try {
            const response = await fetch('data/dashboard/plannedWorkouts.json');
            if (!response.ok) throw new Error("Data not found");
            
            const data = await response.json();
            container.innerHTML = generateWidgetHTML(data);
            
        } catch (error) {
            console.error("Widget Error:", error);
            container.innerHTML = ''; // Hide on error
        }
    }, 50);

    return `<div id="progress-widget-container">${loadingHtml}</div>`;
}

function generateWidgetHTML(data) {
    if (!data || data.length === 0) return '';

    // --- 1. Date Setup ---
    const today = new Date();
    // Normalize to Monday of current week
    const day = today.getDay(); 
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const currentWeekMonday = new Date(today.setDate(diff));
    currentWeekMonday.setHours(0,0,0,0);
    
    // Helper: Get "Week Key" (YYYY-Www) for grouping
    const getWeekKey = (dateStr) => {
        const d = new Date(dateStr);
        d.setHours(0,0,0,0);
        const dDay = d.getDay();
        const dDiff = d.getDate() - dDay + (dDay === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(dDiff);
        return `${monday.getFullYear()}-${monday.getMonth()+1}-${monday.getDate()}`;
    };

    const thisWeekKey = getWeekKey(new Date().toISOString());

    // --- 2. Process Data ---
    const weeks = {};

    data.forEach(w => {
        const key = getWeekKey(w.date);
        if (!weeks[key]) weeks[key] = { planned: 0, actual: 0, completedCount: 0, totalCount: 0, missed: false };
        
        // Sum Duration
        weeks[key].planned += (w.plannedDuration || 0);
        weeks[key].actual += (w.actualDuration || 0);
        
        // Check Status (Only count "real" workouts, ignore Rest days for failure check)
        if (w.plannedDuration > 0) {
            weeks[key].totalCount++;
            if (w.status === 'COMPLETED' || w.actualDuration >= (w.plannedDuration * 0.8)) {
                weeks[key].completedCount++;
            } else if (w.status === 'MISSED') {
                weeks[key].missed = true;
            }
        }
    });

    // --- 3. Current Week Stats ---
    const currentWeek = weeks[thisWeekKey] || { planned: 0, actual: 0 };
    const adherencePct = currentWeek.planned > 0 
        ? Math.round((currentWeek.actual / currentWeek.planned) * 100) 
        : 0;

    // --- 4. Streak Calculation (Lookback) ---
    // Sort weeks descending (newest first)
    const sortedWeeks = Object.keys(weeks).sort((a, b) => new Date(b) - new Date(a));
    
    let volumeStreak = 0;
    let perfectStreak = 0;

    // Skip "This Week" for streak calculation (since it's not done yet), 
    // start from Last Week.
    for (let i = 0; i < sortedWeeks.length; i++) {
        if (sortedWeeks[i] === thisWeekKey) continue; // Skip current incomplete week

        const w = weeks[sortedWeeks[i]];
        
        // Volume Streak Logic (>90% volume hit)
        if (w.planned > 0 && (w.actual / w.planned) >= 0.90) {
            volumeStreak++;
        } else {
            break; // Streak broken
        }
    }

    // Perfect Streak Logic (No missed workouts)
    for (let i = 0; i < sortedWeeks.length; i++) {
        if (sortedWeeks[i] === thisWeekKey) continue;
        const w = weeks[sortedWeeks[i]];
        
        if (!w.missed && w.totalCount > 0 && w.completedCount === w.totalCount) {
            perfectStreak++;
        } else {
            break;
        }
    }

    // --- 5. Formatting Helpers ---
    const getStreakColor = (val) => val > 3 ? 'text-emerald-400' : (val > 0 ? 'text-blue-400' : 'text-slate-500');
    const complianceColor = adherencePct >= 100 ? 'text-emerald-400' : (adherencePct >= 80 ? 'text-blue-400' : 'text-yellow-400');
    
    // --- 6. HTML Output ---
    return `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            
            <div class="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 relative overflow-hidden group">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Weekly Compliance</span>
                <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-bold ${complianceColor} tracking-tight">${adherencePct}%</span>
                </div>
                <div class="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div class="bg-emerald-500 h-full rounded-full transition-all duration-1000" style="width: ${Math.min(adherencePct, 100)}%"></div>
                </div>
            </div>

            <div class="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 relative overflow-hidden group">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Volume</span>
                <div class="flex flex-col">
                    <div class="flex items-baseline gap-1">
                        <span class="text-3xl font-bold text-white tracking-tight">${Math.round(currentWeek.actual)}</span>
                        <span class="text-sm text-slate-400 font-mono">min</span>
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1">Target: ${Math.round(currentWeek.planned)} min</span>
                </div>
            </div>

            <div class="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 relative overflow-hidden group">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Perfect Weeks</span>
                <div class="flex items-center gap-3 mt-1">
                    <i class="fa-solid fa-calendar-check text-2xl ${getStreakColor(perfectStreak)} opacity-80"></i>
                    <span class="text-3xl font-bold text-white tracking-tight">${perfectStreak}</span>
                </div>
                <span class="text-[10px] text-slate-500 absolute bottom-3 right-4">Streak</span>
            </div>

            <div class="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 relative overflow-hidden group">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Volume Streak</span>
                <div class="flex items-center gap-3 mt-1">
                    <i class="fa-solid fa-fire text-2xl ${getStreakColor(volumeStreak)} opacity-80"></i>
                    <span class="text-3xl font-bold text-white tracking-tight">${volumeStreak}</span>
                </div>
                <span class="text-[10px] text-slate-500 absolute bottom-3 right-4">>90% Vol</span>
            </div>

        </div>
    `;
}
