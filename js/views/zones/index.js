// js/views/zones/index.js
import { UI } from '../../utils/ui.js';

export function renderZonesTab(profileData) {
    // 1. Simple Check: Did the App pass us data?
    if (!profileData || !profileData.zones) {
        return UI.buildCollapsibleSection('zones-error', 'Training Zones', 
            `<div class="p-6 text-center text-slate-500 italic border border-dashed border-slate-700 rounded-xl">
                Zone data not found. Please check <code>data/profile.json</code>.
             </div>`, true);
    }

    const { heartRate, power } = profileData.zones;

    // Helper to handle casing differences (z1 vs Z1)
    const getVal = (obj, key) => (obj && (obj[key] || obj[key.toUpperCase()])) || '-';

    const buildRow = (label, colorClass, desc, hrVal, pwrVal) => `
        <tr class="hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0">
            <td class="p-4"><span class="${colorClass} font-bold text-base">${label}</span></td>
            <td class="p-4 text-slate-400">${desc}</td>
            <td class="p-4 font-mono text-slate-200">${hrVal} <span class="text-xs text-slate-500">bpm</span></td>
            <td class="p-4 font-mono text-slate-200">${pwrVal} <span class="text-xs text-slate-500">w</span></td>
        </tr>
    `;

    const tableHtml = `
        <div class="overflow-hidden rounded-xl bg-slate-800/20 border border-slate-700 shadow-sm">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-800 border-b border-slate-700">
                    <tr class="text-slate-400 text-xs uppercase tracking-wider">
                        <th class="p-4 font-bold">Zone</th>
                        <th class="p-4 font-bold">Intensity</th>
                        <th class="p-4 font-bold">Heart Rate</th>
                        <th class="p-4 font-bold">Power</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
                    ${buildRow('Z1', 'text-emerald-400', 'Recovery',      getVal(heartRate, 'z1'), getVal(power, 'z1'))}
                    ${buildRow('Z2', 'text-blue-400',    'Endurance',     getVal(heartRate, 'z2'), getVal(power, 'z2'))}
                    ${buildRow('Z3', 'text-green-400',   'Tempo',         getVal(heartRate, 'z3'), getVal(power, 'z3'))}
                    ${buildRow('Z4', 'text-yellow-400',  'Threshold',     getVal(heartRate, 'z4'), getVal(power, 'z4'))}
                    ${buildRow('Z5', 'text-orange-500',  'VO2 Max',       getVal(heartRate, 'z5'), getVal(power, 'z5'))}
                    ${buildRow('Z6', 'text-red-500',     'Anaerobic',     getVal(heartRate, 'z6'), getVal(power, 'z6'))}
                </tbody>
            </table>
        </div>
        <div class="mt-4 text-[10px] text-slate-500 text-right font-mono uppercase tracking-widest">
            Threshold HR: ${profileData.threshold_hr || 'N/A'} | FTP: ${profileData.ftp || 'N/A'}
        </div>
    `;

    return UI.buildCollapsibleSection('zones-content', 'Training Zones', tableHtml, true);
}
