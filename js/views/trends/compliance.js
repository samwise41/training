import { getIconForType } from './utils.js';

// Helper: Color Coding based on %
const getColor = (pct) => pct >= 80 ? '#22c55e' : (pct >= 50 ? '#eab308' : '#ef4444');

const buildConcentricChart = (d30, d60, centerLabel) => {
    // 30d Ring (Outer)
    const r1 = 15.9155; 
    const dash1 = `${d30.pct} ${100 - d30.pct}`; 
    const color1 = getColor(d30.pct);

    // 60d Ring (Inner)
    const r2 = 10; 
    const c2 = 2 * Math.PI * r2; // ~62.8
    const val2 = (d60.pct / 100) * c2; 
    const dash2 = `${val2} ${c2 - val2}`; 
    const color2 = getColor(d60.pct); 

    return `
        <div class="flex flex-col items-center justify-center w-full py-2">
            <div class="relative w-[120px] h-[120px] mb-2">
                <svg width="100%" height="100%" viewBox="0 0 42 42" class="donut-svg">
                    <circle cx="21" cy="21" r="${r1}" fill="none" stroke="#1e293b" stroke-width="3"></circle>
                    <circle cx="21" cy="21" r="${r2}" fill="none" stroke="#1e293b" stroke-width="3"></circle>
                    
                    <circle cx="21" cy="21" r="${r1}" fill="none" stroke="${color1}" stroke-width="3" 
                        stroke-dasharray="${dash1}" stroke-dashoffset="25" stroke-linecap="round"></circle>
                    
                    <circle cx="21" cy="21" r="${r2}" fill="none" stroke="${color2}" stroke-width="3" 
                        stroke-dasharray="${dash2}" stroke-dashoffset="${c2 * 0.25}" stroke-linecap="round"></circle>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">${centerLabel}</span>
                </div>
            </div>
            
            <div class="flex flex-col gap-1 text-[10px] w-full items-center">
                <div class="flex items-center justify-center gap-2">
                    <span class="font-bold text-slate-400 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${color1}"></span> 30d
                    </span>
                    <span class="font-mono text-white flex items-center gap-1">
                        ${d30.pct}% <span class="text-slate-500 opacity-80">(${d30.label})</span>
                    </span>
                </div>
                
                <div class="flex items-center justify-center gap-2">
                    <span class="font-bold text-slate-500 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${color2}"></span> 60d
                    </span>
                    <span class="font-mono text-slate-300 flex items-center gap-1">
                        ${d60.pct}% <span class="text-slate-500 opacity-80">(${d60.label})</span>
                    </span>
                </div>
            </div>
        </div>
    `;
};

const buildCombinedCard = (dataObj, title, type) => {
    // dataObj is adherenceData.compliance[type]
    if (!dataObj) return '';

    // Extract Count Data
    const c30 = { pct: dataObj['30d'].count_pct, label: dataObj['30d'].count_label };
    const c60 = { pct: dataObj['60d'].count_pct, label: dataObj['60d'].count_label };

    // Extract Duration Data
    const d30 = { pct: dataObj['30d'].duration_pct, label: dataObj['30d'].duration_label };
    const d60 = { pct: dataObj['60d'].duration_pct, label: dataObj['60d'].duration_label };

    return `
        <div class="kpi-card">
            <div class="kpi-header mb-2">${getIconForType(type)}<span class="kpi-title">${title}</span></div>
            <div class="flex justify-around items-start">
                <div class="w-1/2 border-r border-slate-700 pr-2">
                    ${buildConcentricChart(c30, c60, "Count")}
                </div>
                <div class="w-1/2 pl-2">
                    ${buildConcentricChart(d30, d60, "Time")}
                </div>
            </div>
        </div>
    `;
};

export const renderComplianceSection = (complianceData) => {
    if (!complianceData) return `<div class="p-4 text-red-500">Compliance data missing</div>`;
    
    return `
        <div class="kpi-grid mb-0">
            ${buildCombinedCard(complianceData['All'], "All Activities", "All")}
            ${buildCombinedCard(complianceData['Bike'], "Cycling", "Bike")}
            ${buildCombinedCard(complianceData['Run'], "Running", "Run")}
            ${buildCombinedCard(complianceData['Swim'], "Swimming", "Swim")}
        </div>
    `;
};

