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

// --- TOOLTIP HANDLER ---
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

// --- DATA HELPERS ---

// 1. Normalize Dates (String -> Date Object)
function normalizeData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        const newItem = { ...item };
        if (newItem.date && typeof newItem.date === 'string') {
            const parts = newItem.date.split('-');
            if (parts.length === 3) {
                // Force Local Time Construction
                newItem.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                newItem.date = new Date(newItem.date);
            }
        }
        return newItem;
    });
}

// 2. Deduplicate (Fixes the "Doubling" Issue)
function deduplicateData(data) {
    const map = new Map();
    data.forEach(item => {
        if (!item.date) return;
        const dateStr = item.date.toISOString().split('T')[0];
        
        let sport = 'Other';
        const type = String(item.activityType || item.actualSport || '').toLowerCase();
        if (type.includes('bike') || type.includes('ride')) sport = 'Bike';
        else if (type.includes('run')) sport = 'Run';
        else if (type.includes('swim')) sport = 'Swim';
        
        const uniqueKey = `${dateStr}|${sport}`;
        
        // If conflict, keep the one with larger duration (assumed to be the master entry)
        if (map.has(uniqueKey)) {
            const existing = map.get(uniqueKey);
            const existDur = parseFloat(existing.plannedDuration || existing.actualDuration) || 0;
            const newDur = parseFloat(item.plannedDuration || item.actualDuration) || 0;
            if (newDur > existDur) map.set(uniqueKey, item);
        } else {
            map.set(uniqueKey, item);
        }
    });
    return Array.from(map.values());
}

// 3. Parse Phase & Events from Markdown
function parseTopLevelStats(planMd) {
    // Safety check for Markdown string
    if (!planMd || typeof planMd !== 'string') return { phase: "Unknown", event: null };

    const today = new Date();
    today.setHours(0,0,0,0);

    let currentPhase = "Training";
    let nextEvent = null;
    let minDays = 9999;

    const lines = planMd.split('\n');

    for (const line of lines) {
        // A. Extract Status
        if (line.includes('**Status:**')) {
            currentPhase = line.replace('**Status:**', '').trim();
        }
        
        // B. Extract Events
        if (line.trim().startsWith('|') && !line.includes('---') && !line.includes('Event Type')) {
            const parts = line.split('|').map(s => s.trim());
            // Format: | Date | Event Name | ...
            if (parts.length >= 3) {
                const evtDateStr = parts[1];
                const evtName = parts[2];
                const evtDate = new Date(evtDateStr);
                
                if (!isNaN(evtDate) && evtDate >= today) {
                    const diffTime = Math.abs(evtDate - today);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    
                    if (diffDays < minDays) {
                        minDays = diffDays;
                        nextEvent = { name: evtName, days: diffDays, date: evtDateStr };
                    }
                }
            }
        }
    }

    return { phase: currentPhase, event: nextEvent };
}

// --- MAIN RENDERER ---
// UPDATED SIGNATURE: Accepts 3 arguments to match app.js
export function renderDashboard(plannedData, actualData, planMd) {
    
    // 1. Process Data
    let workouts = normalizeData(plannedData);
    let fullLogData = normalizeData(actualData);

    // Fix doubling issue
    workouts = deduplicateData(workouts);

    // Sort
    workouts.sort((a, b) => a.date - b.date);
    fullLogData.sort((a, b) => a.date - b.date);

    // 2. Extract Top Cards Info
    const { phase, event } = parseTopLevelStats(planMd);

    // 3. Render Top Cards
    const eventHtml = event 
        ? `<div class="text-right">
             <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Next Event</div>
             <div class="text-lg font-bold text-white truncate">${event.name}</div>
             <div class="text-sm font-mono text-emerald-400">T-${event.days} Days <span class="text-slate-500 text-xs">(${event.date})</span></div>
           </div>`
        : `<div class="text-right">
             <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Next Event</div>
             <div class="text-sm text-slate-500 italic">No events scheduled</div>
           </div>`;

    const topCardsHtml = `
        <div class="grid grid-cols-2 gap-4 mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-sm">
            <div>
                <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Current Focus</div>
                <div class="text-xl font-bold text-white tracking-tight">${phase}</div>
                <div class="flex items-center gap-2 mt-1">
                    <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span class="text-xs text-emerald-400 font-mono font-bold">ACTIVE</span>
                </div>
            </div>
            ${eventHtml}
        </div>
    `;

    // 4. Render Child Components
    const progressHtml = renderProgressWidget(workouts, fullLogData);
    // Note: plannedWorkouts now accepts both to check completion status
    const plannedWorkoutsHtml = renderPlannedWorkouts(workouts, fullLogData);
    // Note: heatmaps now only needs fullLogData
    const heatmapsHtml = renderHeatmaps(fullLogData);

    // 5. Sync Button
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
        ${topCardsHtml}
        ${progressHtml}
        ${plannedWorkoutsHtml}
        ${heatmapsHtml}
        <div id="dashboard-tooltip-popup" class="z-50 bg-slate-900 border border-slate-600 p-2 rounded shadow-xl text-xs pointer-events-none opacity-0 transition-opacity fixed"></div>
    `;
}
