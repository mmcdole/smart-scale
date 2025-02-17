const { GuassianOrderGenerator } = require('../GuassianOrderGenerator.js');

// Sample product database (copied from main.js)
const products = [
    { id: 'crunchy_taco', name: 'Crunchy Taco', trueRange: [135, 150], meanWeight: 142.5 },
    { id: 'soft_taco', name: 'Soft Taco', trueRange: [150, 165], meanWeight: 157.5 },
    { id: 'doritos_locos_taco', name: 'Doritos Locos Taco', trueRange: [140, 155], meanWeight: 147.5 },
    { id: 'crunchy_taco_supreme', name: 'Crunchy Taco Supreme', trueRange: [155, 170], meanWeight: 162.5 },
    { id: 'soft_taco_supreme', name: 'Soft Taco Supreme', trueRange: [170, 185], meanWeight: 177.5 },
    { id: 'bean_burrito', name: 'Bean Burrito', trueRange: [180, 195], meanWeight: 187.5 },
    { id: 'burrito_supreme', name: 'Burrito Supreme', trueRange: [210, 230], meanWeight: 220 },
    { id: 'five_layer_burrito', name: '5-Layer Burrito', trueRange: [245, 260], meanWeight: 252.5 },
    { id: 'seven_layer_burrito', name: '7-Layer Burrito', trueRange: [280, 300], meanWeight: 290 },
    { id: 'chicken_burrito', name: 'Chicken Burrito', trueRange: [200, 220], meanWeight: 210 },
    { id: 'quesadilla', name: 'Quesadilla', trueRange: [225, 245], meanWeight: 235 },
    { id: 'mexican_pizza', name: 'Mexican Pizza', trueRange: [220, 240], meanWeight: 230 },
    { id: 'crunchwrap_supreme', name: 'Crunchwrap Supreme', trueRange: [280, 305], meanWeight: 292.5 },
    { id: 'chalupa_supreme', name: 'Chalupa Supreme', trueRange: [165, 185], meanWeight: 175 },
    { id: 'gordita_crunch', name: 'Gordita Crunch', trueRange: [170, 190], meanWeight: 180 },
    { id: 'nachos_bellgrande', name: 'Nachos BellGrande', trueRange: [450, 485], meanWeight: 467.5 },
    { id: 'nachos_supreme', name: 'Nachos Supreme', trueRange: [320, 345], meanWeight: 332.5 },
    { id: 'cheesy_fiesta_potatoes', name: 'Cheesy Fiesta Potatoes', trueRange: [170, 190], meanWeight: 180 },
    { id: 'cinnamon_twists', name: 'Cinnamon Twists', trueRange: [45, 55], meanWeight: 50 },
    { id: 'mexican_rice', name: 'Mexican Rice', trueRange: [115, 130], meanWeight: 122.5 },
    { id: 'cheesy_bean_rice_burrito', name: 'Cheesy Bean & Rice Burrito', trueRange: [180, 200], meanWeight: 190 },
    { id: 'spicy_potato_taco', name: 'Spicy Potato Soft Taco', trueRange: [145, 160], meanWeight: 152.5 },
    { id: 'cheesy_roll_up', name: 'Cheesy Roll Up', trueRange: [80, 95], meanWeight: 87.5 },
    { id: 'chips_and_cheese', name: 'Chips & Cheese', trueRange: [140, 155], meanWeight: 147.5 },
    { id: 'triple_layer_nachos', name: 'Triple Layer Nachos', trueRange: [185, 205], meanWeight: 195 }
];

// Initialize generator with products
const generator = new GuassianOrderGenerator(products);

// Generate 1000 orders at once using batchSize
const orders = generator.generateCompleteOrder(1000, 1);

// Save to file
const fs = require('fs');
const path = require('path');
const outputPath = path.join(__dirname, 'orders.json');
fs.writeFileSync(outputPath, JSON.stringify(orders, null, 2));
console.log(`Generated 1000 orders and saved to ${outputPath}`);
