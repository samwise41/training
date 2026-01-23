// js/views/dashboard/utils.js

// ... (keep existing imports/helper functions) ...

// --- TOOLTIP LOGIC ---
window.showTooltip = function(evt, date, minutes, type, color) {
    let tooltip = document.getElementById('global-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        // Increased Z-Index to 9999
        tooltip.className = 'fixed z-[9999] bg-slate-900 border border-slate-600 rounded px-3 py-2 shadow-xl pointer-events-none text-xs';
        document.body.appendChild(tooltip);
    }

    const safeColor = color && color !== 'undefined' ? color : '#64748b';

    if (minutes == 0 || minutes === '0') {
        tooltip.innerHTML = `<span class="text-slate-400">${date}</span><br><span class="font-bold text-slate-500">${type}</span>`;
    } else {
        tooltip.innerHTML = `
            <span class="text-slate-300 border-b border-slate-700 pb-0.5 mb-1 block">${date}</span>
            <div class="font-bold text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background:${safeColor}"></span> ${type}
            </div>
            <span class="text-slate-400">${minutes} mins</span>
        `;
    }

    tooltip.style.display = 'block';
    tooltip.style.left = (evt.clientX + 10) + 'px';
    tooltip.style.top = (evt.clientY + 10) + 'px';
};

window.hideTooltip = function() {
    const tooltip = document.getElementById('global-tooltip');
    if (tooltip) tooltip.style.display = 'none';
};

// ... (keep exports) ...
