// sample items weights from normal distribution
// TODO: sometimes missing items

class GuassianOrderGenerator extends IOrderGenerator {
    constructor(products) {
        products.forEach(product => {
            // Calculate standard deviation as half the difference between the max and min values of trueRange
            product.stdDeviation = (product.trueRange[1] - product.trueRange[0]) / 2;
        });
        super(products)
        //  represent % of time we expect prod orders to have at least one missing item (0.0-1.0)
        this.prodErrorRate = 0.0;
    }

    generateCompleteOrder(batchSize = 1, minItems = 1) {
        this.setNumberOfUniqueItemsRange(minItems, this.maxUniqueItemsPerOrder)
        const orders = [];
        for (let i = 0; i < batchSize; i++) {
            const numItems = this.randomInteger(this.minUniqueItemsPerOrder, this.maxUniqueItemsPerOrder)
            const items = [];

            // Create a shuffled copy of product IDs to pick from
            const availableProducts = this.getRandomProductIds();

            for (let j = 0; j < numItems; j++) {
                const productId = availableProducts[j % availableProducts.length];
                const quantity = this.randomInteger(this.minItemQuantity, this.maxItemQuantity) // 1-2 quantity
                const product = products.find(p => p.id === productId);
                let totalWeight = 0;
                for (let k = 0; k < quantity; k++) {
                    // distinct weight for each individual product in the range
                    // uses sampling from normal distribution 
                    totalWeight += this.sampleNormal(product.meanWeight, product.stdDeviation)
                }
                items.push(new Item(productId, quantity, totalWeight));
            }

            orders.push(new Order(items));
        }
        return orders;
    }

    generateIncompleteOrder() {
        // Generate a complete order with guaranteed 2+ items
        const order = this.generateCompleteOrder(1, 2)[0];

        // Randomly select one item to mark as missing
        const missingIndex = Math.floor(Math.random() * order.items.length);
        order.items[missingIndex].missing = true;

        return order;
    }

    // Returns a random sample from a normal distribution with given mean and stdDev.
    // Uses the Box-Muller transform.
    sampleNormal(mean, stdDev) {
        // Generate two independent uniform random numbers between 0 and 1.
        const u1 = Math.random();
        const u2 = Math.random();

        // Apply the Box-Muller transform:
        // z0 and z1 are independent standard normal random variables.
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Scale and shift to match the desired mean and standard deviation.
        return z0 * stdDev + mean;
    }
}
