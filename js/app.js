// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (JSON Mode)...");
    const cacheBuster = Date.now();

    // --- RESTORED CONFIG (For Weather Icons) ---
    const CONFIG = {
        WEATHER_MAP: {
            0: ["Clear", "☀️"], 1: ["Partly Cloudy", "🌤️"], 2: ["Partly Cloudy", "🌤️"], 3: ["Cloudy", "☁️"],
            45: ["Foggy", "🌫️"], 48: ["Foggy", "🌫️"], 51: ["Drizzle", "🌦️"], 
            61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"],
            71: ["Snow", "❄️"], 95: ["Storm", "⛈️"]
        }
    };
    
    // --- 1. DYNAMIC IMPORTS ---
    const safeImport = async (path, name) => {
        try {
            return await import(`${path}?t=${cacheBuster}`);
        } catch (e) {
            console.error(`❌ Failed to load ${name}:`, e.message);
            return null;
        }
    };

    const [
        parserMod, dashMod, trendsMod, gearMod, zonesMod, ftpMod, roadmapMod, 
        metricsMod, readinessMod 
    ] = await Promise.all([
        safeImport('./parser.js', 'Parser'),
        safeImport('./views/dashboard/index.js', 'Dashboard'),
        safeImport('./views/trends/index.js', 'Trends'),
        safeImport('./views/gear/index.js', 'Gear'),
        safeImport('./views/zones/index.js', 'Zones'),
        safeImport('./views/ftp/index.js', 'FTP'),
        safeImport('./views/roadmap/index.js', 'Roadmap'),
        safeImport('./views/metrics/index.js', 'Metrics'),
        safeImport('./views/readiness/index.js', 'Readiness')
    ]);

    const Parser = parserMod?.Parser || { parseTrainingLog: (d) => d, getSection: () => "" };
    const renderDashboard = dashMod?.renderDashboard || (() => "Dashboard loading...");
    const renderTrends = trendsMod?.renderTrends || (() => ({ html: "Trends missing" }));
    const renderGear = gearMod?.renderGear || (() => "Gear missing");
    const updateGearResult = gearMod?.updateGearResult || (() => {});
    const renderZonesTab = zonesMod?.renderZonesTab || (() => "Zones missing");
    const renderFTP = ftpMod?.renderFTP || (() => "FTP missing");
    const renderRoadmap = roadmapMod?.renderRoadmap || (() => "Roadmap missing");
    const renderMetrics = metricsMod?.renderMetrics || (() => "Metrics missing");
    const renderReadiness = readinessMod?.renderReadiness || (() => "Readiness missing");

    // --- 2. APP STATE ---
    const App = {
        planMd: "",
        rawLogData: [],   
        parsedLogData: [], 
        plannedData: [],
        gearData: null,
        garminData: [],
        profileData: null,
        readinessData: null,
        trendsData: null, 
        
        weather: { current: null, hourly: null }, 

        async init() {
            await this.loadData();
            this.setupNavigation();
            
            // --- FIX: Fetch Weather on Init ---
            this.fetchWeather(); 

            const savedView = localStorage.getItem('currentView') || 'dashboard';
            this.renderCurrentView(savedView);
        },

        async loadData() {
            try {
                console.log("📡 Fetching Data...");
                const [planRes, logRes, plannedRes, gearRes, garminRes, profileRes, readinessRes, trendsRes] = await Promise.all([
                    fetch('./endurance_plan.md'),
                    fetch('./data/training_log.json'),
                    fetch('./data/planned.json'),
                    fetch('./data/gear/gear.json'),
                    fetch('./data/my_garmin_data_ALL.json'),
                    fetch('./data/profile.json'),
                    fetch('./data/readiness/readiness.json'),
                    fetch('./data/trends/trends.json') 
                ]);

                this.planMd = await planRes.text();
                this.rawLogData = await logRes.json();
                this.plannedData = await plannedRes.json();
                this.garminData = await garminRes.json();
                
                if (gearRes.ok) {
                    this.gearData = await gearRes.json();
                } else {
                    console.warn("⚠️ gear.json not found.");
                    this.gearData = { bike: [], run: [] };
                }

                if (profileRes.ok) this.profileData = await profileRes.json();
                else this.profileData = {}; 

                if (readinessRes.ok) this.readinessData = await readinessRes.json();
                else this.readinessData = null;

                if (trendsRes.ok) this.trendsData = await trendsRes.json();
                else this.trendsData = null;

                this.parsedLogData = Parser.parseTrainingLog(this.rawLogData);

            } catch (err) {
                console.error("❌ Data Load Error:", err);
            }
        },

        // --- RESTORED: Weather Fetcher ---
        async fetchWeather() {
            try {
                const locRes = await fetch('https://ipapi.co/json/');
                const locData = await locRes.json();
                if (locData.latitude) {
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current_weather=true&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`);
                    const weatherData = await weatherRes.json();
                    
                    // Map to new state structure
                    this.weather.current = Math.round(weatherData.current_weather.temperature);
                    this.weather.hourly = weatherData.hourly || null;
                    
                    // Optional: Update UI if elements exist (ported from old code)
                    const code = weatherData.current_weather.weathercode;
                    const condition = CONFIG.WEATHER_MAP[code] || ["Cloudy", "☁️"];
                    const wInfo = document.getElementById('weather-info');
                    if(wInfo) wInfo.innerText = `${this.weather.current}°F • ${condition[0]}`;
                }
            } catch (e) { console.error("Weather unavailable", e); }
        },

        // --- RESTORED: Stats Bar HTML Generator ---
        getStatsBar() {
            return `
                <div id="stats-bar" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-center shadow-lg">
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Phase</p>
                        <div class="flex flex-col">
                            <span class="text-lg font-bold text-blue-500 leading-tight" id="stat-phase">--</span>
                            <span class="text-sm font-bold text-white leading-tight mt-1" id="stat-week">--</span>
                        </div>
                    </div>
                    
                    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden">
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Next Event</p>
                            <div id="stat-event">
                                <p class="text-lg font-bold text-white leading-tight" id="stat-event-name">--</p>
                                <div class="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                                    <span id="stat-event-date" class="border-r border-slate-600 pr-3 text-slate-300">--</span>
                                    <span id="stat-event-countdown" class="uppercase">--</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-right pl-4 border-l border-slate-700/50" id="stat-readiness-box" style="display:none;">
                            <div class="text-3xl font-black text-slate-200 leading-none tracking-tighter" id="stat-readiness-val">--%</div>
                            <div class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Readiness</div>
                            <div class="flex flex-col items-end gap-1 mt-1">
                                <div id="stat-readiness-badge" class="px-1.5 py-0.5 rounded bg-slate-900 border text-[8px] font-bold uppercase tracking-wider inline-block">--</div>
                                <div id="stat-weakest-link" class="text-[9px] text-slate-500 font-mono hidden">
                                    Limit: <span id="stat-weakest-name" class="font-bold">--</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // --- RESTORED: Update Stats Logic ---
        updateStats() {
            if (!this.planMd) return;
            
            // Regex from old code to parse Status from MD
            const statusMatch = this.planMd.match(/\*\*Status:\*\*\s*(.*?)\s+-\s+(.*)/i);
            const currentPhaseRaw = statusMatch ? statusMatch[1].trim() : "Plan Active";
            const currentWeek = statusMatch ? statusMatch[2].trim() : "";

            const phaseEl = document.getElementById('stat-phase');
            if (phaseEl) phaseEl.innerText = currentPhaseRaw;
            
            const weekEl = document.getElementById('stat-week');
            if (weekEl) weekEl.innerText = currentWeek;

            // Event Parsing Logic
            const lines = this.planMd.split('\n');
            let nextEvent = null;
            let inTable = false;
            const today = new Date(); today.setHours(0,0,0,0);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes('| **Date** |')) { inTable = true; continue; }
                if (inTable && line.startsWith('| :---')) continue;
                if (inTable && line.startsWith('|')) {
                    const clean = line.replace(/^\||\|$/g, '');
                    const cols = clean.split('|').map(c => c.trim());
                    if (cols.length >= 2) {
                        const d = new Date(cols[0]);
                        if (!isNaN(d.getTime()) && d >= today) {
                            nextEvent = { 
                                date: d, name: cols[1], 
                                swimGoal: cols[7]||'', bikeGoal: cols[9]||'', runGoal: cols[11]||'' 
                            };
                            break; 
                        }
                    }
                } else if (inTable && line === '') inTable = false;
            }

            if (nextEvent) {
                const nameEl = document.getElementById('stat-event-name');
                if(nameEl) nameEl.innerText = nextEvent.name;
                
                const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                const dateEl = document.getElementById('stat-event-date');
                if(dateEl) dateEl.innerText = nextEvent.date.toLocaleDateString('en-US', dateOptions);
                
                const diff = Math.ceil((nextEvent.date - today) / 86400000);
                const timeStr = diff < 0 ? "Completed" : (diff === 0 ? "Today!" : `${Math.floor(diff/7)}w ${diff%7}d to go`);
                const cdEl = document.getElementById('stat-event-countdown');
                if(cdEl) cdEl.innerHTML = `<i class="fa-solid fa-hourglass-half mr-1"></i> ${timeStr}`;

                // Readiness Calculation (using this.parsedLogData)
                if (this.parsedLogData && this.parsedLogData.length > 0) {
                    const parseDur = (str) => {
                        if(!str || str.includes('km') || str.includes('mi')) return 0;
                        if(!isNaN(str)) return parseInt(str);
                        let m=0;
                        if(str.includes('h')) { const p=str.split('h'); m+=parseInt(p[0])*60; if(p[1]) m+=parseInt(p[1]); }
                        else if(str.includes(':')) { const p=str.split(':'); m+=parseInt(p[0])*60 + parseInt(p[1]); }
                        else if(str.includes('m')) m+=parseInt(str);
                        return m;
                    };

                    const lookback = new Date(); lookback.setDate(lookback.getDate()-30);
                    let mS=0, mB=0, mR=0;
                    
                    this.parsedLogData.forEach(d => {
                        if(new Date(d.date) >= lookback) {
                            let dur = typeof d.actualDuration === 'number' ? d.actualDuration : parseDur(d.duration);
                            if(d.type==='Swim') mS=Math.max(mS,dur);
                            if(d.type==='Bike') mB=Math.max(mB,dur);
                            if(d.type==='Run') mR=Math.max(mR,dur);
                        }
                    });

                    const tS = parseDur(nextEvent.swimGoal);
                    const tB = parseDur(nextEvent.bikeGoal);
                    const tR = parseDur(nextEvent.runGoal);
                    
                    const scores = [];
                    if(tS>0) scores.push({ type: 'Swim', val: Math.min(Math.round((mS/tS)*100),100), color: 'text-cyan-400' });
                    if(tB>0) scores.push({ type: 'Bike', val: Math.min(Math.round((mB/tB)*100),100), color: 'text-purple-400' });
                    if(tR>0) scores.push({ type: 'Run', val: Math.min(Math.round((mR/tR)*100),100), color: 'text-pink-400' });

                    if(scores.length > 0) {
                        const minScore = scores.reduce((prev, curr) => prev.val < curr.val ? prev : curr);
                        const box = document.getElementById('stat-readiness-box');
                        const val = document.getElementById('stat-readiness-val');
                        const badge = document.getElementById('stat-readiness-badge');
                        const weakBox = document.getElementById('stat-weakest-link');
                        const weakName = document.getElementById('stat-weakest-name');
                        
                        if(box) {
                            box.style.display = 'block';
                            val.innerText = `${minScore.val}%`;
                            let color = "text-red-500"; let bColor = "border-red-500/50"; let label = "WARNING";
                            if(minScore.val >= 85) { color="text-emerald-500"; bColor="border-emerald-500/50"; label="READY"; }
                            else if(minScore.val >= 60) { color="text-yellow-500"; bColor="border-yellow-500/50"; label="BUILD"; }

                            val.className = `text-3xl font-black ${color} leading-none tracking-tighter`;
                            badge.innerText = label;
                            badge.className = `px-1.5 py-0.5 rounded bg-slate-900 border ${bColor} ${color} text-[8px] font-bold uppercase tracking-wider inline-block`;
                            
                            if (minScore.val < 100) {
                                weakBox.classList.remove('hidden');
                                weakName.innerText = minScore.type;
                                weakName.className = `font-bold ${minScore.color}`;
                            } else {
                                weakBox.classList.add('hidden');
                            }
                        }
                    }
                }
            }
        },

        updateGearResult() {
            if (this.gearData) {
                updateGearResult(this.gearData);
            }
        },

        setupNavigation() {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');

            if (menuBtn) {
                menuBtn.addEventListener('click', () => {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.remove('hidden');
                });
                overlay.addEventListener('click', () => {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.add('hidden');
                });
            }

            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.nav-item').forEach(b => {
                        b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                        b.classList.add('text-slate-400', 'border-transparent');
                    });
                    e.currentTarget.classList.remove('text-slate-400', 'border-transparent');
                    e.currentTarget.classList.add('bg-slate-800', 'text-white', 'border-slate-600');

                    const view = e.currentTarget.dataset.view;
                    localStorage.setItem('currentView', view);
                    this.renderCurrentView(view);

                    if (window.innerWidth < 1024 && sidebar) {
                        sidebar.classList.add('-translate-x-full');
                        overlay.classList.add('hidden');
                    }
                });
            });
        },

        renderCurrentView(view) {
            const content = document.getElementById('main-content');
            content.classList.add('opacity-0');
            
            setTimeout(async () => {
                content.innerHTML = '';
                try {
                    switch (view) {
                        case 'dashboard':
                            // --- FIX: Combine Stats Bar + Dashboard Content ---
                            const statsHtml = this.getStatsBar();
                            const dashHtml = renderDashboard(this.plannedData, this.rawLogData, this.planMd);
                            content.innerHTML = statsHtml + dashHtml;
                            
                            // Call updateStats to populate the data in the header
                            this.updateStats();
                            break;
                        case 'trends':
                            // Pass trendsData to the view
                            content.innerHTML = renderTrends(this.parsedLogData, this.trendsData).html;
                            break;
                        case 'metrics':
                            content.innerHTML = renderMetrics(this.rawLogData); 
                            break;
                        case 'readiness':
                            content.innerHTML = renderReadiness(this.readinessData);
                            break;
                        case 'ftp':
                            content.innerHTML = renderFTP(this.profileData); 
                            break;
                        case 'gear':
                            content.innerHTML = renderGear(this.gearData, this.weather.current, this.weather.hourly);
                            this.updateGearResult();
                            break;
                        case 'zones':
                            content.innerHTML = await renderZonesTab();
                            break;
                        case 'roadmap':
                            content.innerHTML = renderRoadmap(this.garminData, this.planMd);
                            break;
                        case 'plan':
                            const md = Parser.getSection(this.planMd, "Weekly Schedule") || "No plan found.";
                            content.innerHTML = `<div class="markdown-body p-6 bg-slate-900 rounded-xl border border-slate-700">${window.marked.parse(md)}</div>`;
                            break;
                        default:
                            content.innerHTML = `<div class="p-10 text-center text-slate-500">View not found: ${view}</div>`;
                    }
                } catch (e) {
                    console.error(`Render Error in ${view}:`, e);
                    content.innerHTML = `<div class="p-10 text-red-500">Render Error: ${e.message}</div>`;
                }
                content.classList.remove('opacity-0');
                document.querySelectorAll('.nav-item').forEach(b => {
                    if (b.dataset.view === view) {
                        b.classList.remove('text-slate-400', 'border-transparent');
                        b.classList.add('bg-slate-800', 'text-white', 'border-slate-600');
                    }
                });
            }, 150);
        }
    };

    window.App = App;
    App.init();
})();
