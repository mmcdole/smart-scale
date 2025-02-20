class EMAEstimator extends WeightEstimator {
    constructor(alpha = 0.2) {
        super();
        this.alpha = alpha;
        this.estimates = new Map(); // productId -> estimated weight
        this.confidenceScores = new Map(); // productId -> confidence score
        this.observations = new Map(); // productId -> number of observations
    }

    getName() {
        return `EMA Estimator (α=${this.alpha})`;
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
            const oldEstimate = this.estimates.get(item.productId) || 0;
            const newEstimate = oldEstimate + (this.alpha * errorPerItem);
            this.estimates.set(item.productId, newEstimate);
            
            // Update observation count
            const observations = (this.observations.get(item.productId) || 0) + 1;
            this.observations.set(item.productId, observations);
            
            // Update confidence score based on number of observations and error
            const confidence = Math.min(observations / 10, 1) * (1 - Math.abs(errorPerItem/newEstimate));
            this.confidenceScores.set(item.productId, confidence);
        });
    }

    getItemStats(productId){
        return { mean: 0.0, variance: 0.0};
    }

    classifyOrder(order, trueWeight) {
        // placeholder
        return new OrderMeasurement(0, 0, 0, 0, 0);
    }


    getObservationCount(productId) {
        return this.observations.get(productId) || 0;
    }

    getConfidenceStatus(productId) {
        const confidence = this.confidenceScores.get(productId) || 0;
        if (confidence > 0.8) return 'HIGH';
        if (confidence > 0.5) return 'MEDIUM';
        return 'LEARNING';
    }

    _itemStatus(item) {
        return this.getConfidenceStatus(item.productId);
    }
}
