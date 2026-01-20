// js/views/zones/index.js

export async function renderZonesTab() {
    const containerId = 'zones-tab-content';
    
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch('data/zones/zones.json');
            if (!response.ok) throw new Error("Zones JSON file not found");
            
            const data = await response.json();

            // Check if the expected keys exist and have data
            const hasCycling = data.cycling && data.cycling.zones && data.cycling.zones.length > 0;
            const hasRunning = data.running && data.running.zones && data.running.zones.length > 0;

            if (!hasCycling && !hasRunning) {
                container.innerHTML = `
                    <div class="p-12 text-center">
                        <i class="fa-solid fa-triangle-exclamation text-4xl text-yellow-500 mb-4"></i>
                        <p class="text-slate-400 italic">Zones data found but appears to be empty.</p>
                        <p class="text-xs text-slate-500 mt-2">Check your endurance_plan.md table formatting.</p>
                    </div>`;
                return;
            }

            container.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
                    ${hasCycling ? renderZoneCard("Cycling Power Zones", data.cycling, "text-purple-400") : ''}
                    ${hasRunning ? renderZoneCard("Running HR Zones", data.running, "text-pink-400") : ''}
                </div>
            `;
        } catch (err) {
            console.error("Zones Load Error:", err);
            container.innerHTML = `
                <div class="p-12 text-center">
                    <i class="fa-solid fa-file-circle-exclamation text-4xl text-red-500/50 mb-4"></i>
                    <p class="text-slate-400 italic">Unable to load zones.json</p>
                    <p class="text-xs text-slate-500 mt-2">Ensure python/zones/createZones.py has been run.</p>
                </div>
            `;
        }
    }, 50);

    return `<div id="${containerId}" class="min-h-[400px]"></div>`;
}

function renderZoneCard(title, sportData, iconColor) {
    const rows = sportData.zones.map(z => `
        <div class="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/10 px-2 rounded transition-colors">
            <span class="text-sm font-bold text-slate-200">${z.name}</span>
            <span class="text-sm font-mono font-bold text-white bg-slate-900/50 px-3 py-1 rounded border border-slate-700">
                ${z.range}
            </span>
        </div>
    `).join('');

    return `
        <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid fa-gauge-high ${iconColor}"></i>
                    ${title}
                </h3>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-2 py-1 rounded">
                    ${sportData.type}
                </span>
            </div>
            <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter px-2 mb-2">
                    <span>Intensity Level</span>
                    <span>Range (${sportData.unit})</span>
                </div>
                ${rows}
            </div>
        </div>
    `;
}
