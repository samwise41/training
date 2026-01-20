export const renderVolumeChart = (trendsJson, sportType = 'All', title = 'Weekly Volume Trend') => {
    try {
        if (!trendsJson || !trendsJson.data || trendsJson.data.length === 0) {
            return '<div class="p-4 text-slate-500 italic">No data available</div>';
        }

        // Map UI sport types to JSON keys
        const categoryMap = {
            'All': 'total',
            'Bike': 'cycling',
            'Run': 'running',
            'Swim': 'swimming'
        };
        const jsonKey = categoryMap[sportType] || 'total';

        // Hardcoded safety thresholds from documentation
        // Run: Red > 5%, Yellow > 0%
        // Others: Red > 10%, Yellow > 0% (Total: Red > 15%, Yellow > 0%)
        // Everyone: Grey < -20%
        const getThresholds = (type) => {
            if (type === 'running') return { red: 0.05, yellow: 0.0 };
            if (type === 'total') return { red: 0.15, yellow: 0.0 };
            return { red: 0.10, yellow: 0.0 };
        };
        const { red, yellow } = getThresholds(jsonKey);

        const getStatusColor = (pctChange) => {
            if (pctChange > red) return ['bg-red-500', '#ef4444', 'text-red-400'];
            if (pctChange > yellow) return ['bg-yellow-500', '#eab308', 'text-yellow-400'];
            if (pctChange < -0.20) return ['bg-slate-600', '#475569', 'text-slate-500']; 
            // -20% to 0% is Green (Optimal Growth/Maintenance)
            return ['bg-emerald-500', '#10b981', 'text-emerald-400'];
        };

        // Calculate max volume for scaling
        let maxVol = 0;
        trendsJson.data.forEach(week => {
            const cat = week.categories[jsonKey];
            if (cat) {
                maxVol = Math.max(maxVol, cat.actual || 0, cat.planned || 0);
            }
        });
        maxVol = maxVol || 1; // Prevent division by zero

        let barsHtml = ''; 

        trendsJson.data.forEach((week, idx) => {
            const cat = week.categories[jsonKey];
            if (!cat) return;

            const isCurrentWeek = (idx === trendsJson.data.length - 1); 
            const hActual = Math.round((cat.actual / maxVol) * 100); 
            const hPlan = Math.round((cat.planned / maxVol) * 100); 

            // Use the growth values pre-calculated in the JSON
            const actualGrowth = cat.actual_growth || 0;
            const plannedGrowth = cat.planned_growth || 0;

            const [actualClass, _, actualTextClass] = getStatusColor(actualGrowth);
            const [__, planHex, planTextClass] = getStatusColor(plannedGrowth);

            const formatLabel = (val) => {
                const sign = val > 0 ? '▲' : (val < 0 ? '▼' : '');
                // Show label if value exists, otherwise --
                return (val !== undefined && val !== null) ? `${sign} ${Math.round(Math.abs(val) * 100)}%` : '--';
            };
            
            const actLabel = formatLabel(actualGrowth);
            const planLabel = formatLabel(plannedGrowth);
            const limitLabel = `Limit: ${Math.round(red*100)}%`;

            const planBarStyle = `
                background: repeating-linear-gradient(
                    45deg, ${planHex} 0, ${planHex} 4px, transparent 4px, transparent 8px
                ); border: 1px solid ${planHex}; opacity: 0.3;`;

            const actualOpacity = isCurrentWeek ? 'opacity-90' : 'opacity-80'; 
            
            const clickAttr = `onclick="window.showVolumeTooltip(event, '${week.week_label}', ${Math.round(cat.planned)}, '${planLabel}', '${planTextClass}', ${Math.round(cat.actual)}, '${actLabel}', '${actualTextClass}', '${limitLabel}')"`;

            barsHtml += `
                <div class="flex flex-col items-center gap-1 flex-1 group relative cursor-pointer" ${clickAttr}>
                    <div class="relative w-full bg-slate-800/30 rounded-t-sm h-32 flex items-end justify-center pointer-events-none">
                        <div style="height: ${hPlan}%; ${planBarStyle}" class="absolute bottom-0 w-full rounded-t-sm z-0"></div>
                        <div style="height: ${hActual}%;" class="relative z-10 w-2/3 ${actualClass} ${actualOpacity} rounded-t-sm"></div>
                    </div>
                    <span class="text-[9px] text-slate-500 font-mono text-center leading-none mt-1 pointer-events-none">
                        ${week.week_label}
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
