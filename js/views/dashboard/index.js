import { Parser } from '../../parser.js';
import { renderPlannedWorkouts } from './plannedWorkouts.js';
import { renderProgressWidget } from './progressWidget.js';
import { renderHeatmaps } from './heatmaps.js';

// --- GITHUB SYNC TRIGGER ---
window.triggerGitHubSync = async () => {
    let token = localStorage.getItem('github_pat');
    
    // First time setup: Ask for token
    if (!token) {
        token = prompt("🔐 Enter GitHub Personal Access Token (PAT) to enable remote sync:");
        if (token) {
            localStorage.setItem('github_pat', token.trim());
        } else {
            return; // User cancelled
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
                localStorage.removeItem('github_pat'); // Clear bad token
                alert("❌ Authentication Failed.\n\nYour token might be invalid or expired. Please try again.");
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

// --- TOOLTIP HANDLER ---
// Keeps the tooltip logic for the Progress Widget and other dashboard elements
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
            <div class="text-[10px] text-slate-400 font-normal mb-1">${date}</div>
            <div class="text-[10px] text-slate-200 font-mono font-bold border-b border-slate-700 pb-1 mb-1">${sportType}</div>
            <div class="text-[11px] font-bold mt-1 uppercase tracking-wide" style="color: ${color}">${label}</div>
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

// --- MAIN RENDER FUNCTION ---
// Now async to handle fetching the heatmap JSON
export async function renderDashboard(planMd, mergedLogData) {
    const scheduleSection = Parser.getSection(planMd, "Weekly Schedule");
    if (!scheduleSection) return '<p class="text-slate-500 italic">No Weekly Schedule found.</p>';

    const workouts = Parser._parseTableBlock(scheduleSection);
    workouts.sort((a, b) => a.date - b.date);

    const fullLogData = mergedLogData || [];

    // 1. Fetch Heatmap Data (New Implementation)
    let heatmapData = {};
    try {
        const response = await fetch('data/dashboard/heatmaps.json');
        if (response.ok) {
            heatmapData = await response.json();
        } else {
            console.warn("Heatmaps.json not found, falling back to empty.");
        }
    } catch (e) {
        console.error("Error loading heatmaps:", e);
    }

    // 2. Render Widgets
    const progressHtml = renderProgressWidget(workouts, fullLogData);
    const plannedWorkoutsHtml = renderPlannedWorkouts(planMd);
    
    // Pass the fetched JSON data to the heatmaps renderer
    const heatmapsHtml = renderHeatmaps(heatmapData);

    // --- SYNC BUTTON HTML ---
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
