export const FuelState = {
    // Session State
    isRunning: false,
    startTime: null,
    totalTime: 0,
    
    // Config Defaults
    drinkInterval: 15,
    eatInterval: 45,
    carbsPerBottle: 90, 
    targetHourlyCarbs: 90,
    
    // Data
    fuelMenu: [], 

    // Live Counters
    nextDrink: 15 * 60,
    nextEat: 45 * 60,
    totalCarbsConsumed: 0,
    bottlesConsumed: 0,
    
    // History
    consumptionLog: [], 
    
    timerId: null,

    // --- PERSISTENCE (This was missing) ---

    save() {
        const data = {
            isRunning: this.isRunning,
            totalTime: this.totalTime,
            drinkInterval: this.drinkInterval,
            eatInterval: this.eatInterval,
            carbsPerBottle: this.carbsPerBottle,
            targetHourlyCarbs: this.targetHourlyCarbs,
            nextDrink: this.nextDrink,
            nextEat: this.nextEat,
            totalCarbsConsumed: this.totalCarbsConsumed,
            bottlesConsumed: this.bottlesConsumed,
            consumptionLog: this.consumptionLog,
            timestamp: Date.now()
        };
        localStorage.setItem('fuel_timer_state', JSON.stringify(data));
    },

    load() {
        const saved = localStorage.getItem('fuel_timer_state');
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            
            // Restore values
            this.totalTime = data.totalTime || 0;
            this.drinkInterval = data.drinkInterval || 15;
            this.eatInterval = data.eatInterval || 45;
            this.carbsPerBottle = data.carbsPerBottle || 90;
            this.targetHourlyCarbs = data.targetHourlyCarbs || 90;
            this.nextDrink = data.nextDrink;
            this.nextEat = data.nextEat;
            this.totalCarbsConsumed = data.totalCarbsConsumed || 0;
            this.bottlesConsumed = data.bottlesConsumed || 0;
            this.consumptionLog = data.consumptionLog || [];
            
            // Always load paused for safety
            this.isRunning = false; 
            
            return true; // Loaded successfully
        } catch (e) {
            console.error("Failed to load saved state", e);
            return false;
        }
    },

    clearSave() {
        localStorage.removeItem('fuel_timer_state');
    },

    resetSession() {
        this.clearSave();
        this.isRunning = false;
        this.totalTime = 0;
        this.totalCarbsConsumed = 0;
        this.bottlesConsumed = 0;
        this.consumptionLog = []; 
        this.nextDrink = this.drinkInterval * 60;
        this.nextEat = this.eatInterval * 60;
    }
};
