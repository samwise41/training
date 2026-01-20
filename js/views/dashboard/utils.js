// js/views/dashboard/utils.js

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

// 1. Normalize: clean dates and ensure numbers are numbers
export function normalizeData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
        const newItem = { ...item };
        
        // Fix Date
        if (newItem.date && typeof newItem.date === 'string') {
            const parts = newItem.date.split('-');
            if (parts.length === 3) {
                newItem.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                newItem.date = new Date(newItem.date);
            }
        }

        // Fix Numbers
        newItem.plannedDuration = parseFloat(newItem.plannedDuration) || 0;
        newItem.actualDuration = parseFloat(newItem.actualDuration) || 0;

        return newItem;
    });
}

// 2. Merge: Combine Plan and Actuals into single "Day Objects" to prevent double counting
export function mergeAndDeduplicate(planned, actuals) {
    const map = new Map();

    // Key Generator: "2024-01-01|bike"
    const getKey = (item) => {
        if (!item.date) return null;
        const dateStr = item.date.toISOString().split('T')[0];
        
        // Safe Sport Detection
        let sport = 'Other';
        const type = String(item.activityType || item.actualSport || '').toLowerCase();
        
        if (type.includes('bike') || type.includes('ride') || type.includes('cycl')) sport = 'Bike';
        else if (type.includes('run')) sport = 'Run';
        else if (type.includes('swim')) sport = 'Swim';
        
        return `${dateStr}|${sport}`;
    };

    // A. Add Plans First
    planned.forEach(item => {
        const k = getKey(item);
        if (k) map.set(k, { ...item, source: 'plan' });
    });

    // B. Merge Actuals (Overwrite/Augment Plan)
    actuals.forEach(item => {
        const k = getKey(item);
        if (k) {
            const existing = map.get(k) || {};
            // Merge logic: Actuals take precedence for status, but keep plan metadata
            const merged = { ...existing, ...item, source: 'merged' };
            map.set(k, merged);
        }
    });

    return Array.from(map.values());
}

// --- STYLE & ICON HELPERS (Crash Proof) ---

export const getSportColorVar = (type) => {
    // Safety check: force string
    const t = String(type || '').toLowerCase();
    
    if (t.includes('bike') || t.includes('cycl') || t.includes('ride')) return 'var(--color-bike)';
    if (t.includes('run')) return 'var(--color-run)';
    if (t.includes('swim')) return 'var(--color-swim)';
    if (t.includes('strength')) return 'var(--color-strength, #a855f7)';
    return 'var(--color-all)';
};

export const getIcon = (type) => { 
    const t = String(type || '').toLowerCase();
    const colorStyle = `style="color: ${getSportColorVar(t)}"`;
    
    if (t.includes('bike') || t.includes('cycl') || t.includes('ride')) 
        return `<i class="fa-solid fa-bicycle text-xl opacity-80" ${colorStyle}></i>`;
    if (t.includes('run')) 
        return `<i class="fa-solid fa-person-running text-xl opacity-80" ${colorStyle}></i>`;
    if (t.includes('swim')) 
        return `<i class="fa-solid fa-person-swimming text-xl opacity-80" ${colorStyle}></i>`;
    
    return `<i class="fa-solid fa-dumbbell text-xl opacity-80" ${colorStyle}></i>`;
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
