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

// -- New Product class using a Kalman filter --
class Product {
    constructor(name) {
        this.name = name;
        this.defaultWeight = 200;

        // Initial state estimate
        this.x = this.defaultWeight;

        // Start with high uncertainty
        this.P = 1000;

        // Measurement noise (scale precision)
        this.R = 10;  // Scales are highly accurate

        // Process noise (natural variation in food prep)
        this.Q = 30;  // Base level of variation

        // Observation count
        this.n = 0;
    }

    update(measurement) {
        if (measurement <= 0) return;
        this.n++;

        // Compute the error between the measurement and current estimate
        const error = measurement - this.x;
        
        // More aggressive error response
        let effectiveQ = this.Q;
        const errorThreshold = 5; // Lower threshold (was 10)
        if (Math.abs(error) > errorThreshold) {
            // More aggressive boost (was 5)
            effectiveQ = this.Q * Math.min(10, 1 + Math.abs(error) / errorThreshold);
        }

        // Prediction: add (possibly boosted) process noise
        this.P += effectiveQ;
        
        // Calculate Kalman gain
        const K = this.P / (this.P + this.R);

        // Adaptive gamma - more aggressive for large errors
        const gamma = Math.min(1, 0.5 + Math.abs(error) / 50);  // Scales up with error
        this.x += gamma * K * error;
        
        // Update uncertainty with adaptive gamma
        this.P = (1 - gamma * K) * this.P;
        
        // Use a dynamic lower bound
        const dynamicFloor = Math.max(this.R, this.Q * 0.5);
        if (this.P < dynamicFloor) {
            this.P = dynamicFloor;
        }
    }

    get estimatedWeight() {
        return this.x;
    }

    get uncertainty() {
        return this.P;
    }

    // Move status calculation to a dedicated function
    calculateConfidenceLevel() {
        if (this.n < 10) return "Learning";
        if (this.P > 50) return "Medium";
        return "High";
    }

    // Keep the getter for backward compatibility
    get status() {
        return this.calculateConfidenceLevel();
    }

    get notes() {
        return `P=${this.P.toFixed(1)}`;  // Show uncertainty in notes
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
    constructor(estimatorType = KalmanEstimator) {
        // Initialize products with the selected estimator type
        this.products = new Map(products.map(p => [p.name, new estimatorType(p.name)]));
    }

    generateOrder(incomplete = false) {
        const minItems = incomplete ? 2 : 1;
        const maxItems = 6;  // Changed from 3 to 6
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
        let totalWeight = 0;
        let totalVariance = 0;
        order.items.forEach(item => {
            const product = this.products.get(item.name);
            totalWeight += product.estimatedWeight;

            // Base variance floor should be higher to reflect true uncertainty
            let varianceFloor = 29;  // Theoretical minimum from R + Q

            // For learning phase items, be more conservative
            if (product.n < 10) {  // Match our new learning threshold
                varianceFloor = 100;  // Much higher for learning items
            } else if (product.P > 35) {  // Medium confidence
                varianceFloor = 50;   // Higher for medium confidence
            }

            // Use max of current uncertainty and floor
            const effectiveVariance = Math.max(product.P, varianceFloor);
            totalVariance += effectiveVariance;
        });

        return {
            weight: totalWeight,
            std: Math.sqrt(totalVariance)
        };
    }

    analyzeOrderDifference(measuredWeight, inferredWeight) {
        const { weight, std } = inferredWeight;
        const difference = Math.abs(measuredWeight - weight);
        // Get current threshold from UI
        const threshold = parseFloat(document.getElementById('detection-threshold').value);
        
        if (difference <= threshold * std) return 'Verified';
        if (difference <= (threshold + 1) * std) return 'Warning';
        return 'Flagged';
    }

    // Update the weight estimates using the Kalman filter
    updateWeightEstimates(order, measuredWeight) {
        const presentItems = order.items.filter(item => item.present);
        if (presentItems.length === 0) return;

        // For single-item orders, direct Kalman update with measured weight
        if (presentItems.length === 1) {
            const product = this.products.get(presentItems[0].name);
            product.update(measuredWeight);
            return;
        }

        // For multi-item orders, distribute error proportionally then Kalman update
        let totalEstimated = 0;
        presentItems.forEach(item => {
            const product = this.products.get(item.name);
            totalEstimated += product.estimatedWeight;
        });
        
        const totalError = measuredWeight - totalEstimated;
        presentItems.forEach(item => {
            const product = this.products.get(item.name);
            const ratio = product.estimatedWeight / totalEstimated;
            const target = product.estimatedWeight + (totalError * ratio);
            product.update(target);
        });
    }
}

// UI Controller
class UIController {
    constructor() {
        this.availableEstimators = {
            'kalman': KalmanEstimator,
            'ema': ExponentialMovingAverageEstimator,
            'simple': SimpleAverageEstimator
        };
        this.currentEstimator = 'kalman';
        this.simulator = new OrderSimulator(this.availableEstimators[this.currentEstimator]);
        this.progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        this.productTable = document.getElementById('product-table').getElementsByTagName('tbody')[0];
        this.updateProductTable();
        this.weightThreshold = 4.0;  // default 4σ threshold
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
            updateSliderValue('detection-threshold');
            // Re-analyze current order with new threshold
            if (this.currentOrder) {
                const analysis = this.simulator.analyzeOrderDifference(
                    this.currentOrder.measuredWeight, 
                    this.currentOrder.inferredWeight
                );
                this.displayCurrentOrder();
            }
        });

        // Add algorithm selector
        document.getElementById('algorithm-selector').addEventListener('change', (e) => {
            this.currentEstimator = e.target.value;
            this.simulator = new OrderSimulator(this.availableEstimators[this.currentEstimator]);
            this.updateProductTable();
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
        
        // Get status for each item
        const itemStatuses = order.map(item => {
            if (!item.present) return { status: 'Missing', class: 'text-danger' };
            const product = this.simulator.products.get(item.name);
            const confidence = product.calculateConfidenceLevel();
            
            switch (confidence) {
                case 'Learning':
                    return { status: 'Learning', class: 'text-warning' };
                case 'Medium':
                    return { status: 'Medium', class: 'text-warning' };
                case 'High':
                    return { status: 'High', class: 'text-success' };
            }
        });

        // Count non-high confidence items
        const nonHighConfidenceCount = itemStatuses.filter(s => 
            s.status === 'Learning' || s.status === 'Medium'
        ).length;

        // Determine order status based on confidence and threshold
        let statusHtml = '';
        const threshold = parseFloat(document.getElementById('detection-threshold').value);

        if (nonHighConfidenceCount > 0) {
            // If any items aren't high confidence, show learning warning
            statusHtml = `
                <div class="alert alert-warning mb-3">
                    <strong>Learning in Progress</strong><br>
                    ${nonHighConfidenceCount} item${nonHighConfidenceCount > 1 ? 's' : ''} not yet at high confidence
                </div>
            `;
        } else if (sigmaValue > threshold) {
            // All items high confidence but weight difference exceeds threshold
            statusHtml = `
                <div class="alert alert-danger mb-3">
                    <strong>Weight Mismatch</strong><br>
                    Weight difference exceeds ${threshold}σ threshold
                </div>
            `;
        } else {
            // All items high confidence and weight within threshold
            statusHtml = `
                <div class="alert alert-success mb-3">
                    <strong>Order Verified</strong><br>
                    Order weight within expected range
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
            const confidence = product.calculateConfidenceLevel();
            
            let statusClass;
            switch (confidence) {
                case 'Learning':
                    statusClass = 'bg-danger';
                    break;
                case 'Medium':
                    statusClass = 'bg-warning';
                    break;
                case 'High':
                    statusClass = 'bg-success';
                    break;
            }

            return `
                <tr>
                    <td>${name}</td>
                    <td>${min}-${max}</td>
                    <td>${product.estimatedWeight.toFixed(1)}</td>
                    <td>${product.n}</td>
                    <td>${product.notes}</td>
                    <td><span class="badge ${statusClass}">${confidence}</span></td>
                </tr>
            `;
        }).join('');
    }

    async generateBatch(batchSize, incomplete = false) {
        const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        const progressBar = document.querySelector('#progressModal .progress-bar');
        const progressText = document.querySelector('#progressModal .modal-body p');

        if (incomplete) {
            const order = this.simulator.generateOrder(true);
            const measuredWeight = this.simulator.measureWeight(order.totalWeight);
            await this.processOrder(order, measuredWeight);
            this.updateProductTable();
            return;
        }

        progressModal.show();
        progressBar.style.width = '0%';
        progressText.textContent = 'Starting batch processing...';

        for (let i = 0; i < batchSize; i++) {
            const order = this.simulator.generateOrder(false);
            const measuredWeight = this.simulator.measureWeight(order.totalWeight);
            
            progressBar.style.width = `${((i + 1) / batchSize) * 100}%`;
            progressText.textContent = `Processing order ${i + 1} of ${batchSize}...`;
            
            await this.processOrder(order, measuredWeight);
            this.updateProductTable();
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        progressBar.style.width = '100%';
        progressText.textContent = 'Batch processing complete!';
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        progressModal.hide();
    }

    processOrder(order, measuredWeight) {
        // Store current order for UI display
        this.currentOrder = {
            order: order.items,
            measuredWeight,
            inferredWeight: this.simulator.inferOrderWeight(order)
        };

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
