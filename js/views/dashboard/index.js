// js/views/dashboard/index.js
import { renderPlannedWorkouts } from './plannedWorkouts.js';
import { renderProgressWidget } from './progressWidget.js';
import { renderHeatmaps } from './heatmaps.js';

// --- GITHUB SYNC TRIGGER ---
window.triggerGitHubSync = async () => {
    let token = localStorage.getItem('github_pat');
    if (!token) {
        token = prompt("🔐 Enter GitHub Personal Access Token (PAT) to enable remote sync:");
        if (token) localStorage.setItem('github_pat', token.trim());
        else return;
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

        if (response.ok) alert("🚀 Sync Started!\n\nCheck back in ~2-3 minutes.");
        else {
            if (response.status === 401) localStorage.removeItem('github_pat');
            alert(`❌ Sync Failed: ${await response.text()}`);
        }
    } catch (e) {
        alert(`❌ Error: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.innerHTML = originalContent;
    }
};

// --- DATA NORMALIZER (Dates) ---
function normalizeData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        const newItem = { ...item };
        // Ensure date is a Date object (handling YYYY-MM-DD strings safely)
        if (newItem.date && typeof newItem.date === 'string') {
            const parts = newItem.date.split('-');
            if (parts.length === 3) {
                // Force Local Time Construction (Avoids UTC shift)
                newItem.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                newItem.date = new Date(newItem.date);
            }
        }
        return newItem;
    });
}

// --- MAIN RENDERER ---
export function renderDashboard(plannedData, actualData) {
    // 1. Prepare Data
    const workouts = normalizeData(plannedData);
    const fullLogData = normalizeData(actualData);

    workouts.sort((a, b) => a.date - b.date);
    fullLogData.sort((a, b) => a.date - b.date);

    // 2. Render Components
    // FIX: Pass BOTH datasets to heatmaps so it can see the actual log
    const plannedWorkoutsHtml = renderPlannedWorkouts(workouts, fullLogData);
    const progressHtml = renderProgressWidget(workouts, fullLogData);
    const heatmapsHtml = renderHeatmaps(workouts, fullLogData); 

    // 3. Sync Button
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
