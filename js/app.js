// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (JSON Mode)...");
    const cacheBuster = Date.now();

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
                
                if (gearRes.ok) this.gearData = await gearRes.json();
                else this.gearData = { bike: [], run: [] };

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

        async fetchWeather() {
            try {
                const locRes = await fetch('https://ipapi.co/json/');
                const locData = await locRes.json();
                if (locData.latitude) {
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current_weather=true&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`);
                    const weatherData = await weatherRes.json();
                    
                    this.weather.current = Math.round(weatherData.current_weather.temperature);
                    this.weather.hourly = weatherData.hourly || null;
                    
                    // Store condition code for UI updates
                    this.weather.code = weatherData.current_weather.weathercode;
                    
                    // If we are already running, update the header immediately
                    this.updateHeaderUI();
                }
            } catch (e) { console.error("Weather unavailable", e); }
        },

        // --- HELPER: Updates Top Bar Title & Weather ---
        updateHeaderUI(viewName) {
            // 1. Update Title
            const titles = { 
                dashboard: 'Weekly Schedule', trends: 'Trends & KPIs', logbook: 'Logbook', 
                roadmap: 'Season Roadmap', gear: 'Gear Choice', zones: 'Training Zones', 
                ftp: 'Performance Profile', readiness: 'Race Readiness', metrics: 'Performance Metrics'
            };
            
            if (viewName) {
                const titleEl = document.getElementById('header-title-dynamic');
                if (titleEl) titleEl.innerText = titles[viewName] || 'Dashboard';
            }

            // 2. Update Weather (if data exists)
            if (this.weather.current !== null) {
                const condition = CONFIG.WEATHER_MAP[this.weather.code] || ["Cloudy", "☁️"];
                const wInfo = document.getElementById('weather-info');
                const wIcon = document.getElementById('weather-icon-top');
                
                if (wInfo) wInfo.innerText = `${this.weather.current}°F • ${condition[0]}`;
                if (wIcon) wIcon.innerText = condition[1];
            }
        },

        updateGearResult() {
            if (this.gearData) {
                updateGearResult(this.gearData);
            }
        },

        // --- Mobile Navigation ---
    setupNavigation() {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const btnClose = document.getElementById('btn-sidebar-close'); 

            // FIXED: Only toggle the custom classes found in your HTML
            const toggleSidebar = () => {
                sidebar.classList.toggle('sidebar-closed'); 
                sidebar.classList.toggle('sidebar-open');   
                overlay.classList.toggle('hidden');
            };

            if (menuBtn) {
                // Use 'click' and stopPropagation to prevent immediate closing
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleSidebar();
                });
            }
            
            // Allow closing via overlay or X button
            if (overlay) overlay.addEventListener('click', toggleSidebar);
            if (btnClose) btnClose.addEventListener('click', toggleSidebar);

            // Close sidebar when a navigation item is clicked
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // 1. Update Visuals
                    document.querySelectorAll('.nav-item').forEach(b => {
                        b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                        b.classList.add('text-slate-400', 'border-transparent');
                    });
                    e.currentTarget.classList.remove('text-slate-400', 'border-transparent');
                    e.currentTarget.classList.add('bg-slate-800', 'text-white', 'border-slate-600');

                    // 2. Render View
                    const view = e.currentTarget.dataset.view;
                    localStorage.setItem('currentView', view);
                    this.renderCurrentView(view);

                    // 3. Close Mobile Menu (Check if overlay is visible)
                    if (window.innerWidth < 1024 && !overlay.classList.contains('hidden')) {
                        toggleSidebar();
                    }
                });
            });
        },

        renderCurrentView(view) {
            // Update Header Title & Weather
            this.updateHeaderUI(view);

            const content = document.getElementById('main-content');
            content.classList.add('opacity-0');
            
            setTimeout(async () => {
                content.innerHTML = '';
                try {
                    switch (view) {
                        case 'dashboard':
                            // --- CHANGED: Just render the dashboard content ---
                            // Your new topCards.js logic is assumed to be inside renderDashboard now
                            content.innerHTML = renderDashboard(this.plannedData, this.rawLogData, this.planMd);
                            break;
                        case 'trends':
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
