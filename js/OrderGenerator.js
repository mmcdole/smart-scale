class OrderGenerator {
    constructor(products) {
        this.products = products;
    }

    generateCompleteOrder(batchSize = 1, minItems = 1) {
        const orders = [];
        for (let i = 0; i < batchSize; i++) {
            const numItems = Math.floor(Math.random() * 3) + minItems; // 1-3 items normally, or 2-4 if minItems=2
            const items = [];
            
            // Create a shuffled copy of product IDs to pick from
            const availableProducts = [...this.products]
                .sort(() => Math.random() - 0.5)
                .map(p => p.id);
            
            for (let j = 0; j < numItems; j++) {
                const productId = availableProducts[j % availableProducts.length];
                const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
                items.push(new Item(productId, quantity));
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
