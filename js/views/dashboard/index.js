// js/views/dashboard/index.js
import { renderTopCards } from './topCards.js';
import { renderProgressWidget } from './progressWidget.js';
import { renderPlannedWorkouts } from './plannedWorkouts.js';
import { renderHeatmaps } from './heatmaps.js';
import { normalizeData, mergeAndDeduplicate } from './utils.js';

// --- GITHUB SYNC (Logic Only) ---
window.triggerGitHubSync = async () => {
    let token = localStorage.getItem('github_pat');
    if (!token) {
        token = prompt("🔐 Enter GitHub PAT:");
        if (token) localStorage.setItem('github_pat', token.trim()); else return;
    }
    const btn = document.getElementById('btn-force-sync');
    const orgHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Syncing...';
    btn.disabled = true;
    try {
        await fetch(`https://api.github.com/repos/samwise41/training-plan/actions/workflows/Training_Data_Sync.yml/dispatches`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref: 'main' })
        });
        alert("🚀 Sync Started!");
    } catch (e) { alert(`Error: ${e.message}`); }
    btn.innerHTML = orgHtml;
    btn.disabled = false;
};

// --- TOOLTIPS (Global Helper) ---
window.showDashboardTooltip = (evt, date, plan, act, label, color, sportType, details) => {
    let t = document.getElementById('dash-tooltip');
    if (!t) { t = document.createElement('div'); t.id = 'dash-tooltip'; t.className = 'fixed z-50 bg-slate-900 border border-slate-600 p-3 rounded shadow-xl pointer-events-none opacity-0 transition-opacity'; document.body.appendChild(t); }
    t.innerHTML = `<div class="text-center text-xs text-white"><div class="font-bold mb-1">${label}</div><div>${sportType}</div><div>Plan: ${plan}m | Act: ${act}m</div><div class="text-slate-400 mt-1">${date}</div></div>`;
    t.style.top = `${evt.clientY - 80}px`; t.style.left = `${evt.clientX - 60}px`;
    t.classList.remove('opacity-0');
    setTimeout(() => t.classList.add('opacity-0'), 3000);
};

// --- MAIN RENDERER ---
export function renderDashboard(plannedData, actualData, planMd) {
    // 1. Prepare Data (Clean & Merge)
    const pData = normalizeData(plannedData);
    const aData = normalizeData(actualData);
    
    // Create Unified Timeline (Fixes doubling and connects planned vs actual)
    const unifiedData = mergeAndDeduplicate(pData, aData);
    unifiedData.sort((a, b) => a.date - b.date);

    // 2. Render Components (Passing Clean Data)
    const topCards = renderTopCards(planMd);
    const progress = renderProgressWidget(unifiedData); // Widget now uses unified list
    const workouts = renderPlannedWorkouts(unifiedData);
    const heatmaps = renderHeatmaps(unifiedData);

    const syncBtn = `
        <div class="flex justify-end mb-4">
            <button id="btn-force-sync" onclick="window.triggerGitHubSync()" class="text-[10px] uppercase bg-slate-800 text-slate-400 hover:text-white border border-slate-700 font-bold py-1.5 px-3 rounded flex items-center gap-2">
                <i class="fa-solid fa-rotate"></i> <span>Force Sync</span>
            </button>
        </div>`;

    return `
        ${topCards}
        ${syncBtn}
        ${progress}
        ${workouts}
        ${heatmaps}
    `;
}
