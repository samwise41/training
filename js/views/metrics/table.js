// js/views/metrics/table.js
import { DataManager } from '../../utils/data.js';
import { METRIC_DEFINITIONS } from './definitions.js'; // Import static definitions for styling

// --- HELPERS ---

const getTrendIcon = (trend, higherIsBetter) => {
    // 1. Handle Flat or Missing
    if (!trend || trend === 'Flat') {
        return '<i class="fa-solid fa-minus text-slate-600/50" title="Stable"></i>';
    }
    
    const isRising = trend === 'Rising';
    
    // 2. Determine "Good" direction
    let isGood = false;
    if (higherIsBetter) {
        isGood = isRising;
    } else {
        isGood = !isRising; 
    }
    
    // Bright colors for dark mode
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
    
    // Add checkmark or warning icon based on status
    let icon = '';
    if (status === 'On Target') icon = '✅ ';
    if (status === 'Off Target') icon = '⚠️ ';

    return `
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls} whitespace-nowrap">
            ${icon}${status}
        </span>
    `;
};

// --- MAIN RENDERER ---

export const renderSummaryTable = async () => {
    // 1. Fetch the Pre-Calculated Data
    const data = await DataManager.fetchJSON('COACHING_VIEW');

    if (!data || !data.metrics_summary) {
        return `
            <div class="p-6 text-center bg-slate-800/50 rounded-xl border border-slate-700">
                <p class="text-slate-400 font-mono text-xs">Waiting for Coaching Data...</p>
                <p class="text-[10px] text-slate-600 mt-2">Run 'python python/metrics/generate_coach_view.py'</p>
            </div>
        `;
    }

    // 2. Build HTML
    let html = `
        <div class="overflow-x-auto bg-slate-800/30 border border-slate-700 rounded-xl mb-4 shadow-sm">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                        <th class="px-4 py-3 border-b border-slate-700">Metric</th>
                        <th class="px-4 py-3 text-center border-b border-slate-700 w-16">30d</th>
                        <th class="px-4 py-3 text-center border-b border-slate-700 w-16">60d</th>
                        <th class="px-4 py-3 text-center border-b border-slate-700 w-16">90d</th>
                        <th class="px-4 py-3 text-right border-b border-slate-700 w-24">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50">
    `;

    // 3. Iterate Groups
    data.metrics_summary.forEach(group => {
        // Group Header
        html += `
            <tr class="bg-slate-900/80">
                <td colspan="5" class="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700">
                    ${group.group}
                </td>
            </tr>
        `;

        // Metric Rows
        group.metrics.forEach(m => {
            // MERGE: Look up the static definition for Icon & Color
            // m.id comes from JSON, definitions keyed by same id
            const def = METRIC_DEFINITIONS[m.id] || {};
            
            // Fallback values if definition missing
            const icon = def.icon || 'fa-chart-line';
            const colorVar = def.colorVar || 'var(--text-main)';
            const rangeInfo = def.rangeInfo || `${m.good_min} - ${m.good_max}`;

            const higherIsBetter = m.higher_is_better !== false;
            
            html += `
                <tr class="hover:bg-slate-700/30 transition-colors group">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded flex items-center justify-center bg-slate-800 border border-slate-700 group-hover:border-slate-500 transition-colors shadow-sm">
                                <i class="fa-solid ${icon} text-xs" style="color: ${colorVar}"></i>
                            </div>
                            <div>
                                <div class="font-bold text-slate-200 group-hover:text-white transition-colors">
                                    ${m.title}
                                </div>
                                <div class="text-[9px] text-slate-500 font-mono">
                                    ${rangeInfo}
                                </div>
                            </div>
                        </div>
                    </td>

                    <td class="px-4 py-3 text-center">
                        ${getTrendIcon(m.trends['30d'], higherIsBetter)}
                    </td>

                    <td class="px-4 py-3 text-center">
                        ${getTrendIcon(m.trends['60d'], higherIsBetter)}
                    </td>

                    <td class="px-4 py-3 text-center">
                        ${getTrendIcon(m.trends['90d'], higherIsBetter)}
                    </td>

                    <td class="px-4 py-3 text-right">
                        ${getStatusBadge(m.status)}
                    </td>
                </tr>
            `;
        });
    });

    html += `</tbody></table></div>`;
    
    // Footer
    html += `
        <div class="text-right text-[10px] text-slate-600 font-mono mb-4">
            AI Analysis: ${data.generated_at || 'Unknown'}
        </div>
    `;

    return html;
};
