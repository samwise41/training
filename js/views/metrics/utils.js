// js/views/metrics/utils.js
import { SPORT_IDS, METRIC_DEFINITIONS } from './definitions.js';

// --- DATA HELPERS ---

export const checkSport = (activity, sportKey) => {
    // 1. Try ID Match (Old Way)
    const typeId = activity.activityType?.typeId || activity.sportTypeId;
    const parentId = activity.activityType?.parentTypeId;
    
    if (SPORT_IDS[sportKey] && (SPORT_IDS[sportKey].includes(typeId) || SPORT_IDS[sportKey].includes(parentId))) {
        return true;
    }

    // 2. String Match (New Way for training_log.json)
    // Checks 'activityType' or 'actualSport' for string inclusion
    const typeStr = String(activity.activityType || activity.actualSport || activity.actualType || "").toUpperCase();
    const key = sportKey.toUpperCase();
    
    if (key === 'BIKE' && (typeStr.includes('BIKE') || typeStr.includes('CYCL') || typeStr.includes('RIDE'))) return true;
    if (key === 'RUN' && typeStr.includes('RUN')) return true;
    if (key === 'SWIM' && typeStr.includes('SWIM')) return true;
    
    return false;
};

export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        const tss = parseFloat(d.trainingStressScore || d.tss || 0);
        if (tss === 0) return;
        
        const date = new Date(d.date);
        const day = date.getDay(); 
        const diff = date.getDate() - day + (day === 0 ? 0 : 7); 
        const weekEnd = new Date(date.setDate(diff));
        weekEnd.setHours(0,0,0,0);
        const key = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += tss;
    });
    
    return Object.keys(weeks).sort().map(k => ({
        date: new Date(k),
        dateStr: `Week Ending ${k}`,
        name: "Weekly Load",
        val: weeks[k],
        breakdown: `Total TSS: ${Math.round(weeks[k])}`
    }));
};

export const calculateTrend = (dataPoints) => {
    const n = dataPoints.length;
    if (n < 3) return null;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i; sumY += dataPoints[i].val;
        sumXY += i * dataPoints[i].val; sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, startVal: intercept, endVal: intercept + slope * (n - 1) };
};

export const getTrendIcon = (slope, invert) => {
    if (Math.abs(slope) < 0.001) return { icon: 'fa-arrow-right', color: 'text-slate-500' };
    const isUp = slope > 0;
    const isGood = invert ? !isUp : isUp;
    return {
        icon: isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down',
        color: isGood ? 'text-emerald-400' : 'text-red-400'
    };
};

// --- UI COMPONENT BUILDERS ---
export const buildCollapsibleSection = (id, title, contentHtml, isOpen = true) => {
    const contentClasses = isOpen ? "max-h-[5000px] opacity-100 py-4 mb-8" : "max-h-0 opacity-0 py-0 mb-0";
    const iconClasses = isOpen ? "rotate-0" : "-rotate-90";
    return `
        <div class="w-full">
            <div class="flex items-center gap-2 cursor-pointer py-3 border-b-2 border-slate-700 hover:border-slate-500 transition-colors group select-none" onclick="window.toggleSection('${id}')">
                <i class="fa-solid fa-caret-down text-slate-400 text-base transition-transform duration-300 group-hover:text-white ${iconClasses}"></i>
                <h2 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">${title}</h2>
            </div>
            <div id="${id}" class="collapsible-content overflow-hidden transition-all duration-500 ease-in-out ${contentClasses}">
                ${contentHtml}
            </div>
        </div>
    `;
};

// --- GLOBAL INTERACTION HANDLERS ---
window.toggleSection = (id) => {
    const content = document.getElementById(id);
    if (!content) return;
    const header = content.previousElementSibling;
    const icon = header.querySelector('i.fa-caret-down');
    const isCollapsed = content.classList.contains('max-h-0');

    if (isCollapsed) {
        content.classList.remove('max-h-0', 'opacity-0', 'py-0', 'mb-0');
        content.classList.add('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8'); 
        if (icon) { icon.classList.add('rotate-0'); icon.classList.remove('-rotate-90'); }
    } else {
        content.classList.add('max-h-0', 'opacity-0', 'py-0', 'mb-0');
        content.classList.remove('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8');
        if (icon) { icon.classList.remove('rotate-0'); icon.classList.add('-rotate-90'); }
    }
};

const performScroll = (id) => {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const card = wrapper.firstElementChild;
    if (card) {
        card.classList.remove('bg-slate-800/30'); 
        card.classList.add('bg-slate-800', 'ring-2', 'ring-inset', 'ring-blue-500', 'shadow-lg', 'shadow-blue-900/50', 'transition-all', 'duration-500');
        setTimeout(() => {
            card.classList.remove('bg-slate-800', 'ring-2', 'ring-inset', 'ring-blue-500', 'shadow-lg', 'shadow-blue-900/50');
            card.classList.add('bg-slate-800/30'); 
        }, 1500);
    }
};

window.scrollToMetric = (key) => {
    const sectionId = 'metrics-charts-section';
    const chartId = `metric-chart-${key}`;
    const section = document.getElementById(sectionId);
    if (section && section.classList.contains('max-h-0')) {
        window.toggleSection(sectionId);
        setTimeout(() => performScroll(chartId), 300);
    } else {
        performScroll(chartId);
    }
};

let activeTooltips = { data: null, static: null };
let tooltipTimers = { data: null, static: null };

const closeTooltip = (channel) => {
    if (channel === 'all') { closeTooltip('data'); closeTooltip('static'); return; }
    const active = activeTooltips[channel];
    if (active) {
        const el = document.getElementById(active.id);
        if (el) { el.classList.add('opacity-0', 'pointer-events-none'); el.innerHTML = ''; }
        activeTooltips[channel] = null;
        if (tooltipTimers[channel]) clearTimeout(tooltipTimers[channel]);
    }
};

const manageTooltip = (evt, id, contentHTML, channel) => {
    evt.stopPropagation(); 
    const triggerEl = evt.target;
    if (activeTooltips[channel] && activeTooltips[channel].trigger === triggerEl) {
        closeTooltip(channel);
        return;
    }
    closeTooltip(channel);
    const tooltip = document.getElementById(id);
    if (!tooltip) return;
    tooltip.innerHTML = contentHTML;
    tooltip.classList.remove('opacity-0', 'pointer-events-none');
    const x = evt.pageX; const y = evt.pageY; const viewportWidth = window.innerWidth;
    if (x > viewportWidth * 0.6) { tooltip.style.right = `${viewportWidth - x + 10}px`; tooltip.style.left = 'auto'; } 
    else { tooltip.style.left = `${x + 10}px`; tooltip.style.right = 'auto'; }
    let topPos = channel === 'data' ? y - tooltip.offsetHeight - 20 : y + 25;
    tooltip.style.top = `${topPos}px`;
    activeTooltips[channel] = { id, trigger: triggerEl };
    if (tooltipTimers[channel]) clearTimeout(tooltipTimers[channel]);
    tooltipTimers[channel] = setTimeout(() => closeTooltip(channel), 15000);
};

window.addEventListener('click', (e) => {
    ['data', 'static'].forEach(channel => {
        const active = activeTooltips[channel];
        if (active) {
            const tooltipEl = document.getElementById(active.id);
            if (tooltipEl && tooltipEl.contains(e.target)) { closeTooltip(channel); return; }
            if (e.target !== active.trigger) closeTooltip(channel);
        }
    });
});

window.hideMetricTooltip = () => { closeTooltip('all'); };

window.showAnalysisTooltip = (evt, key) => {
    const def = METRIC_DEFINITIONS[key];
    if (!def) return;
    const rangeColor = def.invertRanges ? "bg-gradient-to-r from-emerald-500 to-red-500" : "bg-gradient-to-r from-red-500 to-emerald-500";
    const html = `
        <div class="w-[280px] space-y-3 cursor-pointer">
            <div class="flex items-center gap-2 border-b border-slate-700 pb-2">
                <i class="fa-solid ${def.icon} text-lg" style="color: ${def.colorVar}"></i>
                <div>
                    <h4 class="text-white font-bold text-sm leading-none">${def.title}</h4>
                    <span class="text-[10px] text-slate-400 font-mono">${def.sport.toUpperCase()} METRIC</span>
                </div>
            </div>
            <div class="text-xs text-slate-300 leading-relaxed">${def.description}</div>
            <div class="bg-slate-800/50 rounded p-2 border border-slate-700">
                <div class="flex justify-between items-end mb-1">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Target Range</span>
                    <span class="text-xs font-mono font-bold text-emerald-400">${def.rangeInfo}</span>
                </div>
                <div class="h-1.5 w-full rounded-full ${rangeColor} opacity-80"></div>
                <div class="flex justify-between text-[8px] text-slate-500 mt-1 font-mono">
                    <span>${def.invertRanges ? "Low (Good)" : "Floor"}</span>
                    <span>${def.invertRanges ? "High (Bad)" : "Ceiling"}</span>
                </div>
            </div>
            <div>
                <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wide">How to Improve</span>
                <div class="text-[11px] text-slate-400 mt-1 pl-2 border-l-2 border-blue-500/30">${def.improvement}</div>
            </div>
            <div class="text-[9px] text-slate-600 text-center pt-1 italic">Click to close</div>
        </div>`;
    manageTooltip(evt, 'metric-info-popup', html, 'static');
};

window.showMetricTooltip = (evt, date, name, val, unitLabel, breakdown, colorVar) => {
    const html = `
        <div class="text-center min-w-[100px] cursor-pointer">
            <div class="text-[10px] text-slate-400 mb-1 border-b border-slate-700 pb-1">${date}</div>
            <div class="text-white font-bold text-xs mb-1">${name}</div>
            <div class="font-mono font-bold text-xl" style="color: ${colorVar}">${val} <span class="text-[10px] text-slate-500">${unitLabel}</span></div>
            ${breakdown ? `<div class="text-[10px] text-slate-300 font-mono bg-slate-800 rounded px-2 py-0.5 mt-1 border border-slate-700">${breakdown}</div>` : ''}
        </div>`;
    manageTooltip(evt, 'metric-tooltip-popup', html, 'data');
};
