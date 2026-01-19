// js/views/roadmap/index.js
import { safeMarked } from './utils.js';
import { generateVolumeData, parsePhases } from './logic.js';
import { renderVolumeGraph, renderPhaseList } from './components.js';

export function renderRoadmap(planMd) {
    if (!planMd) return '<div class="p-8 text-center text-slate-500">No plan loaded.</div>';

    // 1. Process Data
    const weeksData = generateVolumeData();
    const phasesData = parsePhases(planMd);

    // 2. Build Components
    const volumeGraphHtml = renderVolumeGraph(weeksData);
    const phasesHtml = renderPhaseList(phasesData);
    
    // 3. Render Full Plan (Marked)
    const fullPlanHtml = safeMarked(planMd);

    // 4. Assemble View
    return `
        <div class="max-w-4xl mx-auto space-y-10">
            
            <div>
                ${volumeGraphHtml}
            </div>

            <div>
                <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <i class="fa-solid fa-timeline text-blue-500"></i> Season Roadmap
                </h2>
                ${phasesHtml}
            </div>

            <div class="border-t border-slate-700"></div>
            
            <div>
                <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <i class="fa-solid fa-file-contract text-emerald-500"></i> Master Training Plan
                </h2>
                <div class="bg-slate-800/30 p-8 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                    <div class="markdown-body">
                        ${fullPlanHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}
