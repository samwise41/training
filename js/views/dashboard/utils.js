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

// --- DATA NORMALIZERS ---

// 1. Convert Strings to Date Objects (Fixes Timezone Shifts)
export function normalizeData(data) {
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

// 2. Intelligent Merge (Fixes Doubling)
// Log Data overwrites Planned Data if they are on the same day/sport
export function mergeAndDeduplicate(planned, actuals) {
    const map = new Map();

    // Helper to generate key: "2024-01-01|bike"
    const getKey = (item) => {
        if (!item.date) return null;
        const dateStr = item.date.toISOString().split('T')[0];
        
        // SAFEGUARD: Ensure strings
        let sport = 'Other';
        const type = String(item.activityType || item.actualSport || '').toLowerCase();
        
        if (type.includes('bike') || type.includes('ride') || type.includes('cycl')) sport = 'Bike';
        else if (type.includes('run')) sport = 'Run';
        else if (type.includes('swim')) sport = 'Swim';
        
        return `${dateStr}|${sport}`;
    };

    // 1. Load Plan first
    planned.forEach(item => {
        const k = getKey(item);
        if (k) map.set(k, item);
    });

    // 2. Overlay Actuals (Source of Truth)
    actuals.forEach(item => {
        const k = getKey(item);
        if (k) {
            // Merge actuals INTO plan (keeping plan notes)
            const existing = map.get(k) || {};
            const merged = { ...existing, ...item };
            map.set(k, merged);
        }
    });

    return Array.from(map.values());
}

// --- STYLE & COLOR HELPERS ---
// CRITICAL FIX: Added String() wrapper to prevent crashes
export const getSportColorVar = (type) => {
    if (!type) return 'var(--color-all)';
    const t = String(type).toLowerCase(); // Force string conversion
    
    if (t === 'bike' || t.includes('cycl') || t.includes('ride')) return 'var(--color-bike)';
    if (t === 'run' || t.includes('run')) return 'var(--color-run)';
    if (t === 'swim' || t.includes('swim')) return 'var(--color-swim)';
    if (t === 'strength') return 'var(--color-strength, #a855f7)';
    return 'var(--color-all)';
};

export const getIcon = (type) => { 
    const colorStyle = `style="color: ${getSportColorVar(type)}"`;
    const t = String(type || '').toLowerCase();
    
    if (t === 'bike' || t.includes('cycl') || t.includes('ride')) 
        return `<i class="fa-solid fa-bicycle text-xl opacity-80" ${colorStyle}></i>`;
    if (t === 'run') 
        return `<i class="fa-solid fa-person-running text-xl opacity-80" ${colorStyle}></i>`;
    if (t === 'swim') 
        return `<i class="fa-solid fa-person-swimming text-xl opacity-80" ${colorStyle}></i>`;
    
    return `<i class="fa-solid fa-dumbbell text-xl opacity-80" ${colorStyle}></i>`;
};

export const buildCollapsibleSection = (id, title, content, isOpen = false) => {
    const arrowClass = isOpen ? 'fa-rotate-180' : '';
    const contentClass = isOpen ? '' : 'hidden';
    
    return `
        <div class="mb-6 border border-slate-700 rounded-xl overflow-hidden bg-slate-800/30">
            <button onclick="document.getElementById('${id}').classList.toggle('hidden'); this.querySelector('i').classList.toggle('fa-rotate-180')" 
                class="w-full flex justify-between items-center p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left">
                <span class="font-bold text-slate-200 text-sm uppercase tracking-wider">${title}</span>
                <i class="fa-solid fa-chevron-down text-slate-400 transition-transform duration-300 ${arrowClass}"></i>
            </button>
            <div id="${id}" class="${contentClass} p-4 border-t border-slate-700/50">
                ${content}
            </div>
        </div>
    `;
};
