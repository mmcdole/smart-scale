class KFCProductGenerator extends ProductGenerator {
    constructor() {
        super();
        this.products = [
            // All products sorted alphabetically by display name
            new Product('chicken_bucket_8pc', '8pc Chicken Bucket', [840, 960], 900),
            new Product('chicken_bucket_12pc', '12pc Chicken Bucket', [1260, 1440], 1350),
            new Product('chicken_bucket_16pc', '16pc Chicken Bucket', [1680, 1920], 1800),
            new Product('chicken_tenders_3pc', '3pc Chicken Tenders', [140, 190], 165),
            new Product('chicken_tenders_5pc', '5pc Chicken Tenders', [235, 295], 265),
            new Product('biscuit', 'Buttermilk Biscuit', [170, 210], 190),
            new Product('pot_pie', 'Chicken Pot Pie', [760, 840], 800),
            new Product('chicken_little', 'Chicken Little Sandwich', [130, 170], 150),
            new Product('classic_sandwich', 'Classic Chicken Sandwich', [210, 260], 235),
            new Product('corn_on_cob', 'Corn on the Cob', [130, 170], 150),
            new Product('double_down', 'Double Down Sandwich', [260, 320], 290),
            new Product('extra_crispy_breast', 'Extra Crispy Chicken Breast', [210, 290], 250),
            new Product('extra_crispy_leg', 'Extra Crispy Chicken Leg', [125, 175], 150),
            new Product('extra_crispy_thigh', 'Extra Crispy Chicken Thigh', [160, 220], 190),
            new Product('extra_crispy_wing', 'Extra Crispy Chicken Wing', [95, 145], 120),
            new Product('family_feast', 'Family Feast (8pc + 2 Large Sides)', [1300, 1600], 1450),
            new Product('famous_bowl', 'Famous Bowl', [710, 790], 750),
            new Product('hot_wings_6pc', '6pc Hot Wings', [165, 225], 195),
            new Product('hot_wings_12pc', '12pc Hot Wings', [330, 450], 390),
            new Product('coleslaw_large', 'Large Coleslaw', [280, 340], 310),
            new Product('fries_large', 'Large Fries', [350, 450], 400),
            new Product('mac_and_cheese_large', 'Large Mac and Cheese', [410, 490], 450),
            new Product('mashed_potatoes_large', 'Large Mashed Potatoes & Gravy', [320, 390], 355),
            new Product('original_chicken_breast', 'Original Recipe Chicken Breast', [200, 280], 240),
            new Product('original_chicken_leg', 'Original Recipe Chicken Leg', [115, 165], 140),
            new Product('original_chicken_thigh', 'Original Recipe Chicken Thigh', [150, 210], 180),
            new Product('original_chicken_wing', 'Original Recipe Chicken Wing', [85, 135], 110),
            new Product('coleslaw_small', 'Small Coleslaw', [140, 180], 160),
            new Product('fries_small', 'Small Fries', [175, 225], 200),
            new Product('mac_and_cheese_small', 'Small Mac and Cheese', [205, 255], 230),
            new Product('mashed_potatoes_small', 'Small Mashed Potatoes & Gravy', [160, 210], 185),
            new Product('spicy_bowl', 'Spicy Famous Bowl', [710, 790], 750),
            new Product('spicy_sandwich', 'Spicy Chicken Sandwich', [210, 260], 235)
        ];
    }
    getProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
}