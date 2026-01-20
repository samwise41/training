// js/views/dashboard/progressWidget.js
import { getSportColorVar } from './utils.js';

export function renderProgressWidget(unifiedData) {
    // 1. Define Current Week Window
    const today = new Date(); today.setHours(0,0,0,0);
    const day = today.getDay();
    const monday = new Date(today); monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    
    // 2. Aggregate Stats
    const stats = { 
        Bike: { p: 0, a: 0 }, Run: { p: 0, a: 0 }, Swim: { p: 0, a: 0 }, Other: { p: 0, a: 0 }, All: { p: 0, a: 0 }
    };

    unifiedData.forEach(item => {
        if (item.date >= monday && item.date <= sunday) {
            // Determine Sport Category
            let s = 'Other';
            const type = String(item.activityType || item.actualSport || '').toLowerCase();
            if (type.includes('bike') || type.includes('ride')) s = 'Bike';
            else if (type.includes('run')) s = 'Run';
            else if (type.includes('swim')) s = 'Swim';

            // Add Values
            stats[s].p += item.plannedDuration;
            stats[s].a += item.actualDuration;
            stats.All.p += item.plannedDuration;
            stats.All.a += item.actualDuration;
        }
    });

    // 3. Render Helper
    const drawBar = (label, icon, s) => {
        const p = stats[s].p; const a = stats[s].a;
        if (p === 0 && a === 0) return ''; // Hide empty rows
        
        const pct = p > 0 ? Math.min(Math.round((a / p) * 100), 100) : 0;
        const color = getSportColorVar(s);
        
        return `
        <div class="mb-3">
            <div class="flex justify-between mb-1 text-xs font-bold text-slate-400">
                <div class="flex items-center gap-2"><i class="fa-solid ${icon}" style="color:${color}"></i> ${label}</div>
                <div>${Math.round(a)} / ${Math.round(p)}m</div>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500" style="width: ${pct}%; background-color: ${color}"></div>
            </div>
        </div>`;
    };

    return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-8">
        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Current Week Progress</div>
        ${drawBar('Total Volume', 'fa-chart-simple', 'All')}
        ${drawBar('Bike', 'fa-bicycle', 'Bike')}
        ${drawBar('Run', 'fa-person-running', 'Run')}
        ${drawBar('Swim', 'fa-person-swimming', 'Swim')}
    </div>`;
}
