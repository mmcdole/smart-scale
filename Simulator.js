import OrderGenerator from './OrderGenerator.js';

class Simulator {
    /**
     * Create a simulator for a specific product using the provided estimator.
     * @param {string} productName - The selected product name to simulate.
     * @param {class} estimatorType - The estimator implementation class.
     */
    constructor(productName, estimatorType) {
        this.orderGenerator = new OrderGenerator();
        // Create only one estimator instance corresponding to the 
        // currently selected product.
        this.estimator = new estimatorType(productName);
        this.selectedProductName = productName;
    }

    processOrder(incomplete = false) {
        // Generate an order from the generator.
        const order = this.orderGenerator.generateOrder(incomplete);

        // Find the order item for the selected product.
        const orderItem = order.items.find(item => item.name === this.selectedProductName);

        // Get the measured weight for the selected product.
        const measuredWeight = orderItem && orderItem.present ? orderItem.weight : 0;

        // Get inference from the currently selected estimator.
        const inference = this.estimator.inferItemWeight(orderItem ? [orderItem] : []);

        // If the order contains the selected product, update the estimator.
        if (orderItem && orderItem.present) {
            this.estimator.update(measuredWeight);
        }

        return { order: order.items, measuredWeight, inferredWeight: inference };
    }
}

export default Simulator; 