// js/views/readiness/index.js
import { buildCollapsibleSection } from ../../utils/ui.js;
import { renderGuide, renderEventList } from './components.js';

// Note: logic.js is no longer imported because calculations are done in Python

export function renderReadiness(readinessData) {
    // New error message for the JSON data flow
    if (!readinessData) return '<div class="p-8 text-slate-500 italic">No readiness data found. Please run the Python generation script and check data/readiness/readiness.json exists.</div>';

    // 1. Process Data (Directly from JSON object)
    const { trainingStats, upcomingEvents, generatedAt } = readinessData;

    // 2. Build Components
    const guideHtml = renderGuide();
    
    // Ensure events and stats are passed correctly to the component
    const eventsHtml = renderEventList(upcomingEvents, trainingStats);
    
    // Format generation date for display
    const genDate = new Date(generatedAt).toLocaleString();

    // 3. Assemble View
    return `
        <div class="max-w-5xl mx-auto space-y-4">
            <div class="text-right text-xs text-slate-500 mb-2">Last Updated: ${genDate}</div>
            ${UI.buildCollapsibleSection('readiness-guide', 'Legend & Logic', guideHtml, true)}
            ${UI.buildCollapsibleSection('readiness-events', 'Event Status', eventsHtml, true)}
        </div>
    `;
}
