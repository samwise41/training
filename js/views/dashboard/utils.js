// js/views/dashboard/utils.js

// --- DATE HELPERS ---

export const toLocalYMD = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


// --- STYLE & COLOR HELPERS ---

export const getSportColorVar = (type) => {
    if (type === 'Bike') return 'var(--color-bike)';
    if (type === 'Run') return 'var(--color-run)';
    if (type === 'Swim') return 'var(--color-swim)';
    if (type === 'Strength') return 'var(--color-strength, #a855f7)';
    return 'var(--color-all)';
};

export const getIcon = (type) => { 
    const colorStyle = `style="color: ${getSportColorVar(type)}"`;
    if (type === 'Bike') return `<i class="fa-solid fa-bicycle text-xl opacity-80" ${colorStyle}></i>`;
    if (type === 'Run') return `<i class="fa-solid fa-person-running text-xl opacity-80" ${colorStyle}></i>`;
    if (type === 'Swim') return `<i class="fa-solid fa-person-swimming text-xl opacity-80" ${colorStyle}></i>`;
    if (type === 'Strength') return `<i class="fa-solid fa-dumbbell text-xl opacity-80" ${colorStyle}></i>`;
    return `<i class="fa-solid fa-stopwatch text-slate-500 text-xl opacity-80"></i>`; 
};


// --- UI COMPONENT BUILDERS ---

/**
 * Creates a collapsible section structure.
 * Note: Relies on window.toggleSection (defined below) for interactivity.
 */
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
                <i id="icon-${id}" class="fa-solid fa-caret-down text-slate-400 text-base transition-transform duration-300 group-hover:text-white ${iconClasses}"></i>
                <h2 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">${title}</h2>
            </div>
            <div id="${id}" class="collapsible-content overflow-hidden transition-all duration-500 ease-in-out ${contentClasses}">
                ${contentHtml}
            </div>
        </div>
    `;
};


// --- GLOBAL INTERACTION HANDLERS ---

/**
 * Toggles the visibility of a collapsible section.
 * Attached to window to support inline onclick handlers in HTML strings.
 */
window.toggleSection = (id) => {
    const content = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    
    if (!content) return;

    // Toggle Content
    if (content.classList.contains('max-h-0')) {
        // OPEN
        content.classList.remove('max-h-0', 'opacity-0', 'py-0', 'mb-0');
        content.classList.add('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8');
        if (icon) {
            icon.classList.remove('-rotate-90');
            icon.classList.add('rotate-0');
        }
    } else {
        // CLOSE
        content.classList.remove('max-h-[5000px]', 'opacity-100', 'py-4', 'mb-8');
        content.classList.add('max-h-0', 'opacity-0', 'py-0', 'mb-0');
        if (icon) {
            icon.classList.remove('rotate-0');
            icon.classList.add('-rotate-90');
        }
    }
};

/**
 * Renders the floating tooltip for charts/grids.
 * Attached to window to support inline onclick handlers.
 */
window.showDashboardTooltip = (evt, date, plan, act, label, color, sportType) => {
    let tooltip = document.getElementById('dashboard-tooltip-popup');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'dashboard-tooltip-popup';
        tooltip.className = 'z-50 bg-slate-900 border border-slate-600 p-3 rounded-md shadow-xl text-xs pointer-events-none opacity-0 transition-opacity fixed min-w-[140px]';
        document.body.appendChild(tooltip);
    }

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
        </div>
    `;

    // Position Logic
    const x = evt.clientX;
    const y = evt.clientY;
    const viewportWidth = window.innerWidth;
    
    tooltip.style.top = `${y - 75}px`; 
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

    tooltip.classList.remove('opacity-0');
    
    if (window.dashTooltipTimer) clearTimeout(window.dashTooltipTimer);
    window.dashTooltipTimer = setTimeout(() => {
        tooltip.classList.add('opacity-0');
    }, 3000);
};
