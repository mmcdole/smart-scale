const fs = require('fs');

/**
 * Loads orders from a JSON file.
 * @param {string} filePath - Path to the orders JSON file.
 * @returns {Array} Array of orders.
 */
function loadOrdersFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading orders file:", err);
    return [];
  }
}

/**
 * Evaluates multiple estimators and returns their convergence metrics
 * @param {Array} estimators - Array of estimator instances
 * @param {Array} orders - Array of pre-generated orders
 * @param {Array} products - Array of product definitions
 * @param {Object} options - Evaluation options
 * @returns {Array} Array of evaluation results for each estimator
 */
function evaluateEstimators(estimators, orders, products, options = {}) {
  const results = [];
  
  for (const estimator of estimators) {
    const result = evaluateEstimatorConvergence(estimator, orders, products, options);
    results.push(result);
  }
  
  return results;
}

/**
 * Evaluates a single estimator's convergence speed
 * @param {WeightEstimator} estimator - An estimator instance
 * @param {Array} orders - Array of pre-generated orders
 * @param {Array} products - Array of product definitions
 * @param {Object} options - Optional parameters
 * @returns {Object} Evaluation metrics for the estimator
 */
function evaluateEstimatorConvergence(estimator, orders, products, options = {}) {
  const errorThreshold = options.errorThreshold || 5;
  const convergenceOrders = {};
  products.forEach(product => {
    convergenceOrders[product.id] = null;
  });

  let ordersProcessed = 0;
  
  // Reset estimator state
  estimator.reset();

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const measuredWeight = order.items.reduce((sum, item) => sum + item.totalWeight, 0);

    estimator.updateEstimates(order, measuredWeight);
    ordersProcessed++;

    products.forEach(product => {
      if (convergenceOrders[product.id] !== null) return;

      const idx = estimator.model.productIds.indexOf(product.id);
      if (idx >= 0) {
        const estimatedWeight = estimator.inferItemWeight({ productId: product.id });
        const error = Math.abs(estimatedWeight - product.meanWeight);
        if (error < errorThreshold) {
          convergenceOrders[product.id] = ordersProcessed;
        }
      }
    });

    const allConverged = products.every(product => convergenceOrders[product.id] !== null);
    if (allConverged) break;
  }

  // Calculate convergence score (lower is better)
  const convergedProducts = products.filter(p => convergenceOrders[p.id] !== null).length;
  const avgConvergenceOrder = Object.values(convergenceOrders)
    .filter(v => v !== null)
    .reduce((sum, v) => sum + v, 0) / convergedProducts;

  return {
    estimatorName: estimator.getName(),
    ordersProcessed,
    convergenceOrders,
    convergedProducts,
    avgConvergenceOrder,
    score: avgConvergenceOrder // Lower score is better
  };
}

module.exports = {
  loadOrdersFromFile,
  evaluateEstimators,
  evaluateEstimatorConvergence
};
