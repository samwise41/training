{
type: uploaded file
fileName: samwise41/training/training-01_12_Bug_Fixes/js/views/trends/index.js
fullContent:
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

// We now fetch adherence.json locally if it's not passed in (or handle it in App.js)
// For now, assuming App.js might not pass it yet, we can fetch it here or modify App.js
// To be safe/fast, let's fetch it if missing.
async function fetchAdherence() {
    try {
        const res = await fetch('./data/trends/adherence.json');
        return await res.json();
    } catch(e) {
        console.error("Failed to load adherence.json", e);
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
    // We will inject this after fetch
    const adherenceContainerHtml = `<div id="compliance-container"><div class="p-4 text-slate-500 italic">Loading compliance data...</div></div>`;
    const adherenceSection = buildCollapsibleSection('adherence-section', 'Compliance Overview', adherenceContainerHtml, true);

    // --- DURATION TOOL ---
    const durationHtml = renderDurationTool(logData);
    const durationSection = buildCollapsibleSection('duration-section', 'Deep Dive Analysis', durationHtml, true);

    // 3. Post-Render: Initialize Dynamic Charts
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
        }
    }, 50);

    return { html: volumeSection + trendsSection + adherenceSection + durationSection };
}

export { updateDurationAnalysis };
}
