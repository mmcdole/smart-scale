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

// TODO: Unwind this object from weight calcs
class Item {
    constructor(productId, quantity = 1, totalWeight = 0) {
        this.productId = productId;
        this.quantity = quantity;
        this.totalWeight = totalWeight;
    }
}

class IOrderGenerator {
    constructor(products) {
        this.products = products;
        this.minUniqueItemsPerOrder = 1;
        this.maxUniqueItemsPerOrder = 5;
        this.minItemQuantity = 1;
        this.maxItemQuantity = 12;
    }

    setNumberOfUniqueItemsRange(min, max) {
        if (min > max) {
            min = max;
            throw new Error('dont be stupid, min > max');
        }
        this.minUniqueItemsPerOrder = min;
        this.maxUniqueItemsPerOrder = max;
    }

    setItemQuantityRange(min, max) {
        if (min > max) {
            min = max;
            throw new Error('dont be stupid, min > max');
        }
        this.minItemQuantity = min
        this.maxItemQuantity = max;
    }

    generateCompleteOrder(batchSize = 1, minItems = 1) {
        throw new Error('Not implemented');
    }

    generateIncompleteOrder() {
        throw new Error('Not implemented');
    }

    // uniform random distribution
    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}
