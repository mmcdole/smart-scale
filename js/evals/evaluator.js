// Evaluator functions

async function evaluateEstimator(estimatorName, products) {
    // Create a new instance of the specified estimator
    let estimator;
    switch (estimatorName) {
        case 'EMAEstimator':
            estimator = new EMAEstimator();
            break;
        case 'KalmanEstimator':
            estimator = new KalmanEstimator();
            break;
        case 'BayesianLREstimator':
            estimator = new BayesianLREstimator();
            break;
        default:
            throw new Error(`Unknown estimator: ${estimatorName}`);
    }

    // Get evaluation orders
    if (!window.evalOrders) {
        throw new Error('Evaluation orders not found. Make sure eval-orders.js is loaded.');
    }

    // Run convergence evaluation if available
    if (window.convergenceEvaluator) {
        const convergenceResult = await window.convergenceEvaluator.evaluate(
            estimator, 
            window.evalOrders, 
            products
        );
        // Return just the convergence result for backwards compatibility
        return convergenceResult;
    }

    throw new Error('No evaluators available');
}
