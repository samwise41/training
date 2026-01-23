// js/views/metrics/table.js
import { calculateTrend } from './utils.js';
import { Formatters } from '../../utils/formatting.js'; 
import { extractMetricData } from './parser.js';
import { METRIC_DEFINITIONS } from './definitions.js';

export const renderSummaryTable = (data) => {
    const keys = Object.keys(METRIC_DEFINITIONS);
    
    let rows = keys.map(key => {
        const def = METRIC_DEFINITIONS[key];
        const metricData = extractMetricData(data, key);
        
        // Calculate Trends (30d vs 90d)
        const trend30 = calculateTrend(metricData, 30);
        const trend90 = calculateTrend(metricData, 90);
        
        if (trend30.val === 0) return ''; // Skip empty metrics

        const diff = (trend30.val - trend90.val).toFixed(1);
        const isPositive = parseFloat(diff) >= 0;
        const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400';
        const iconClass = isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

        // Interactive Rows
        return `
            <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer" 
                onclick="window.scrollToMetric('${key}')">
                <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                            <i class="fa-solid ${def.icon}" style="color: ${def.colorVar}"></i>
                        </div>
                        <div>
                            <div class="font-bold text-slate-200 text-xs uppercase tracking-wide">${def.title}</div>
                            <div class="text-[10px] text-slate-500 font-mono">${def.rangeInfo}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="font-mono text-lg font-bold text-white">${trend30.val}</div>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1 ${colorClass}">
                        <span class="font-mono text-xs font-bold">${diff > 0 ? '+' : ''}${diff}</span>
                        <i class="fa-solid ${iconClass} text-[10px]"></i>
                    </div>
                    <div class="text-[10px] text-slate-500">vs 90d avg</div>
                </td>
                <td class="py-3 px-4 text-right">
                    <button class="text-slate-400 hover:text-white transition-colors"
                        onclick="window.handleMetricInfoClick(event, '${key}')">
                        <i class="fa-regular fa-circle-question"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (rows === '') rows = '<tr><td colspan="4" class="p-4 text-center text-slate-500 italic">No metrics data available for this period.</td></tr>';

    return `
        <div class="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/20">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th class="py-3 px-4">Metric</th>
                        <th class="py-3 px-4 text-right">30d Avg</th>
                        <th class="py-3 px-4 text-right">Trend</th>
                        <th class="py-3 px-4 text-right">Info</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
};
