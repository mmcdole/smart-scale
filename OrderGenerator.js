// Product Database - Source of truth for our simulated restaurant
const products = [
    { name: 'Crunchy Taco', trueRange: [135, 150] },
    { name: 'Soft Taco', trueRange: [150, 165] },
    { name: 'Doritos Locos Taco', trueRange: [140, 155] },
    { name: 'Crunchy Taco Supreme', trueRange: [155, 170] },
    { name: 'Soft Taco Supreme', trueRange: [170, 185] },
    { name: 'Bean Burrito', trueRange: [180, 195] },
    { name: 'Burrito Supreme', trueRange: [210, 230] },
    { name: '5-Layer Burrito', trueRange: [245, 260] },
    { name: '7-Layer Burrito', trueRange: [280, 300] },
    { name: 'Chicken Burrito', trueRange: [200, 220] },
    { name: 'Quesadilla', trueRange: [225, 245] },
    { name: 'Mexican Pizza', trueRange: [220, 240] },
    { name: 'Crunchwrap Supreme', trueRange: [280, 305] },
    { name: 'Chalupa Supreme', trueRange: [165, 185] },
    { name: 'Gordita Crunch', trueRange: [170, 190] },
    { name: 'Nachos BellGrande', trueRange: [450, 485] },
    { name: 'Nachos Supreme', trueRange: [320, 345] },
    { name: 'Cheesy Fiesta Potatoes', trueRange: [170, 190] },
    { name: 'Cinnamon Twists', trueRange: [45, 55] },
    { name: 'Mexican Rice', trueRange: [115, 130] },
    { name: 'Cheesy Bean & Rice Burrito', trueRange: [180, 200] },
    { name: 'Spicy Potato Soft Taco', trueRange: [145, 160] },
    { name: 'Cheesy Roll Up', trueRange: [80, 95] },
    { name: 'Chips & Cheese', trueRange: [140, 155] },
    { name: 'Triple Layer Nachos', trueRange: [185, 205] }
];

class OrderGenerator {
    constructor() {
        this.products = products;
    }

    // Get product by name
    getProduct(name) {
        return this.products.find(p => p.name === name);
    }

    // Get all products
    getAllProducts() {
        return [...this.products];
    }

    // Generate a true weight for a given product
    generateItemWeight(product) {
        const [min, max] = product.trueRange;
        return min + Math.random() * (max - min);
    }

    // Generate a realistic order with true weights
    generateOrder(incomplete = false) {
        const minItems = incomplete ? 2 : 1;
        const maxItems = 6;
        const numItems = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
        
        // Select random items
        const selectedItems = new Set();
        while (selectedItems.size < numItems) {
            const randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
            selectedItems.add(randomProduct);
        }

        // Create order items with realistic weights
        const order = Array.from(selectedItems).map(product => {
            return {
                name: product.name,
                present: true,
                weight: this.generateItemWeight(product)
            };
        });

        // Optionally remove an item for incomplete orders
        if (incomplete && order.length > 1) {
            const missingIndex = Math.floor(Math.random() * order.length);
            order[missingIndex].present = false;
            order[missingIndex].weight = 0;
        }

        return {
            items: order,
            totalWeight: order.reduce((sum, item) => sum + (item.present ? item.weight : 0), 0)
        };
    }
}

// Export for use in other modules
export default OrderGenerator; 