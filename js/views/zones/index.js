import { buildCollapsibleSection } from '../dashboard/utils.js';

export function renderZones() {
    setTimeout(async () => {
        const container = document.getElementById('zones-content');
        if (!container) return;

        try {
            const response = await fetch('data/zones/zones.json');
            if (!response.ok) throw new Error("Zones data not found");

            const data = await response.json();
            container.innerHTML = generateZonesHTML(data);

        } catch (error) {
            console.error("Failed to load zones:", error);
            container.innerHTML = `<p class="text-slate-500 italic">Unable to load zones data.</p>`;
        }
    }, 50);

    const loadingHtml = `<div id="zones-content" class="min-h-[100px] flex items-center justify-center text-slate-500">
        <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading Zones...
    </div>`;

    return buildCollapsibleSection('zones-section', 'Training Zones', loadingHtml, true);
}

function generateZonesHTML(data) {
    if (!data || Object.keys(data).length === 0) {
        return '<p class="text-slate-500 italic">No zone data available.</p>';
    }

    let html = '';

    // FIX: Added 'grid' container for even spacing
    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

    // Iterate through each zone category (e.g., "Heart Rate", "Power")
    for (const [category, zones] of Object.entries(data)) {
        
        // FIX: Applied 'bubble' card styling (bg-slate-800, rounded-xl, etc.)
        html += `
            <div class="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 relative overflow-hidden">
                <h3 class="text-lg font-bold text-white mb-4 capitalize border-b border-slate-700 pb-2">
                    ${category.replace(/_/g, ' ')}
                </h3>
                
                <div class="space-y-3">
                    ${renderZoneRows(zones)}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function renderZoneRows(zones) {
    if (!Array.isArray(zones)) return '';

    return zones.map(z => `
        <div class="flex justify-between items-center bg-slate-700/30 rounded-lg p-3">
            <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-200">${z.name || 'Zone'}</span>
                <span class="text-xs text-slate-400">${z.description || ''}</span>
            </div>
            <div class="text-right">
                <span class="text-sm font-mono font-bold text-emerald-400">
                    ${z.min} - ${z.max} ${z.unit || ''}
                </span>
            </div>
        </div>
    `).join('');
}
