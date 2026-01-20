export const renderVolumeChart = (trendsJson, sportType = 'All', title = 'Weekly Volume Trend') => {
    try {
        if (!trendsJson || !trendsJson.data || trendsJson.data.length === 0) {
            return '<div class="p-4 text-slate-500 italic">No data available</div>';
        }

        // 1. Map UI Sport to JSON Category keys
        const categoryMap = {
            'All': 'total',
            'Bike': 'cycling',
            'Run': 'running',
            'Swim': 'swimming'
        };
        const jsonKey = categoryMap[sportType] || 'total';

        // 2. Define Safety Thresholds per documentation
        // Note: Total Red is > 15%, but Yellow ends at 7.5%. 
        // We set Red at 0.15 to match the explicit "Red" column, covering the gap with Yellow.
        const getThresholds = (key) => {
            switch (key) {
                case 'running': return 0.05; // > 5%
                case 'cycling': return 0.10; // > 10%
                case 'swimming': return 0.10; // > 10%
                case 'total': return 0.15;   // > 15%
                default: return 0.10;
            }
        };
        const redLimit = getThresholds(jsonKey);

        // 3. Color Logic Methodology
        const getStatusColor = (pctChange) => {
            // Red (High Risk)
            if (pctChange > redLimit) return ['bg-red-500', '#ef4444', 'text-red-400'];
            
            // Yellow (Minor Increase): 0% to RedLimit
            // Note: For Total, this covers 0% to 15%.
            if (pctChange > 0) return ['bg-yellow-500', '#eab308', 'text-yellow-400'];
            
            // Grey (Recovery/Drop): < -20%
            if (pctChange < -0.20) return ['bg-slate-600', '#475569', 'text-slate-500']; 
            
            // Green (Optimal Growth/Maintenance): -20% to 0%
            return ['bg-emerald-500', '#10b981', 'text-emerald-400'];
        };

        // 4. Calculate Max Volume for Scale (Using pre-calculated JSON values)
        let maxVol = 0;
        trendsJson.data.forEach(week => {
            const cat = week.categories[jsonKey];
            if (cat) {
                // Ensure we handle missing values gracefully
                const p = cat.planned || 0;
                const a = cat.actual || 0;
                maxVol = Math.max(maxVol, p, a);
            }
        });
        maxVol = maxVol || 1; 

        let barsHtml = ''; 

        // 5. Generate Bars
        trendsJson.data.forEach((week, idx) => {
            const cat = week.categories[jsonKey];
            if (!cat) return;

            const isCurrentWeek = (idx === trendsJson.data.length - 1); 
            
            const plannedMins = cat.planned || 0;
            const actualMins = cat.actual || 0;

            const hActual = Math.round((actualMins / maxVol) * 100); 
            const hPlan = Math.round((plannedMins / maxVol) * 100); 

            // Use pre-calculated growth from JSON
            const actualGrowth = cat.actual_growth !== undefined ? cat.actual_growth : 0;
            const plannedGrowth = cat.planned_growth !== undefined ? cat.planned_growth : 0;

            const [actualClass, _, actualTextClass] = getStatusColor(actualGrowth);
            const [__, planHex, planTextClass] = getStatusColor(plannedGrowth);

            const formatLabel = (val) => {
                const sign = val > 0 ? '▲' : (val < 0 ? '▼' : '');
                return (val !== null && val !== undefined) ? `${sign} ${Math.round(Math.abs(val) * 100)}%` : '--';
            };
            
            const actLabel = formatLabel(actualGrowth);
            const planLabel = formatLabel(plannedGrowth);
            const limitLabel = `Limit: ${Math.round(redLimit*100)}%`;

            const planBarStyle = `
                background: repeating-linear-gradient(
                    45deg, ${planHex} 0, ${planHex} 4px, transparent 4px, transparent 8px
                ); border: 1px solid ${planHex}; opacity: 0.3;`;

            const actualOpacity = isCurrentWeek ? 'opacity-90' : 'opacity-80'; 
            
            const clickAttr = `onclick="window.showVolumeTooltip(event, '${week.week_label}', ${Math.round(plannedMins)}, '${planLabel}', '${planTextClass}', ${Math.round(actualMins)}, '${actLabel}', '${actualTextClass}', '${limitLabel}')"`;

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
