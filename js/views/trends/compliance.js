import { calculateStats } from './analysis.js';
import { getIconForType } from './utils.js';

const buildConcentricChart = (stats30, stats60, centerLabel = "Trend") => {
    const r1 = 15.9155; const c1 = 100; const dash1 = `${stats30.pct} ${100 - stats30.pct}`; const color1 = stats30.pct >= 80 ? '#22c55e' : (stats30.pct >= 50 ? '#eab308' : '#ef4444');
    const r2 = 10; const c2 = 2 * Math.PI * r2; const val2 = (stats60.pct / 100) * c2; const dash2 = `${val2} ${c2 - val2}`; const color2 = stats60.pct >= 80 ? '#15803d' : (stats60.pct >= 50 ? '#a16207' : '#b91c1c'); 
    return `<div class="flex flex-col items-center justify-center w-full py-2"><div class="relative w-[120px] h-[120px] mb-2"><svg width="100%" height="100%" viewBox="0 0 42 42" class="donut-svg"><circle cx="21" cy="21" r="${r1}" fill="none" stroke="#1e293b" stroke-width="3"></circle><circle cx="21" cy="21" r="${r2}" fill="none" stroke="#1e293b" stroke-width="3"></circle><circle cx="21" cy="21" r="${r1}" fill="none" stroke="${color1}" stroke-width="3" stroke-dasharray="${dash1}" stroke-dashoffset="25" stroke-linecap="round"></circle><circle cx="21" cy="21" r="${r2}" fill="none" stroke="${color2}" stroke-width="3" stroke-dasharray="${dash2}" stroke-dashoffset="${c2 * 0.25}" stroke-linecap="round"></circle></svg><div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">${centerLabel}</span></div></div><div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] w-full max-w-[160px]"><div class="text-right font-bold text-slate-400 flex items-center justify-end gap-1"><span class="w-1.5 h-1.5 rounded-full" style="background-color: ${color1}"></span> 30d</div><div class="font-mono text-white flex items-center gap-1 truncate">${stats30.pct}% <span class="text-slate-500 opacity-70">(${stats30.label})</span></div><div class="text-right font-bold text-slate-500 flex items-center justify-end gap-1"><span class="w-1.5 h-1.5 rounded-full" style="background-color: ${color2}"></span> 60d</div><div class="font-mono text-slate-300 flex items-center gap-1 truncate">${stats60.pct}% <span class="text-slate-600 opacity-70">(${stats60.label})</span></div></div></div>`;
};

const buildCombinedCard = (logData, title, type) => {
    const count30 = calculateStats(logData, type, 30, false); 
    const count60 = calculateStats(logData, type, 60, false);
    const dur30 = calculateStats(logData, type, 30, true); 
    const dur60 = calculateStats(logData, type, 60, true);
    return `<div class="kpi-card"><div class="kpi-header mb-2">${getIconForType(type)}<span class="kpi-title">${title}</span></div><div class="flex justify-around items-start"><div class="w-1/2 border-r border-slate-700 pr-2">${buildConcentricChart(count30, count60, "Count")}</div><div class="w-1/2 pl-2">${buildConcentricChart(dur30, dur60, "Time")}</div></div></div>`;
};

export const renderComplianceSection = (logData) => {
    return `<div class="kpi-grid mb-0">${buildCombinedCard(logData, "All Activities", "All")}${buildCombinedCard(logData, "Cycling", "Bike")}${buildCombinedCard(logData, "Running", "Run")}${buildCombinedCard(logData, "Swimming", "Swim")}</div>`;
};
