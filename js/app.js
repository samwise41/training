// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (JSON Mode)...");
    const cacheBuster = Date.now();
    
    // --- 1. DYNAMIC IMPORTS ---
    const safeImport = async (path, name) => {
        try {
            return await import(`${path}?t=${cacheBuster}`);
        } catch (e) {
            console.error(`❌ Failed to load ${name}:`, e.message);
            return null;
        }
    };

    // Load Modules & Utilities
    const [
        dashMod, trendsMod, gearMod, zonesMod, ftpMod, 
        metricsMod, readinessMod, analyzerMod, 
        tooltipMod, uiMod, dataMod, formatMod 
    ] = await Promise.all([
        safeImport('./views/dashboard/index.js', 'Dashboard'),
        safeImport('./views/trends/index.js', 'Trends'),
        safeImport('./views/gear/index.js', 'Gear'),
        safeImport('./views/zones/index.js', 'Zones'),
        safeImport('./views/ftp/index.js', 'FTP'),
        safeImport('./views/metrics/index.js', 'Metrics'),
        safeImport('./views/readiness/index.js', 'Readiness'),
        safeImport('./views/logbook/analyzer.js', 'Analyzer'),
        // Utilities
        safeImport('./utils/tooltipManager.js', 'TooltipManager'),
        safeImport('./utils/ui.js', 'UI'),
        safeImport('./utils/data.js', 'DataManager'),
        safeImport('./utils/formatting.js', 'Formatters')
    ]);

    // Render Functions
    const renderDashboard = dashMod?.renderDashboard || (() => "Dashboard loading...");
    const renderTrends = trendsMod?.renderTrends || (() => ({ html: "Trends missing" }));
    const renderGear = gearMod?.renderGear || (() => "Gear missing");
    const updateGearResult = gearMod?.updateGearResult || (() => {});
    const renderZonesTab = zonesMod?.renderZonesTab || (() => "Zones missing");
    const renderFTP = ftpMod?.renderFTP || (() => "FTP missing");
    const renderMetrics = metricsMod?.renderMetrics || (() => "Metrics missing");
    const renderReadiness = readinessMod?.renderReadiness || (() => "Readiness missing");
    const renderAnalyzer = analyzerMod?.renderAnalyzer || (() => "Analyzer missing");
    
    // Initialize Utilities
    if (tooltipMod?.TooltipManager?.initGlobalListener) {
        tooltipMod.TooltipManager.initGlobalListener();
        window.TooltipManager = tooltipMod.TooltipManager; 
    }

    if (uiMod?.UI?.init) uiMod.UI.init();

    const DataManager = dataMod?.DataManager;
    const Formatters = formatMod?.Formatters;

    // --- 2. APP STATE ---
    const App = {
        planMd: "",
        rawLogData: [],   
        plannedData: [],
        gearData: null,
        garminData: [],
        profileData: null,
        readinessData: null,
        trendsData: null, 
        
        weather: { current: null, hourly: null, code: 0 }, 

        async init() {
            await this.loadData();
            this.setupNavigation();
            this.fetchWeather(); 

            // Routing
            const hashView = window.location.hash.replace('#', '');
            const initialView = hashView || localStorage.getItem('currentView') || 'dashboard';

            if (window.location.hash !== `#${initialView}`) {
                window.location.hash = initialView; 
            } else {
                this.renderCurrentView(initialView);
            }
        },

        async loadData() {
            if (DataManager) {
                try {
                    // One-liner to load all core data
                    const coreData = await DataManager.loadCoreData();
                    Object.assign(this, coreData);
                    console.log("✅ Data Load Complete");
                } catch (err) {
                    console.error("❌ Data Load Error:", err);
                }
            } else {
                console.error("❌ DataManager module failed to load.");
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
                    this.weather.code = weatherData.current_weather.weathercode;
                    
                    this.updateHeaderUI();
                }
            } catch (e) { console.error("Weather unavailable", e); }
        },

        updateHeaderUI(viewName) {
            const titles = { 
                dashboard: 'Weekly Schedule', trends: 'Trends & KPIs', plan: 'Logbook Analysis', 
                gear: 'Gear Choice', zones: 'Training Zones', ftp: 'Performance Profile', 
                readiness: 'Race Readiness', metrics: 'Performance Metrics'
            };
            
            if (viewName) {
                const titleEl = document.getElementById('header-title-dynamic');
                if (titleEl) titleEl.innerText = titles[viewName] || 'Dashboard';
            }

            if (this.weather.current !== null && Formatters) {
                // Use Formatters for weather mapping
                const condition = Formatters.getWeatherInfo(this.weather.code);
                const wInfo = document.getElementById('weather-info');
                const wIcon = document.getElementById('weather-icon-top');
                
                if (wInfo) wInfo.innerText = `${this.weather.current}°F • ${condition[0]}`;
                if (wIcon) wIcon.innerText = condition[1];
            }
        },

        updateGearResult() {
            if (this.gearData) updateGearResult(this.gearData);
        },

        setupNavigation() {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const btnClose = document.getElementById('btn-sidebar-close'); 

            const toggleSidebar = () => {
                sidebar.classList.toggle('sidebar-closed'); 
                sidebar.classList.toggle('sidebar-open');   
                overlay.classList.toggle('hidden');
            };

            window.addEventListener('hashchange', () => {
                const view = window.location.hash.replace('#', '');
                this.renderCurrentView(view || 'dashboard');
            });

            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const view = e.currentTarget.dataset.view;
                    window.location.hash = view; 
                    if (window.innerWidth < 1024 && !overlay.classList.contains('hidden')) {
                        toggleSidebar();
                    }
                });
            });

            if (menuBtn) menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
            if (overlay) overlay.addEventListener('click', toggleSidebar);
            if (btnClose) btnClose.addEventListener('click', toggleSidebar);
        },

        renderCurrentView(view) {
            localStorage.setItem('currentView', view);
            this.updateHeaderUI(view);

            document.querySelectorAll('.nav-item').forEach(b => {
                if (b.dataset.view === view) {
                    b.classList.remove('text-slate-400', 'border-transparent');
                    b.classList.add('bg-slate-800', 'text-white', 'border-slate-600');
                } else {
                    b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                    b.classList.add('text-slate-400', 'border-transparent');
                }
            });

            const content = document.getElementById('main-content');
            content.classList.add('opacity-0');
            
            setTimeout(async () => {
                content.innerHTML = '';
                try {
                    switch (view) {
                        case 'dashboard':
                            content.innerHTML = renderDashboard(this.plannedData, this.rawLogData, this.planMd, this.readinessData);
                            break;
                        case 'trends':
                            content.innerHTML = renderTrends(null, this.trendsData).html;
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
                            // Now passing profileData to zones
                            content.innerHTML = renderZonesTab(this.profileData);
                            break;
                        case 'plan':
                            content.innerHTML = renderAnalyzer(this.rawLogData);
                            break;
                        default:
                            content.innerHTML = `<div class="p-10 text-center text-slate-500">View not found: ${view}</div>`;
                    }
                } catch (e) {
                    console.error(`Render Error in ${view}:`, e);
                    content.innerHTML = `<div class="p-10 text-red-500">Render Error: ${e.message}</div>`;
                }
                content.classList.remove('opacity-0');
            }, 150);
        }
    };

    window.App = App;
    App.init();
})();
