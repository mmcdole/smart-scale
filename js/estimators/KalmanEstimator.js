class KalmanEstimator extends WeightEstimator {
    constructor(processNoise = 0.001, measurementNoise = 0.1) {
        super();
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
        this.estimates = new Map(); // productId -> estimated weight
        this.uncertainties = new Map(); // productId -> uncertainty
        this.observations = new Map(); // productId -> number of observations
    }

    getName() {
        return `Kalman Filter (Q=${this.processNoise}, R=${this.measurementNoise})`;
    }

    inferOrderWeight(order) {
        return order.items.reduce((total, item) => {
            return total + (this.inferItemWeight(item) * item.quantity);
        }, 0);
    }

    inferItemWeight(item) {
        return this.estimates.get(item.productId) || 0;
    }

    updateEstimates(order, measuredWeight) {
        const currentEstimate = this.inferOrderWeight(order);
        const error = measuredWeight - currentEstimate;
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const errorPerItem = error / itemCount;

        order.items.forEach(item => {
            // Get current state
            let estimate = this.estimates.get(item.productId) || 0;
            let uncertainty = this.uncertainties.get(item.productId) || 1.0;

            // Prediction step
            uncertainty += this.processNoise;

            // Update step
            const kalmanGain = uncertainty / (uncertainty + this.measurementNoise);
            estimate += kalmanGain * errorPerItem;
            uncertainty *= (1 - kalmanGain);

            // Store new state
            this.estimates.set(item.productId, estimate);
            this.uncertainties.set(item.productId, uncertainty);

            // Update observation count
            const observations = (this.observations.get(item.productId) || 0) + 1;
            this.observations.set(item.productId, observations);
        });
    }

    classifyOrder(order, trueWeight) {
        // placeholder
        return new OrderMeasurement(0, 0, 0, 0, 0);
    }

    getObservationCount(productId) {
        return this.observations.get(productId) || 0;
    }

    getConfidenceStatus(productId) {
        const uncertainty = this.uncertainties.get(productId) || 1.0;
        const observations = this.observations.get(productId) || 0;
        const confidenceScore = (1 - uncertainty) * Math.min(observations / 10, 1);
        
        if (confidenceScore > 0.8) return 'HIGH';
        if (confidenceScore > 0.5) return 'MEDIUM';
        return 'LEARNING';
    }

    _itemStatus(item) {
        return this.getConfidenceStatus(item.productId);
    }
}
