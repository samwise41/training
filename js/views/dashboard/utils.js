// js/views/dashboard/utils.js


// 1. Define the Helper Helper FIRST
const getColor = (varName) => {
    // Check if we are in a browser environment to avoid crashes during build
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    // Fallback colors if CSS isn't loaded yet
    const defaults = {
        '--color-swim': '#22d3ee',
        '--color-bike': '#c084fc',
        '--color-run': '#f472b6',
        '--color-strength': '#94a3b8'
    };
    return defaults[varName] || '#888888';
};

// 2. Your Color Logic (Now it can safely use getColor)
export const getSportColor = (t) => {
    if (!t) return '#888888'; // Safety check for empty values
    const type = t.toLowerCase();

    if (type.includes('bike') || type.includes('cycl') || type.includes('ride')) {
        return getColor('--color-bike'); 
    }
    if (type.includes('run')) {
        return getColor('--color-run'); 
    }
    if (type.includes('swim') || type.includes('pool') || type.includes('water')) {
        return getColor('--color-swim'); 
    }
    if (type.includes('strength') || type.includes('weight') || type.includes('gym')) {
        return getColor('--color-strength'); 
    }
    
    return '#94a3b8'; // Default Slate
};


// --- DATE HELPERS ---
export const toLocalYMD = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};



// --- DATA NORMALIZATION & MERGING ---
export function normalizeData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        const newItem = { ...item };
        
        // 1. Normalize Dates to Local Midnight
        if (newItem.date && typeof newItem.date === 'string') {
            const parts = newItem.date.split('-');
            if (parts.length >= 3) {
                // Force "2023-10-25" OR "2023-10-25T14:00:00" to Local Midnight
                newItem.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2].slice(0, 2)));
            } else {
                newItem.date = new Date(newItem.date);
            }
        }

        // 2. Normalize Sport/Activity Type
        // We look for common fields (sport, type, activityType) and consolidate them
        const rawType = newItem.activityType || newItem.sport || newItem.type || newItem.actualSport || 'Other';
        newItem.activityType = rawType; // Ensure this field always exists for the UI

        // 3. Normalize Numbers
        newItem.plannedDuration = parseFloat(newItem.plannedDuration) || 0;
        newItem.actualDuration = parseFloat(newItem.actualDuration) || 0;
        
        return newItem;
    });
}

export function mergeAndDeduplicate(planned, actuals) {
    const map = new Map();
    
    // Robust Key Generator
    const getKey = (item) => {
        if (!item.date) return null;
        
        // Use toLocalYMD to ensure we match on "Calendar Day" not "UTC Timestamp"
        const dateStr = toLocalYMD(item.date);
        
        // Normalize sport for matching purposes
        let sport = 'Other';
        const type = String(item.activityType || '').toLowerCase();
        
        if (type.includes('bike') || type.includes('ride') || type.includes('cycl')) sport = 'Bike';
        else if (type.includes('run') || type.includes('jog')) sport = 'Run';
        else if (type.includes('swim') || type.includes('pool')) sport = 'Swim';
        else if (type.includes('strength') || type.includes('weight') || type.includes('lift')) sport = 'Strength';
        
        return `${dateStr}|${sport}`;
    };

    // 1. Add Plans
    planned.forEach(item => {
        const k = getKey(item);
        if (k) map.set(k, { ...item, source: 'plan' });
    });

    // 2. Merge Actuals
    actuals.forEach(item => {
        const k = getKey(item);
        if (k) {
            const existing = map.get(k) || {};
            // Merge existing plan with actual data
            // We prioritize 'item' (actual) values for things that overlap, but keep plan data
            const merged = { 
                ...existing, 
                ...item, 
                // Ensure specific fields don't get overwritten if they exist in plan but not actual
                plannedDuration: existing.plannedDuration || 0,
                plannedWorkout: existing.plannedWorkout || existing.planName,
                source: existing.source ? 'merged' : 'actual_only' 
            };
            map.set(k, merged);
        }
    });

    return Array.from(map.values());
}


export const getSportColorVar = (type) => {
        
    const t = String(type || '').toLowerCase();
    
    if (t.includes('bike') || t.includes('cycl') || t.includes('ride')) return getColor('--color-bike'); // Purple
    if (t.includes('run')) return getColor('--color-run'); // Pink
    if (t.includes('swim')) return getColor('--color-swim'); // Blue
    if (t.includes('strength') || t.includes('weight')) return '#94a3b8'; // Slate
    
    return getColor('--color-all'); // Emerald (Default)
};

export const getIcon = (type) => { 
    const t = String(type || '').toLowerCase();
    const color = getSportColorVar(t);
    const style = `style="color: ${color}"`;
    
    if (t.includes('bike') || t.includes('cycl') || t.includes('ride')) 
        return `<i class="fa-solid fa-bicycle text-xl opacity-80" ${style}></i>`;
    if (t.includes('run')) 
        return `<i class="fa-solid fa-person-running text-xl opacity-80" ${style}></i>`;
    if (t.includes('swim')) 
        return `<i class="fa-solid fa-person-swimming text-xl opacity-80" ${style}></i>`;
    
    return `<i class="fa-solid fa-dumbbell text-xl opacity-80" ${style}></i>`;
};

// --- UI BUILDER ---
export const buildCollapsibleSection = (id, title, content, isOpen = true) => {
    const arrowClass = isOpen ? 'rotate-0' : '-rotate-90';
    const contentClass = isOpen ? 'max-h-[5000px] opacity-100 py-4 mb-8' : 'max-h-0 opacity-0 py-0 mb-0';
    
    return `
        <div class="w-full">
            <div class="flex items-center gap-2 cursor-pointer py-3 border-b-2 border-slate-700 hover:border-slate-500 transition-colors group select-none" onclick="window.toggleSection('${id}')">
                <i id="icon-${id}" class="fa-solid fa-caret-down text-slate-400 text-base transition-transform duration-300 group-hover:text-white ${arrowClass}"></i>
                <h2 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">${title}</h2>
            </div>
            <div id="${id}" class="collapsible-content overflow-hidden transition-all duration-500 ease-in-out ${contentClass}">
                ${content}
            </div>
        </div>
    `;
};

// Add this at the bottom of utils.js
window.showTooltip = function(evt, date, minutes, type, color) {
    let tooltip = document.getElementById('global-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'global-tooltip';
        tooltip.className = 'fixed z-50 bg-slate-900 border border-slate-600 rounded px-3 py-2 shadow-xl pointer-events-none text-xs';
        document.body.appendChild(tooltip);
    }

    if (minutes == 0 || minutes === '0') {
        tooltip.innerHTML = `<span class="text-slate-400">${date}</span><br><span class="font-bold text-slate-500">No Activity</span>`;
    } else {
        tooltip.innerHTML = `
            <span class="text-slate-300 border-b border-slate-700 pb-0.5 mb-1 block">${date}</span>
            <div class="font-bold text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" style="background:${color}"></span> ${type}
            </div>
            <span class="text-slate-400">${minutes} mins</span>
        `;
    }

    tooltip.style.display = 'block';
    tooltip.style.left = (evt.clientX + 15) + 'px';
    tooltip.style.top = (evt.clientY + 15) + 'px';
};

window.hideTooltip = function() {
    const tooltip = document.getElementById('global-tooltip');
    if (tooltip) tooltip.style.display = 'none';
};
