export const FuelState = {
    isRunning: false,
    startTime: null,
    totalTime: 0,
    
    drinkInterval: 15,
    eatInterval: 45,
    carbsPerBottle: 90, 
    bottleVolume: 750, 
    targetHourlyCarbs: 90,
    targetHourlyFluid: 500,
    plannedDuration: 180, // Minutes
    
    fuelMenu: [], 

    nextDrink: 15 * 60,
    nextEat: 45 * 60,
    totalCarbsConsumed: 0,
    totalFluidConsumed: 0,
    bottlesConsumed: 0,      
    waterBottlesConsumed: 0, 
    
    consumptionLog: [], 
    lastTickTimestamp: 0, 
    timerId: null,

    save() {
        const data = {
            isRunning: this.isRunning,
            totalTime: this.totalTime,
            drinkInterval: this.drinkInterval,
            eatInterval: this.eatInterval,
            carbsPerBottle: this.carbsPerBottle,
            bottleVolume: this.bottleVolume,
            targetHourlyCarbs: this.targetHourlyCarbs,
            targetHourlyFluid: this.targetHourlyFluid,
            plannedDuration: this.plannedDuration,
            nextDrink: this.nextDrink,
            nextEat: this.nextEat,
            totalCarbsConsumed: this.totalCarbsConsumed,
            totalFluidConsumed: this.totalFluidConsumed,
            bottlesConsumed: this.bottlesConsumed,
            waterBottlesConsumed: this.waterBottlesConsumed,
            consumptionLog: this.consumptionLog,
            lastTickTimestamp: this.lastTickTimestamp,
            timestamp: Date.now()
        };
        localStorage.setItem('fuel_timer_state', JSON.stringify(data));
    },

    load() {
        const saved = localStorage.getItem('fuel_timer_state');
        if (!saved) return false;
        try {
            const data = JSON.parse(saved);
            this.totalTime = data.totalTime || 0;
            this.drinkInterval = data.drinkInterval || 15;
            this.eatInterval = data.eatInterval || 45;
            this.carbsPerBottle = data.carbsPerBottle || 90;
            this.bottleVolume = data.bottleVolume || 750;
            this.targetHourlyCarbs = data.targetHourlyCarbs || 90;
            this.targetHourlyFluid = data.targetHourlyFluid || 500;
            this.plannedDuration = data.plannedDuration || 180;
            this.nextDrink = data.nextDrink;
            this.nextEat = data.nextEat;
            this.totalCarbsConsumed = data.totalCarbsConsumed || 0;
            this.totalFluidConsumed = data.totalFluidConsumed || 0;
            this.bottlesConsumed = data.bottlesConsumed || 0;
            this.waterBottlesConsumed = data.waterBottlesConsumed || 0;
            this.consumptionLog = data.consumptionLog || [];
            this.lastTickTimestamp = data.lastTickTimestamp || Date.now();
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
        this.consumptionLog = []; 
        this.nextDrink = this.drinkInterval * 60;
        this.nextEat = this.eatInterval * 60;
        this.lastTickTimestamp = 0;
    }
};
