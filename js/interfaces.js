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

    hasRemovedItem(){
        return this.items.some(item => item.missing === true);
    }
}

// TODO: Unwind this object from weight calcs
class Item {
    constructor(productId, quantity = 1, totalWeight = 0, hasMissingQty = false) {
        this.productId = productId;
        this.quantity = quantity;
        //  these are both for training
        this.totalWeight = totalWeight;
        this.missing = hasMissingQty;
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
    // JS TODO: move to utils
    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    getProducts() {
        return this.products;
    }

    //  Use the Fisher-Yates shuffle to ensure a correct and uniform randomization of your array.
    //  JS TODO: move to utils
    getRandomProductIds() {
        const result = [...this.products]; // Create a shallow copy
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result.map(p => p.id);
      }
}

// Product class definition
class Product {
    constructor(id, name, trueRange, meanWeight) {
        this.id = id;
        this.name = name;
        //  represents 1std deviation
        //  maybe make this 2? we need some sample data
        this.trueRange = trueRange;
        this.meanWeight = meanWeight;
    }
}

// Product Generator Interface
class ProductGenerator {
    getProducts() {
        throw new Error('Not implemented');
    }

    getProductById(id) {
        throw new Error('Not implemented');
    }
}
