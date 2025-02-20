// ==========================
// Global references/variables
// ==========================
let emaEstimator, kalmanEstimator, bayesianLREstimator;
let defaultOrderGenerator, guassianOrderGenerator;
let simulator;
let currentEstimator = 'ema';
let chosenGenerator;
let chosenEstimator;
let verificationThreshold = 3.0;

// UI element references
let modal, progressBar, progressText, currentOrderDisplay, estimatorSelect;
let batchSizeInput, generateCompleteBtn, generateIncompleteBtn;

// ====================
// Re-initialization
// ====================
function initializeSimulator() {
  // 1. Create product generators locally and choose the correct one
  const tbProductsGenerator = new TacoBellProductGenerator();
  const kfcProductsGenerator = new KFCProductGenerator();
  const productLineSelect = document.getElementById('productLineSelect');
  const currentProductGenerator =
    productLineSelect && productLineSelect.value === 'kfc'
      ? kfcProductsGenerator
      : tbProductsGenerator;
  // Get the products from the selected generator (local to this function)
  let products = currentProductGenerator.getProducts();

  // 2. Create order generators using the chosen products
  defaultOrderGenerator = new OrderGenerator(products);
  guassianOrderGenerator = new GuassianOrderGenerator(products);
  guassianOrderGenerator.setItemQuantityRange(1, 12);
  guassianOrderGenerator.setNumberOfUniqueItemsRange(1, 5);

  // 3. Re-create the estimators
  emaEstimator = new EMAEstimator();
  kalmanEstimator = new KalmanEstimator();
  bayesianLREstimator = new BayesianLREstimator();

  // 4. Decide which order generator to use (based on the order method switch)
  const methodSwitch = document.getElementById('orderMethodSwitch');
  const useGaussian = methodSwitch && methodSwitch.checked;
  chosenGenerator = useGaussian ? guassianOrderGenerator : defaultOrderGenerator;

  // 5. Decide which estimator to use
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

  // 6. Create a new simulator with the chosen generator/estimator
  simulator = new Simulator(chosenGenerator, chosenEstimator);
  // (No global "products" is stored – retrieve via simulator.getGenerator().getProducts())

  // 7. Update the UI to reflect the new state
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
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 500);
  }
}

function updateProgress(current, total) {
  if (progressBar && progressText) {
    const percentage = Math.round((current / total) * 100);
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

  const hasLearningItems = order.items.some(
    item => simulator.weightEstimator.getConfidenceStatus(item.productId) === 'LEARNING'
  );
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
  const statusBanner = orderStatus
    ? `
      <div class="mb-4 p-3 border rounded-lg ${orderStatus.class}">
        <div class="font-bold mb-1">
          ${orderStatus.type === 'error' ? '⚠️ ' : ''}${orderStatus.header}
        </div>
        <div class="text-sm">
          ${orderStatus.message}
          ${orderStatus.type === 'error'
      ? `<div class="mt-1">
                Differs by <span id="sigma-difference">${(0).toFixed(1)}</span>σ
                (threshold: ${verificationThreshold.toFixed(1)}σ)
              </div>`
      : ''}
        </div>
      </div>
    `
    : '';

  // Get the products from the current generator
  const currentProducts = simulator.getGenerator().getProducts();
  const itemsList = order.items
    .map(item => {
      const product = currentProducts.find(p => p.id === item.productId);
      const status = simulator.weightEstimator.getConfidenceStatus(item.productId);
      const statusClasses = {
        HIGH: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        LEARNING: 'bg-red-100 text-red-800'
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
    })
    .join('');

  currentOrderDisplay.innerHTML = `
    ${statusBanner}
    <div class="space-y-1">
      <h6 class="font-semibold mb-3">Order Items:</h6>
      ${itemsList}
    </div>
  `;
}

// ====================
// Order Generator Settings
// ====================
function updateOrderGeneratorSettings() {
  const minUnique = parseInt(document.getElementById('minUniqueItems').value, 10) || 1;
  const maxUnique = parseInt(document.getElementById('maxUniqueItems').value, 10) || 3;
  const minQuantity = parseInt(document.getElementById('minQuantity').value, 10) || 1;
  const maxQuantity = parseInt(document.getElementById('maxQuantity').value, 10) || 2;

  if (document.getElementById('orderMethodSwitch').checked) {
    guassianOrderGenerator.setNumberOfUniqueItemsRange(minUnique, maxUnique);
    guassianOrderGenerator.setItemQuantityRange(minQuantity, maxQuantity);
  } else {
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
  
  // Clear the table body
  tableBody.innerHTML = '';
  
  // Retrieve the current products from the simulator's generator.
  const currentProducts = simulator.getGenerator().getProducts();
  
  currentProducts.forEach(product => {
    // Create the main row
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 cursor-pointer';
    
    const estimator = simulator.weightEstimator;
    const estimatedWeight = estimator.inferItemWeight(new Item(product.id));
    const observations = estimator.getObservationCount(product.id);
    const status = estimator.getConfidenceStatus(product.id);
    const statusClasses = {
      HIGH: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LEARNING: 'bg-red-100 text-red-800'
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
    
    // Create the expandable row (hidden by default)
    const expRow = document.createElement('tr');
    expRow.className = 'hidden';
    const expCell = document.createElement('td');
    expCell.colSpan = 5;
    // Each expansion contains a canvas with a unique id
    expCell.innerHTML = `
      <div class="p-4">
        <canvas id="chart_${product.id}" class="w-full h-48 bg-gray-100 rounded"></canvas>
      </div>
    `;
    expRow.appendChild(expCell);
    tableBody.appendChild(expRow);
    
    // Toggle expansion on click of the main row.
    row.addEventListener('click', () => {
      if (expRow.classList.contains('hidden')) {
        expRow.classList.remove('hidden');
        // Create the product chart.
        // Here we assume:
        //   mean = product.meanWeight,
        //   variance = 25,
        //   actual value = product.meanWeight + 5.
        createProductChart(`chart_${product.id}`, product.meanWeight, 25, product.meanWeight + 5);
      } else {
        expRow.classList.add('hidden');
      }
    });
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
    const order = simulator.generateIncompleteOrder();
    const trueWeight = order.items.reduce((total, item) => {
      if (!item.missing) {
        return total + item.totalWeight;
      } else {
        return total + (item.totalWeight - (item.totalWeight / item.quantity));
      }
    }, 0);

    // simulator.processOrder(order, trueWeight);
    const measurement = simulator.classifyOrder(order, trueWeight);
    console.log(measurement);
    updateProbabilityVisualization(measurement.inferredWeight, measurement.variance, measurement.trueWeight, measurement.probComplete, measurement.probMissing, measurement.missingItems);
    updateCurrentOrder(order);
    updateProductTable();
    updateStatistics(order, trueWeight);
    return;
  }

  showModal();
  try {
    for (let i = 0; i < batchSize; i++) {
      updateProgress(i + 1, batchSize);
      const order = simulator.generateCompleteOrders(1)[0];
      const trueWeight = order.items.reduce((total, item) => total + item.totalWeight, 0);
      order.trueWeight = trueWeight;
      simulator.processOrder(order, trueWeight);
      const measurement = simulator.classifyOrder(order, trueWeight);
      console.log(measurement);
      updateProbabilityVisualization(measurement.inferredWeight, measurement.variance, measurement.trueWeight, measurement.probComplete, measurement.probMissing, measurement.missingItems);
      updateCurrentOrder(order);
      updateProductTable();
      updateStatistics(order, trueWeight);
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
  } 1

  // Initial simulator creation (default product line = Taco Bell)
  initializeSimulator();

  // Populate the Estimator dropdown
  estimatorSelect.innerHTML = `
    <option value="ema">${emaEstimator.getName()}</option>
    <option value="kalman">${kalmanEstimator.getName()}</option>
    <option value="bayesianLRE">${bayesianLREstimator.getName()}</option>
  `;

  // ====================
  // Event Listeners
  // ====================
  estimatorSelect.addEventListener('change', (e) => {
    currentEstimator = e.target.value;
    initializeSimulator();
  });

  generateCompleteBtn.addEventListener('click', () => {
    updateOrderGeneratorSettings();
    const batchSize = parseInt(batchSizeInput.value, 10) || 1;
    generateOrders(batchSize, false);
  });

  generateIncompleteBtn.addEventListener('click', () => {
    generateOrders(1, true);
  });

  const thresholdSlider = document.getElementById('verificationThreshold');
  const thresholdValue = document.getElementById('thresholdValue');
  thresholdSlider.addEventListener('input', (e) => {
    verificationThreshold = parseFloat(e.target.value);
    thresholdValue.textContent = verificationThreshold.toFixed(1);
  });

  document.getElementById('orderMethodSwitch').addEventListener('change', function () {
    const methodLabel = document.getElementById('methodLabel');
    methodLabel.textContent = this.checked ? 'GAUSSIAN' : 'DEFAULT';
    console.log(`Order generation method changed to ${this.checked ? 'GAUSSIAN' : 'DEFAULT'}`);
    initializeSimulator();
  });

  document.getElementById('minUniqueItems').addEventListener('change', updateOrderGeneratorSettings);
  document.getElementById('maxUniqueItems').addEventListener('change', updateOrderGeneratorSettings);
  document.getElementById('minQuantity').addEventListener('change', updateOrderGeneratorSettings);
  document.getElementById('maxQuantity').addEventListener('change', updateOrderGeneratorSettings);

  // Product Line Switch: When changed, re-initialize simulator with the new product generator
  const productLineSelect = document.getElementById('productLineSelect');
  productLineSelect.addEventListener('change', function () {
    console.log(`Switched product line to ${this.value === 'kfc' ? 'KFC' : 'Taco Bell'}`);
    initializeSimulator();
  });

  // updateProbabilityVisualization(150, 25, 160);
});

function updateProbabilityVisualization(mean, variance, actualValue, probabilityComplete, probabilityMissing, productMissingData) {
  // Calculate sigma and set up x range for the distribution curve.
  const sigma = Math.sqrt(variance);
  const xMin = mean - 4 * sigma;
  const xMax = mean + 4 * sigma;
  const numPoints = 100;
  const step = (xMax - xMin) / numPoints;
  const dataPoints = [];
  let maxY = 0;


  // Generate data points for the normal distribution.
  for (let x = xMin; x <= xMax; x += step) {
    const y = (1 / (Math.sqrt(2 * Math.PI * variance))) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    console.log(x, y);
    if (isNaN(x) || isNaN(y)) {
      return;
    }

    dataPoints.push({ x, y });
    if (y > maxY) {
      maxY = y;
    }
  }

  // Data for the vertical line representing the actual (measured) value.
  const verticalLineData = [
    { x: actualValue, y: 0 },
    { x: actualValue, y: maxY }
  ];

  // Create the chart.
  const ctx = document.getElementById('probabilityChart').getContext('2d');
  // Destroy any existing chart on this canvas.
  if (ctx.chart) {
    ctx.chart.destroy();
  }
  ctx.chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Normal Distribution',
          data: dataPoints,
          borderColor: 'green',
          backgroundColor: 'rgba(128,128,128,0.3)', // grey fill
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Measured Value',
          data: verticalLineData,
          borderColor: 'red',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          showLine: true
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Weight'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Probability Density'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });

  function createProductChart(canvasId, mean, variance, actualValue) {
  const sigma = Math.sqrt(variance);
  const xMin = mean - 4 * sigma;
  const xMax = mean + 4 * sigma;
  const numPoints = 100;
  const step = (xMax - xMin) / numPoints;
  const dataPoints = [];
  let maxY = 0;
  
  // Compute the data points for the normal distribution.
  for (let x = xMin; x <= xMax; x += step) {
    const y = (1 / (Math.sqrt(2 * Math.PI * variance))) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    dataPoints.push({ x, y });
    if (y > maxY) maxY = y;
  }
  
  // Create a vertical line dataset for the actual value.
  const verticalLineData = [
    { x: actualValue, y: 0 },
    { x: actualValue, y: maxY }
  ];
  
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // If a chart already exists on this canvas, destroy it.
  if (ctx.chart) {
    ctx.chart.destroy();
  }
  
  ctx.chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Normal Distribution',
          data: dataPoints,
          borderColor: 'green',
          backgroundColor: 'rgba(128,128,128,0.3)', // Grey fill
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Actual Value',
          data: verticalLineData,
          borderColor: 'red',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          showLine: true
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Weight'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Probability Density'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

  // Update the Probability Complete and Probability Missing spans.
  document.getElementById('probabilityComplete').textContent = probabilityComplete.toFixed(4);
  document.getElementById('probabilityMissing').textContent = probabilityMissing.toFixed(4);

  // Update the table for product missing probabilities.
  const tbody = document.getElementById('probabilityTableBody');
  tbody.innerHTML = ''; // Clear existing rows
  productMissingData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-2 text-xs text-gray-500">${item.productId}</td>
      <td class="px-4 py-2 text-xs text-gray-500">${item.probability.toFixed(4)}</td>
    `;
    tbody.appendChild(tr);
  });
}