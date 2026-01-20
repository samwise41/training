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
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ref: 'main' })
        });

        if (response.ok) {
            alert("🚀 Sync Started!\n\nThe update process is running on GitHub.\nCheck back in ~2-3 minutes and refresh the page.");
        } else {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('github_pat');
                alert("❌ Authentication Failed.\n\nYour token might be invalid or expired.");
            } else {
                const err = await response.text();
                alert(`❌ Error: ${err}`);
            }
        }
    } catch (e) {
        alert(`❌ Network Connection Error: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.innerHTML = originalContent;
    }
};

/**
 * Main Dashboard Entry Point
 * Converted to ASYNC to support the new data-fetching widget
 */
export async function renderDashboard(planMd, mergedLogData) {
    const scheduleSection = Parser.getSection(planMd, "Weekly Schedule");
    if (!scheduleSection) return '<p class="text-slate-500 italic">No Weekly Schedule found.</p>';

    const workouts = Parser._parseTableBlock(scheduleSection);
    workouts.sort((a, b) => a.date - b.date);

    const fullLogData = mergedLogData || [];

    // --- FIX: We must await this call now ---
    const progressHtml = await renderProgressWidget(workouts, fullLogData);
    
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
        <div id="dashboard-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-2 rounded shadow-xl text-xs pointer-events-none opacity-0 transition-opacity fixed"></div>
    `;
}
