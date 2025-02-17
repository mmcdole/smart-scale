// Weight Estimator Interface
class WeightEstimator {
    inferOrderWeight(order) {
        throw new Error('Not implemented');
    }

    inferItemWeight(item) {
        throw new Error('Not implemented');
    }

    updateEstimates(order, measuredWeight) {
        throw new Error('Not implemented');
    }

    getObservationCount(productId) {
        throw new Error('Not implemented');
    }

    getConfidenceStatus(productId) {
        throw new Error('Not implemented');
    }

    getName() {
        throw new Error('Not implemented');
    }
}

// Order and Item interfaces
class Order {
    constructor(items = []) {
        this.items = items;
        this.timestamp = Date.now();
    }
}

class Item {
    constructor(productId, quantity = 1) {
        this.productId = productId;
        this.quantity = quantity;
    }
}
