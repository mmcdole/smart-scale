class Simulator {
    constructor(orderGenerator, weightEstimator) {
        this.generator = orderGenerator;
        this.weightEstimator = weightEstimator;
        this.currentOrder = null;
    }

    setWeightEstimator(estimator) {
        this.weightEstimator = estimator;
    }

    generateCompleteOrders(batchSize) {
        return this.generator.generateCompleteOrder(batchSize);
    }

    generateIncompleteOrder() {
        return this.generator.generateIncompleteOrder();
    }

    // Simulates processing an order with a true weight
    processOrder(order, trueWeight) {
        this.weightEstimator.updateEstimates(order, trueWeight);
    }

    // Gets the current status of a product
    getProductStatus(productId) {
        return this.weightEstimator.itemStatus(new Item(productId));
    }
}
