class OrderGenerator {
    constructor(products) {
        this.products = products;
    }

    generateCompleteOrder(batchSize = 1) {
        const orders = [];
        for (let i = 0; i < batchSize; i++) {
            const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
            const items = [];
            
            for (let j = 0; j < numItems; j++) {
                const product = this.products[Math.floor(Math.random() * this.products.length)];
                const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
                items.push(new Item(product.id, quantity));
            }
            
            orders.push(new Order(items));
        }
        return orders;
    }

    generateIncompleteOrder() {
        // Generate a complete order first
        const order = this.generateCompleteOrder(1)[0];
        
        // Ensure there's at least 2 items to make one missing
        if (order.items.length < 2) {
            const product = this.products[Math.floor(Math.random() * this.products.length)];
            order.items.push(new Item(product.id, 1));
        }
        
        // Randomly select one item to mark as missing
        const missingIndex = Math.floor(Math.random() * order.items.length);
        order.items[missingIndex].missing = true;
        
        return order;
    }
}
