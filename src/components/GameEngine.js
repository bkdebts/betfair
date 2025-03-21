// New file for optimized game engine
export class GameEngine {
    constructor() {
        this.multiplier = 1.0;
        this.targetMultiplier = 1.0;
        this.lastUpdate = performance.now();
        this.interpolationFactor = 0.1;
    }

    update(timestamp) {
        const delta = (timestamp - this.lastUpdate) / 1000;
        this.lastUpdate = timestamp;
        
        // Smooth interpolation of multiplier
        this.multiplier += (this.targetMultiplier - this.multiplier) * 
                          this.interpolationFactor * delta * 60;
        
        return this.multiplier;
    }

    setTargetMultiplier(value) {
        this.targetMultiplier = value;
    }
} 