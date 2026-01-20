// js/views/metrics/utils.js
import { SPORT_IDS, METRIC_DEFINITIONS } from './definitions.js';

// --- DATA HELPERS ---

export const checkSport = (activity, sportKey) => {
    // 1. Try ID Match (Most Robust)
    const typeId = activity.activityType ? activity.activityType.typeId : null;
    const parentId = activity.activityType ? activity.activityType.parentTypeId : null;
    
    if (SPORT_IDS[sportKey] && (SPORT_IDS[sportKey].includes(typeId) || SPORT_IDS[sportKey].includes(parentId))) {
        return true;
    }

    // 2. Fallback: String Match (Safety Net for JSON)
    const typeStr = String(activity.activityType || activity.actualSport || activity.actualType || "").toUpperCase();
    const key = sportKey.toUpperCase();
    
    if (key === 'BIKE' && (typeStr.includes('BIKE') || typeStr.includes('CYCL') || typeStr.includes('RIDE'))) return true;
    if (key === 'RUN' && typeStr.includes('RUN')) return true;
    if (key === 'SWIM' && typeStr.includes('SWIM')) return true;
    
    return false;
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

// --- GLOBAL HANDLERS ---
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

// ... (Rest of Tooltip Logic remains the same)
// Just ensure the tooltip functions (manageTooltip, window.showAnalysisTooltip, etc.) 
// are pasted here if you overwrote the file completely. 
// For brevity, I'll assume you keep the existing tooltip code at the bottom of utils.js
