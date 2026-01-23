// js/views/zones/index.js
import { UI } from '../../utils/ui.js';

export function renderZonesTab(profileData) {
    if (!profileData || !profileData.zones) {
        return UI.buildCollapsibleSection('zones-error', 'Training Zones', 
            `<div class="p-4 text-slate-400 italic">No zone data available in profile.json</div>`, true);
    }

    const { heartRate, power } = profileData.zones;

    const buildRow = (label, colorClass, desc, hr, pwr) => `
        <tr class="hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0">
            <td class="p-4"><span class="${colorClass} font-bold text-base">${label}</span></td>
            <td class="p-4 text-slate-400">${desc}</td>
            <td class="p-4 font-mono text-slate-200">${hr || '-'} <span class="text-xs text-slate-500">bpm</span></td>
            <td class="p-4 font-mono text-slate-200">${pwr || '-'} <span class="text-xs text-slate-500">watts</span></td>
        </tr>
    `;

    const tableHtml = `
        <div class="overflow-hidden rounded-xl bg-slate-800/20 border border-slate-700">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-800/80">
                    <tr class="text-slate-400 text-xs uppercase tracking-wider">
                        <th class="p-4">Zone</th>
                        <th class="p-4">Intensity</th>
                        <th class="p-4">Heart Rate</th>
                        <th class="p-4">Power</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-slate-800">
                    ${buildRow('Z1', 'text-emerald-400', 'Recovery / Easy', heartRate?.z1, power?.z1)}
                    ${buildRow('Z2', 'text-blue-400', 'Endurance / Base', heartRate?.z2, power?.z2)}
                    ${buildRow('Z3', 'text-green-400', 'Tempo / Sweet Spot', heartRate?.z3, power?.z3)}
                    ${buildRow('Z4', 'text-yellow-400', 'Threshold / FTP', heartRate?.z4, power?.z4)}
                    ${buildRow('Z5', 'text-red-500', 'VO2 Max', heartRate?.z5, power?.z5)}
                    ${buildRow('Z6', 'text-purple-500', 'Anaerobic', '-', power?.z6)}
                </tbody>
            </table>
        </div>
        <div class="mt-4 text-[10px] text-slate-500 text-right font-mono">
            Based on Threshold HR: ${profileData.threshold_hr || 'N/A'} bpm | FTP: ${profileData.ftp || 'N/A'} w
        </div>
    `;

    return UI.buildCollapsibleSection('zones-content', 'Training Zones', tableHtml, true);
}
