// js/views/zones/index.js
import { UI } from '../../utils/ui.js';

export function renderZonesTab(profileData) {
    // DEBUG: Check console to see what you are receiving
    console.log("Zones Tab Received:", profileData);

    // 1. Check for data
    if (!profileData || Object.keys(profileData).length === 0) {
        return UI.buildCollapsibleSection('zones-error', 'Training Zones', 
            `<div class="p-6 text-center text-slate-500 italic border border-dashed border-slate-700 rounded-xl">
                <i class="fa-solid fa-circle-exclamation text-yellow-500 mb-2"></i><br>
                Profile data is empty. Ensure <code>data/profile.json</code> exists and is valid JSON.
             </div>`, true);
    }

    // 2. Check for 'zones' key. 
    // If it's missing, maybe your JSON has 'heartRate' at the root level?
    const hr = (profileData.zones && profileData.zones.heartRate) || profileData.heartRate || {};
    const pwr = (profileData.zones && profileData.zones.power) || profileData.power || {};

    if (Object.keys(hr).length === 0 && Object.keys(pwr).length === 0) {
         return UI.buildCollapsibleSection('zones-missing', 'Training Zones', 
            `<div class="p-4 text-slate-400">
                Data loaded, but no zones found. <br>
                Expected format: <code>"zones": { "heartRate": {...}, "power": {...} }</code>
             </div>`, true);
    }

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
                    ${buildRow('Z1', 'text-emerald-400', 'Recovery',      getVal(hr, 'z1'), getVal(pwr, 'z1'))}
                    ${buildRow('Z2', 'text-blue-400',    'Endurance',     getVal(hr, 'z2'), getVal(pwr, 'z2'))}
                    ${buildRow('Z3', 'text-green-400',   'Tempo',         getVal(hr, 'z3'), getVal(pwr, 'z3'))}
                    ${buildRow('Z4', 'text-yellow-400',  'Threshold',     getVal(hr, 'z4'), getVal(pwr, 'z4'))}
                    ${buildRow('Z5', 'text-orange-500',  'VO2 Max',       getVal(hr, 'z5'), getVal(pwr, 'z5'))}
                    ${buildRow('Z6', 'text-red-500',     'Anaerobic',     getVal(hr, 'z6'), getVal(pwr, 'z6'))}
                </tbody>
            </table>
        </div>
        <div class="mt-4 text-[10px] text-slate-500 text-right font-mono uppercase tracking-widest">
            Threshold HR: ${profileData.threshold_hr || 'N/A'} | FTP: ${profileData.ftp || 'N/A'}
        </div>
    `;

    return UI.buildCollapsibleSection('zones-content', 'Training Zones', tableHtml, true);
}
