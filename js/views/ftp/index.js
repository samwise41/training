// js/views/ftp/index.js
import { UI } from '../../utils/ui.js';

export function renderFTP(profileData) {
    if (!profileData) return UI.buildCollapsibleSection('ftp-error', 'Power Profile', '<div class="p-4">No Profile Data</div>', true);

    const ftp = profileData.ftp || 0;
    const weight = profileData.weight || 1;
    const wkg = (ftp / weight).toFixed(2);
    
    // --- 1. Header Stats ---
    const statsHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">FTP</div>
                <div class="text-2xl font-bold text-white">${ftp} <span class="text-xs text-slate-400 font-normal">w</span></div>
            </div>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">Weight</div>
                <div class="text-2xl font-bold text-white">${weight} <span class="text-xs text-slate-400 font-normal">kg</span></div>
            </div>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">W/kg</div>
                <div class="text-2xl font-bold text-emerald-400">${wkg}</div>
            </div>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">Threshold HR</div>
                <div class="text-2xl font-bold text-red-400">${profileData.threshold_hr || '--'} <span class="text-xs text-slate-400 font-normal">bpm</span></div>
            </div>
        </div>
    `;

    // --- 2. Power Curve Table ---
    let rows = '';
    if (profileData.power_curve) {
        // Sort keys numerically/duration-wise if possible, or just iterate
        const keys = Object.keys(profileData.power_curve);
        // Custom sorter for durations like "5s", "1m", "20m"
        const durToSec = (d) => {
            if (d.includes('s')) return parseInt(d);
            if (d.includes('m')) return parseInt(d) * 60;
            return 9999;
        };
        keys.sort((a,b) => durToSec(a) - durToSec(b));

        keys.forEach(k => {
            const watts = profileData.power_curve[k];
            const pWkg = (watts / weight).toFixed(1);
            rows += `
                <tr class="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30">
                    <td class="py-2 px-4 font-mono text-slate-300">${k}</td>
                    <td class="py-2 px-4 font-bold text-white">${watts}w</td>
                    <td class="py-2 px-4 font-mono text-blue-400">${pWkg} w/kg</td>
                </tr>
            `;
        });
    }

    const tableHtml = `
        <div class="bg-slate-800/40 rounded-xl border border-slate-700 overflow-hidden">
            <div class="p-3 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase">Power Duration Curve</div>
            <table class="w-full text-left text-sm">
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    const contentHtml = `
        <div class="w-full">
            ${statsHtml}
            ${tableHtml}
        </div>
    `;

    return UI.buildCollapsibleSection('ftp-profile', 'Athlete Profile', contentHtml, true);
}
