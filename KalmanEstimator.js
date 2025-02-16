class KalmanEstimator extends WeightEstimator {
    constructor(name) {
        super(name);
        
        // Initial state estimate
        this.x = this.defaultWeight;
        this.P = 1000;
        
        // Noise parameters
        this.R = 10;  // Measurement noise
        this.Q = 30;  // Process noise
    }

    update(measurement) {
        if (measurement <= 0) return;
        this.n++;

        const error = measurement - this.x;
        
        let effectiveQ = this.Q;
        const errorThreshold = 5;
        if (Math.abs(error) > errorThreshold) {
            effectiveQ = this.Q * Math.min(10, 1 + Math.abs(error) / errorThreshold);
        }

        this.P += effectiveQ;
        const K = this.P / (this.P + this.R);
        
        const gamma = Math.min(1, 0.5 + Math.abs(error) / 50);
        this.x += gamma * K * error;
        this.P = (1 - gamma * K) * this.P;
        
        const dynamicFloor = Math.max(this.R, this.Q * 0.5);
        if (this.P < dynamicFloor) {
            this.P = dynamicFloor;
        }
    }

    get estimatedWeight() {
        return this.x;
    }

    get uncertainty() {
        return this.P;
    }

    calculateConfidenceLevel() {
        if (this.n < 10) return "Learning";
        if (this.P > 50) return "Medium";
        return "High";
    }

    get notes() {
        return `P=${this.P.toFixed(1)}`;  // Show uncertainty in notes
    }

    inferOrderWeight(items) {
        let totalWeight = 0;
        let totalVariance = 0;

        items.forEach(item => {
            totalWeight += this.estimatedWeight;

            // Base variance floor should be higher to reflect true uncertainty
            let varianceFloor = 29;  // Theoretical minimum from R + Q

            // For learning phase items, be more conservative
            if (this.n < 10) {  // Match our new learning threshold
                varianceFloor = 100;  // Much higher for learning items
            } else if (this.P > 35) {  // Medium confidence
                varianceFloor = 50;   // Higher for medium confidence
            }

            // Use max of current uncertainty and floor
            const effectiveVariance = Math.max(this.P, varianceFloor);
            totalVariance += effectiveVariance;
        });

        return {
            weight: totalWeight,
            std: Math.sqrt(totalVariance)
        };
    }
} 