// js/views/dashboard/utils.js

const getColor = (varName) => {
    if (typeof window !== "undefined" && window.getComputedStyle) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    const defaults = {
        '--color-swim': '#22d3ee',
        '--color-bike': '#c084fc',
        '--color-run': '#f472b6',
        '--color-strength': '#94a3b8'
    };
    return defaults[varName] || '#888888';
};

export const getSportColor = (t) => {
    if (!t) return '#888888'; 
    const type = t.toLowerCase();
    if (type.includes('bike') || type.includes('cycl') || type.includes('ride')) return getColor('--color-bike'); 
    if (type.includes('run')) return getColor('--color-run'); 
    if (type.includes('swim') || type.includes('pool') || type.includes('water')) return getColor('--color-swim'); 
    if (type.includes('strength') || type.includes('weight') || type.includes('gym')) return getColor('--color-strength'); 
    return '#94a3b8'; 
};

export const toLocalYMD = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function normalizeData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        const newItem = { ...item };
        if (newItem.date && typeof newItem.date === 'string') {
            const parts = newItem.date.split('-');
            if (parts.length >= 3) {
                newItem.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2].slice(0, 2)));
            } else {
                newItem.date = new Date(newItem.date);
            }
        }
        const rawType = newItem.activityType || newItem.sport || newItem.type || newItem.actualSport || 'Other';
        newItem.activityType = rawType; 
        newItem.plannedDuration = parseFloat(newItem.plannedDuration) || 0;
        newItem.actualDuration = parseFloat(newItem.actualDuration) || 0;
        return newItem;
    });
}

export function mergeAndDeduplicate(planned, actuals) {
    const map = new Map();
    const getKey = (item) => {
        if (!item.date) return null;
        const dateStr = toLocalYMD(item.date);
        let sport = 'Other';
        const type = String(item.activityType || '').toLowerCase();
        if (type.includes('bike') || type.includes('ride') || type.includes('cycl')) sport = 'Bike';
        else if (type.includes('run') || type.includes('jog')) sport = 'Run';
        else if (type.includes('swim') || type.includes('pool')) sport = 'Swim';
        else if (type.includes('strength') || type.includes('weight') || type.includes('lift')) sport = 'Strength';
        return `${dateStr}|${sport}`;
    };
    planned.forEach(item => { const k = getKey(item); if (k) map.set(k, { ...item, source: 'plan' }); });
    actuals.forEach(item => {
        const k = getKey(item);
        if (k) {
            const existing = map.get(k) || {};
            const merged = { ...existing, ...item, plannedDuration: existing.plannedDuration || 0, plannedWorkout: existing.plannedWorkout || existing.planName, source: existing.source ? 'merged' : 'actual_only' };
            map.set(k, merged);
        }
    });
    return Array.from(map.values());
}

export const getSportColorVar = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('bike') || t.includes('cycl') || t.includes('ride')) return getColor('--color-bike'); 
    if (t.includes('run')) return getColor('--color-run'); 
    if (t.includes('swim')) return getColor('--color-swim'); 
    if (t.includes('strength') || t.includes('weight')) return '#94a3b8'; 
    return getColor('--color-all'); 
};

export const getIcon = (type) => { 
    const t = String(type || '').toLowerCase();
    const color = getSportColorVar(t);
    const style = `style="color: ${color}"`;
    if (t.includes('bike') || t.includes('cycl') || t.includes('ride')) return `<i class="fa-solid fa-bicycle text-xl opacity-80" ${style}></i>`;
    if (t.includes('run')) return `<i class="fa-solid fa-person-running text-xl opacity-80" ${style}></i>`;
    if (t.includes('swim')) return `<i class="fa-solid fa-person-swimming text-xl opacity-80" ${style}></i>`;
    return `<i class="fa-solid fa-dumbbell text-xl opacity-80" ${style}></i>`;
};

export const buildCollapsibleSection = (id, title, content, isOpen = true) => {
    const arrowClass = isOpen ? 'rotate-0' : '-rotate-90';
    const contentClass = isOpen ? 'max-h-[5000px] opacity-100 py-4 mb-8' : 'max-h-0 opacity-0 py-0 mb-0';
    return `<div class="w-full"><div class="flex items-center gap-2 cursor-pointer py-3 border-b-2 border-slate-700 hover:border-slate-500 transition-colors group select-none" onclick="window.toggleSection('${id}')"><i id="icon-${id}" class="fa-solid fa-caret-down text-slate-400 text-base transition-transform duration-300 group-hover:text-white ${arrowClass}"></i><h2 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">${title}</h2></div><div id="${id}" class="collapsible-content overflow-hidden transition-all duration-500 ease-in-out ${contentClass}">${content}</div></div>`;
};
