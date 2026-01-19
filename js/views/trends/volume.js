import { parsePlanLimits, aggregateVolumeBuckets } from './analysis.js';

export const renderVolumeChart = (data, planMd, sportType = 'All', title = 'Weekly Volume Trend') => {
    try {
        if (!data || data.length === 0) return '<div class="p-4 text-slate-500 italic">No data available</div>';
        
        const { limitRed, limitYellow } = parsePlanLimits(planMd, sportType);
        const buckets = aggregateVolumeBuckets(data, sportType);

        let barsHtml = ''; 
        const maxVol = Math.max(...buckets.map(b => Math.max(b.actualMins, b.plannedMins))) || 1;

        const getStatusColor = (pctChange) => {
            if (pctChange > limitRed) return ['bg-red-500', '#ef4444', 'text-red-400'];
            if (pctChange > limitYellow) return ['bg-yellow-500', '#eab308', 'text-yellow-400'];
            if (pctChange < -0.20) return ['bg-slate-600', '#475569', 'text-slate-500']; 
            return ['bg-emerald-500', '#10b981', 'text-emerald-400'];
        };

        buckets.forEach((b, idx) => {
            const isCurrentWeek = (idx === buckets.length - 1); 
            const hActual = Math.round((b.actualMins / maxVol) * 100); 
            const hPlan = Math.round((b.plannedMins / maxVol) * 100); 
            const prevActual = idx > 0 ? buckets[idx - 1].actualMins : 0;

            let actualGrowth = 0; 
            let plannedGrowth = 0;

            if (prevActual > 0) {
                actualGrowth = (b.actualMins - prevActual) / prevActual;
                plannedGrowth = (b.plannedMins - prevActual) / prevActual;
            }

            const [actualClass, _, actualTextClass] = getStatusColor(actualGrowth);
            const [__, planHex, planTextClass] = getStatusColor(plannedGrowth);

            const formatLabel = (val) => {
                const sign = val > 0 ? '▲' : (val < 0 ? '▼' : '');
                return prevActual > 0 ? `${sign} ${Math.round(Math.abs(val) * 100)}%` : '--';
            };
            
            const actLabel = formatLabel(actualGrowth);
            const planLabel = formatLabel(plannedGrowth);
            const limitLabel = `Limit: ${Math.round(limitRed*100)}%`;

            const planBarStyle = `
                background: repeating-linear-gradient(
                    45deg, ${planHex} 0, ${planHex} 4px, transparent 4px, transparent 8px
                ); border: 1px solid ${planHex}; opacity: 0.3;`;

            const actualOpacity = isCurrentWeek ? 'opacity-90' : 'opacity-80'; 
            
            const clickAttr = `onclick="window.showVolumeTooltip(event, '${b.label}', ${Math.round(b.plannedMins)}, '${planLabel}', '${planTextClass}', ${Math.round(b.actualMins)}, '${actLabel}', '${actualTextClass}', '${limitLabel}')"`;

            barsHtml += `
                <div class="flex flex-col items-center gap-1 flex-1 group relative cursor-pointer" ${clickAttr}>
                    <div class="relative w-full bg-slate-800/30 rounded-t-sm h-32 flex items-end justify-center pointer-events-none">
                        <div style="height: ${hPlan}%; ${planBarStyle}" class="absolute bottom-0 w-full rounded-t-sm z-0"></div>
                        <div style="height: ${hActual}%;" class="relative z-10 w-2/3 ${actualClass} ${actualOpacity} rounded-t-sm"></div>
                    </div>
                    <span class="text-[9px] text-slate-500 font-mono text-center leading-none mt-1 pointer-events-none">
                        ${b.label}
                        ${isCurrentWeek ? '<br><span class="text-[8px] text-blue-400 font-bold">NEXT</span>' : ''}
                    </span>
                </div>
            `;
        });
        
        let iconHtml = '<i class="fa-solid fa-chart-column icon-all"></i>'; 
        if (sportType === 'Bike') iconHtml = '<i class="fa-solid fa-bicycle icon-bike"></i>'; 
        if (sportType === 'Run') iconHtml = '<i class="fa-solid fa-person-running icon-run"></i>'; 
        if (sportType === 'Swim') iconHtml = '<i class="fa-solid fa-person-swimming icon-swim"></i>';

        return `
            <div class="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4">
                <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">${iconHtml} ${title}</h3>
                </div>
                <div class="flex items-start justify-between gap-1 w-full">
                    ${barsHtml}
                </div>
            </div>
        `;
    } catch (e) { return `<div class="p-4 text-red-400">Chart Error: ${e.message}</div>`; }
};
