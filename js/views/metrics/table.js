import { DataManager } from '../../utils/data.js';
import { METRIC_DEFINITIONS } from './definitions.js';

const getTrendIcon = (trend, higherIsBetter) => {
    if (!trend || trend === 'Flat') return '<i class="fa-solid fa-minus text-slate-600/50" title="Stable"></i>';
    const isRising = trend === 'Rising';
    let isGood = higherIsBetter ? isRising : !isRising;
    const colorClass = isGood ? 'text-emerald-400' : 'text-rose-400';
    const iconClass = isRising ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    return `<i class="fa-solid ${iconClass} ${colorClass}"></i>`;
};

const getStatusBadge = (status) => {
    const map = {
        'On Target':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'Off Target': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'Neutral':    'bg-slate-700/50 text-slate-400 border-slate-600',
        'No Data':    'bg-slate-800 text-slate-600 border-slate-700'
    };
    const cls = map[status] || map['Neutral'];
    let icon = status === 'On Target' ? '✅ ' : (status === 'Off Target' ? '⚠️ ' : '');
    return `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls} whitespace-nowrap">${icon}${status}</span>`;
};

export const renderSummaryTable = async () => {
    try {
        const data = await DataManager.fetchJSON('COACHING_VIEW');
        
        if (!data || !data.metrics_summary) {
            return `<div class="p-6 text-center bg-slate-800/50 rounded-xl border border-slate-700"><p class="text-[10px] text-slate-500">No Data Found</p></div>`;
        }

        // Updated Layout: Fixed widths for data columns, Flexible for Name
        let html = `
            <div class="overflow-x-auto bg-slate-800/30 border border-slate-700 rounded-xl mb-4 shadow-sm">
                <table class="w-full text-left text-xs min-w-[650px]">
                    <thead class="bg-slate-900/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                            <th class="px-4 py-3 border-b border-slate-700 w-full">Metric</th>
                            <th class="px-2 py-3 text-center border-b border-slate-700 w-[80px] shrink-0">30d</th>
                            <th class="px-2 py-3 text-center border-b border-slate-700 w-[80px] shrink-0">60d</th>
                            <th class="px-2 py-3 text-center border-b border-slate-700 w-[80px] shrink-0">90d</th>
                            <th class="px-4 py-3 text-right border-b border-slate-700 w-[140px] shrink-0">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/50">
        `;

        data.metrics_summary.forEach(group => {
            html += `
                <tr class="bg-slate-900/80">
                    <td colspan="5" class="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700">
                        ${group.group}
                    </td>
                </tr>
            `;

            group.metrics.forEach(m => {
                const def = METRIC_DEFINITIONS[m.id] || {};
                const icon = def.icon || 'fa-chart-line';
                const colorVar = def.colorVar || 'var(--text-main)';
                const rangeInfo = def.rangeInfo || `${m.good_min} - ${m.good_max}`;
                const higherIsBetter = m.higher_is_better !== false;

                html += `
                    <tr class="hover:bg-slate-700/30 transition-colors group cursor-pointer" onclick="window.scrollToMetric('${m.id}')">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded flex items-center justify-center bg-slate-800 border border-slate-700 group-hover:border-slate-500 transition-colors shadow-sm shrink-0">
                                    <i class="fa-solid ${icon} text-xs" style="color: ${colorVar}"></i>
                                </div>
                                <div class="min-w-0">
                                    <div class="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                        ${m.title}
                                    </div>
                                    <div class="text-[9px] text-slate-500 font-mono truncate">
                                        ${rangeInfo}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="px-2 py-3 text-center w-[80px] shrink-0">
                            ${getTrendIcon(m.trends['30d'], higherIsBetter)}
                        </td>
                        <td class="px-2 py-3 text-center w-[80px] shrink-0">
                            ${getTrendIcon(m.trends['60d'], higherIsBetter)}
                        </td>
                        <td class="px-2 py-3 text-center w-[80px] shrink-0">
                            ${getTrendIcon(m.trends['90d'], higherIsBetter)}
                        </td>
                        <td class="px-4 py-3 text-right w-[140px] shrink-0">
                            ${getStatusBadge(m.status)}
                        </td>
                    </tr>
                `;
            });
        });

        html += `</tbody></table></div>`;
        return html;
    } catch (e) {
        console.error(e);
        return `<div class="p-4 text-rose-400">Table Error</div>`;
    }
};
