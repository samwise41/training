// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (Race Readiness Fix)...");
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
    const renderZones = zonesMod?.renderZones || (() => "Zones missing");
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
        gearData: "",
        garminData: [],

        async init() {
            await this.loadData();
            this.setupNavigation();
            const savedView = localStorage.getItem('currentView') || 'dashboard';
            this.renderCurrentView(savedView);
        },

        async loadData() {
            try {
                console.log("📡 Fetching Data...");
                const [planRes, logRes, plannedRes, gearRes, garminRes] = await Promise.all([
                    fetch('./endurance_plan.md'),
                    fetch('./data/training_log.json'),
                    fetch('./data/planned.json'),
                    fetch('./js/views/gear/Gear.md'),
                    fetch('./data/my_garmin_data_ALL.json')
                ]);

                this.planMd = await planRes.text();
                this.gearData = await gearRes.text();
                this.rawLogData = await logRes.json();
                this.plannedData = await plannedRes.json();
                this.garminData = await garminRes.json();

                this.parsedLogData = Parser.parseTrainingLog(this.rawLogData);
                console.log(`✅ Data Loaded: ${this.rawLogData.length} logs found.`);

            } catch (err) {
                console.error("❌ Data Load Error:", err);
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
            
            setTimeout(() => {
                content.innerHTML = '';
                try {
                    switch (view) {
                        case 'dashboard':
                            content.innerHTML = renderDashboard(this.plannedData, this.rawLogData, this.planMd);
                            break;
                        case 'trends':
                            content.innerHTML = renderTrends(this.parsedLogData).html;
                            break;
                        case 'metrics':
                            content.innerHTML = renderMetrics(this.rawLogData); 
                            break;
                        
                        // --- FIX IS HERE ---
                        case 'readiness':
                            // Now passing BOTH log data AND plan data
                            console.log("🏁 Rendering Readiness...");
                            content.innerHTML = renderReadiness(this.rawLogData, this.planMd);
                            break;
                            
                        case 'gear':
                            content.innerHTML = renderGear(this.gearData);
                            updateGearResult(this.gearData);
                            break;
                        case 'zones':
                            content.innerHTML = renderZones(this.garminData);
                            break;
                        case 'ftp':
                            content.innerHTML = renderFTP(this.garminData);
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
