// js/views/gear/index.js
import { UI } from '../../utils/ui.js';

export function renderGear(gearData, currentTemp, hourlyWeather) {
    // 1. Loading State
    if (!gearData) {
        return `
            <div class="p-10 flex flex-col items-center justify-center text-slate-500 animate-pulse">
                <i class="fa-solid fa-bicycle text-4xl mb-4 text-slate-600"></i>
                <div class="text-sm font-mono">Loading Gear Locker...</div>
            </div>`;
    }

    // 2. Data Destructuring
    const bikeGear = gearData.bike || [];
    const runGear = gearData.run || [];

    // 3. Helper to build gear rows
    const buildRow = (item, type) => {
        const isRetired = item.status === 'Retired';
        const opacity = isRetired ? 'opacity-50 grayscale' : '';
        const icon = type === 'bike' ? 'fa-bicycle' : 'fa-shoe-prints';
        
        return `
            <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 ${opacity}">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                        <i class="fa-solid ${icon} text-xs"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-white">${item.name}</div>
                        <div class="text-[10px] text-slate-500 uppercase tracking-wider">${item.brand || ''}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-mono font-bold text-emerald-400">${Math.round(item.distance || 0)} <span class="text-[10px] text-slate-500">mi</span></div>
                    <div class="text-[10px] ${isRetired ? 'text-red-500' : 'text-blue-400'} font-bold uppercase">${item.status || 'Active'}</div>
                </div>
            </div>
        `;
    };

    // 4. Build Sections using UI
    const bikeHtml = `<div class="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-2">${bikeGear.map(g => buildRow(g, 'bike')).join('')}</div>`;
    const runHtml = `<div class="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-2">${runGear.map(g => buildRow(g, 'run')).join('')}</div>`;

    return `
        <div class="max-w-5xl mx-auto space-y-6">
            ${UI.buildCollapsibleSection('gear-bike', 'Bike Garage', bikeHtml, true)}
            ${UI.buildCollapsibleSection('gear-run', 'Shoe Rotation', runHtml, true)}
        </div>
    `;
}

// Keep this placeholder if app.js calls it
export function updateGearResult() {}
