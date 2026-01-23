// js/views/ftp/index.js
import { UI } from '../../utils/ui.js';
import { Formatters } from '../../utils/formatting.js';

export function renderFTP(profileData) {
    // 1. Safety Check
    if (!profileData || !profileData.ftp) {
        return UI.buildCollapsibleSection(
            'ftp-error', 
            'Power Profile', 
            '<div class="p-4 text-red-400 italic">Profile data missing or incomplete (check data/profile.json)</div>', 
            true
        );
    }

    const ftp = profileData.ftp;
    const weight = profileData.weight || 75;
    const wkg = (ftp / weight).toFixed(2);
    const hr = profileData.threshold_hr || '--';

    // 2. Build Header Stats
    const statsHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">FTP</div>
                <div class="text-3xl font-bold text-white tracking-tight">${ftp} <span class="text-xs text-slate-400 font-normal">w</span></div>
            </div>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">Weight</div>
                <div class="text-3xl font-bold text-white tracking-tight">${weight} <span class="text-xs text-slate-400 font-normal">kg</span></div>
            </div>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">W/kg</div>
                <div class="text-3xl font-bold text-emerald-400 tracking-tight">${wkg}</div>
            </div>
            <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
                <div class="text-[10px] uppercase text-slate-500 font-bold mb-1">LTHR</div>
                <div class="text-3xl font-bold text-red-400 tracking-tight">${hr} <span class="text-xs text-slate-400 font-normal">bpm</span></div>
            </div>
        </div>
    `;

    // 3. Prepare Chart Data
    const powerCurve = profileData.power_curve || {};
    // Sort keys by duration (1s, 5s, 1m, 5m, 20m, 1h)
    const durOrder = { 's': 1, 'm': 60, 'h': 3600 };
    const getSecs = (str) => {
        const unit = str.slice(-1);
        const val = parseFloat(str);
        return val * (durOrder[unit] || 1);
    };
    
    const sortedKeys = Object.keys(powerCurve).sort((a, b) => getSecs(a) - getSecs(b));
    const labels = sortedKeys; // ["5s", "1m", "5m"...]
    const dataValues = sortedKeys.map(k => powerCurve[k]);

    // 4. Render Chart Canvas
    // We attach the init logic in a timeout just like other views
    setTimeout(() => {
        initPowerChart(labels, dataValues);
    }, 100);

    const chartHtml = `
        <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
            <div class="h-[300px] w-full">
                <canvas id="powerCurveChart"></canvas>
            </div>
        </div>
    `;

    // 5. Build Table
    let tableRows = sortedKeys.map(k => {
        const watts = powerCurve[k];
        const rowWkg = (watts / weight).toFixed(1);
        return `
            <tr class="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                <td class="py-3 px-4 font-mono text-slate-300">${k}</td>
                <td class="py-3 px-4 font-bold text-white">${watts}w</td>
                <td class="py-3 px-4 font-mono text-blue-400">${rowWkg} w/kg</td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <div class="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <div class="p-3 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">Duration Breakdown</div>
            <table class="w-full text-left text-sm">
                <tbody class="divide-y divide-slate-800">${tableRows}</tbody>
            </table>
        </div>
    `;

    return UI.buildCollapsibleSection('ftp-profile', 'Athlete Profile & Power Curve', statsHtml + chartHtml + tableHtml, true);
}

function initPowerChart(labels, data) {
    const ctx = document.getElementById('powerCurveChart');
    if (!ctx || !window.Chart) return;

    // Destroy existing if re-rendering
    if (window.ftpChartInstance) {
        window.ftpChartInstance.destroy();
    }

    window.ftpChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Power (Watts)',
                data: data,
                borderColor: '#10b981', // Emerald 500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#064e3b',
                pointBorderColor: '#10b981',
                pointRadius: 4,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#94a3b8',
                    bodyColor: '#fff',
                    borderColor: '#334155',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8', font: { family: 'monospace' } }
                },
                x: {
                    grid: { color: 'transparent' },
                    ticks: { color: '#94a3b8', font: { family: 'monospace' } }
                }
            }
        }
    });
}
