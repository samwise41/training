// js/views/readiness/index.js
import { buildCollapsibleSection } from './utils.js';
import { getTrainingStats, parseEvents } from './logic.js';
import { renderGuide, renderEventList } from './components.js';

export function renderReadiness(logData, planMd) {
    if (!planMd) return '<div class="p-8 text-slate-500 italic">No plan data found. Check app.js connection.</div>';

    // 1. Process Data
    const trainingStats = getTrainingStats(logData || []);
    const upcomingEvents = parseEvents(planMd);

    // 2. Build Components
    const guideHtml = renderGuide();
    const eventsHtml = renderEventList(upcomingEvents, trainingStats);

    // 3. Assemble View
    return `
        <div class="max-w-5xl mx-auto space-y-4">
            ${buildCollapsibleSection('readiness-guide', 'Legend & Logic', guideHtml, true)}
            ${buildCollapsibleSection('readiness-events', 'Event Status', eventsHtml, true)}
        </div>
    `;
}
