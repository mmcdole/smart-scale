// ====================
// Sample product data
// ====================
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
  
  // ==========================
  // Global references/variables
  // ==========================
  let emaEstimator, kalmanEstimator, bayesianLREstimator;
  let defaultOrderGenerator, guassianOrderGenerator;
  let simulator;
  let currentEstimator = 'ema';
  let verificationThreshold = 3.0;
  
  // UI element references
  let modal, progressBar, progressText, currentOrderDisplay, estimatorSelect;
  let batchSizeInput, generateCompleteBtn, generateIncompleteBtn;
  
  // ====================
  // Re-initialization
  // ====================
  
  function initializeSimulator() {
    // 1. Re-create the estimators
    emaEstimator = new EMAEstimator();
    kalmanEstimator = new KalmanEstimator();
    bayesianLREstimator = new BayesianLREstimator();
  
    // 2. Re-create the order generators
    defaultOrderGenerator = new OrderGenerator(products);
    guassianOrderGenerator = new GuassianOrderGenerator(products);
    guassianOrderGenerator.setItemQuantityRange(1, 12);
    guassianOrderGenerator.setNumberOfUniqueItemsRange(1, 5);
  
    // 3. Decide which generator to use
    let methodSwitch = document.getElementById('orderMethodSwitch');
    let useGaussian = methodSwitch && methodSwitch.checked;
    let chosenGenerator = useGaussian ? guassianOrderGenerator : defaultOrderGenerator;
  
    // 4. Decide which estimator to use
    let chosenEstimator;
    switch (currentEstimator) {
      case 'ema':
        chosenEstimator = emaEstimator;
        break;
      case 'kalman':
        chosenEstimator = kalmanEstimator;
        break;
      case 'bayesianLRE':
        chosenEstimator = bayesianLREstimator;
        break;
      default:
        chosenEstimator = emaEstimator;
        console.warn('Unknown estimator, defaulting to EMA');
    }
  
    // 5. Create a new simulator with the chosen generator/estimator
    simulator = new Simulator(chosenGenerator, chosenEstimator);
  
    // 6. Update the UI to reflect the new state
    updateProductTable();
    updateCurrentOrder(null);
  }
  
  // ====================
  // Modal / UI Helpers
  // ====================
  
  function showModal() {
    if (modal) {
      modal.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressText.textContent = 'Processing order 0 of 0...';
    }
  }
  
  function hideModal() {
    if (modal) {
      // Add a small delay to show completion
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 500);
    }
  }
  
  function updateProgress(current, total) {
    if (progressBar && progressText) {
      const percentage = Math.round((current / total) * 100);
      // Force style update
      progressBar.style.width = '0%';
      progressBar.offsetWidth; // Force reflow
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `Processing order ${current} of ${total}...`;
    }
  }
  
  // =====================
  // Order Status / Update
  // =====================
  
  function getOrderStatus(order, trueWeight) {
    if (!order || order.items.length === 0) return null;
  
    const inferredWeight = simulator.weightEstimator.inferOrderWeight(order);
    const difference = trueWeight - inferredWeight;
    const sigma = Math.abs(difference) / (inferredWeight * 0.05);
    
    // Check if any items are in learning state
    const hasLearningItems = order.items.some(item => 
      simulator.weightEstimator.getConfidenceStatus(item.productId) === 'LEARNING'
    );
  
    // Check if all items are at least medium confidence
    const allItemsConfident = order.items.every(item => {
      const status = simulator.weightEstimator.getConfidenceStatus(item.productId);
      return status === 'HIGH' || status === 'MEDIUM';
    });
  
    if (hasLearningItems) {
      return {
        type: 'warning',
        header: 'Learning in Progress',
        message: 'Still learning item weights - verification not yet reliable',
        class: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    } else if (allItemsConfident && sigma <= verificationThreshold) {
      return {
        type: 'success',
        header: 'Order Verified',
        message: 'Weight within expected range',
        class: 'bg-green-100 text-green-800 border-green-300'
      };
    } else if (allItemsConfident) {
      return {
        type: 'error',
        header: 'Weight Discrepancy',
        message: 'Order weight out of expected range',
        class: 'bg-red-100 text-red-800 border-red-300'
      };
    }
  
    return null;
  }
  
  function updateCurrentOrder(order) {
    if (!currentOrderDisplay) return;
  
    if (!order || order.items.length === 0) {
      currentOrderDisplay.innerHTML = '<p class="text-gray-500">No order being processed</p>';
      return;
    }
    
    const orderStatus = getOrderStatus(order, order.trueWeight);
    const statusBanner = orderStatus ? `
        <div class="mb-4 p-3 border rounded-lg ${orderStatus.class}">
            <div class="font-bold mb-1">
                ${orderStatus.type === 'error' ? '⚠️ ' : ''}${orderStatus.header}
            </div>
            <div class="text-sm">
                ${orderStatus.message}
                ${orderStatus.type === 'error' ? `
                    <div class="mt-1">
                        Differs by <span id="sigma-difference">${(0).toFixed(1)}</span>σ
                        (threshold: ${verificationThreshold.toFixed(1)}σ)
                    </div>
                ` : ''}
            </div>
        </div>
    ` : '';
    
    const itemsList = order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const status = simulator.weightEstimator.getConfidenceStatus(item.productId);
      const statusClasses = {
        'HIGH': 'bg-green-100 text-green-800',
        'MEDIUM': 'bg-yellow-100 text-yellow-800',
        'LEARNING': 'bg-red-100 text-red-800'
      };
      
      let quantityText = '';
      if (item.missing && item.quantity > 1) {
        quantityText = `<span class="text-gray-500">×${item.quantity - 1}</span> <span class="text-red-500 text-sm">(1 missing)</span>`;
      } else if (item.missing) {
        quantityText = `<span class="text-red-500 text-sm">(Missing)</span>`;
      } else if (item.quantity > 1) {
        quantityText = `<span class="text-gray-500">×${item.quantity}</span>`;
      }
      
      return `
        <div class="flex justify-between items-center py-2 ${item.missing && item.quantity === 1 ? 'opacity-50' : ''}">
            <div class="flex items-center gap-2">
                <span class="font-medium">${product.name}</span>
                ${quantityText}
            </div>
            <span class="px-2 py-1 rounded-full text-xs ${statusClasses[status]}">${status}</span>
        </div>
      `;
    }).join('');
    
    currentOrderDisplay.innerHTML = `
      ${statusBanner}
      <div class="space-y-1">
          <h6 class="font-semibold mb-3">Order Items:</h6>
          ${itemsList}
      </div>
    `;
  }

  function updateOrderGeneratorSettings() {
    const minUnique = parseInt(document.getElementById('minUniqueItems').value, 10) || 1;
    const maxUnique = parseInt(document.getElementById('maxUniqueItems').value, 10) || 3;
    const minQuantity = parseInt(document.getElementById('minQuantity').value, 10) || 1;
    const maxQuantity = parseInt(document.getElementById('maxQuantity').value, 10) || 2;
    
    // Check which generator is active based on the order method switch
    if (document.getElementById('orderMethodSwitch').checked) {
      guassianOrderGenerator.setNumberOfUniqueItemsRange(minUnique, maxUnique);
      guassianOrderGenerator.setItemQuantityRange(minQuantity, maxQuantity);
    } else {
      // If defaultOrderGenerator supports these methods, update them too
      if (typeof defaultOrderGenerator.setNumberOfUniqueItemsRange === 'function') {
        defaultOrderGenerator.setNumberOfUniqueItemsRange(minUnique, maxUnique);
      }
      if (typeof defaultOrderGenerator.setItemQuantityRange === 'function') {
        defaultOrderGenerator.setItemQuantityRange(minQuantity, maxQuantity);
      }
    }
  }
  
  // ====================
  // Product Table Update
  // ====================
  
  function updateProductTable() {
    const tableBody = document.getElementById('product-table-body');
    if (!tableBody) {
      console.error('Product table body not found');
      return;
    }
  
    tableBody.innerHTML = '';
    
    products.forEach(product => {
      try {
        const row = document.createElement('tr');
        const estimator = simulator.weightEstimator;
        const estimatedWeight = estimator.inferItemWeight(new Item(product.id));
        const observations = estimator.getObservationCount(product.id);
        const status = estimator.getConfidenceStatus(product.id);
        
        row.className = 'hover:bg-gray-50';
        
        const statusClasses = {
          'HIGH': 'bg-green-100 text-green-800',
          'MEDIUM': 'bg-yellow-100 text-yellow-800',
          'LEARNING': 'bg-red-100 text-red-800'
        };
        
        row.innerHTML = `
          <td class="px-4 py-2 text-sm">${product.name}</td>
          <td class="px-4 py-2 text-sm">${product.trueRange[0]}g - ${product.trueRange[1]}g</td>
          <td class="px-4 py-2 text-sm">${estimatedWeight ? estimatedWeight.toFixed(1) : '0.0'}g</td>
          <td class="px-4 py-2 text-sm">${observations}</td>
          <td class="px-4 py-2 text-sm">
              <span class="px-2 py-1 rounded-full text-xs ${statusClasses[status]}">${status}</span>
          </td>
        `;
        tableBody.appendChild(row);
      } catch (error) {
        console.error(`Error updating row for product ${product.name}:`, error);
      }
    });
  }
  
  // ====================
  // Statistics Display
  // ====================
  
  function updateStatistics(order, trueWeight) {
    const inferredWeight = simulator.weightEstimator.inferOrderWeight(order);
    const difference = trueWeight - inferredWeight;
    const sigma = Math.abs(difference) / (inferredWeight * 0.05);
    const isWithinThreshold = sigma <= verificationThreshold;
  
    document.getElementById('measured-weight').textContent = trueWeight.toFixed(1);
    document.getElementById('inferred-weight').textContent = inferredWeight.toFixed(1);
    document.getElementById('weight-difference').textContent = difference.toFixed(1);
    
    const sigmaElement = document.getElementById('sigma-difference');
    sigmaElement.textContent = sigma.toFixed(1);
    sigmaElement.className = isWithinThreshold ? 'text-green-600' : 'text-red-600';
  }
  
  // ====================
  // Order Generation
  // ====================
  
  async function generateOrders(batchSize, incomplete = false) {
    if (incomplete) {
      // Generate a single incomplete order without progress bar
      const order = simulator.generateIncompleteOrder();
      
      // Calculate true weight (only for items that are present)
      const trueWeight = order.items.reduce((total, item) => {
        if (!item.missing) {
          return total + item.totalWeight;
        } else {
          // one item missing
          return total + (item.totalWeight - (item.totalWeight / item.quantity));
        }
      }, 0);
      
      // Show the verification, but do not update estimator with incomplete data
      updateCurrentOrder(order);
      updateStatistics(order, trueWeight);
      return;
    }
  
    // Regular order processing with progress bar
    showModal();
    try {
      for (let i = 0; i < batchSize; i++) {
        updateProgress(i + 1, batchSize);
        
        const order = simulator.generateCompleteOrders(1)[0];
        const trueWeight = order.items.reduce((total, item) => total + item.totalWeight, 0);
        
        // Attach the trueWeight for reference
        order.trueWeight = trueWeight;
        
        // Update the estimator with this order
        simulator.processOrder(order, trueWeight);
        updateCurrentOrder(order);
        updateProductTable();
        updateStatistics(order, trueWeight);
        
        // Small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Error generating orders:', error);
    } finally {
      updateProgress(batchSize, batchSize);
      hideModal();
    }
  }
  
  // ====================
  // DOM Initialization
  // ====================
  
  document.addEventListener('DOMContentLoaded', () => {
    // Get references to all required UI elements
    modal = document.getElementById('progressModal');
    progressBar = document.getElementById('progressBar');
    progressText = document.getElementById('progressText');
    currentOrderDisplay = document.getElementById('currentOrder');
    estimatorSelect = document.getElementById('estimatorSelect');
    batchSizeInput = document.getElementById('batchSize');
    generateCompleteBtn = document.getElementById('generateComplete');
    generateIncompleteBtn = document.getElementById('generateIncomplete');
  
    if (!modal || !progressBar || !progressText || !currentOrderDisplay ||
        !estimatorSelect || !batchSizeInput || !generateCompleteBtn || !generateIncompleteBtn) {
      console.error('Some UI elements not found');
      return;
    }
  
    // Initialize everything for the first time
    initializeSimulator();
  
    // Now that the estimators exist, populate the dropdown with their names
    estimatorSelect.innerHTML = `
      <option value="ema">${emaEstimator.getName()}</option>
      <option value="kalman">${kalmanEstimator.getName()}</option>
      <option value="bayesianLRE">${bayesianLREstimator.getName()}</option>
    `;
  
    // ====================
    // Event Listeners
    // ====================
  
    // Changing estimator => re-initialize simulator (clear learning, start fresh)
    estimatorSelect.addEventListener('change', (e) => {
      currentEstimator = e.target.value;
      initializeSimulator(); // Full reset
    });
  
    // Generate complete orders => do not reset, keep learned data
    generateCompleteBtn.addEventListener('click', () => {
        // Ensure latest order generator settings are applied
        updateOrderGeneratorSettings();
        
        const batchSize = parseInt(batchSizeInput.value, 10) || 1;
        generateOrders(batchSize, false);
      });
  
    // Generate incomplete order => do not reset, keep learned data
    generateIncompleteBtn.addEventListener('click', () => {
      generateOrders(1, true);
    });
  
    // Changing threshold => do not reset, just update the threshold
    const thresholdSlider = document.getElementById('verificationThreshold');
    const thresholdValue = document.getElementById('thresholdValue');
    thresholdSlider.addEventListener('input', (e) => {
      verificationThreshold = parseFloat(e.target.value);
      thresholdValue.textContent = verificationThreshold.toFixed(1);
    });
  
    // Changing order generation method => re-initialize simulator
    document.getElementById('orderMethodSwitch').addEventListener('change', function() {
      const methodLabel = document.getElementById('methodLabel');
      if (this.checked) {
        methodLabel.textContent = 'GAUSSIAN';
        console.log('Order generation method changed to GAUSSIAN');
      } else {
        methodLabel.textContent = 'DEFAULT';
        console.log('Order generation method changed to DEFAULT');
      }
      // Full reset to switch generators
      initializeSimulator();
    });

    // Attach event listeners to update the generator settings when inputs change
    document.getElementById('minUniqueItems').addEventListener('change', updateOrderGeneratorSettings);
    document.getElementById('maxUniqueItems').addEventListener('change', updateOrderGeneratorSettings);
    document.getElementById('minQuantity').addEventListener('change', updateOrderGeneratorSettings);
    document.getElementById('maxQuantity').addEventListener('change', updateOrderGeneratorSettings);

  });
  