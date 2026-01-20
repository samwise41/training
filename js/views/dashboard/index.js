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

const parseDur = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = val.toString().toLowerCase();
    let mins = 0;
    if (str.includes('h')) {
        const parts = str.split('h');
        mins += parseInt(parts[0]) * 60;
        if (parts[1] && parts[1].includes('m')) mins += parseInt(parts[1]);
    } else if (str.includes('m')) {
        mins += parseInt(str);
    } else {
        mins = parseInt(str);
    }
    return isNaN(mins) ? 0 : mins;
};

// --- 2. LOGIC: MERGE PLANNED & COMPLETED ---
const mergeWorkouts = (planned, logs) => {
    const merged = [];
    const logMap = {};

    // Map logs by Date (YYYY-MM-DD)
    logs.forEach(l => {
        if (!l.date) return;
        const dateKey = l.date.split('T')[0];
        if (!logMap[dateKey]) logMap[dateKey] = [];
        logMap[dateKey].push(l);
    });

    // Process PLANNED workouts
    planned.forEach(p => {
        const pDate = p.date;
        const matchingLogs = logMap[pDate];
        let match = null;

        if (matchingLogs) {
            match = matchingLogs.find(l => {
                const pType = (p.type || "").toLowerCase();
                const lType = (l.actualSport || l.activityType || "").toLowerCase();
                return (pType.includes('run') && lType.includes('run')) ||
                       (pType.includes('bike') && (lType.includes('bike') || lType.includes('cycl'))) ||
                       (pType.includes('swim') && lType.includes('swim'));
            });
        }

        if (match) {
            // MERGE: Show as Completed (Green)
            merged.push({
                status: 'completed',
                date: pDate,
                day: getDayName(pDate),
                type: p.type || "Workout",
                title: p.title || match.title,
                planDur: parseDur(p.duration),
                actDur: parseDur(match.actualDuration || match.duration),
                details: p.details,
                tss: match.trainingStressScore || 0
            });
        } else {
            // NO MATCH: Show as Planned (Blue)
            merged.push({
                status: 'planned',
                date: pDate,
                day: getDayName(pDate),
                type: p.type || "Workout",
                title: p.title,
                planDur: parseDur(p.duration),
                actDur: 0,
                details: p.details,
                tss: 0
            });
        }
    });

    return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
};

// --- 3. COMPONENT: STATS & HEATMAP ---
const renderStatsRow = (logs) => {
    // Calculate last 7 days stats
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    
    const recentLogs = logs.filter(l => new Date(l.date) >= weekAgo);
    const totalTime = recentLogs.reduce((sum, l) => sum + parseDur(l.actualDuration || l.duration), 0);
    const totalTSS = recentLogs.reduce((sum, l) => sum + (l.trainingStressScore || 0), 0);
    const runDist = recentLogs
        .filter(l => (l.actualSport || "").toLowerCase().includes('run'))
        .reduce((sum, l) => sum + (parseFloat(l.totalDistance) || 0), 0);

    // Convert meters to miles roughly if needed, or keep raw
    const distDisplay = runDist > 100 ? (runDist / 1609.34).toFixed(1) + " mi" : runDist.toFixed(1) + " km";

    const card = (icon, title, val, sub, color) => `
        <div class="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
            <div class="w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div>
                <div class="text-xs text-slate-400 uppercase font-bold">${title}</div>
                <div class="text-xl font-black text-white">${val}</div>
                <div class="text-[10px] text-slate-500">${sub}</div>
            </div>
        </div>`;

    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            ${card('fa-stopwatch', '7d Volume', Math.round(totalTime/60) + 'h ' + (totalTime%60) + 'm', 'Training Duration', 'bg-blue-500')}
            ${card('fa-fire', '7d Load', Math.round(totalTSS), 'TSS Accumulated', 'bg-purple-500')}
            ${card('fa-person-running', 'Run Dist', distDisplay, 'Last 7 Days', 'bg-emerald-500')}
        </div>
    `;
};

const renderHeatmap = (logs) => {
    // Simple 30-day consistency visualization
    const days = [];
    const today = new Date();
    for(let i=29; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        
        const dayLogs = logs.filter(l => l.date && l.date.startsWith(dateKey));
        const hasActivity = dayLogs.length > 0;
        const color = hasActivity ? 'bg-emerald-500' : 'bg-slate-700/50';
        
        days.push(`<div class="w-full aspect-square rounded-sm ${color} opacity-80 hover:opacity-100 transition-opacity" title="${dateKey}"></div>`);
    }

    return `
        <div class="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-6">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">30-Day Consistency</h3>
                <span class="text-[10px] text-slate-500">More Green = Better</span>
            </div>
            <div class="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
                ${days.join('')}
            </div>
        </div>
    `;
};

// --- 4. COMPONENT: WORKOUT CARD ---
const renderCard = (w) => {
    const isDone = w.status === 'completed';
    const borderColor = isDone ? 'border-emerald-500' : 'border-blue-500';
    const bgColor = isDone ? 'bg-emerald-900/10' : 'bg-blue-900/10';
    const textColor = isDone ? 'text-emerald-400' : 'text-blue-400';
    const label = isDone ? 'COMPLETED' : 'PLANNED';
    
    const typeStr = (w.type || "").toLowerCase();
    let icon = 'fa-dumbbell'; 
    if (typeStr.includes('run')) icon = 'fa-person-running';
    if (typeStr.includes('bike')) icon = 'fa-person-biking';
    if (typeStr.includes('swim')) icon = 'fa-person-swimming';

    // Markdown Parser
    const renderMarkdown = (text) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded text-orange-300 font-mono text-[10px]">$1</code>')
            .replace(/\n/g, '<br>');
    };

    let durHtml = isDone 
        ? `<span class="text-2xl font-bold text-white">${w.actDur}</span><span class="text-xs text-slate-400 ml-1">min</span> <span class="text-[10px] text-slate-500">/ ${w.planDur}m</span>`
        : `<span class="text-2xl font-bold text-white">${w.planDur}</span><span class="text-xs text-slate-400 ml-1">min</span>`;

    return `
    <div class="relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-5 transition-all hover:shadow-lg hover:shadow-${isDone ? 'emerald' : 'blue'}-900/20 flex flex-col h-full">
        <div class="flex justify-between items-start mb-3">
            <div>
                <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">${w.day.toUpperCase()}</div>
                ${durHtml}
            </div>
            <div class="text-right">
                <i class="fa-solid ${icon} ${textColor} text-xl mb-1"></i>
                <div class="text-[9px] font-bold ${textColor} border border-${isDone ? 'emerald' : 'blue'}-500/30 px-2 py-0.5 rounded bg-slate-900/40">${label}</div>
            </div>
        </div>
        
        <h4 class="text-sm font-bold text-white mb-2 leading-tight min-h-[40px]">${w.title}</h4>
        
        <div class="text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-3 mt-auto">
            ${renderMarkdown(w.details)}
        </div>
    </div>
    `;
};

// --- 5. MAIN RENDER FUNCTION ---
export function renderDashboard(plannedData, logData, planMd) {
    if (!plannedData || !Array.isArray(plannedData)) {
        return `<div class="p-8 text-center text-slate-500">No planned workouts found.</div>`;
    }

    // 1. Calculate Date Range (Yesterday + Next 5 days)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Sort plans
    plannedData.sort((a,b) => new Date(a.date) - new Date(b.date));

    // Filter relevant plans
    const visiblePlans = plannedData.filter(p => {
        if (!p.date) return false;
        const d = new Date(p.date);
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 5; 
    });

    // 2. Merge Data (The Fix)
    const displayWorkouts = mergeWorkouts(visiblePlans, logData || []);

    // 3. Render Components
    const statsHtml = renderStatsRow(logData || []);
    const heatmapHtml = renderHeatmap(logData || []);
    const cardsHtml = displayWorkouts.map(w => renderCard(w)).join('');

    return `
        <div class="max-w-7xl mx-auto pb-12 space-y-6">
            <div>
                <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-chart-line text-blue-400"></i> Dashboard
                </h2>
                ${statsHtml}
                ${heatmapHtml}
            </div>

            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-calendar-day text-blue-400"></i>
                        <h3 class="text-lg font-bold text-white">Training Schedule</h3>
                    </div>
                    <span class="text-xs text-slate-500">Upcoming 7 Days</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${cardsHtml}
                </div>
            </div>
        </div>
    `;
}
