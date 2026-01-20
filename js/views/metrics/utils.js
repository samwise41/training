// js/views/metrics/utils.js
import { SPORT_IDS, METRIC_DEFINITIONS } from './definitions.js';

export const checkSport = (activity, sportKey) => {
    const key = sportKey.toUpperCase();

    // 1. Check ID (sportTypeId) from your list
    if (activity.sportTypeId) {
        if (key === 'RUN' && activity.sportTypeId == 1) return true;
        if (key === 'BIKE' && activity.sportTypeId == 2) return true;
        if (key === 'SWIM' && (activity.sportTypeId == 5 || activity.sportTypeId == 26 || activity.sportTypeId == 18)) return true;
    }

    // 2. Check String Strings (actualSport / activityType)
    const typeStr = String(activity.actualSport || activity.activityType || "").toUpperCase();
    
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
