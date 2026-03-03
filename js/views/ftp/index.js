import { FTPData } from './data.js';
import { FTPCharts } from './charts.js';
import { FTPTemplates } from './templates.js';

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    return '';
};

// Function to handle the W/kg Calculator logic
function setupWkgCalculator() {
    const wInput = document.getElementById('calc-weight');
    const fInput = document.getElementById('calc-ftp');
    const kInput = document.getElementById('calc-wkg');
    const resultBox = document.getElementById('calc-result-box');
    const tableContainer = document.getElementById('calc-table-container');

    if (!wInput || !fInput || !kInput) return;

    const calculate = () => {
        const w = parseFloat(wInput.value);
        const f = parseFloat(fInput.value);
        const k = parseFloat(kInput.value);

        const hasW = !isNaN(w) && w > 0;
        const hasF = !isNaN(f) && f > 0;
        const hasK = !isNaN(k) && k > 0;

        const activeCount = [hasW, hasF, hasK].filter(Boolean).length;

        // Reset styling and table if not exactly 2 inputs
        if (activeCount !== 2) {
            resultBox.innerHTML = '<span class="text-slate-500 text-sm italic">Awaiting Inputs...</span>';
            tableContainer.classList.add('hidden');
            [wInput, fInput, kInput].forEach(el => {
                el.classList.remove('border-blue-500', 'bg-blue-900/20');
                el.classList.add('border-slate-700', 'bg-slate-900');
            });
            return;
        }

        let resultVal = 0;
        let kg = 0;

        // Reset backgrounds before highlighting
        [wInput, fInput, kInput].forEach(el => {
            el.classList.remove('border-blue-500', 'bg-blue-900/20');
            el.classList.add('border-slate-700', 'bg-slate-900');
        });

        // Scenario 1: Calculate FTP
        if (hasW && hasK) {
            kg = w / 2.20462;
            resultVal = Math.round(k * kg);
            resultBox.innerHTML = `<span class="text-xs text-slate-400 uppercase tracking-widest mb-1">Required FTP</span><span class="text-5xl font-black text-blue-400">${resultVal} <span class="text-xl text-slate-500 font-normal">W</span></span>`;
            fInput.value = ''; 
            fInput.classList.replace('bg-slate-900', 'bg-blue-900/20');
            fInput.classList.replace('border-slate-700', 'border-blue-500');
            renderTable('FTP', w, resultVal, k);
        } 
        // Scenario 2: Calculate Weight
        else if (hasF && hasK) {
            kg = f / k;
            resultVal = (kg * 2.20462).toFixed(1);
            resultBox.innerHTML = `<span class="text-xs text-slate-400 uppercase tracking-widest mb-1">Target Weight</span><span class="text-5xl font-black text-blue-400">${resultVal} <span class="text-xl text-slate-500 font-normal">lbs</span></span>`;
            wInput.value = '';
            wInput.classList.replace('bg-slate-900', 'bg-blue-900/20');
            wInput.classList.replace('border-slate-700', 'border-blue-500');
            renderTable('Weight', resultVal, f, k);
        } 
        // Scenario 3: Calculate W/kg
        else if (hasW && hasF) {
            kg = w / 2.20462;
            resultVal = (f / kg).toFixed(2);
            resultBox.innerHTML = `<span class="text-xs text-slate-400 uppercase tracking-widest mb-1">Resulting W/kg</span><span class="text-5xl font-black text-blue-400">${resultVal}</span>`;
            kInput.value = '';
            kInput.classList.replace('bg-slate-900', 'bg-blue-900/20');
            kInput.classList.replace('border-slate-700', 'border-blue-500');
            renderTable('W/kg', w, f, resultVal); 
        }
    };

    // Generates the surrounding data table
    const renderTable = (solveFor, weightLbs, ftp, targetWkg) => {
        tableContainer.classList.remove('hidden');
        let rows = '';
        const baseKg = parseFloat(weightLbs) / 2.20462;
        const baseFtp = parseInt(ftp);

        // If calculating FTP or W/kg, show how Watts impact W/kg at current weight
        if (solveFor === 'FTP' || solveFor === 'W/kg') {
            rows += `<table class="w-full text-sm text-left"><thead class="text-[10px] text-slate-400 uppercase bg-slate-800 sticky top-0"><tr><th class="px-4 py-2">Watts</th><th class="px-4 py-2">W/kg @ ${weightLbs} lbs</th></tr></thead><tbody>`;
            
            // Generate rows -5 to +5 watts
            for(let i = -5; i <= 5; i++) {
                const curFtp = baseFtp + i;
                const curWkg = (curFtp / baseKg).toFixed(2);
                const isTarget = i === 0;
                const rowClass = isTarget ? 'bg-blue-900/40 font-bold border-l-2 border-blue-500 text-white' : 'border-b border-slate-800/50 text-slate-400';
                rows += `<tr class="${rowClass} hover:bg-slate-700/30 transition-colors"><td class="px-4 py-2">${curFtp} W</td><td class="px-4 py-2">${curWkg}</td></tr>`;
            }
            rows += `</tbody></table>`;
        } 
        // If calculating Weight, show how Lbs impact W/kg at current FTP
        else if (solveFor === 'Weight') {
            const baseWeight = Math.round(parseFloat(weightLbs));
            rows += `<table class="w-full text-sm text-left"><thead class="text-[10px] text-slate-400 uppercase bg-slate-800 sticky top-0"><tr><th class="px-4 py-2">Weight</th><th class="px-4 py-2">W/kg @ ${ftp} W</th></tr></thead><tbody>`;
            
            // Generate rows -5 to +5 lbs
            for(let i = -5; i <= 5; i++) {
                const curW = baseWeight + i;
                const curKg = curW / 2.20462;
                const curWkg = (baseFtp / curKg).toFixed(2);
                const isTarget = i === 0;
                const rowClass = isTarget ? 'bg-blue-900/40 font-bold border-l-2 border-blue-500 text-white' : 'border-b border-slate-800/50 text-slate-400';
                rows += `<tr class="${rowClass} hover:bg-slate-700/30 transition-colors"><td class="px-4 py-2">${curW} lbs</td><td class="px-4 py-2">${curWkg}</td></tr>`;
            }
            rows += `</tbody></table>`;
        }
        
        tableContainer.innerHTML = rows;
        
        // Auto-scroll table to center the highlighted "target" row
        setTimeout(() => {
            const targetRow = tableContainer.querySelector('.border-blue-500');
            if(targetRow) {
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 10);
    };

    // Attach listeners
    [wInput, fInput, kInput].forEach(el => el.addEventListener('input', calculate));
}

export function renderFTP(profileData) {
    const bio = profileData || { wkg: 0, gauge_percent: 0, category: { label: "Unknown", color: "#64748b" } };
    const ts = Date.now();
    
    window.ftpChartIds = {
        cycleCurve: `curve-bike-${ts}`,
        runCurve: `curve-run-${ts}`,
        bikeHist: `hist-bike-${ts}`,
        runHist: `hist-run-${ts}`
    };

    const components = {
        gauge: FTPTemplates.gauge(bio.wkg, bio.gauge_percent, bio.category),
        bikeStats: FTPTemplates.cyclingStats(bio),
        runStats: FTPTemplates.runningStats(bio),
        calculator: FTPTemplates.wkgCalculator()
    };

    return FTPTemplates.layout(window.ftpChartIds, components);
}

export async function initCharts() {
    const ids = window.ftpChartIds;
    if (!ids) return;

    const bikeColor = getColor('--color-bike');
    const runColor = getColor('--color-run');

    // 1. Power Curves (SVG)
    FTPData.fetchCycling().then(data => {
        const el = document.getElementById(ids.cycleCurve);
        if (el && data.length) {
            const pts = data.map(d => ({ 
                x: d.seconds, 
                yAll: d.all_time_watts, 
                y6w: d.six_week_watts,
                dateAll: d.at_date, 
                date6w: d.sw_date
            })).filter(d => d.x >= 1);
            
            el.innerHTML = FTPCharts.renderSvgCurve(pts, { 
                containerId: ids.cycleCurve,
                width: 600, height: 250, xType: 'time', 
                colorAll: bikeColor, color6w: bikeColor, 
                showPoints: false 
            });
            FTPCharts.setupSvgInteractions(ids.cycleCurve, pts, { width: 600, xType: 'time', colorAll: bikeColor, color6w: bikeColor });
        }
    });

    FTPData.fetchRunning().then(data => {
        const el = document.getElementById(ids.runCurve);
        if (el && data.length) {
            el.innerHTML = FTPCharts.renderSvgCurve(data, { 
                containerId: ids.runCurve,
                width: 600, height: 250, xType: 'distance', 
                colorAll: runColor, color6w: runColor, 
                showPoints: true 
            });
            FTPCharts.setupSvgInteractions(ids.runCurve, data, { width: 600, xType: 'distance', colorAll: runColor, color6w: runColor });
        }
    });

    // 2. History Charts (Chart.js)
    const history = await FTPData.fetchGarminHistory();
    if (history.length) {
        // Sort by date to ensure chronological order
        const sorted = history.sort((a,b) => new Date(a["Date"]) - new Date(b["Date"]));
        
        const bikeData = sorted
            .filter(d => d["FTP"] > 0 && d["Weight (lbs)"] > 0)
            .map(d => ({
                date: d["Date"], // Pass full date for better X-axis formatting
                ftp: d["FTP"],
                wkg: parseFloat((d["FTP"] / (d["Weight (lbs)"] / 2.20462)).toFixed(2))
            }));

        const runData = sorted
            .filter(d => d["Run FTP Pace"] || d["Lactate Threshold HR"])
            .map(d => {
                let sec = null;
                if (d["Run FTP Pace"] && d["Run FTP Pace"].includes(':')) {
                    const [m, s] = d["Run FTP Pace"].split(':').map(Number);
                    sec = (m * 60) + s;
                }
                return {
                    date: d["Date"], // Pass full date for better X-axis formatting
                    pace: sec,
                    lthr: d["Lactate Threshold HR"] || null
                };
            });

        FTPCharts.renderBikeHistory(ids.bikeHist, bikeData, bikeColor);
        FTPCharts.renderRunHistory(ids.runHist, runData, runColor);
    }

    // Initialize the calculator interactions
    setupWkgCalculator();
}
