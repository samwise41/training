import { UI } from '../../utils/ui.js';

export const Gear = {
    renderGear(gearData, currentTemp, hourlyWeather) {
        // Default to 50F if no weather data yet
        const temp = currentTemp ? Math.round(currentTemp) : 50;
        
        const html = `
            <div class="space-y-6 pb-20">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 class="text-2xl font-black text-white uppercase tracking-tight italic">
                            Gear Check
                        </h2>
                        <p class="text-slate-400 text-sm">
                            Recommendations based on 
                            <span class="text-blue-400 font-bold text-lg mx-1">${temp}°F</span> 
                            base temperature.
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    ${this.renderBodyPartCard("Head & Neck", "head", temp)}
                    ${this.renderBodyPartCard("Upper Body", "upper", temp)}
                    ${this.renderBodyPartCard("Lower Body", "lower", temp)}
                    ${this.renderBodyPartCard("Hands & Feet", "extremities", temp)}
                </div>
            </div>
        `;
        return html;
    },

    renderBodyPartCard(title, partKey, baseTemp) {
        const regular = this.getGearForCondition(partKey, baseTemp, 'regular');
        const windy = this.getGearForCondition(partKey, baseTemp, 'windy');
        const dark = this.getGearForCondition(partKey, baseTemp, 'dark');

        return `
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
            <div class="bg-slate-900/50 p-2 md:p-3 border-b border-slate-700 flex items-center gap-2">
                <span class="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-widest">${title}</span>
            </div>

            <div class="grid grid-cols-3 divide-x divide-slate-700">
                
                <div class="p-2 md:p-4 flex flex-col gap-2">
                    <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1 xl:gap-2 mb-1 border-b border-slate-700/50 pb-1 xl:border-0 xl:pb-0">
                        <i class="fa-solid fa-sun text-yellow-500 text-[10px] md:text-xs"></i>
                        <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Standard</span>
                    </div>
                    ${this.renderList(regular)}
                </div>

                <div class="p-2 md:p-4 flex flex-col gap-2 bg-slate-800/30">
                    <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1 xl:gap-2 mb-1 border-b border-slate-700/50 pb-1 xl:border-0 xl:pb-0">
                        <i class="fa-solid fa-wind text-blue-400 text-[10px] md:text-xs"></i>
                        <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Wind/Rain</span>
                    </div>
                    ${this.renderList(windy)}
                </div>

                <div class="p-2 md:p-4 flex flex-col gap-2 bg-slate-900/30">
                    <div class="flex flex-col xl:flex-row items-start xl:items-center gap-1 xl:gap-2 mb-1 border-b border-slate-700/50 pb-1 xl:border-0 xl:pb-0">
                        <i class="fa-solid fa-moon text-purple-400 text-[10px] md:text-xs"></i>
                        <span class="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Dark/Night</span>
                    </div>
                    ${this.renderList(dark)}
                </div>

            </div>
        </div>`;
    },

    renderList(items) {
        if (!items || items.length === 0) return '<span class="text-[9px] md:text-xs text-slate-600 italic">None</span>';
        
        return items.map(item => `
            <div class="flex items-start gap-1.5 leading-tight">
                <span class="text-emerald-500 text-[8px] mt-[3px] shrink-0">●</span>
                <span class="text-[10px] md:text-sm text-slate-300 break-words">${item}</span>
            </div>
        `).join('');
    },

    getGearForCondition(part, temp, condition) {
        let effectiveTemp = temp;
        
        if (condition === 'windy') effectiveTemp -= 5; 
        if (condition === 'dark') effectiveTemp -= 5;  

        // Get Base Items
        let items = [...this.getRules(part, effectiveTemp)];

        // Add Condition Specific Modifiers
        if (condition === 'windy') {
            if (part === 'upper' && effectiveTemp < 60) items.push("Wind Shell"); // Shortened name for mobile
            if (part === 'head' && effectiveTemp < 50) items.push("Visor/Cap");
        }

        if (condition === 'dark') {
            if (part === 'upper') items.push("Reflective Vest");
            if (part === 'head') items.push("Headlamp");
            if (part === 'extremities') items.push("Reflective Bands");
        }

        return [...new Set(items)]; 
    },

    getRules(part, t) {
        const rules = {
            head: [
                { max: 25, items: ["Hvy Beanie", "Neck Gaiter"] }, // Shortened names
                { max: 35, items: ["Beanie", "Neck Buff"] },
                { max: 45, items: ["Light Beanie"] },
                { max: 55, items: ["Headband"] },
                { max: 100, items: ["Cap / Visor"] }
            ],
            upper: [
                { max: 20, items: ["Thermal Base", "Insul. Jacket", "Shell"] },
                { max: 30, items: ["LS Base", "Mid-Layer", "Vest"] },
                { max: 40, items: ["LS Tech Shirt", "Light Jkt/Vest"] },
                { max: 50, items: ["LS Tech Shirt", "Gilet (Vest)"] },
                { max: 60, items: ["SS Shirt + Arm Warmers"] },
                { max: 100, items: ["Singlet / SS Shirt"] }
            ],
            lower: [
                { max: 25, items: ["Thermal Tights"] },
                { max: 35, items: ["Fleece Tights"] },
                { max: 45, items: ["Full Tights"] },
                { max: 55, items: ["Capris / 3/4"] },
                { max: 100, items: ["Shorts"] }
            ],
            extremities: [
                { max: 25, items: ["Hvy Mittens", "Wool Socks"] },
                { max: 35, items: ["Wind Gloves", "Wool Socks"] },
                { max: 45, items: ["Light Gloves", "Crew Socks"] },
                { max: 55, items: ["Liners (Opt)", "Tech Socks"] },
                { max: 100, items: ["No Gloves", "Light Socks"] }
            ]
        };

        const match = rules[part].find(r => t <= r.max);
        return match ? match.items : [];
    }
};
