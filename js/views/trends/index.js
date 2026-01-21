
import { buildCollapsibleSection } from './utils.js';
import { renderVolumeChart } from './volume.js';
import { renderDynamicCharts } from './adherence.js';
import { renderComplianceSection } from './compliance.js';
import { renderDurationTool, updateDurationAnalysis } from './duration.js';

let logData = [];
let trendsData = null;
let adherenceData = null; // New state for pre-calculated json

// Expose the analysis tool helper to global scope
window.App = window.App || {};
window.App.updateDurationAnalysis = updateDurationAnalysis;

async function fetchAdherence() {
    try {
        const res = await fetch('./data/trends/adherence.json');
        if (!res.ok) throw new Error("404");
        return await res.json();
    } catch(e) {
        console.warn("Adherence data missing, using empty default.");
        return null;
    }
}

export function renderTrends(mergedLogData, _trendsData) {
    // 1. Initialize Data
    logData = Array.isArray(mergedLogData) ? mergedLogData : [];
    trendsData = _trendsData || { data: [] };

    // --- VOLUME SECTION ---
    const volumeChartsHtml = `
        ${renderVolumeChart(trendsData, 'All', 'Total Weekly Volume')}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-0">
            ${renderVolumeChart(trendsData, 'Bike', 'Cycling Volume')}
            ${renderVolumeChart(trendsData, 'Run', 'Running Volume')}
            ${renderVolumeChart(trendsData, 'Swim', 'Swimming Volume')}
        </div>`;
    const volumeSection = buildCollapsibleSection('volume-section', 'Weekly Volume Analysis', volumeChartsHtml, true);

    // --- TRENDS SECTION (Container Only) ---
    const trendContainerHtml = `<div id="trend-charts-container"><div class="p-4 text-slate-500 italic">Loading adherence data...</div></div>`;
    const trendsSection = buildCollapsibleSection('trends-section', 'Adherence Trends', trendContainerHtml, true);

    // --- ADHERENCE OVERVIEW (Placeholder) ---
    const adherenceContainerHtml = `<div id="compliance-container"><div class="p-4 text-slate-500 italic">Loading compliance data...</div></div>`;
    const adherenceSection = buildCollapsibleSection('adherence-section', 'Compliance Overview', adherenceContainerHtml, true);

    // --- DURATION TOOL ---
    const durationHtml = renderDurationTool(logData);
    const durationSection = buildCollapsibleSection('duration-section', 'Deep Dive Analysis', durationHtml, true);

    // 3. Post-Render: Fetch & Initialize
    setTimeout(async () => {
        if (!adherenceData) {
            adherenceData = await fetchAdherence();
        }
        
        if (adherenceData) {
            // Render Rolling Trends
            renderDynamicCharts('trend-charts-container', adherenceData.rolling_trends);
            
            // Render Compliance Donuts
            const complianceDiv = document.getElementById('compliance-container');
            if (complianceDiv) {
                complianceDiv.innerHTML = renderComplianceSection(adherenceData.compliance);
            }
        } else {
             const tDiv = document.getElementById('trend-charts-container');
             if(tDiv) tDiv.innerHTML = '<div class="p-4 text-red-400">Adherence data not found. Run python generation script.</div>';
        }
    }, 50);

    return { html: volumeSection + trendsSection + adherenceSection + durationSection };
}

export { updateDurationAnalysis };
