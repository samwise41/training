// js/views/dashboard/heatmaps.js
import { toLocalYMD, getSportColorVar } from './utils.js';

function buildGrid(data, start, end, title) {
    const map = {};
    data.forEach(d => { 
        const k = toLocalYMD(d.date);
        if (!map[k]) map[k] = { p: 0, a: 0 };
        map[k].p += d.plannedDuration;
        map[k].a += d.actualDuration;
    });

    let html = '';
    let curr = new Date(start);
    const today = new Date(); today.setHours(0,0,0,0);

    while (curr <= end) {
        const k = toLocalYMD(curr);
        const vals = map[k] || { p: 0, a: 0 };
        let color = 'bg-slate-800'; // Default Empty
        
        if (vals.a > 0) color = 'bg-emerald-500';
        else if (curr > today && vals.p > 0) color = 'bg-slate-600'; // Future Plan
        else if (curr <= today && vals.p > 0) color = 'bg-red-500/50'; // Missed

        html += `<div class="w-3 h-3 rounded-sm m-[1px] ${color}" title="${k}: Plan ${vals.p}m | Act ${vals.a}m"></div>`;
        curr.setDate(curr.getDate() + 1);
    }

    return `
    <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4 overflow-hidden">
        <h3 class="text-xs font-bold text-slate-400 uppercase mb-2">${title}</h3>
        <div class="flex flex-wrap gap-0.5 justify-center">${html}</div>
    </div>`;
}

export function renderHeatmaps(unifiedData) {
    const today = new Date();
    const end = new Date(today); end.setDate(today.getDate() + 7); // Show next week
    const start = new Date(today); start.setMonth(today.getMonth() - 6); // Last 6 months

    return `
        <div class="grid grid-cols-1 mt-8">
            ${buildGrid(unifiedData, start, end, "Consistency Heatmap")}
        </div>
    `;
}
