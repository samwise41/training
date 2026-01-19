// js/views/trends/utils.js

// --- CONSTANTS ---
export const COLOR_MAP = { 
    All: 'var(--color-all)', 
    Bike: 'var(--color-bike)',
    Run: 'var(--color-run)',
    Swim: 'var(--color-swim)'
};

// --- DOM HELPERS ---
export const buildCollapsibleSection = (id, title, contentHtml, isOpen = true) => {
    const contentClasses = isOpen 
        ? "max-h-[5000px] opacity-100 py-4 mb-8" 
        : "max-h-0 opacity-0 py-0 mb-0";
    const iconClasses = isOpen 
        ? "rotate-0" 
        : "-rotate-90";

    return `
        <div class="w-full">
            <div class="flex items-center gap-2 cursor-pointer py-3 border-b-2 border-slate-700 hover:border-slate-500 transition-colors group select-none" onclick="window.toggleSection('${id}')">
                <i class="fa-solid fa-caret-down text-slate-400 text-base transition-transform duration-300 group-hover:text-white ${iconClasses}"></i>
                <h2 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">${title}</h2>
            </div>
            <div id="${id}" class="collapsible-content overflow-hidden transition-all duration-500 ease-in-out ${contentClasses}">
                ${contentHtml}
            </div>
        </div>
    `;
};

export const getIconForType = (type) => {
    if (type === 'Bike') return '<i class="fa-solid fa-bicycle icon-bike text-xl"></i>';
    if (type === 'Run') return '<i class="fa-solid fa-person-running icon-run text-xl"></i>';
    if (type === 'Swim') return '<i class="fa-solid fa-person-swimming icon-swim text-xl"></i>';
    return '<i class="fa-solid fa-chart-line icon-all text-xl"></i>';
};

// --- GLOBAL HANDLERS ---
// Ensure these are attached to window once imported
window.toggleSection = (id) => {
    const content = document.getElementById(id);
    if (!content) return;
    const header = content.previousElementSibling;
    const icon = header.querySelector('i.fa-caret-down');

    const isCollapsed = content.classList.contains('max-h-0');

    if (isCollapsed) {
        content.classList.remove('max-h-0', 'opacity-0', 'py-0', 'mb-0');
        content.classList.add('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8'); 
        if (icon) {
            icon.classList.add('rotate-0');
            icon.classList.remove('-rotate-90');
        }
    } else {
        content.classList.add('max-h-0', 'opacity-0', 'py-0', 'mb-0');
        content.classList.remove('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8');
        if (icon) {
            icon.classList.remove('rotate-0');
            icon.classList.add('-rotate-90');
        }
    }
};

window.showVolumeTooltip = (evt, date, planMins, planLabel, planColor, actMins, actLabel, actColor, limitLabel) => {
    const tooltip = document.getElementById('trend-tooltip-popup');
    if (!tooltip) return;

    tooltip.innerHTML = `
        <div class="text-center min-w-[140px]">
            <div class="font-bold text-white mb-2 border-b border-slate-600 pb-1">${date}</div>
            <div class="mb-3">
                <div class="text-lg font-bold text-white leading-none">Plan: ${planMins}m</div>
                <div class="text-[10px] ${planColor} font-mono mt-1 opacity-90">
                    vs Prior Act: ${planLabel} <span class="text-slate-500">(${limitLabel})</span>
                </div>
            </div>
            <div>
                <div class="text-lg font-bold text-white leading-none">Act: ${actMins}m</div>
                <div class="text-[10px] ${actColor} font-mono mt-1 opacity-90">
                    vs Prior Act: ${actLabel} <span class="text-slate-500">(${limitLabel})</span>
                </div>
            </div>
        </div>
    `;

    const x = evt.clientX;
    const y = evt.clientY;
    const viewportWidth = window.innerWidth;
    
    tooltip.style.position = 'fixed';
    tooltip.style.top = `${y - 100}px`; 
    tooltip.style.left = '';
    tooltip.style.right = '';

    if (x > viewportWidth * 0.60) {
        tooltip.style.right = `${viewportWidth - x + 10}px`;
        tooltip.style.left = 'auto';
    } else {
        tooltip.style.left = `${x - 70}px`; 
        tooltip.style.right = 'auto';
    }
    
    if (parseInt(tooltip.style.left) < 10) tooltip.style.left = '10px';

    tooltip.classList.remove('opacity-0', 'pointer-events-none');
    
    if (window.tooltipTimer) clearTimeout(window.tooltipTimer);
    window.tooltipTimer = setTimeout(() => {
        tooltip.classList.add('opacity-0', 'pointer-events-none');
    }, 4000);
};

window.showTrendTooltip = (evt, date, label, value, color, footer = null, footerColor = 'text-gray-400') => {
    const tooltip = document.getElementById('trend-tooltip-popup');
    if (!tooltip) return;

    if (footer) {
        tooltip.innerHTML = `
            <div class="text-center min-w-[120px]">
                <div class="font-bold text-white mb-1 border-b border-slate-600 pb-1">${date}</div>
                <div class="text-xs text-slate-300 mb-1">${label}</div>
                <div class="text-sm font-bold text-white mb-1 whitespace-nowrap">${value}</div>
                <div class="text-[10px] ${footerColor} border-t border-slate-700 pt-1 mt-1 font-mono">
                    ${footer}
                </div>
            </div>
        `;
    } else {
        tooltip.innerHTML = `
            <div class="font-bold text-white mb-1 border-b border-slate-600 pb-1">${date}</div>
            <div class="flex items-center gap-2 whitespace-nowrap">
                <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
                <span class="text-slate-300 text-xs">${label}:</span>
                <span class="text-white font-mono font-bold">${value}</span>
            </div>
        `;
    }

    const x = evt.clientX;
    const y = evt.clientY;
    const viewportWidth = window.innerWidth;
    
    tooltip.style.position = 'fixed';
    tooltip.style.top = `${y - 60}px`; 
    tooltip.style.left = '';
    tooltip.style.right = '';

    if (x > viewportWidth * 0.60) {
        tooltip.style.right = `${viewportWidth - x + 10}px`;
        tooltip.style.left = 'auto';
    } else {
        tooltip.style.left = `${x - 20}px`; 
        tooltip.style.right = 'auto';
    }
    
    if (x < 40) tooltip.style.left = '10px';

    tooltip.classList.remove('opacity-0', 'pointer-events-none');
    
    if (window.tooltipTimer) clearTimeout(window.tooltipTimer);
    window.tooltipTimer = setTimeout(() => {
        tooltip.classList.add('opacity-0', 'pointer-events-none');
    }, 3000);
};
