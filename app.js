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

// Gaussian Utilities
const GaussianUtils = {
    randomGaussian(mean, stdDev) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z0 * stdDev;
    }
};

// Order Simulation
class OrderSimulator {
    constructor() {
        // Initialize products with estimated weights
        this.products = {};
        
        // Convert products array into a map with additional tracking fields
        products.forEach(product => {
            this.products[product.name] = {
                ...product,
                estimatedWeight: 0,    // Start with no assumption
                confidence: 0,         // Start with zero confidence
                observations: 0,
                weightHistory: [],
                errorHistory: []
            };
        });
    }

    getProducts() {
        return this.products;
    }

    generateOrder(incomplete = false) {
        // Generate a random order of 2-4 items for incomplete orders, 1-4 for complete orders
        const minItems = incomplete ? 2 : 1;
        const numItems = Math.floor(Math.random() * (4 - minItems + 1)) + minItems;
        const products = Object.keys(this.products);
        const order = [];
        
        // Select random items
        for (let i = 0; i < numItems; i++) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            order.push({
                name: randomProduct,
                present: true,
                trueWeight: this.generateItemWeight(randomProduct)
            });
        }
        
        // For incomplete orders, ensure at least one item is missing
        if (incomplete && order.length > 1) {
            // Randomly select one item to definitely keep
            const keepIndex = Math.floor(Math.random() * order.length);
            
            // Randomly select one item to definitely make missing
            let missingIndex;
            do {
                missingIndex = Math.floor(Math.random() * order.length);
            } while (missingIndex === keepIndex);
            
            // Mark the chosen item as missing
            order[missingIndex].present = false;
            order[missingIndex].trueWeight = 0;
            
            // For remaining items, randomly mark some as missing
            for (let i = 0; i < order.length; i++) {
                if (i !== keepIndex && i !== missingIndex && Math.random() < 0.3) {
                    order[i].present = false;
                    order[i].trueWeight = 0;
                }
            }
        }
        
        // Calculate total weight of present items only
        const totalWeight = order.reduce((sum, item) => {
            return sum + (item.present ? item.trueWeight : 0);
        }, 0);
        
        return {
            items: order,
            totalWeight: totalWeight
        };
    }
    
    generateItemWeight(productName) {
        const product = this.products[productName];
        const [min, max] = product.trueRange;
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6; // Assumes 99.7% of weights fall within range
        return GaussianUtils.randomGaussian(mean, stdDev);
    }
    
    measureWeight(trueWeight) {
        // Add small random measurement error
        const error = GaussianUtils.randomGaussian(0, 2); // 2g standard deviation
        return Math.max(0, trueWeight + error);
    }
    
    inferOrderWeight(order) {
        // Calculate total expected weight for ALL items, including missing ones
        let totalEstimatedWeight = 0;
        
        // Calculate total expected weight
        order.forEach(item => {
            const product = this.products[item.name];
            
            if (product.observations > 0) {
                // Use learned weight for known items
                totalEstimatedWeight += product.estimatedWeight;
            } else {
                // For unknown items, always use true range midpoint
                const [min, max] = product.trueRange;
                totalEstimatedWeight += (min + max) / 2;
            }
        });
        
        return totalEstimatedWeight;
    }
    
    updateWeightEstimates(order, measuredWeight) {
        if (!order || order.length === 0) return;

        // Only update weights for present items
        const presentItems = order.filter(item => item.present);
        if (presentItems.length === 0) return;

        // If we only have one item, we can directly learn its weight
        if (presentItems.length === 1) {
            const product = this.products[presentItems[0].name];
            this.updateProductWeight(product, measuredWeight, true);
            return;
        }

        // For multiple items, distribute weight based on current estimates
        const totalEstimatedWeight = presentItems.reduce((sum, item) => {
            const product = this.products[item.name];
            // Start with reasonable default if no estimate (average QSR item ~200g)
            return sum + (product.estimatedWeight || 200);
        }, 0);

        presentItems.forEach(item => {
            const product = this.products[item.name];
            const currentEstimate = product.estimatedWeight || 200;
            const weightRatio = currentEstimate / totalEstimatedWeight;
            const estimatedItemWeight = measuredWeight * weightRatio;
            
            // Apply a weighted update based on order complexity
            const orderComplexityFactor = 1 / presentItems.length;
            this.updateProductWeight(product, estimatedItemWeight, false, orderComplexityFactor);
        });
    }

    updateProductWeight(product, measuredWeight, isSingleItem = false, orderComplexityFactor = 1) {
        // Initialize with first measurement
        if (product.observations === 0) {
            product.estimatedWeight = measuredWeight;
            product.weightHistory = [measuredWeight];
            product.errorHistory = [0];
            product.observations = 1;
            this.updateConfidence(product);
            return;
        }

        // Update weight history
        product.weightHistory.push(measuredWeight);
        if (product.weightHistory.length > 10) {
            product.weightHistory.shift();
        }

        // Calculate relative error before update
        const currentError = Math.abs(measuredWeight - product.estimatedWeight) / product.estimatedWeight;
        product.errorHistory.push(currentError);
        if (product.errorHistory.length > 10) {
            product.errorHistory.shift();
        }

        // Adaptive learning rate based on multiple factors
        const baseRate = 0.2; // Increased base learning rate
        const confidenceFactor = 1 - (product.confidence * 0.5); // Lower confidence = higher learning rate
        const singleItemBonus = isSingleItem ? 0.3 : 0; // Bonus for single-item orders
        
        // Calculate final learning rate
        const learningRate = Math.min(0.8, baseRate + confidenceFactor + singleItemBonus) * orderComplexityFactor;

        // Update weight estimate using exponential moving average
        product.estimatedWeight = (1 - learningRate) * product.estimatedWeight + learningRate * measuredWeight;
        product.observations++;
        this.updateConfidence(product);
    }

    updateConfidence(product) {
        // Step 1: Handle initial cases
        if (product.observations === 0) {
            product.confidence = 0;
            return;
        }

        // Step 2: Build up initial confidence gradually
        if (product.observations < 5) {
            product.confidence = Math.min(0.5, product.observations * 0.1);
            return;
        }

        // Step 3: Calculate error metrics
        const recentErrors = product.errorHistory.slice(-5);
        const avgRecentError = recentErrors.reduce((sum, err) => sum + err, 0) / recentErrors.length;

        // Step 4: Calculate stability metrics
        const recentWeights = product.weightHistory.slice(-5);
        const avgWeight = recentWeights.reduce((sum, w) => sum + w, 0) / recentWeights.length;
        const weightVariability = recentWeights.reduce((sum, w) => 
            sum + Math.pow(w - avgWeight, 2), 0) / recentWeights.length;
        const normalizedVariability = Math.sqrt(weightVariability) / avgWeight;

        // Step 5: Calculate base confidence more conservatively
        let confidence = product.confidence; // Start with current confidence

        // Step 6: Adjust confidence based on new data
        const maxAdjustment = 0.1; // Maximum 10% change per update
        
        // Increase confidence if measurements are good
        if (avgRecentError < 0.1 && normalizedVariability < 0.1) {
            confidence += maxAdjustment * (1 - confidence); // Slower increase as we get more confident
        }
        // Decrease confidence if measurements are poor
        else if (avgRecentError > 0.2 || normalizedVariability > 0.2) {
            confidence -= maxAdjustment;
        }

        // Step 7: Apply confidence limits based on observations
        const maxConfidenceByObservations = Math.min(0.99, 0.5 + (product.observations * 0.02));
        confidence = Math.min(confidence, maxConfidenceByObservations);

        // Step 8: Apply hard limits based on recent performance
        if (avgRecentError > 0.3) { // > 30% error
            confidence = Math.min(confidence, 0.6);
        } else if (avgRecentError > 0.2) { // > 20% error
            confidence = Math.min(confidence, 0.8);
        } else if (avgRecentError > 0.1) { // > 10% error
            confidence = Math.min(confidence, 0.9);
        }

        // Step 9: Ensure confidence stays within bounds
        confidence = Math.max(0.5, Math.min(0.99, confidence));

        // Step 10: Update product confidence
        product.confidence = confidence;
    }

    updateProductTable() {
        const tableBody = document.querySelector('#product-table tbody');
        tableBody.innerHTML = Object.values(this.products).map(product => {
            const [min, max] = product.trueRange;
            const confidence = product.observations > 0 ? (product.confidence * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${product.name}</td>
                    <td>${min}-${max}</td>
                    <td>${product.estimatedWeight ? product.estimatedWeight.toFixed(1) : '0.0'}</td>
                    <td>${confidence}% (${product.observations} orders)</td>
                </tr>
            `;
        }).join('');
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
            valueDisplay.textContent = `${slider.value}%`;
        };

        // Weight threshold slider
        document.getElementById('weight-threshold').addEventListener('input', (e) => {
            this.weightThreshold = parseInt(e.target.value);
            updateSliderValue('weight-threshold');
            this.displayCurrentOrder();
        });

        // Verified threshold slider
        document.getElementById('verified-threshold').addEventListener('input', (e) => {
            this.verifiedThreshold = parseInt(e.target.value);
            updateSliderValue('verified-threshold');
            this.displayCurrentOrder();
        });

        // Initialize value displays
        updateSliderValue('weight-threshold');
        updateSliderValue('verified-threshold');
    }

    displayCurrentOrder() {
        const orderDisplay = document.getElementById('current-order');
        if (!this.currentOrder) {
            orderDisplay.innerHTML = '<p class="text-muted">No order being processed</p>';
            return;
        }

        const { order, measuredWeight, inferredWeight } = this.currentOrder;
        
        // Calculate weight difference percentage
        const weightDiff = Math.abs(measuredWeight - inferredWeight);
        const largerWeight = Math.max(measuredWeight, inferredWeight);
        const weightDiffPercent = (weightDiff / largerWeight) * 100;
        const threshold = parseFloat(document.getElementById('weight-threshold').value);
        
        // Count items by confidence level
        const confidenceLevels = order.reduce((acc, item) => {
            if (!item.present) return acc;
            const product = this.simulator.products[item.name];
            const confidence = product.confidence * 100;
            if (confidence < this.verifiedThreshold) acc.learning++;
            else acc.verified++;
            return acc;
        }, { learning: 0, verified: 0 });
        
        // Determine order status
        let statusHtml = '';
        if (weightDiffPercent <= threshold) {
            statusHtml = `
                <div class="alert alert-success mb-3">
                    <strong>Order Verified</strong><br>
                    Weight within ${threshold}% threshold
                </div>
            `;
        } else if (confidenceLevels.learning > 0) {
            statusHtml = `
                <div class="alert alert-warning mb-3">
                    <strong>Learning in Progress</strong><br>
                    ${confidenceLevels.learning} item${confidenceLevels.learning > 1 ? 's' : ''} still in learning phase
                </div>
            `;
        } else {
            statusHtml = `
                <div class="alert alert-danger mb-3">
                    <strong>Weight Mismatch</strong><br>
                    Difference of ${weightDiffPercent.toFixed(1)}% exceeds ${threshold}% threshold
                </div>
            `;
        }
        
        // Display items
        let itemsHtml = '';
        order.forEach(item => {
            const product = this.simulator.products[item.name];
            let status, statusClass;
            
            if (!item.present) {
                status = 'Missing';
                statusClass = 'text-danger';
            } else {
                const confidence = product.confidence * 100;
                if (confidence >= this.verifiedThreshold) {
                    status = `Verified (${confidence.toFixed(1)}%)`;
                    statusClass = 'text-success';
                } else {
                    status = `Learning (${confidence.toFixed(1)}%)`;
                    statusClass = 'text-warning';
                }
            }
            
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
                    <div class="col-6 text-end">${inferredWeight.toFixed(1)}g</div>
                </div>
                <div class="row">
                    <div class="col-6">Difference:</div>
                    <div class="col-6 text-end ${weightDiffPercent > threshold ? 'text-danger' : ''}">${weightDiff.toFixed(1)}g (${weightDiffPercent.toFixed(1)}%)</div>
                </div>
            </div>
        `;
        
        // Combine all sections
        orderDisplay.innerHTML = statusHtml + itemsHtml + weightsHtml;
        
        // Update weight analysis display
        document.getElementById('measured-weight').textContent = measuredWeight.toFixed(1);
        document.getElementById('inferred-weight').textContent = inferredWeight.toFixed(1);
        document.getElementById('weight-difference').textContent = weightDiff.toFixed(1);
    }

    async generateBatch(batchSize, incomplete = false) {
        // Get modal elements
        const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
        const progressBar = document.querySelector('#progressModal .progress-bar');
        const progressText = document.querySelector('#progressModal .modal-body p');

        if (incomplete) {
            // For incomplete orders, just generate one
            const { items, totalWeight } = this.simulator.generateOrder(true);
            const measuredWeight = this.simulator.measureWeight(totalWeight); // Measure only present items
            await this.processOrder(items, measuredWeight);
            this.updateProductTable();
            return;
        }

        // Show modal for batch processing
        progressModal.show();
        progressBar.style.width = '0%';
        progressText.textContent = 'Starting batch processing...';

        // For complete orders, generate a batch
        for (let i = 0; i < batchSize; i++) {
            const { items, totalWeight } = this.simulator.generateOrder(false);
            const measuredWeight = this.simulator.measureWeight(totalWeight);
            
            progressBar.style.width = `${((i + 1) / batchSize) * 100}%`;
            progressText.textContent = `Processing order ${i + 1} of ${batchSize}...`;
            
            await this.processOrder(items, measuredWeight);
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
            order,
            measuredWeight,
            inferredWeight: this.simulator.inferOrderWeight(order)
        };

        // Update display
        this.displayCurrentOrder();
        
        // Only update weight estimates if all items are present
        // We can't learn from incomplete orders as they would skew our weight estimates
        if (order.every(item => item.present)) {
            this.simulator.updateWeightEstimates(order, measuredWeight);
            this.updateProductTable();
        }
    }

    updateProductTable() {
        const tableBody = document.querySelector('#product-table tbody');
        tableBody.innerHTML = Object.values(this.simulator.products).map(product => {
            const [min, max] = product.trueRange;
            const confidence = product.observations > 0 ? (product.confidence * 100).toFixed(1) : '0.0';
            return `
                <tr>
                    <td>${product.name}</td>
                    <td>${min}-${max}</td>
                    <td>${product.estimatedWeight ? product.estimatedWeight.toFixed(1) : '0.0'}</td>
                    <td>${confidence}% (${product.observations} orders)</td>
                </tr>
            `;
        }).join('');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing application...");
    window.uiController = new UIController();
    uiController.initializeUI();
});
