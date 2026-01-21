import { buildCollapsibleSection } from './utils.js';
import { renderVolumeChart } from './volume.js';
import { renderDynamicCharts } from './adherence.js';
import { renderComplianceSection } from './compliance.js';
import { renderDurationTool, updateDurationAnalysis } from './duration.js';

let logData = [];
let planMdContent = "";

// Expose the analysis tool helper to global scope
window.App = window.App || {};
window.App.updateDurationAnalysis = updateDurationAnalysis;

// Updated signature to accept trendsData
export function renderTrends(mergedLogData, trendsData) {
    // 1. Initialize Data
    logData = Array.isArray(mergedLogData) ? mergedLogData : [];
    planMdContent = window.App?.planMd || "";
    
    // Ensure we have valid trends data or default to object with empty data array
    const safeTrendsData = trendsData || { data: [] };

    // 2. Build Sections
    
    // --- VOLUME SECTION ---
    const volumeChartsHtml = `
        ${renderVolumeChart(safeTrendsData, 'All', 'Total Weekly Volume')}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-0">
            ${renderVolumeChart(safeTrendsData, 'Bike', 'Cycling Volume')}
            ${renderVolumeChart(safeTrendsData, 'Run', 'Running Volume')}
            ${renderVolumeChart(safeTrendsData, 'Swim', 'Swimming Volume')}
        </div>`;
    const volumeSection = buildCollapsibleSection('volume-section', 'Weekly Volume Analysis', volumeChartsHtml, true);

    // --- TRENDS SECTION (Container Only) ---
    const trendContainerHtml = `<div id="trend-charts-container"></div>`;
    const trendsSection = buildCollapsibleSection('trends-section', 'Adherence Trends', trendContainerHtml, true);

    // --- ADHERENCE OVERVIEW ---
    const adherenceHtml = renderComplianceSection(logData);
    const adherenceSection = buildCollapsibleSection('adherence-section', 'Compliance Overview', adherenceHtml, true);

    // --- DURATION TOOL ---
    const durationHtml = renderDurationTool(logData);
    const durationSection = buildCollapsibleSection('duration-section', 'Deep Dive Analysis', durationHtml, true);

    // 3. Post-Render: Initialize Dynamic Charts
    setTimeout(() => {
        renderDynamicCharts('trend-charts-container', logData);
    }, 0);

    return { html: volumeSection + trendsSection + adherenceSection + durationSection };
}

// Re-export for App.js import destructuring
export { updateDurationAnalysis };
