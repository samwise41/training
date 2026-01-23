// js/views/trends/index.js
import { UI } from '../../utils/ui.js';
import { DataManager } from '../../utils/data.js'; // <--- NEW IMPORT
import { renderVolumeChart } from './volume.js';
import { renderDynamicCharts } from './adherence.js';
import { renderComplianceSection } from './compliance.js';

let trendsData = null;
let adherenceData = null; 

export function renderTrends(_mergedLogData, _trendsData) {
    trendsData = _trendsData || { data: [] };

    // --- VOLUME SECTION ---
    const volumeChartsHtml = `
        ${renderVolumeChart(trendsData, 'All', 'Total Weekly Volume')}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-0">
            ${renderVolumeChart(trendsData, 'Bike', 'Cycling Volume')}
            ${renderVolumeChart(trendsData, 'Run', 'Running Volume')}
            ${renderVolumeChart(trendsData, 'Swim', 'Swimming Volume')}
        </div>`;
    const volumeSection = UI.buildCollapsibleSection('volume-section', 'Weekly Volume Analysis', volumeChartsHtml, true);

    // --- TRENDS SECTION (Container Only) ---
    const trendContainerHtml = `<div id="trend-charts-container"><div class="p-4 text-slate-500 italic">Loading adherence data...</div></div>`;
    const trendsSection = UI.buildCollapsibleSection('trends-section', 'Adherence Trends', trendContainerHtml, true);

    // --- ADHERENCE OVERVIEW (Placeholder) ---
    const adherenceContainerHtml = `<div id="compliance-container"><div class="p-4 text-slate-500 italic">Loading compliance data...</div></div>`;
    const adherenceSection = UI.buildCollapsibleSection('adherence-section', 'Compliance Overview', adherenceContainerHtml, true);

    // 3. Post-Render: Fetch & Initialize
    setTimeout(async () => {
        if (!adherenceData) {
            // USE DATA MANAGER
            adherenceData = await DataManager.fetchJSON('adherence');
        }
        
        if (adherenceData) {
            renderDynamicCharts('trend-charts-container', adherenceData.rolling_trends);
            
            const complianceDiv = document.getElementById('compliance-container');
            if (complianceDiv) {
                complianceDiv.innerHTML = renderComplianceSection(adherenceData.compliance);
            }
        } else {
             const tDiv = document.getElementById('trend-charts-container');
             if(tDiv) tDiv.innerHTML = '<div class="p-4 text-red-400">Adherence data not found. Run python generation script.</div>';
        }
    }, 50);

    return { html: volumeSection + trendsSection + adherenceSection };
}
