class OrderGenerator extends IOrderGenerator {
    constructor(products) {
        super(products)
        //  Match Matt's defaults
        this.setNumberOfUniqueItemsRange(1, 3);
        this.setItemQuantityRange(1, 2);
    }

    generateCompleteOrder(batchSize = 1, minItems = 1) {
        this.setNumberOfUniqueItemsRange(minItems, this.maxUniqueItemsPerOrder)
        const orders = [];
        for (let i = 0; i < batchSize; i++) {
            const numItems = this.randomInteger(this.minUniqueItemsPerOrder, this.maxUniqueItemsPerOrder)
            const items = [];

            // Create a shuffled copy of product IDs to pick from
            const availableProducts = this.getRandomProductIds()

            for (let j = 0; j < numItems; j++) {
                const productId = availableProducts[j % availableProducts.length];
                const quantity = this.randomInteger(this.minItemQuantity, this.maxItemQuantity) // 1-2 quantity
                const product = this.getProducts().find(p => p.id === productId);
                let totalWeight = 0;
                for (let k = 0; k < quantity; k++) {
                    // distinct weight for each individual product in the range
                    // uses sampling from a uniform distribution
                    totalWeight += product.meanWeight + (Math.random() * 40 - 20);
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
}
