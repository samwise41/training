// js/views/dashboard/index.js
import { Parser } from '../../parser.js';
import { renderPlannedWorkouts } from './plannedWorkouts.js';
import { renderProgressWidget } from './progressWidget.js';
import { renderHeatmaps } from './heatmaps.js';

// --- GITHUB SYNC TRIGGER ---
window.triggerGitHubSync = async () => {
    let token = localStorage.getItem('github_pat');
    
    if (!token) {
        token = prompt("🔐 Enter GitHub Personal Access Token (PAT) to enable remote sync:");
        if (token) {
            localStorage.setItem('github_pat', token.trim());
        } else {
            return; 
        }
    }

    const btn = document.getElementById('btn-force-sync');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Syncing...</span>';

    try {
        const response = await fetch(`https://api.github.com/repos/samwise41/training-plan/actions/workflows/01_1_Training_Data_Sync.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ ref: 'main' })
        });

        if (response.ok) {
            alert("🚀 Sync triggered! The dashboard will update in about 2 minutes.");
        } else {
            throw new Error(`Sync failed: ${response.statusText}`);
        }
    } catch (err) {
        console.error(err);
        alert("❌ Error starting sync. Check your console and PAT permissions.");
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.innerHTML = originalContent;
    }
};

/**
 * Main Dashboard Entry Point
 * Now converted to an ASYNC function to support the streak data fetch
 */
export async function renderDashboard(planMd, mergedLogData) {
    const scheduleSection = Parser.getSection(planMd, "Weekly Schedule");
    if (!scheduleSection) return '<p class="text-slate-500 italic">No Weekly Schedule found.</p>';

    const workouts = Parser._parseTableBlock(scheduleSection);
    workouts.sort((a, b) => a.date - b.date);

    const fullLogData = mergedLogData || [];

    // Await the widget result to prevent [object Promise] errors
    const progressHtml = await renderProgressWidget(workouts, fullLogData);
    
    // These remain synchronous or handle their own loading states internally
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
        ${progressHtml}
        ${plannedWorkoutsHtml}
        ${heatmapsHtml}
    `;
}
