// js/views/dashboard/index.js
import { Parser } from '../../parser.js';
import { renderPlannedWorkouts } from './plannedWorkouts.js';
import { renderProgressWidget } from './progressWidget.js';
import { renderHeatmaps } from './heatmaps.js';

// ... (triggerGitHubSync and showDashboardTooltip remain unchanged) ...

export function renderDashboard(planMd, mergedLogData) {
    const scheduleSection = Parser.getSection(planMd, "Weekly Schedule");
    if (!scheduleSection) return '<p class="text-slate-500 italic">No Weekly Schedule found.</p>';

    const workouts = Parser._parseTableBlock(scheduleSection);
    workouts.sort((a, b) => a.date - b.date);

    const fullLogData = mergedLogData || [];

    // REVERTED: Synchronous call. The widget handles its own async data internally.
    const progressHtml = renderProgressWidget(workouts, fullLogData);
    const plannedWorkoutsHtml = renderPlannedWorkouts(planMd);
    const heatmapsHtml = renderHeatmaps(fullLogData, planMd);

    const syncButtonHtml = `
        <div class="flex justify-end mb-4">
            <button id="btn-force-sync" onclick="window.triggerGitHubSync()" 
                class="text-[10px] uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 font-bold py-1.5 px-3 rounded transition-all shadow-sm flex items-center gap-2">
                <i class="fa-solid fa-rotate"></i>
                <span>Force Sync</span>
            </button>
        </div>
    `;

    return `
        ${syncButtonHtml}
        <div id="progress-widget-container">${progressHtml}</div>
        ${plannedWorkoutsHtml}
        ${heatmapsHtml}
        <div id="dashboard-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-2 rounded shadow-xl text-xs pointer-events-none opacity-0 transition-opacity fixed"></div>
    `;
}
