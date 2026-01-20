// js/views/trends/volume.js

export async function renderVolumeAnalysis() {
    const containerId = 'volume-analysis-container';
    
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch(`data/trends/trends.json?t=${Date.now()}`);
            if (!response.ok) throw new Error("Trends data not found");
            const { data } = await response.json();

            container.innerHTML = `
                <div class="space-y-8">
                    ${renderChartGroup("Total Weekly Volume", "total", data)}
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        ${renderChartGroup("Cycling Volume", "cycling", data)}
                        ${renderChartGroup("Running Volume", "running", data)}
                        ${renderChartGroup("Swimming Volume", "swimming", data)}
                    </div>
                </div>
            `;
        } catch (err) {
            console.error("Trends Render Error:", err);
            container.innerHTML = `<p class="text-slate-500 italic p-8">Unable to load volume analysis.</p>`;
        }
    }, 50);

    return `<div id="${containerId}" class="min-h-[400px]"></div>`;
}

function getStatusColor(growth, sport) {
    const g = growth * 100; // Convert to percentage
    
    // Grey: Recovery / Deload
    if (g < -10) return 'bg-slate-500/50';
    
    if (sport === 'running') {
        if (g <= 10) return 'bg-emerald-500'; // Green: Controlled
        if (g <= 15) return 'bg-yellow-500';  // Yellow: Overloading
        return 'bg-red-500';                 // Red: Risk
    } else {
        // Bike/Swim
        if (g <= 20) return 'bg-emerald-500'; // Green
        if (g <= 30) return 'bg-yellow-500';  // Yellow
        return 'bg-red-500';                 // Red
    }
}

function renderChartGroup(title, category, data) {
    const bars = data.map(week => {
        const stats = week.categories[category];
        const pColor = getStatusColor(stats.planned_growth, category);
        const aColor = getStatusColor(stats.actual_growth, category);
        
        // Calculate relative heights (max 100px for mini charts, 160px for total)
        const maxHeight = category === 'total' ? 160 : 100;
        const pHeight = Math.min(maxHeight, (stats.planned / 800) * maxHeight); // Scale factor
        const aHeight = Math.min(maxHeight, (stats.actual / 800) * maxHeight);

        return `
            <div class="flex flex-col items-center gap-2 group relative">
                <div class="flex items-end gap-0.5 h-[${maxHeight}px]">
                    <div class="w-4 ${pColor} opacity-40 rounded-t-sm relative overflow-hidden" 
                         style="height: ${pHeight}px; background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);">
                    </div>
                    <div class="w-4 ${aColor} rounded-t-sm shadow-lg" style="height: ${aHeight}px;"></div>
                </div>
                <span class="text-[9px] font-bold text-slate-500 uppercase">${week.week_label}</span>
                
                <div class="absolute bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 border border-slate-700 p-2 rounded text-[10px] whitespace-nowrap shadow-2xl">
                    <div class="font-bold text-white mb-1">Week Ending ${week.week_end}</div>
                    <div class="flex justify-between gap-4">
                        <span>Planned: ${stats.planned}m</span>
                        <span class="${pColor.replace('bg-', 'text-')}">${(stats.planned_growth * 100).toFixed(1)}%</span>
                    </div>
                    <div class="flex justify-between gap-4">
                        <span>Actual: ${stats.actual}m</span>
                        <span class="${aColor.replace('bg-', 'text-')}">${(stats.actual_growth * 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                <i class="fa-solid ${category === 'total' ? 'fa-chart-column' : 'fa-bicycle'}"></i>
                ${title}
            </h3>
            <div class="flex justify-between items-end gap-1 px-2">
                ${bars}
            </div>
        </div>
    `;
}
