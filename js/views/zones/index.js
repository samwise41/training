// js/views/zones/index.js

export async function renderZonesTab() {
    const containerId = 'zones-tab-content';
    
    setTimeout(async () => {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const cacheBuster = new Date().getTime();
            const response = await fetch(`data/zones/zones.json?t=${cacheBuster}`);
            if (!response.ok) throw new Error("Zones JSON not found");
            const data = await response.json();

            container.innerHTML = `
                <div class="zones-layout grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                    ${renderZoneCard("Cycling Power Zones", data.cycling)}
                    ${renderZoneCard("Running Heart Rate Zones", data.running)}
                </div>
            `;
        } catch (err) {
            console.error("Zones Load Error:", err);
            container.innerHTML = `<div class="p-12 text-center text-slate-500 italic">Unable to load zones.</div>`;
        }
    }, 50);

    return `<div id="${containerId}" class="min-h-[400px]"></div>`;
}

function renderZoneCard(title, sportData) {
    if (!sportData || !sportData.zones) return '';

    const rows = sportData.zones.map(z => {
        // Determine the CSS class for the color border based on zone name
        let zClass = 'border-slate-500'; // Default
        const name = z.name.toLowerCase();
        
        if (name.includes('zone 1')) zClass = 'border-slate-400';
        else if (name.includes('zone 2')) zClass = 'border-blue-500';
        else if (name.includes('zone 3')) zClass = 'border-emerald-500';
        else if (name.includes('sweet spot')) zClass = 'border-yellow-500';
        else if (name.includes('zone 4')) zClass = 'border-orange-500';
        else if (name.includes('zone 5')) zClass = 'border-red-500';

        // Adjusted row bg to bg-slate-700/40 so it stands out against the card's bg-slate-800
        return `
            <div class="flex justify-between items-center bg-slate-700/40 p-4 rounded-lg border-l-4 ${zClass} mb-3 shadow-sm">
                <span class="text-sm font-bold text-slate-100">${z.name}</span>
                <span class="text-sm font-mono text-slate-400">${z.range}</span>
            </div>
        `;
    }).join('');

    // Added the requested "bubble" card styling here
    return `
        <div class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col h-full">
            <h3 class="text-xs font-black uppercase tracking-widest text-white mb-6 opacity-80 border-b border-slate-700 pb-2">${title}</h3>
            <div class="space-y-1">
                ${rows}
            </div>
        </div>
    `;
}
