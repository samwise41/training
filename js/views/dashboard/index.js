// js/views/dashboard/index.js
import { renderPlannedWorkouts } from './plannedWorkouts.js';
import { renderProgressWidget } from './progressWidget.js';
import { renderHeatmaps } from './heatmaps.js';
import { renderTopCards } from './topCards.js'; 
import { normalizeData, mergeAndDeduplicate } from './utils.js';

// --- GITHUB SYNC ---
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
        const response = await fetch(`https://api.github.com/repos/samwise41/training-plan/actions/workflows/Training_Data_Sync.yml/dispatches`, {
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

// --- TOOLTIP ---
window.showDashboardTooltip = (evt, date, plan, act, label, color, sportType, details) => {
    let tooltip = document.getElementById('dashboard-tooltip-popup');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'dashboard-tooltip-popup';
        tooltip.className = 'z-50 bg-slate-900 border border-slate-600 p-3 rounded-md shadow-xl text-xs pointer-events-none opacity-0 transition-opacity fixed min-w-[140px]';
        document.body.appendChild(tooltip);
    }

    const detailsHtml = details ? `
        <div class="mt-2 pt-2 border-t border-slate-700 border-dashed text-slate-400 font-mono text-[10px] leading-tight text-left">
            ${details}
        </div>
    ` : '';

    tooltip.innerHTML = `
        <div class="text-center">
            <div class="text-white font-bold text-sm mb-0.5 whitespace-nowrap">
                Plan: ${Math.round(plan)}m | Act: ${Math.round(act)}m
            </div>
            
            <div class="text-[10px] text-slate-400 font-normal mb-1">
                ${date}
            </div>

            <div class="text-[10px] text-slate-200 font-mono font-bold border-b border-slate-700 pb-1 mb-1">
                ${sportType}
            </div>

            <div class="text-[11px] font-bold mt-1 uppercase tracking-wide" style="color: ${color}">
                ${label}
            </div>
            ${detailsHtml}
        </div>
    `;

    const x = evt.clientX;
    const y = evt.clientY;
    const viewportWidth = window.innerWidth;
    
    tooltip.style.top = `${y - 75}px`; 
    tooltip.style.left = ''; tooltip.style.right = '';

    if (x > viewportWidth * 0.60) {
        tooltip.style.right = `${viewportWidth - x + 10}px`;
        tooltip.style.left = 'auto';
    } else {
        tooltip.style.left = `${x - 70}px`; 
        tooltip.style.right = 'auto';
    }
    
    if (parseInt(tooltip.style.left) < 10) tooltip.style.left = '10px';

    tooltip.classList.remove('opacity-0');
    if (window.dashTooltipTimer) clearTimeout(window.dashTooltipTimer);
    window.dashTooltipTimer = setTimeout(() => tooltip.classList.add('opacity-0'), 3000);
};

// --- MAIN RENDERER ---
export function renderDashboard(plannedData, actualData, planMd) {
    // 1. Data Prep
    let workouts = normalizeData(plannedData);
    let fullLogData = normalizeData(actualData);
    
    // Deduplicate and Sort
    workouts = mergeAndDeduplicate(workouts, fullLogData);
    workouts.sort((a, b) => a.date - b.date);
    fullLogData.sort((a, b) => a.date - b.date);

    // 2. Render Components
    const topCardsHtml = renderTopCards(planMd);
    const progressHtml = renderProgressWidget(workouts, fullLogData);
    const plannedWorkoutsHtml = renderPlannedWorkouts(workouts, fullLogData);
    const heatmapsHtml = renderHeatmaps(fullLogData);

    // 3. Sync Button (Styled to fit between cards and widget)
    const syncButtonHtml = `
        <div class="flex justify-end mb-4">
            <button id="btn-force-sync" onclick="window.triggerGitHubSync()" 
                class="text-[10px] uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 font-bold py-1.5 px-3 rounded transition-all shadow-sm flex items-center gap-2">
                <i class="fa-solid fa-rotate"></i>
                <span>Force Sync</span>
            </button>
        </div>
    `;

    // 4. Return Final Layout
    // ORDER: Top Cards -> Sync Button -> Progress Tracker -> Workouts -> Heatmaps
    return `
        ${topCardsHtml}
        ${syncButtonHtml}
        ${progressHtml}
        ${plannedWorkoutsHtml}
        ${heatmapsHtml}
        <div id="dashboard-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-2 rounded shadow-xl text-xs pointer-events-none opacity-0 transition-opacity fixed"></div>
    `;
}
