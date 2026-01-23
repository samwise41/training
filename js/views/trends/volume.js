// js/views/trends/volume.js

// --- 1. Global Click Handler for Tooltip Manager ---
window.handleVolumeClick = (evt, date, plan, planLabel, planClass, act, actLabel, actClass, limit) => {
    // Stop propagation to prevent immediate close
    evt.stopPropagation();
    const el = evt.currentTarget;
    
    const html = `
        <div class="min-w-[160px]">
            <div class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">${date}</div>
            
            <div class="grid grid-cols-2 gap-4 mb-1">
                <div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Plan</div>
                    <div class="text-sm font-bold text-white">${plan}m</div>
                    <div class="text-[10px] ${planClass} font-mono mt-0.5">
                        ${planLabel}
                    </div>
                </div>

                <div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Actual</div>
                    <div class="text-sm font-bold text-white">${act}m</div>
                    <div class="text-[10px] ${actClass} font-mono mt-0.5">
                        ${actLabel}
                    </div>
                </div>
            </div>
            
            <div class="mt-2 pt-2 border-t border-slate-700 text-[9px] text-slate-500 text-center font-mono">
                Growth Limit: <span class="text-slate-400">${limit}</span>
            </div>
        </div>
    `;

    if (window.TooltipManager) window.TooltipManager.show(el, html, evt);
};

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

        // 2. Revised Color Logic Methodology
        const getStatusColor = (pctChange, key) => {
            const val = pctChange;

            // --- Grey: Recovery / Deload (Below -5% for all) ---
            if (val < -0.05) return ['bg-slate-600', '#475569', 'text-slate-500'];

            // --- RUNNING Thresholds ---
            if (key === 'running') {
                if (val > 0.15) return ['bg-red-500', '#ef4444', 'text-red-400'];       
                if (val > 0.10) return ['bg-yellow-500', '#eab308', 'text-yellow-400']; 
                return ['bg-emerald-500', '#10b981', 'text-emerald-400'];              
            }

            // --- TOTAL Thresholds ---
            if (key === 'total') {
                if (val > 0.25) return ['bg-red-500', '#ef4444', 'text-red-400'];       
                if (val > 0.15) return ['bg-yellow-500', '#eab308', 'text-yellow-400']; 
                return ['bg-emerald-500', '#10b981', 'text-emerald-400'];              
            }

            // --- CYCLING & SWIMMING Thresholds ---
            if (key === 'cycling' || key === 'swimming') {
                if (val > 0.30) return ['bg-red-500', '#ef4444', 'text-red-400'];       
                if (val > 0.20) return ['bg-yellow-500', '#eab308', 'text-yellow-400']; 
                return ['bg-emerald-500', '#10b981', 'text-emerald-400'];              
            }

            return ['bg-emerald-500', '#10b981', 'text-emerald-400'];
        };

        // 3. Dynamic Threshold Label
        const getRedLimitLabel = (key) => {
            switch (key) {
                case 'running': return "10%";
                case 'total': return "20%";
                case 'cycling':
                case 'swimming': return "15%";
                default: return "10%";
            }
        };

        // 4. Calculate Max Volume for Scale
        let maxVol = 0;
        trendsJson.data.forEach(week => {
            const cat = week.categories[jsonKey];
            if (cat) {
                maxVol = Math.max(maxVol, cat.planned || 0, cat.actual || 0);
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

            const actualGrowth = cat.actual_growth !== undefined ? cat.actual_growth : 0;
            const plannedGrowth = cat.planned_growth !== undefined ? cat.planned_growth : 0;

            const [actualClass, _, actualTextClass] = getStatusColor(actualGrowth, jsonKey);
            const [__, planHex, planTextClass] = getStatusColor(plannedGrowth, jsonKey);

            const formatLabel = (val) => {
                const sign = val > 0 ? '▲' : (val < 0 ? '▼' : '');
                return `${sign} ${Math.round(Math.abs(val) * 100)}%`;
            };
            
            const actLabel = formatLabel(actualGrowth);
            const planLabel = formatLabel(plannedGrowth);
            const limitLabel = getRedLimitLabel(jsonKey);

            const planBarStyle = `
                background: repeating-linear-gradient(
                    45deg, ${planHex} 0, ${planHex} 4px, transparent 4px, transparent 8px
                ); border: 1px solid ${planHex}; opacity: 0.3;`;

            const actualOpacity = isCurrentWeek ? 'opacity-90' : 'opacity-80'; 
            
            // Updated OnClick Attribute
            const clickAttr = `onclick="window.handleVolumeClick(event, '${week.week_label}', ${Math.round(plannedMins)}, '${planLabel}', '${planTextClass}', ${Math.round(actualMins)}, '${actLabel}', '${actualTextClass}', '${limitLabel}')"`;

            barsHtml += `
                <div class="flex flex-col items-center gap-1 flex-1 group relative cursor-pointer" ${clickAttr}>
                    <div class="relative w-full bg-slate-800/30 rounded-t-sm h-32 flex items-end justify-center pointer-events-none">
                        <div style="height: ${hPlan}%; ${planBarStyle}" class="absolute bottom-0 w-full rounded-t-sm z-0"></div>
                        <div style="height: ${hActual}%;" class="relative z-10 w-2/3 ${actualClass} ${actualOpacity} rounded-t-sm"></div>
                    </div>
                    <span class="text-[9px] text-slate-400 font-mono text-center leading-none mt-1 pointer-events-none">
                        ${week.week_label}
                        ${isCurrentWeek ? '<br><span class="text-[8px] text-blue-400 font-bold uppercase">Next</span>' : ''}
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
