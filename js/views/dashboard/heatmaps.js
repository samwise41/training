// ... inside buildGrid function ...

        if (entry) {
            // ... (keep plan/act/status logic) ...
            
            if (entry.activities && entry.activities.length > 0) {
                const lines = entry.activities.map(a => {
                    const icon = getIconForSport(a.sport);
                    
                    // --- FIX: Apply Sport Color ---
                    // Helper to get color var, defaults to white/slate if unknown
                    let colorStyle = '';
                    if (['Run','Bike','Swim'].includes(a.sport)) {
                        colorStyle = `style="color: ${getSportColorVar(a.sport)}"`;
                    } else {
                        colorStyle = `class="text-slate-400"`;
                    }

                    return `<div class='flex justify-between items-center gap-2 text-xs'><span ${colorStyle}>${icon}</span> <span>${a.name}</span><span class='font-mono text-emerald-400'>${Math.round(a.actual)}m</span></div>`;
                }).join('');
                detailsJson = encodeURIComponent(lines);
            }

// ... (keep rest of file) ...
