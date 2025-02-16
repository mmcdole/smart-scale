// QSR Smart Scale Simulator

// Product Database
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

// Separate simulation data from learning data
const productRanges = new Map(products.map(p => [p.name, p.trueRange]));

// Core statistical utilities using Welford's algorithm
class WelfordStats {
    constructor() {
        this.n = 0;
        this.mean = 0;
        this.M2 = 0;
    }

    update(newValue) {
        // Guard against NaN inputs
        if (isNaN(newValue)) return;
        
        this.n++;
        const delta = newValue - this.mean;
        this.mean += delta / this.n;
        const delta2 = newValue - this.mean;
        this.M2 += delta * delta2;
    }

    get variance() {
        if (this.n < 2) return 0;
        const variance = this.M2 / (this.n - 1);
        return isNaN(variance) ? 0 : variance;
    }

    get std() {
        return Math.sqrt(this.variance);
    }

    get rsd() {
        if (this.mean === 0 || this.n === 0) return 0;
        const rsd = (this.std / Math.abs(this.mean)) * 100;
        return isNaN(rsd) ? 0 : rsd;
    }
}

// Product class to manage individual product statistics
class Product {
    constructor(name) {
        this.name = name;
        this.stats = new WelfordStats();
        this.defaultWeight = 200;
        this.recentObservations = []; // Track recent measurements
        this.maxRecentHistory = 10;   // Keep last 10 measurements
    }

    get estimatedWeight() {
        const weight = this.stats.n === 0 ? this.defaultWeight : this.stats.mean;
        return isNaN(weight) ? this.defaultWeight : weight;
    }

    get observations() {
        return this.stats.n;
    }

    get rsd() {
        return this.stats.rsd;
    }

    get status() {
        // Learning: Fewer than 5 observations
        if (this.observations < 5) return 'Learning';

        // Medium: At least 5 observations but RSD ≥ 10%
        if (this.rsd >= 10) return 'Medium';

        // High: At least 5 observations with RSD < 10%
        return 'High';
    }

    update(weight, learningRate = 1.0) {
        // Basic input validation is still good practice
        if (weight <= 0 || learningRate < 0 || learningRate > 1) return;

        this.recentObservations.push(weight);
        if (this.recentObservations.length > this.maxRecentHistory) {
            this.recentObservations.shift();
        }

        const effectiveWeight = learningRate * weight + (1 - learningRate) * this.estimatedWeight;
        this.stats.update(effectiveWeight);
    }
}

// Gaussian random number generator
const GaussianUtils = {
    randomGaussian(mean, stdDev) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * stdDev;
    }
};

// Order simulator class
class OrderSimulator {
    constructor() {
        // Only pass the name to Product - keep true ranges separate
        this.products = new Map(products.map(p => [
            p.name, 
            new Product(p.name)
        ]));
    }

    generateOrder(incomplete = false) {
        const minItems = incomplete ? 2 : 1;
        const maxItems = 3; // Per spec: 1-3 items
        const numItems = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
        
        // Select random items
        const productNames = Array.from(this.products.keys());
        const selectedItems = new Set();
        while (selectedItems.size < numItems) {
            const randomProduct = productNames[Math.floor(Math.random() * productNames.length)];
            selectedItems.add(randomProduct);
        }

        // Create order items
        const order = Array.from(selectedItems).map(name => ({
            name,
            present: true,
            trueWeight: this.generateItemWeight(name)
        }));

        // Handle incomplete orders
        if (incomplete && order.length > 1) {
            const missingIndex = Math.floor(Math.random() * order.length);
            order[missingIndex].present = false;
            order[missingIndex].trueWeight = 0;
        }

        return {
            items: order,
            totalWeight: order.reduce((sum, item) => sum + (item.present ? item.trueWeight : 0), 0)
        };
    }

    generateItemWeight(productName) {
        const trueRange = productRanges.get(productName);
        const [min, max] = trueRange;
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6; // 99.7% of weights within range
        return GaussianUtils.randomGaussian(mean, stdDev);
    }

    measureWeight(trueWeight) {
        const measurementNoise = GaussianUtils.randomGaussian(0, 2); // 2g std dev per spec
        return Math.max(0, trueWeight + measurementNoise);
    }

    inferOrderWeight(order) {
        // Calculate total expected weight and variance for the order
        let totalWeight = 0;
        let totalVariance = 0;

        // Include ALL items in inferred weight, regardless of present status
        order.items.forEach(item => {
            const product = this.products.get(item.name);
            totalWeight += product.estimatedWeight;
            totalVariance += product.stats.variance;
        });

        return {
            weight: totalWeight,
            std: Math.sqrt(totalVariance)
        };
    }

    analyzeOrderDifference(measuredWeight, inferredWeight) {
        const {weight, std} = inferredWeight;
        const difference = Math.abs(measuredWeight - weight);
        
        // Use sigma-based thresholds per spec
        if (difference <= std) return 'Verified';
        if (difference <= 2 * std) return 'Warning';
        return 'Flagged';
    }

    updateWeightEstimates(order, measuredWeight) {
        const presentItems = order.items.filter(item => item.present);
        if (presentItems.length === 0) return;

        // For single-item orders, update directly at full rate.
        if (presentItems.length === 1) {
            const product = this.products.get(presentItems[0].name);
            product.update(measuredWeight, 1.0);
            return;
        }

        // For multi-item orders, compute total estimated weight.
        let totalEstimated = 0;
        presentItems.forEach(item => {
            const product = this.products.get(item.name);
            totalEstimated += product.estimatedWeight;
        });
        
        // Compute error and distribute it proportionally.
        const totalError = measuredWeight - totalEstimated;

        // Update each product.
        presentItems.forEach(item => {
            const product = this.products.get(item.name);
            
            // Distribute error proportionally to current estimates
            const ratio = product.estimatedWeight / totalEstimated;
            const target = product.estimatedWeight + (totalError * ratio);
            
            let learningRate;
            if (product.observations < 5) {
                // Learning phase: full rate
                learningRate = 1.0;
            } else if (product.observations < 20) {
                // Early phase: high rate
                learningRate = 0.8;
            } else {
                // Established phase: moderate rate with minimum
                learningRate = 0.2;  // Never drop below 0.2
            }

            // Update with the target weight and learning rate
            product.update(target, learningRate);
        });
    }
}

// UI Controller
class UIController {
    constructor() {
        this.simulator = new OrderSimulator();
        this.progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        this.productTable = document.getElementById('product-table').getElementsByTagName('tbody')[0];
        this.updateProductTable(); // Initialize product table immediately
        this.weightThreshold = 10; // default 10% threshold
        this.verifiedThreshold = 80; // default 80% for learning -> verified
    }

    initializeUI() {
        // Helper to update value display for a slider
        const updateSliderValue = (sliderId) => {
            const slider = document.getElementById(sliderId);
            const valueDisplay = document.getElementById(`${sliderId}-value`);
            valueDisplay.textContent = `${slider.value}\u03C3`; // Unicode for sigma
        };

        // Detection threshold slider
        document.getElementById('detection-threshold').addEventListener('input', (e) => {
            this.weightThreshold = parseFloat(e.target.value);
            updateSliderValue('detection-threshold');
            this.displayCurrentOrder();
        });

        // Initialize value displays
        updateSliderValue('detection-threshold');
    }

    displayCurrentOrder() {
        const orderDisplay = document.getElementById('current-order');
        if (!this.currentOrder) {
            orderDisplay.innerHTML = '<p class="text-muted">No order being processed</p>';
            return;
        }

        const { order, measuredWeight, inferredWeight } = this.currentOrder;
        
        // Calculate weight difference in terms of sigma
        const { weight, std } = inferredWeight;
        const weightDiff = Math.abs(measuredWeight - weight);
        const sigmaValue = std > 0 ? weightDiff / std : 0;
        
        // Update sigma difference display
        document.getElementById('sigma-difference').textContent = sigmaValue.toFixed(1);
        
        // Use sigma threshold instead of percentage
        const threshold = parseFloat(document.getElementById('detection-threshold').value);
        
        // Get status for each item
        const itemStatuses = order.map(item => {
            if (!item.present) return { status: 'Missing', class: 'text-danger' };
            
            const product = this.simulator.products.get(item.name);
            if (product.observations < 5) {
                return { status: 'Learning', class: 'text-warning' };
            } else if (product.rsd >= 10) {
                return { status: 'Medium', class: 'text-warning' };
            } else {
                return { status: 'High', class: 'text-success' };
            }
        });

        // Count non-high confidence items
        const nonHighConfidenceCount = itemStatuses.filter(s => 
            s.status === 'Learning' || s.status === 'Medium'
        ).length;

        // Determine order status based on sigma and confidence
        let statusHtml = '';
        if (nonHighConfidenceCount > 0) {
            // Always show warning if any items are still learning/medium confidence
            statusHtml = `
                <div class="alert alert-warning mb-3">
                    <strong>Learning in Progress</strong><br>
                    ${nonHighConfidenceCount} item${nonHighConfidenceCount > 1 ? 's' : ''} not yet at high confidence
                </div>
            `;
        } else if (sigmaValue <= 1) {
            // Only show success if all items are high confidence and weight matches
            statusHtml = `
                <div class="alert alert-success mb-3">
                    <strong>Order Verified</strong><br>
                    Order weight within expected range
                </div>
            `;
        } else if (sigmaValue > 2) {
            statusHtml = `
                <div class="alert alert-danger mb-3">
                    <strong>Weight Mismatch</strong><br>
                    All items at high confidence but weight difference exceeds threshold
                </div>
            `;
        } else {
            statusHtml = `
                <div class="alert alert-warning mb-3">
                    <strong>Weight Warning</strong><br>
                    Weight difference between 1σ and 2σ
                </div>
            `;
        }

        // Display items with consistent status text
        let itemsHtml = '';
        order.forEach((item, i) => {
            const { status, class: statusClass } = itemStatuses[i];
            itemsHtml += `
                <div class="mb-2">
                    <strong>${item.name}</strong><br>
                    <small class="${statusClass}">${status}</small>
                </div>
            `;
        });
        
        // Display weights
        const weightsHtml = `
            <div class="mt-3 pt-3 border-top">
                <div class="row">
                    <div class="col-6">Measured:</div>
                    <div class="col-6 text-end">${measuredWeight.toFixed(1)}g</div>
                </div>
                <div class="row">
                    <div class="col-6">Inferred:</div>
                    <div class="col-6 text-end">${weight.toFixed(1)}g</div>
                </div>
                <div class="row">
                    <div class="col-6">Difference:</div>
                    <div class="col-6 text-end ${sigmaValue > threshold ? 'text-danger' : ''}">${weightDiff.toFixed(1)}g</div>
                </div>
            </div>
        `;
        
        // Combine all sections
        orderDisplay.innerHTML = statusHtml + itemsHtml + weightsHtml;
        
        // Update weight analysis display
        document.getElementById('measured-weight').textContent = measuredWeight.toFixed(1);
        document.getElementById('inferred-weight').textContent = weight.toFixed(1);
        document.getElementById('weight-difference').textContent = weightDiff.toFixed(1);
    }

    updateProductTable() {
        const tableBody = document.querySelector('#product-table tbody');
        tableBody.innerHTML = Array.from(this.simulator.products.entries()).map(([name, product]) => {
            const [min, max] = productRanges.get(name);
            
            // Get status and color
            let statusText, statusClass;
            if (product.observations < 5) {
                statusText = 'Learning';
                statusClass = 'bg-danger';
            } else if (product.rsd >= 10) {
                statusText = 'Medium';
                statusClass = 'bg-warning';
            } else {
                statusText = 'High';
                statusClass = 'bg-success';
            }

            return `
                <tr>
                    <td>${name}</td>
                    <td>${min}-${max}</td>
                    <td>${product.estimatedWeight.toFixed(1)}</td>
                    <td>${product.observations}</td>
                    <td>${product.rsd.toFixed(1)}%</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');
    }

    async generateBatch(batchSize, incomplete = false) {
        // Get modal elements
        const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        const progressBar = document.querySelector('#progressModal .progress-bar');
        const progressText = document.querySelector('#progressModal .modal-body p');

        if (incomplete) {
            // For incomplete orders, just generate one
            const order = this.simulator.generateOrder(true);
            const measuredWeight = this.simulator.measureWeight(order.totalWeight);
            await this.processOrder(order, measuredWeight);
            this.updateProductTable();
            return;
        }

        // Show modal for batch processing
        progressModal.show();
        progressBar.style.width = '0%';
        progressText.textContent = 'Starting batch processing...';

        // For complete orders, generate a batch
        for (let i = 0; i < batchSize; i++) {
            const order = this.simulator.generateOrder(false);
            const measuredWeight = this.simulator.measureWeight(order.totalWeight);
            
            progressBar.style.width = `${((i + 1) / batchSize) * 100}%`;
            progressText.textContent = `Processing order ${i + 1} of ${batchSize}...`;
            
            await this.processOrder(order, measuredWeight);
            this.updateProductTable();
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        progressBar.style.width = '100%';
        progressText.textContent = 'Batch processing complete!';
        
        // Hide modal after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        progressModal.hide();
    }

    processOrder(order, measuredWeight) {
        // Store current order
        this.currentOrder = {
            order: order.items,
            measuredWeight,
            inferredWeight: this.simulator.inferOrderWeight(order)
        };

        // Update display
        this.displayCurrentOrder();
        
        // Only update weight estimates if all items are present
        if (order.items.every(item => item.present)) {
            this.simulator.updateWeightEstimates(order, measuredWeight);
            this.updateProductTable();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing application...");
    window.uiController = new UIController();
    uiController.initializeUI();
});