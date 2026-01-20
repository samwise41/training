// js/views/gear/index.js

// --- 1. UTILS ---
const WEATHER_MAP = {
    0: ["Clear", "☀️"], 1: ["Partly Cloudy", "🌤️"], 2: ["Partly Cloudy", "🌤️"], 3: ["Cloudy", "☁️"],
    45: ["Foggy", "🌫️"], 48: ["Foggy", "🌫️"], 51: ["Drizzle", "🌦️"], 61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"],
    71: ["Snow", "❄️"], 95: ["Storm", "⛈️"]
};

// --- 2. COMPONENTS ---
const buildHourlyForecast = (hourlyWeather) => {
    if (!hourlyWeather || !hourlyWeather.time || !Array.isArray(hourlyWeather.time)) return '';

    const times = hourlyWeather.time.slice(0, 24); 
    const temps = hourlyWeather.temperature_2m;
    const codes = hourlyWeather.weathercode;
    
    let itemsHtml = '';
    
    times.forEach((t, index) => {
        const date = new Date(t);
        if (index < 24 && temps[index] !== undefined) { 
            const h = date.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hourLabel = h % 12 === 0 ? 12 : h % 12;
            const icon = (WEATHER_MAP[codes[index]] || ["", "☁️"])[1];
            itemsHtml += `
                <div class="hourly-item">
                    <span class="text-[10px] text-slate-400 font-bold">${hourLabel} ${ampm}</span>
                    <span class="text-lg">${icon}</span>
                    <span class="text-xs font-bold text-slate-200">${Math.round(temps[index])}°</span>
                </div>
            `;
        }
    });

    return `<div class="mb-6">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hourly Forecast</p>
        <div class="hourly-scroll">${itemsHtml}</div>
    </div>`;
};

const buildTempOptions = (defaultVal) => {
    let tempOptions = `<option value="25" ${defaultVal === 25 ? 'selected' : ''}>&lt;30°F</option>`;
    for (let i = 30; i <= 70; i++) {
        tempOptions += `<option value="${i}" ${i === defaultVal ? 'selected' : ''}>${i}°F</option>`;
    }
    tempOptions += `<option value="75" ${defaultVal === 75 ? 'selected' : ''}>70°F+</option>`;
    return tempOptions;
};

// --- NEW MATRIX ROW GENERATOR ---
const generateMatrixRow = (idPrefix, iconClass, label, colorClass) => `
    <div class="flex items-center gap-2 md:justify-center p-3 bg-slate-800/50 rounded-lg md:rounded-none md:bg-transparent md:border-r border-slate-700/50">
        <i class="${iconClass} ${colorClass} text-xl"></i>
        <span class="md:hidden text-xs font-bold text-slate-300 uppercase tracking-widest">${label}</span>
    </div>

    <div class="p-3 bg-slate-800/30 rounded-lg md:rounded-none md:bg-transparent flex flex-col justify-center">
        <span class="md:hidden text-[9px] font-bold text-blue-500 uppercase mb-1">Upper Body</span>
        <p id="${idPrefix}-upper" class="text-sm text-slate-200 font-medium leading-snug">--</p>
    </div>

    <div class="p-3 bg-slate-800/30 rounded-lg md:rounded-none md:bg-transparent md:border-l border-slate-700/50 flex flex-col justify-center">
        <span class="md:hidden text-[9px] font-bold text-emerald-500 uppercase mb-1">Lower Body</span>
        <p id="${idPrefix}-lower" class="text-sm text-slate-200 font-medium leading-snug">--</p>
    </div>

    <div class="p-3 bg-slate-800/30 rounded-lg md:rounded-none md:bg-transparent md:border-l border-slate-700/50 flex flex-col justify-center">
        <span class="md:hidden text-[9px] font-bold text-purple-500 uppercase mb-1">Extremities</span>
        <p id="${idPrefix}-extremities" class="text-sm text-slate-200 font-medium leading-snug">--</p>
    </div>
`;

const renderLayout = (hourlyHtml, tempOptions) => {
    return `
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6 mb-8 shadow-sm">
            ${hourlyHtml}
            
            <div class="flex flex-col gap-2 mb-8 max-w-sm mx-auto">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Effective Temperature</label>
                <select id="gear-temp" onchange="window.App.updateGearResult()" class="gear-select text-center text-xl font-bold py-3 bg-slate-800 border-slate-700 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                    ${tempOptions}
                </select>
            </div>

            <div class="mb-10">
                <h3 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span> 
                    Standard Kit
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_1fr] gap-2 md:gap-0 bg-slate-800/20 rounded-xl border border-slate-800 overflow-hidden">
                    <div class="hidden md:contents">
                        <div class="p-3 bg-slate-800/80 border-b border-r border-slate-700/50"></div>
                        <div class="p-3 bg-slate-800/80 border-b border-slate-700/50 text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center">Upper Body</div>
                        <div class="p-3 bg-slate-800/80 border-b border-l border-slate-700/50 text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">Lower Body</div>
                        <div class="p-3 bg-slate-800/80 border-b border-l border-slate-700/50 text-[10px] font-bold text-purple-400 uppercase tracking-widest text-center">Extremities</div>
                    </div>

                    ${generateMatrixRow('bike-standard', 'fa-solid fa-bicycle', 'Cycling', 'text-cyan-400')}
                    
                    <div class="md:hidden h-px bg-slate-800 my-2"></div>
                    <div class="hidden md:block col-span-full h-px bg-slate-700/30"></div>

                    ${generateMatrixRow('run-standard', 'fa-solid fa-person-running', 'Running', 'text-orange-400')}
                </div>
            </div>

            <div>
                <h3 class="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span> 
                    Windy & Rainy (-10°F Rule)
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_1fr] gap-2 md:gap-0 bg-slate-800/20 rounded-xl border border-slate-800 overflow-hidden">
                    <div class="hidden md:contents">
                        <div class="p-3 bg-slate-800/80 border-b border-r border-slate-700/50"></div>
                        <div class="p-3 bg-slate-800/80 border-b border-slate-700/50 text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center">Upper Body</div>
                        <div class="p-3 bg-slate-800/80 border-b border-l border-slate-700/50 text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">Lower Body</div>
                        <div class="p-3 bg-slate-800/80 border-b border-l border-slate-700/50 text-[10px] font-bold text-purple-400 uppercase tracking-widest text-center">Extremities</div>
                    </div>

                    ${generateMatrixRow('bike-weather', 'fa-solid fa-bicycle', 'Cycling', 'text-cyan-400')}
                    
                    <div class="md:hidden h-px bg-slate-800 my-2"></div>
                    <div class="hidden md:block col-span-full h-px bg-slate-700/30"></div>

                    ${generateMatrixRow('run-weather', 'fa-solid fa-person-running', 'Running', 'text-orange-400')}
                </div>
            </div>
        </div>
        
        <div class="text-center text-xs text-slate-500 mt-4">
            <a href="https://github.com/samwise41/training-plan/blob/main/js/views/gear/Gear.md" target="_blank" class="hover:text-blue-400 underline transition-colors">
                View Source Documentation (Gear.md)
            </a>
        </div>
    `;
};

// --- 3. LOGIC ---
function updateGearUI(gearData) {
    if (!gearData) return;
    
    const tempSelect = document.getElementById('gear-temp');
    if (!tempSelect) return;
    const temp = parseInt(tempSelect.value);
    
    const processActivity = (activity, prefixBase) => {
        const list = gearData[activity] || [];
        
        const findMatch = (t) => {
            const match = list.find(r => {
                if (r.min === -999) return t < r.max;
                if (r.max === 999) return t >= r.min;
                return t >= r.min && t <= r.max;
            });
            return match || { upper: "—", lower: "—", extremities: "—" };
        };

        const standard = findMatch(temp);
        const weather = findMatch(temp - 10);

        const updateUI = (prefix, data) => {
            const u = document.getElementById(`${prefix}-upper`);
            const l = document.getElementById(`${prefix}-lower`);
            const e = document.getElementById(`${prefix}-extremities`);
            if (u) u.innerHTML = data.upper;
            if (l) l.innerHTML = data.lower;
            if (e) e.innerHTML = data.extremities;
        };

        updateUI(`${prefixBase}-standard`, standard);
        updateUI(`${prefixBase}-weather`, weather);
    };

    processActivity('bike', 'bike');
    processActivity('run', 'run');
}

// --- 4. EXPORTS ---
export function renderGear(gearData, currentTemp, hourlyWeather) {
    let defaultVal = 50;
    if (currentTemp !== null && currentTemp !== undefined) {
        if (currentTemp < 30) defaultVal = 25;
        else if (currentTemp > 70) defaultVal = 75;
        else defaultVal = currentTemp;
    }

    const tempOptions = buildTempOptions(defaultVal);
    const hourlyHtml = buildHourlyForecast(hourlyWeather);
    const html = renderLayout(hourlyHtml, tempOptions);

    return html;
}

export function updateGearResult(gearData) {
    updateGearUI(gearData);
}
