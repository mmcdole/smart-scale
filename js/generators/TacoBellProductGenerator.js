class TacoBellProductGenerator extends ProductGenerator {
    constructor() {
        super();
        this.products = [
            // All products sorted alphabetically by display name
            new Product('five_layer_burrito', '5-Layer Burrito', [245, 260], 252.5),
            new Product('seven_layer_burrito', '7-Layer Burrito', [280, 300], 290),
            new Product('bean_burrito', 'Bean Burrito', [180, 195], 187.5),
            new Product('burrito_supreme', 'Burrito Supreme', [210, 230], 220),
            new Product('chalupa_supreme', 'Chalupa Supreme', [165, 185], 175),
            new Product('cheesy_bean_rice_burrito', 'Cheesy Bean & Rice Burrito', [180, 200], 190),
            new Product('cheesy_fiesta_potatoes', 'Cheesy Fiesta Potatoes', [170, 190], 180),
            new Product('cheesy_roll_up', 'Cheesy Roll Up', [80, 95], 87.5),
            new Product('chicken_burrito', 'Chicken Burrito', [200, 220], 210),
            new Product('cinnamon_twists', 'Cinnamon Twists', [45, 55], 50),
            new Product('crunchwrap_supreme', 'Crunchwrap Supreme', [280, 305], 292.5),
            new Product('crunchy_taco', 'Crunchy Taco', [135, 150], 142.5),
            new Product('crunchy_taco_supreme', 'Crunchy Taco Supreme', [155, 170], 162.5),
            new Product('doritos_locos_taco', 'Doritos Locos Taco', [140, 155], 147.5),
            new Product('gordita_crunch', 'Gordita Crunch', [170, 190], 180),
            new Product('mexican_pizza', 'Mexican Pizza', [220, 240], 230),
            new Product('mexican_rice', 'Mexican Rice', [115, 130], 122.5),
            new Product('nachos_bellgrande', 'Nachos BellGrande', [450, 485], 467.5),
            new Product('nachos_supreme', 'Nachos Supreme', [320, 345], 332.5),
            new Product('quesadilla', 'Quesadilla', [225, 245], 235),
            new Product('soft_taco', 'Soft Taco', [150, 165], 157.5),
            new Product('soft_taco_supreme', 'Soft Taco Supreme', [170, 185], 177.5),
            new Product('spicy_potato_taco', 'Spicy Potato Soft Taco', [145, 160], 152.5),
            new Product('chips_and_cheese', 'Chips & Cheese', [140, 155], 147.5),
            new Product('triple_layer_nachos', 'Triple Layer Nachos', [185, 205], 195)
        ];
    }

    getProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
}