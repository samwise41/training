// js/views/metrics/table.js
import { METRIC_DEFINITIONS } from './definitions.js';
import { calculateTrend, getTrendIcon } from './utils.js';
// NEW IMPORT:
import { METRIC_FORMULAS, extractMetricData, extractSubjectiveTableData } from './parser.js';

export const renderSummaryTable = (allData) => {
    let rows = '';
    const now = new Date();

    const groups = [
        { name: 'General Fitness', keys: ['vo2max', 'tss', 'anaerobic'] },
        { name: 'Cycling Metrics', keys: ['subjective_bike', 'endurance', 'strength'] },
        { name: 'Running Metrics', keys: ['subjective_run', 'run', 'mechanical', 'gct', 'vert'] },
        { name: 'Swimming Metrics', keys: ['subjective_swim', 'swim'] }
    ];

    groups.forEach(group => {
        rows += `
            <tr class="bg-slate-900/80">
                <td colspan="5" class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
                    ${group.name}
                </td>
            </tr>
        `;

        group.keys.forEach(key => {
            const def = METRIC_DEFINITIONS[key];
            if (!def) return;

            let fullData;
            if (key.startsWith('subjective_')) {
                fullData = extractSubjectiveTableData(allData, key);
            } else {
                fullData = extractMetricData(allData, key).sort((a,b) => a.date - b.date);
            }
            
            if (!fullData || !fullData.length) return;

            // Trend Calculations
            const getT = (days) => {
                const cutoff = new Date();
                cutoff.setDate(now.getDate() - days);
                const subset = fullData.filter(d => d.date >= cutoff);
                const trend = calculateTrend(subset);
                return trend ? getTrendIcon(trend.slope, def.invertRanges) : { icon: 'fa-minus', color: 'text-slate-600' };
            };

            const t30 = getT(30);
            const t90 = getT(90);
            const t6m = getT(180);

            // Current Status
            const recentSubset = fullData.filter(d => d.date >= new Date(now.getTime() - 30*24*60*60*1000));
            let statusHtml = '<span class="text-slate-500">--</span>';
            if (recentSubset.length > 0) {
                const avg30 = recentSubset.reduce((sum, d) => sum + d.val, 0) / recentSubset.length;
                if (def.invertRanges) {
                    if (avg30 <= def.refMax) statusHtml = '<span class="text-emerald-400 font-bold text-[10px] bg-emerald-900/30 px-1.5 py-0.5 rounded">✅ On Target</span>';
                    else statusHtml = '<span class="text-red-400 font-bold text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded">⚠️ High</span>';
                } else {
                    if (avg30 >= def.refMin) statusHtml = '<span class="text-emerald-400 font-bold text-[10px] bg-emerald-900/30 px-1.5 py-0.5 rounded">✅ On Target</span>';
                    else statusHtml = '<span class="text-red-400 font-bold text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded">⚠️ Low</span>';
                }
            }

            // Icons
            const iconCell = `
                <div onclick="window.scrollToMetric('${key}')" class="w-6 h-6 rounded flex items-center justify-center bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 hover:border-slate-500 hover:scale-110 transition-all duration-200 group shadow-sm" title="Jump to Chart">
                    <i class="fa-solid ${def.icon} text-xs group-hover:text-white transition-colors" style="color: ${def.colorVar}"></i>
                </div>`;

            const formula = METRIC_FORMULAS[key] || '';
            const titleHtml = `
                <div class="font-bold text-slate-200">
                    ${def.title}
                    ${formula ? `<span class="text-[10px] font-normal opacity-50 ml-1 font-mono">${formula}</span>` : ''}
                </div>
            `;

            rows += `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <td class="px-4 py-3 flex items-center gap-3">
                        ${iconCell}
                        <div>
                            ${titleHtml}
                            <div class="text-[9px] text-slate-500 font-mono">${def.rangeInfo}</div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center"><i class="fa-solid ${t30.icon} ${t30.color}"></i></td>
                    <td class="px-4 py-3 text-center"><i class="fa-solid ${t90.icon} ${t90.color}"></i></td>
                    <td class="px-4 py-3 text-center"><i class="fa-solid ${t6m.icon} ${t6m.color}"></i></td>
                    <td class="px-4 py-3 text-right">${statusHtml}</td>
                </tr>`;
        });
    });

    return `
        <div class="overflow-x-auto bg-slate-800/30 border border-slate-700 rounded-xl mb-4 shadow-sm">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                        <th class="px-4 py-3">Metric & Target</th>
                        <th class="px-4 py-3 text-center">30d</th>
                        <th class="px-4 py-3 text-center">90d</th>
                        <th class="px-4 py-3 text-center">6m</th>
                        <th class="px-4 py-3 text-right">Current Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50 text-slate-300">
                    ${rows}
                </tbody>
            </table>
        </div>`;
};
