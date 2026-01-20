// js/views/zones/index.js
import { buildCollapsibleSection } from '../dashboard/utils.js';

export async function renderZonesTab() {
    // This ID must match the one used in your main app.js router/tab switcher
    const containerId = 'zones-tab-content';
    
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Zone Error: Container #${containerId} not found in DOM.`);
            return;
        }

        try {
            // Force refresh by adding a timestamp to the URL
            const response = await fetch(`data/zones/zones.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error("Could not find zones.json");
            
            const data = await response.json();
            console.log("Zones Data successfully loaded:", data);

            const hasCycling = data.cycling?.zones?.length > 0;
            const hasRunning = data.running?.zones?.length > 0;

            if (!hasCycling && !hasRunning) {
                container.innerHTML = `<div class="p-12 text-center text-slate-500 italic">Zones file is empty. Run createZones.py again.</div>`;
                return;
            }

            container.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 max-w-7xl mx-auto">
                    ${hasCycling ? renderZoneCard("Cycling Power Zones", data.cycling, "text-purple-400", "fa-bolt") : ''}
                    ${hasRunning ? renderZoneCard("Running HR Zones", data.running, "text-pink-400", "fa-heart-pulse") : ''}
                </div>
            `;
        } catch (err) {
            console.error("Zones Fetch Error:", err);
            container.innerHTML = `
                <div class="p-12 text-center text-slate-500">
                    <i class="fa-solid fa-circle-exclamation text-2xl mb-2 text-red-500/50"></i>
                    <p class="italic">Unable to load zones.json. Ensure the file exists in /data/zones/</p>
                </div>
            `;
        }
    }, 50);

    // This is the "shell" that gets placed in the DOM immediately
    return `<div id="${containerId}" class="min-h-[400px] py-4"></div>`;
}

function renderZoneCard(title, sportData, iconColor, icon) {
    const rows = sportData.zones.map(z => `
        <div class="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 px-3 rounded-lg transition-colors">
            <span class="text-sm font-bold text-slate-200">${z.name}</span>
            <span class="text-sm font-mono font-bold text-white bg-slate-900/80 px-3 py-1 rounded border border-slate-700 shadow-inner">
                ${z.range}
            </span>
        </div>
    `).join('');

    return `
        <div class="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid ${icon} ${iconColor}"></i>
                    ${title}
                </h3>
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                    ${sportData.type}
                </span>
            </div>
            <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                    <span>Zone Name</span>
                    <span>${sportData.unit} Range</span>
                </div>
                ${rows}
            </div>
        </div>
    `;
}
