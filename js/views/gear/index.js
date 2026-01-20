// js/views/gear/index.js

// --- 1. UTILS ---
const WEATHER_MAP = {
    0: ["Clear", "☀️"], 1: ["Partly Cloudy", "🌤️"], 2: ["Partly Cloudy", "🌤️"], 3: ["Cloudy", "☁️"],
    45: ["Foggy", "🌫️"], 48: ["Foggy", "🌫️"], 51: ["Drizzle", "🌦️"], 61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"],
    71: ["Snow", "❄️"], 95: ["Storm", "⛈️"]
};

// --- 2. COMPONENTS ---
const buildHourlyForecast = (hourlyWeather) => {
    // Check if weather data exists; if not, return empty string
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

// RESTORED EXACT ORIGINAL LAYOUT
const generateRow = (idPrefix, iconClass, label, colorClass) => `
    <div class="gear-row-container">
        <div class="activity-header">
            <i class="${iconClass} ${colorClass} text-lg"></i>
            <span class="text-xs font-bold text-slate-200 uppercase tracking-widest">${label}</span>
        </div>
        <div class="gear-bubbles-row">
            <div class="gear-bubble">
                <span class="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Upper Body</span>
                <p id="${idPrefix}-upper" class="text-sm text-slate-100 font-medium leading-relaxed">--</p>
            </div>
            <div class="gear-bubble">
                <span class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Lower Body</span>
                <p id="${idPrefix}-lower" class="text-sm text-slate-100 font-medium leading-relaxed">--</p>
            </div>
            <div class="gear-bubble">
                <span class="text-[9px] font-bold text-purple-500 uppercase tracking-widest mb-1">Extremities</span>
                <p id="${idPrefix}-extremities" class="text-sm text-slate-100 font-medium leading-relaxed">--</p>
            </div>
        </div>
    </div>
`;

const renderLayout = (hourlyHtml, tempOptions) => {
    return `
        <div class="bg-slate-800/30 border border-slate-800 rounded-xl p-6 mb-8">
            ${hourlyHtml}
            
            <div class="flex flex-col gap-2 mb-8 max-w-md mx-auto">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Select Temperature</label>
                <select id="gear-temp" onchange="window.App.updateGearResult()" class="gear-select text-center text-lg py-3">
                    ${tempOptions}
                </select>
            </div>

            <div class="mb-10">
                <h3 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Standard Conditions
                </h3>
                <div class="flex flex-col gap-4">
                    ${generateRow('bike-standard', 'fa-solid fa-bicycle', 'Cycling', 'icon-bike')}
                    ${generateRow('run-standard', 'fa-solid fa-person-running', 'Running', 'icon-run')}
                </div>
            </div>

            <div>
                <h3 class="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Windy & Rainy (-10°F)
                </h3>
                <div class="flex flex-col gap-4">
                    ${generateRow('bike-weather', 'fa-solid fa-bicycle', 'Cycling', 'icon-bike')}
                    ${generateRow('run-weather', 'fa-solid fa-person-running', 'Running', 'icon-run')}
                </div>
            </div>
        </div>

        <div class="mt-8 border-t border-slate-800 pt-8 text-center">
            <div class="flex items-center justify-center gap-2 mb-6">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <a href="https://github.com/samwise41/training-plan/blob/main/js/views/gear/Gear.md" target="_blank" class="text-sm font-bold text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors">
                    View Full Documentation (Gear.md)
                </a>
            </div>
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
    // gearData is now passed in as a JSON object, so NO Parser call needed.

    // Default Temp Logic
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
