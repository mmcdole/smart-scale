class ConvergenceEvaluator {
    async evaluate(estimator, orders, products, options = {}) {
        const convergenceOrders = {};
        products.forEach(product => {
            convergenceOrders[product.id] = null;
        });

        const convergenceThreshold = options.errorThreshold || 0.05; // 5% error threshold
        let ordersProcessed = 0;
        
        // Reset estimator state if reset method exists
        if (typeof estimator.reset === 'function') {
            estimator.reset();
        }

        // Process each order
        for (const order of orders) {
            ordersProcessed++;
            
            // Process the order
            const measuredWeight = order.items.reduce((sum, item) => sum + item.totalWeight, 0);
            estimator.updateEstimates(order, measuredWeight);

            // Check convergence for each product
            products.forEach(product => {
                if (convergenceOrders[product.id] !== null) return;

                const estimatedWeight = estimator.inferItemWeight({ productId: product.id });
                const trueWeight = (product.trueRange[0] + product.trueRange[1]) / 2;
                const error = Math.abs(estimatedWeight - trueWeight) / trueWeight;

                if (error <= convergenceThreshold) {
                    convergenceOrders[product.id] = ordersProcessed;
                }
            });

            // Check if all products have converged
            if (Object.values(convergenceOrders).every(orders => orders !== null)) {
                break;
            }

            // Add a small delay every 100 orders to prevent browser freezing
            if (ordersProcessed % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
                console.log(`Processed ${ordersProcessed} orders...`);
            }
        }

        // Calculate convergence score
        const convergedProducts = Object.values(convergenceOrders).filter(orders => orders !== null).length;
        const avgConvergenceOrder = convergedProducts === 0 ? Infinity :
            Object.values(convergenceOrders)
                .filter(orders => orders !== null)
                .reduce((sum, orders) => sum + orders, 0) / convergedProducts;

        return {
            type: 'convergence',
            estimatorName: estimator.getName(),
            convergenceScore: avgConvergenceOrder,
            ordersProcessed,
            convergedProducts,
            convergenceOrders,
            maxOrdersReached: ordersProcessed >= orders.length
        };
    }
}

// Export for use in evaluator.js
window.convergenceEvaluator = new ConvergenceEvaluator();
