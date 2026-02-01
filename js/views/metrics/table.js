import { DataManager } from '../../utils/data.js';

// --- HELPERS FOR DARK THEME ---

const getTrendIcon = (trend, higherIsBetter) => {
    // 1. Handle Flat or Missing
    if (!trend || trend === 'Flat') {
        return '<i class="fa-solid fa-minus text-slate-600" title="Stable"></i>';
    }
    
    const isRising = trend === 'Rising';
    
    // 2. Determine "Good" direction
    // If Higher is Better: Rising = Good (Green)
    // If Lower is Better (e.g. GCT): Falling = Good (Green)
    let isGood = false;
    if (higherIsBetter) {
        isGood = isRising;
    } else {
        isGood = !isRising; 
    }
    
    // Dark Theme Colors: Green-400 / Red-400 (brighter for dark mode)
    const colorClass = isGood ? 'text-emerald-400' : 'text-rose-400';
    const iconClass = isRising ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    
    return `<i class="fa-solid ${iconClass} ${colorClass}"></i>`;
};

const getStatusBadge = (status) => {
    // Dark Theme Badges
    const map = {
        'On Target':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'Off Target': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'Neutral':    'bg-slate-700/50 text-slate-400 border-slate-600',
        'No Data':    'bg-slate-800 text-slate-600 border-slate-700'
    };
    
    const cls = map[status] || map['Neutral'];
    
    return `
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}">
            ${status}
        </span>
    `;
};

const formatValue = (val) => {
    if (val === null || val === undefined) return '<span class="text-slate-600">--</span>';
    return val; 
};

// --- MAIN RENDERER ---

export const renderSummaryTable = async () => {
    // 1. Fetch the Pre-Calculated Data directly
    const data = await DataManager.fetchJSON('COACHING_VIEW');

    // 2. Handle Empty/Loading State
    if (!data || !data.metrics_summary) {
        return `
            <div class="p-6 text-center bg-slate-800/50 rounded-xl border border-slate-700">
                <p class="text-slate-400 font-mono text-xs">Waiting for Coaching Data...</p>
                <p class="text-[10px] text-slate-600 mt-2">Run 'python python/metrics/generate_coach_view.py' to generate.</p>
            </div>
        `;
    }

    // 3. Build HTML Table
    let html = `
        <div class="overflow-x-auto bg-slate-800/30 border border-slate-700 rounded-xl mb-4 shadow-sm">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                        <th class="px-4 py-3 border-b border-slate-700">Metric</th>
                        <th class="px-4 py-3 text-center border-b border-slate-700">Current (30d)</th>
                        <th class="px-4 py-3 text-center border-b border-slate-700">30d Trend</th>
                        <th class="px-4 py-3 text-center border-b border-slate-700">90d Trend</th>
                        <th class="px-4 py-3 text-right border-b border-slate-700">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/50">
    `;

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
            const higherIsBetter = m.higher_is_better !== false;
            
            html += `
                <tr class="hover:bg-slate-700/30 transition-colors group">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-1.5 h-1.5 rounded-full ${m.status === 'On Target' ? 'bg-emerald-500' : 'bg-slate-600'}"></div>
                            <div>
                                <div class="font-bold text-slate-200 group-hover:text-white transition-colors">
                                    ${m.title}
                                </div>
                                <div class="text-[9px] text-slate-500 font-mono">
                                    ${m.good_min ?? 0} – ${m.good_max ?? '∞'} ${m.unit}
                                </div>
                            </div>
                        </div>
                    </td>

                    <td class="px-4 py-3 text-center font-mono text-slate-300">
                        ${formatValue(m.current_value)}
                        <span class="text-[9px] text-slate-600 ml-0.5">${m.unit || ''}</span>
                    </td>

                    <td class="px-4 py-3 text-center">
                        ${getTrendIcon(m.trends['30d'], higherIsBetter)}
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
            AI Context Generated: ${data.generated_at || 'Unknown'}
        </div>
    `;

    return html;
};
