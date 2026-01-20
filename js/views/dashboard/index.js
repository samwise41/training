// js/views/dashboard/index.js

// --- 1. UTILITY: FORMATTING & PARSING ---
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// --- 2. LOGIC: MERGE PLANNED & COMPLETED ---
const mergeWorkouts = (planned, logs) => {
    const merged = [];
    const logMap = {};

    // Map logs by Date for quick lookup (YYYY-MM-DD)
    // We only take the FIRST log per day per sport to avoid complexity for now
    logs.forEach(l => {
        const dateKey = l.date.split('T')[0];
        if (!logMap[dateKey]) logMap[dateKey] = [];
        logMap[dateKey].push(l);
    });

    // 1. Process PLANNED workouts
    planned.forEach(p => {
        const pDate = p.date;
        const matchingLogs = logMap[pDate];
        
        let match = null;

        // Try to find a log that matches the sport type
        if (matchingLogs) {
            match = matchingLogs.find(l => {
                const pType = (p.type || "").toLowerCase();
                const lType = (l.actualSport || l.activityType || "").toLowerCase();
                // Simple fuzzy match
                return (pType.includes('run') && lType.includes('run')) ||
                       (pType.includes('bike') && (lType.includes('bike') || lType.includes('cycl'))) ||
                       (pType.includes('swim') && lType.includes('swim'));
            });
        }

        if (match) {
            // MERGE: Plan + Actual
            merged.push({
                status: 'completed',
                date: pDate,
                day: getDayName(pDate),
                type: p.type,
                title: p.title || match.title,
                planDur: p.duration,
                actDur: match.actualDuration || match.duration, // Handle various log formats
                details: p.details, // Keep the markdown details from the plan
                file: match.fileName // If you have it
            });
            // Mark log as used so we don't duplicate it later (optional, simplistic approach)
            match._used = true;
        } else {
            // NO MATCH: Plan only
            merged.push({
                status: 'planned',
                date: pDate,
                day: getDayName(pDate),
                type: p.type,
                title: p.title,
                planDur: p.duration,
                actDur: 0,
                details: p.details
            });
        }
    });

    // 2. (Optional) Add Unplanned Logs? 
    // For the dashboard "Upcoming/Weekly" view, we usually just stick to the plan schedule.
    // If you want to see unplanned workouts, we'd iterate logMap here for !l._used.
    
    // Sort by Date
    return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
};


// --- 3. COMPONENT: STATUS CARD ---
const renderCard = (w) => {
    const isDone = w.status === 'completed';
    const borderColor = isDone ? 'border-emerald-500' : 'border-blue-500';
    const bgColor = isDone ? 'bg-emerald-900/10' : 'bg-blue-900/10';
    const textColor = isDone ? 'text-emerald-400' : 'text-blue-400';
    const label = isDone ? 'COMPLETED' : 'PLANNED';
    
    // Icon Logic
    let icon = 'fa-dumbbell';
    if (w.type.toLowerCase().includes('run')) icon = 'fa-person-running';
    if (w.type.toLowerCase().includes('bike')) icon = 'fa-person-biking';
    if (w.type.toLowerCase().includes('swim')) icon = 'fa-person-swimming';

    // Duration Display
    let durHtml = '';
    if (isDone) {
        durHtml = `<span class="text-3xl font-bold text-white">${w.actDur}</span><span class="text-sm text-slate-400 ml-1">min</span> <span class="text-xs text-slate-500">/ ${w.planDur}m plan</span>`;
    } else {
        durHtml = `<span class="text-3xl font-bold text-white">${w.planDur}</span><span class="text-sm text-slate-400 ml-1">min</span>`;
    }

    // Markdown content parsing (simple)
    const renderMarkdown = (text) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded text-orange-300">$1</code>') // Code
            .replace(/\n/g, '<br>');
    };

    return `
    <div class="relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-5 transition-all hover:shadow-lg hover:shadow-${isDone ? 'emerald' : 'blue'}-900/20">
        <div class="flex justify-between items-start mb-4">
            <div>
                <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">${w.day.toUpperCase()}</div>
                ${durHtml}
            </div>
            <div class="text-right">
                <i class="fa-solid ${icon} ${textColor} text-xl mb-1"></i>
                <div class="text-[10px] font-bold ${textColor} border border-${isDone ? 'emerald' : 'blue'}-500/30 px-2 py-0.5 rounded bg-slate-900/40">${label}</div>
            </div>
        </div>
        
        <h4 class="text-lg font-bold text-white mb-2 leading-tight">${w.title}</h4>
        
        <div class="text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-3 mt-3">
            ${renderMarkdown(w.details)}
        </div>
    </div>
    `;
};


// --- 4. MAIN RENDER FUNCTION ---
export function renderDashboard(plannedData, logData, planMd) {
    if (!plannedData || !Array.isArray(plannedData)) {
        return `<div class="p-8 text-center text-slate-500">No planned workouts found.</div>`;
    }

    // 1. Filter for THIS WEEK (Optional, keeps the dashboard focused)
    // For now, let's just grab the next 7 days of plans or recent ones
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Sort planned data just in case
    plannedData.sort((a,b) => new Date(a.date) - new Date(b.date));

    // Simple view: Show Future Plans + Past 2 Days
    const visiblePlans = plannedData.filter(p => {
        const d = new Date(p.date);
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        return diff >= -2 && diff <= 5; // Show yesterday/today + next 5 days
    });

    // 2. Merge Data
    const displayWorkouts = mergeWorkouts(visiblePlans, logData || []);

    // 3. Generate HTML
    const cardsHtml = displayWorkouts.map(w => renderCard(w)).join('');

    return `
        <div class="max-w-7xl mx-auto pb-12">
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-blue-500/20 p-2 rounded-lg">
                    <i class="fa-solid fa-calendar-week text-blue-400 text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white">Weekly Schedule</h2>
                    <p class="text-xs text-slate-400">Your upcoming training block</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${cardsHtml}
            </div>
        </div>
    `;
}
