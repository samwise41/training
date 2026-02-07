
export const FuelState = {
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

    // Counters
    nextDrink: 15 * 60,
    nextEat: 45 * 60,
    totalCarbsConsumed: 0,
    bottlesConsumed: 0,
    
    // History
    consumptionLog: [], 
    
    timerId: null,

    resetSession() {
        this.isRunning = false;
        this.totalTime = 0;
        this.totalCarbsConsumed = 0;
        this.bottlesConsumed = 0;
        this.consumptionLog = []; 
        this.nextDrink = this.drinkInterval * 60;
        this.nextEat = this.eatInterval * 60;
    }
};
