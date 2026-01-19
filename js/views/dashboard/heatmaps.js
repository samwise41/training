// js/views/dashboard/heatmaps.js
import { toLocalYMD } from './utils.js';

// --- Internal Helper: CSS Vars ---
const getSportColorVar = (type) => {
    if (type === 'Bike') return 'var(--color-bike)';
    if (type === 'Run') return 'var(--color-run)';
    if (type === 'Swim') return 'var(--color-swim)';
    if (type === 'Strength') return 'var(--color-strength, #a855f7)';
    return 'var(--color-all)';
};

// Heatmap builder remains largely the same but date logic is simplified for JSON
function buildGenericHeatmap(fullLog, startDate, endDate, title, dateToKeyFn, containerId = null) {
    const dataMap = {}; 
    fullLog.forEach(item => { 
        const dateKey = dateToKeyFn(item.date); 
        if (!dataMap[dateKey]) dataMap[dateKey] = []; 
        dataMap[dateKey].push(item); 
    });
    
    const today = new Date(); today.setHours(0,0,0,0);
    // ... [Logic for rendering cells remains the same as your previous heatmap.js]
    // (Ensure you use the existing buildGenericHeatmap logic here, but removing the eventMap parameter if not needed)
}

// Main Render Function Updated for JSON
export function renderHeatmaps(fullLogData) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const endOfWeek = new Date(today); 
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay())); 

    const startTrailing = new Date(endOfWeek); 
    startTrailing.setMonth(startTrailing.getMonth() - 6);
    
    // Annual Calculation
    const startYear = new Date(today.getFullYear(), 0, 1); 
    const endYear = new Date(today.getFullYear(), 11, 31);
    
    // We pass null for eventMap for now, or you can point to a new event JSON if you have one
    const heatmapTrailingHtml = buildGenericHeatmap(fullLogData, startTrailing, endOfWeek, "Recent Consistency (Trailing 6 Months)", toLocalYMD, "heatmap-trailing-scroll");
    const heatmapYearHtml = buildGenericHeatmap(fullLogData, startYear, endYear, `Annual Overview (${today.getFullYear()})`, toLocalYMD, null);

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            ${heatmapTrailingHtml}
        </div>
        <div class="mt-8">
            ${heatmapYearHtml}
        </div>
    `;
}
