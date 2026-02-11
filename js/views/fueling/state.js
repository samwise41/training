// ==========================================
// USER CONFIGURATION (EDIT DEFAULTS HERE)
// ==========================================
const DEFAULT_CONFIG = {
    // TIMERS (Minutes)
    drinkInterval: 15,
    eatInterval: 45,

    // BOTTLE SETTINGS
    bottleVolume: 750,       // Size of your bottle in ml
    sipsPerBottle: 5,        // How many sips to empty a bottle (draws the lines)
    carbsPerBottle: 90,      // Grams of carbs in your Mix bottle

    // FLASK SETTINGS
    carbsPerFlask: 150,      // Grams of carbs in your Flask
    squeezesPerFlask: 5,     // How many squeezes to empty a flask

    // RIDE GOALS
    targetHourlyCarbs: 70,   // Grams per hour
    targetHourlyFluid: 700,  // ML per hour
    plannedDuration: 180     // Minutes
};

export const FuelState = {
    // Session Data
    isRunning: false,
    startTime: null,
    totalTime: 0,
    
    // Load Defaults
    ...DEFAULT_CONFIG,
    
    // Menu Data
    fuelMenu: [], 

    // Live Counters
    nextDrink: DEFAULT_CONFIG.drinkInterval * 60,
    nextEat: DEFAULT_CONFIG.eatInterval * 60,
    totalCarbsConsumed: 0,
    totalFluidConsumed: 0,
    
    bottlesConsumed: 0,      
    waterBottlesConsumed: 0, 
    flasksConsumed: 0, 
    
    consumptionLog: [], 
    lastTickTimestamp: 0, 
    timerId: null,

    save() {
        const data = {
            // Save System State
            isRunning: this.isRunning,
            totalTime: this.totalTime,
            nextDrink: this.nextDrink,
            nextEat: this.nextEat,
            totalCarbsConsumed: this.totalCarbsConsumed,
            totalFluidConsumed: this.totalFluidConsumed,
            bottlesConsumed: this.bottlesConsumed,
            waterBottlesConsumed: this.waterBottlesConsumed,
            flasksConsumed: this.flasksConsumed,
            consumptionLog: this.consumptionLog,
            lastTickTimestamp: this.lastTickTimestamp,
            timestamp: Date.now(),

            // Save Config (So changes persist during ride)
            drinkInterval: this.drinkInterval,
            eatInterval: this.eatInterval,
            carbsPerBottle: this.carbsPerBottle,
            bottleVolume: this.bottleVolume,
            sipsPerBottle: this.sipsPerBottle,       // Saved
            carbsPerFlask: this.carbsPerFlask,
            squeezesPerFlask: this.squeezesPerFlask, // Saved
            targetHourlyCarbs: this.targetHourlyCarbs,
            targetHourlyFluid: this.targetHourlyFluid,
            plannedDuration: this.plannedDuration
        };
        localStorage.setItem('fuel_timer_state', JSON.stringify(data));
    },

    load() {
        const saved = localStorage.getItem('fuel_timer_state');
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            
            // Restore Counts
            this.totalTime = data.totalTime || 0;
            this.nextDrink = data.nextDrink;
            this.nextEat = data.nextEat;
            this.totalCarbsConsumed = data.totalCarbsConsumed || 0;
            this.totalFluidConsumed = data.totalFluidConsumed || 0;
            this.bottlesConsumed = data.bottlesConsumed || 0;
            this.waterBottlesConsumed = data.waterBottlesConsumed || 0;
            this.flasksConsumed = data.flasksConsumed || 0;
            this.consumptionLog = data.consumptionLog || [];
            this.lastTickTimestamp = data.lastTickTimestamp || Date.now();
            
            // Restore Config (Or use Defaults if missing in save)
            this.drinkInterval = data.drinkInterval || DEFAULT_CONFIG.drinkInterval;
            this.eatInterval = data.eatInterval || DEFAULT_CONFIG.eatInterval;
            this.carbsPerBottle = data.carbsPerBottle || DEFAULT_CONFIG.carbsPerBottle;
            this.bottleVolume = data.bottleVolume || DEFAULT_CONFIG.bottleVolume;
            this.sipsPerBottle = data.sipsPerBottle || DEFAULT_CONFIG.sipsPerBottle;
            this.carbsPerFlask = data.carbsPerFlask || DEFAULT_CONFIG.carbsPerFlask;
            this.squeezesPerFlask = data.squeezesPerFlask || DEFAULT_CONFIG.squeezesPerFlask;
            this.targetHourlyCarbs = data.targetHourlyCarbs || DEFAULT_CONFIG.targetHourlyCarbs;
            this.targetHourlyFluid = data.targetHourlyFluid || DEFAULT_CONFIG.targetHourlyFluid;
            this.plannedDuration = data.plannedDuration || DEFAULT_CONFIG.plannedDuration;

            this.isRunning = false; 
            return true; 
        } catch (e) { return false; }
    },

    clearSave() { localStorage.removeItem('fuel_timer_state'); },

    resetSession() {
        this.clearSave();
        this.isRunning = false;
        this.totalTime = 0;
        this.totalCarbsConsumed = 0;
        this.totalFluidConsumed = 0;
        this.bottlesConsumed = 0;
        this.waterBottlesConsumed = 0;
        this.flasksConsumed = 0;
        this.consumptionLog = []; 
        this.nextDrink = this.drinkInterval * 60;
        this.nextEat = this.eatInterval * 60;
        this.lastTickTimestamp = 0;
    }
};
