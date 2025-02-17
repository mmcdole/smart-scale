// Evaluator functions
function evaluateConvergence(estimator, orders, products, errorThreshold = 5) {
    // Reset estimator state
    estimator.reset();
    
    const convergenceOrders = {};
    products.forEach(product => {
        convergenceOrders[product.id] = null;
    });

    let ordersProcessed = 0;

    for (const order of orders) {
        const measuredWeight = order.items.reduce((sum, item) => sum + item.totalWeight, 0);
        estimator.updateEstimates(order, measuredWeight);
        ordersProcessed++;

        // Check convergence for each product
        products.forEach(product => {
            if (convergenceOrders[product.id] !== null) return;

            const estimatedWeight = estimator.inferItemWeight({ productId: product.id });
            if (estimatedWeight !== undefined) {
                const error = Math.abs(estimatedWeight - product.meanWeight);
                if (error < errorThreshold) {
                    convergenceOrders[product.id] = ordersProcessed;
                }
            }
        });

        // Stop if all products have converged
        if (products.every(p => convergenceOrders[p.id] !== null)) break;
    }

    // Calculate convergence score
    const convergedProducts = Object.values(convergenceOrders).filter(v => v !== null).length;
    const avgConvergenceOrder = convergedProducts > 0 
        ? Object.values(convergenceOrders).filter(v => v !== null).reduce((sum, v) => sum + v, 0) / convergedProducts 
        : Infinity;

    return {
        estimatorName: estimator.getName(),
        convergenceScore: avgConvergenceOrder,
        ordersProcessed,
        convergedProducts,
        convergenceOrders
    };
}

// Run evaluations against all estimators
async function runAllEvaluations() {
    const orders = await fetch('orders.json').then(r => r.json());
    
    // Get products from main.js
    const products = window.products;
    if (!products) {
        throw new Error('Products not found. Make sure main.js is loaded first.');
    }
    
    // Initialize estimators
    const estimators = [
        new EMAEstimator(),
        new KalmanEstimator(),
        new BayesianLREstimator()
    ];

    // Run evaluations
    const results = estimators.map(estimator => evaluateConvergence(estimator, orders, products));
    
    // Save results
    localStorage.setItem('evalResults', JSON.stringify(results));
    
    return results;
}

// Export functions for use in index2.html
window.runAllEvaluations = runAllEvaluations;
