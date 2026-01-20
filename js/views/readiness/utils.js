// js/views/readiness/utils.js

// --- HELPER: Identify Sport (Strict Text Match) ---
export const checkSport = (activity, sportKey) => {
    // Look at 'actualSport' (Primary) or 'activityType' (Fallback)
    const sportStr = String(activity.actualSport || activity.activityType || "").toUpperCase();
    const target = sportKey.toUpperCase();

    if (target === 'BIKE') return sportStr.includes('BIKE') || sportStr.includes('CYCL') || sportStr.includes('RIDE');
    if (target === 'RUN')  return sportStr.includes('RUN') || sportStr.includes('JOG');
    if (target === 'SWIM') return sportStr.includes('SWIM') || sportStr.includes('POOL');
    
    return false;
};

export const parseDur = (str) => {
    if (!str || str === '-' || str.toLowerCase() === 'n/a') return 0;
    if (typeof str === 'number') return str;
    
    let mins = 0;
    const clean = str.toString().toLowerCase().trim();
    
    // Handle "1h 30m" format
    if (clean.includes('h')) {
        const parts = clean.split('h');
        mins += parseInt(parts[0]) * 60;
        if (parts[1] && parts[1].includes('m')) {
            mins += parseInt(parts[1]);
        }
    } 
    // Handle "90m" or just numbers
    else if (clean.includes('m')) {
        mins += parseInt(clean);
    } 
    // Handle "1:30" format
    else if (clean.includes(':')) {
        const parts = clean.split(':');
        mins += parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
    }
    // Handle raw numbers (assumed minutes)
    else if (!isNaN(clean)) {
        mins += parseInt(clean);
    }
    
    return Math.round(mins);
};

export const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
};

// --- GLOBAL TOGGLE ---
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

export const buildCollapsibleSection = (id, title, contentHtml, isOpen = true) => {
    const contentClasses = isOpen ? "max-h-[5000px] opacity-100 py-4 mb-8" : "max-h-0 opacity-0 py-0 mb-0";
    const iconClasses = isOpen ? "rotate-0" : "-rotate-90";

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
