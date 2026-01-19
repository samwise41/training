// js/views/roadmap/components.js

export const renderVolumeGraph = (weeks) => {
    // Replaced dynamic SVG with static image from GitHub
    return `
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg mb-10">
             <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                   <i class="fa-solid fa-chart-line text-blue-500"></i>
                    Projected Volume (2026)
                </h2>
            </div>

            <img 
                src="https://raw.githubusercontent.com/samwise41/training-plan/main/projected_volume_2026.png" 
                alt="Projected Volume 2026" 
                class="w-full h-auto rounded-lg shadow-md"
            >
        </div>
    `;
};

export const renderPhaseList = (phases) => {
    if (!phases || phases.length === 0) return '';

    let html = `<div class="grid grid-cols-1 gap-4 mb-8">`;
    
    phases.forEach((p, index) => {
        const isCurrent = p.dates.includes("Jan") || (p.dates.includes("Feb") && index < 2); 
        
        let barColor = "bg-slate-700";
        let icon = "fa-layer-group";
        
        if (p.name.includes("Base")) { barColor = "bg-blue-600"; icon = "fa-cubes"; }
        if (p.name.includes("Build")) { barColor = "bg-emerald-600"; icon = "fa-chart-line"; }
        if (p.name.includes("Peak") || p.name.includes("Race")) { barColor = "bg-purple-600"; icon = "fa-flag-checkered"; }
        if (p.name.includes("Recovery")) { barColor = "bg-slate-500"; icon = "fa-bed"; }

        const activeClass = isCurrent ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900" : "opacity-75";

        html += `
            <div class="relative flex flex-col sm:flex-row items-start sm:items-center bg-slate-800 rounded-lg p-4 border border-slate-700 ${activeClass} gap-4">
                
                <div class="w-12 h-12 rounded-lg ${barColor} flex items-center justify-center text-white text-xl shadow-lg shrink-0">
                    <i class="fa-solid ${icon}"></i>
                </div>
                
                <div class="flex-1 w-full min-w-0">
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <h3 class="text-white font-bold text-lg leading-tight">${p.name}</h3>
                        <span class="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700 w-fit whitespace-nowrap">
                            ${p.weeks}
                        </span>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="inline-block bg-slate-700/50 px-2 py-1 rounded border border-slate-600 text-xs sm:text-sm text-slate-300">
                             ${p.focus}
                        </div>
                        <div class="text-xs text-slate-500 font-mono block">
                            ${p.dates}
                        </div>
                    </div>
                </div>

                ${isCurrent ? '<div class="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse"></div>' : ''}
            </div>
        `;
    });

    html += `</div>`;
    return html;
};
