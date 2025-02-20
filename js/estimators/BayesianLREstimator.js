// Make sure math.js is loaded in your environment

//---------------------------------------------------------------------
// Helper class that maintains the current Bayesian linear regression model.
// It tracks the ordered product IDs, the posterior mean vector (betaMean)
// and covariance matrix (betaCov) as math.js matrices.
class BayesianLRModel {
    constructor(measurementNoise, defaultPriorMean, defaultPriorVariance) {
        this.productIds = []; // Array of product IDs (strings or numbers)
        this.betaMean = null; // math.matrix: posterior mean vector (shape: [n, 1])
        this.betaCov = null;  // math.matrix: posterior covariance (shape: [n, n])
        this.measurementNoise = measurementNoise;
        this.defaultPriorMean = defaultPriorMean;
        this.defaultPriorVariance = defaultPriorVariance;
    }

    // Adds a product to the model if it isn't already present.
    addProduct(productId) {
        if (!this.productIds.includes(productId)) {
            this.productIds.push(productId);
            const newDim = this.productIds.length;
            if (newDim === 1) {
                // First product: initialize betaMean as a 1x1 matrix and betaCov likewise.
                this.betaMean = math.matrix([[this.defaultPriorMean]]);
                this.betaCov = math.matrix([[this.defaultPriorVariance]]);
            } else {
                const oldDim = newDim - 1;
                // Expand betaMean: convert to array, append a new row, then back to a matrix.
                const oldMeanArr = this.betaMean.toArray();
                oldMeanArr.push([this.defaultPriorMean]);
                this.betaMean = math.matrix(oldMeanArr); // New dimension is newDim x 1.

                // Expand betaCov: create a new matrix of size newDim x newDim.
                // Force math.js to return a matrix by wrapping math.zeros with math.matrix().
                let newBetaCov = math.matrix(math.zeros([newDim, newDim]));
                // Copy over the old covariance values.
                for (let i = 0; i < oldDim; i++) {
                    for (let j = 0; j < oldDim; j++) {
                        newBetaCov.subset(math.index(i, j), this.betaCov.subset(math.index(i, j)));
                    }
                }
                // Set the new product's variance on the diagonal.
                newBetaCov.subset(math.index(newDim - 1, newDim - 1), this.defaultPriorVariance);
                this.betaCov = newBetaCov;
            }
        }
    }

    //
    // Returns the 95% credible interval for a product's weight estimate.
    getCredibleInterval(productId) {
        const idx = this.productIds.indexOf(productId);
        if (idx < 0) {
            return null;
        }
        const mean = this.betaMean.subset(math.index(idx, 0));
        const variance = this.betaCov.subset(math.index(idx, idx));
        const std = Math.sqrt(variance);
        const low = mean - 1.96 * std;
        const high = mean + 1.96 * std;
        return { low, high };
    }

    // Returns the variance-based confidence factor (ignoring sample count).
    getVarianceConfidence(productId, scalingFactor = this.defaultPriorVariance) {
        const idx = this.productIds.indexOf(productId);
        if (idx >= 0) {
            const variance = this.betaCov.subset(math.index(idx, idx));
            // When variance is 0, this returns 1; if variance equals scalingFactor, returns 1/2.
            return 1 / (1 + (variance / scalingFactor));
        } else {
            return 0;
        }
    }
}

//---------------------------------------------------------------------
// BayesianLREstimator class. It extends WeightEstimator (assumed to exist)
// and uses an internal BayesianLRModel instance to track product weights.
// It also keeps track of the number of observations per product.
class BayesianLREstimator extends WeightEstimator {
    constructor(alpha = 0.2) {
        super();
        this.alpha = alpha;
        // Create our internal Bayesian model.
        // (Measurement noise: 100, default prior mean: 200, default prior variance: 10000)
        // Noise value of 100:
        // This implies that we assume the measurement error has a variance of 100. In layman’s terms, 
        // that’s like saying the measurement error has a standard deviation of about 10 grams.
//         this.model = new BayesianLRModel(400, 200, 1000);
//         95% credible interval for product chicken_burrito: [205.60, 208.61]
// BayesianLREstimator.js:266 Product cinnamon_twists: estimated weight = 49.68 g, variance = 0.63, confidence = 0.96, seen 236 times
// BayesianLREstimator.js:270 95% credible interval for product cinnamon_twists: [48.12, 51.23]
// BayesianLREstimator.js:266 Product seven_layer_burrito: estimated weight = 290.00 g, variance = 0.57, confidence = 0.96, seen 247 times
// BayesianLREstimator.js:270 95% credible interval for product seven_layer_burrito: [288.52, 291.48]
// BayesianLREstimator.js:266 Product nachos_bellgrande: estimated weight = 465.10 g, variance = 0.57, confidence = 0.96, seen 261 times
// BayesianLREstimator.js:270 95% credible interval for product nachos_bellgrande: [463.62, 466.58]


        // this.model = new BayesianLRModel(625, 400, 2500);
        // Product triple_layer_nachos: estimated weight = 195.16 g, variance = 0.88, confidence = 0.96, seen 248 times
        // BayesianLREstimator.js:279 95% credible interval for product triple_layer_nachos: [193.32, 196.99]
        // BayesianLREstimator.js:275 Product cheesy_roll_up: estimated weight = 85.78 g, variance = 0.76, confidence = 0.96, seen 277 times
        // BayesianLREstimator.js:279 95% credible interval for product cheesy_roll_up: [84.07, 87.50]
        // BayesianLREstimator.js:275 Product chicken_burrito: estimated weight = 210.03 g, variance = 0.90, confidence = 0.96, seen 253 times
        // BayesianLREstimator.js:279 95% credible interval for product chicken_burrito: [208.17, 211.88]
        // BayesianLREstimator.js:275 Product cinnamon_twists: estimated weight = 50.54 g, variance = 0.80, confidence = 0.96, seen 270 times
        // BayesianLREstimator.js:279 95% credible interval for product cinnamon_twists: [48.79, 52.29]

        // GOOD
        // GOOD
        //         // this.model = new BayesianLRModel(500, 250, 1200);



        //  Good at 2000
        this.model = new BayesianLRModel(1200, 250, 200);

        // this.model = new BayesianLRModel(1500, 250, 200);
        // noise collapses not sure about other value


        // Map to track how many times we've seen each productId.
        this.observations = new Map();
    }

    getName() {
        return `BayesianLREstimator (α=${this.alpha})`;
    }

    // Given an order, infer its total weight using our current estimates.
    inferOrderWeight(order) {
        return order.items.reduce((total, item) => {
            return total + (this.inferItemWeight(item) * item.quantity);
        }, 0);
    }

    // Given a single order item, return the estimated weight.
    inferItemWeight(item) {
        const idx = this.model.productIds.indexOf(item.productId);
        if (idx >= 0) {
            return this.model.betaMean.subset(math.index(idx, 0));
        } else {
            return 0;
        }
    }

    // incorporates both variance and sample count.
    getProductConfidence(productId, k = 10, scalingFactor = this.model.defaultPriorVariance) {
        const idx = this.model.productIds.indexOf(productId);
        if (idx < 0) return 0;
        // Get the variance-based confidence from the model.
        const varianceConf = this.model.getVarianceConfidence(productId, scalingFactor);
        // Get the observation count for this product.
        const n = this.observations.get(productId) || 0;
        // Sample factor: 0 when n is 0, and approaching 1 as n increases.
        const sampleFactor = n / (n + k);
        // The overall confidence is the product of these two factors.
        return sampleFactor * varianceConf;
    }

    // Creates a sample object from the order and measured total weight.
    createSample(order, measuredWeight) {
        return {
            products: order.items.map(item => ({
                id: item.productId,
                quantity: item.quantity
            })),
            actualWeight: measuredWeight
        };
    }

    // Main update entry point: create a sample, update the model, and classify the cart.
    updateEstimates(order, measuredWeight) {
        const sample = this.createSample(order, measuredWeight);
        console.info(order)
        console.log("itemTotal_weight: " + order.items.reduce((sum, item) => sum + item.totalWeight, 0))
        const itemWeightEst = order.items.reduce((total, item) => {
            if (!item.missing) {
                return total + item.totalWeight;
            } else {
                // one item missing
                return total + (item.totalWeight - (item.totalWeight / item.quantity));
            }
        }, 0);
        console.log("itemTotal_weight (removed): " + itemWeightEst)
        console.log("measured_weight:" + measuredWeight)
        if (order.hasRemovedItem()) {
            console.log("************************************************************************")
            console.log("************************************************************************")
            console.log("This order has a MISSING ITEM!!!!!!")
            order.items.forEach(item => {
                if (item.missing) {
                    console.log("Missing item: " + item.productId);
                }
            });

        }
        this.updateModel(sample);
        // this.classifyCart(sample);
    }

    classifyOrder(order, trueWeight) {
        return this.classifyCart(this.createSample(order, trueWeight));
        console.log("----------------------------------------------")
    }

    // Returns how many times we've seen a given product.
    getObservationCount(productId) {
        return this.observations.get(productId) || 0;
    }

    // Return a confidence status based on the product's confidence score.
    // JS Note: This is calculated from a hueristic, it doesn't have a strict stastical interpretation
    getConfidenceStatus(productId) {
        const conf = this.getProductConfidence(productId);
        if (conf > 0.8) return 'HIGH';
        if (conf > 0.5) return 'MEDIUM';
        return 'LEARNING';
    }

    _itemStatus(item) {
        return this.getConfidenceStatus(item.productId);
    }

    /**
     * normalPDF(x, mean, variance)
     * Returns the probability density of x under a Gaussian with the given mean and variance.
     */
    normalPDF(x, mean, variance) {
        const std = Math.sqrt(variance);
        return (1 / (Math.sqrt(2 * Math.PI) * std)) *
            Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
    }

    /**
     * updateModel(sample)
     *
     * For each product in the sample, if we haven't seen its ID before,
     * add it to the model. Then, update the observation counts.
     * Next, construct the design vector x and update the joint posterior over product weights
     * using the conjugate Bayesian linear regression update:
     *
     *    newCov = inv( inv(oldCov) + (x * xᵀ) / σ_y² )
     *    newMean = newCov * ( inv(oldCov) * oldMean + (x * y) / σ_y² )
     *
     * where y is the observed cart weight.
     */
    updateModel(sample) {
        // --- Step 1: Expand our model for any new product IDs ---
        sample.products.forEach(prod => {
            this.model.addProduct(prod.id);
        });
        // --- Step 1.1: Update observation counts for each product in the sample ---
        sample.products.forEach(prod => {
            const currentCount = this.observations.get(prod.id) || 0;
            // Increment count by the quantity observed in this sample.
            this.observations.set(prod.id, currentCount + prod.quantity);
        });

        const d = this.model.productIds.length;

        // --- Step 2: Construct the design vector x (as a column vector of shape [d, 1]) ---
        let x = math.matrix(math.zeros([d, 1])); // Create a d x 1 math.js matrix.
        sample.products.forEach(prod => {
            const idx = this.model.productIds.indexOf(prod.id);
            if (idx >= 0) {
                x.subset(math.index(idx, 0), prod.quantity);
            }
        });
        const y = sample.actualWeight;

        // --- Step 3: Perform the Bayesian update ---
        const oldMean = math.reshape(this.model.betaMean, [d, 1]); // d x 1 matrix.
        const oldCov = this.model.betaCov; // d x d matrix.

        const xRow = math.transpose(x); // 1 x d matrix.
        const outer = math.multiply(x, xRow); // d x d matrix.

        const invOldCov = math.inv(oldCov);
        const addMat = math.divide(outer, this.model.measurementNoise);
        const newPrecision = math.add(invOldCov, addMat);
        const newCov = math.inv(newPrecision);

        const term1 = math.multiply(invOldCov, oldMean);
        const term2 = math.multiply(x, y / this.model.measurementNoise);
        const newMean = math.multiply(newCov, math.add(term1, term2));

        // Update the model with the new posterior.
        this.model.betaMean = newMean; // math.matrix of shape [d, 1]
        this.model.betaCov = newCov;    // math.matrix of shape [d, d]

        // --- Debug/Logging: Print updated estimates, confidence, and observation counts ---
        console.log("=== Updated Model ===");
        for (let i = 0; i < d; i++) {
            const prodId = this.model.productIds[i];
            const meanVal = this.model.betaMean.subset(math.index(i, 0));
            const varVal = this.model.betaCov.subset(math.index(i, i));
            const confidence = this.getProductConfidence(prodId);
            const obsCount = this.getObservationCount(prodId);
            console.log(
                `Product ${prodId}: estimated weight = ${meanVal.toFixed(2)} g, variance = ${varVal.toFixed(2)}, confidence = ${confidence.toFixed(2)}, seen ${obsCount} times`
            );
            const interval = this.model.getCredibleInterval(prodId);
            console.log(`95% credible interval for product ${prodId}: [${interval.low.toFixed(2)}, ${interval.high.toFixed(2)}]`);
        }
    }

    classifyCart(sample) {
        const d = this.model.productIds.length;
        // Build design vector x_complete as a column vector [d,1].
        let x_complete = math.matrix(math.zeros([d, 1]));
        sample.products.forEach(prod => {
            const idx = this.model.productIds.indexOf(prod.id);
            if (idx >= 0) {
                x_complete.subset(math.index(idx, 0), prod.quantity);
            }
        });
        // Compute predicted total weight under H0 (complete cart).
        const predictedMat = math.multiply(math.transpose(x_complete), this.model.betaMean);
        const predicted = predictedMat.subset(math.index(0, 0));

        // Compute predictive variance: xᵀ * betaCov * x + measurementNoise.
        const varPredictMat = math.multiply(
            math.multiply(math.transpose(x_complete), this.model.betaCov),
            x_complete
        );
        const varPredict = varPredictMat.subset(math.index(0, 0)) + this.model.measurementNoise;
        console.log("Predictive Variance:", varPredict.toFixed(2));
        // Likelihood for H0 (complete cart).
        const likelihood_H0 = this.normalPDF(sample.actualWeight, predicted, varPredict);
        console.log(`Likelihood for complete cart (H0): ${likelihood_H0.toExponential(4)}`);

        // For each product in the sample, compute the likelihood if that product were missing.
        let likelihoodsMissing = {};       // productId -> likelihood.
        let predictedMissingWeights = {};  // productId -> predicted weight if that product is missing.
        sample.products.forEach(prod => {
            let x_missing = math.clone(x_complete);
            const idx = this.model.productIds.indexOf(prod.id);
            if (idx >= 0) {
                // Adjust quantity: if quantity > 1, simulate missing one unit; else, simulate missing all.
                const currentQty = prod.quantity;
                const newQty = currentQty > 1 ? currentQty - 1 : 0;
                x_missing.subset(math.index(idx, 0), newQty);
                const predictedMissingMat = math.multiply(math.transpose(x_missing), this.model.betaMean);
                const predictedMissing = predictedMissingMat.subset(math.index(0, 0));
                predictedMissingWeights[prod.id] = predictedMissing;
                const varMissingMat = math.multiply(
                    math.multiply(math.transpose(x_missing), this.model.betaCov),
                    x_missing
                );
                const varMissing = varMissingMat.subset(math.index(0, 0)) + this.model.measurementNoise;
                const likelihoodMissing = this.normalPDF(sample.actualWeight, predictedMissing, varMissing);
                likelihoodsMissing[prod.id] = likelihoodMissing;
                // Log details for each product.
                console.log(`Product ${prod.id} (missing simulation):`);
                console.log(`   Quantity: ${currentQty} -> simulated: ${newQty}`);
                console.log(`   Predicted missing weight: ${predictedMissing.toFixed(2)} g`);
                console.log(`   Variance if missing: ${varMissing.toFixed(2)}`);
                console.log(`   Likelihood if missing: ${likelihoodMissing.toExponential(4)}`);
            }
        });

        // Combine likelihoods with simple priors.
        const prior_H0 = 0.9;
        const n = sample.products.length;
        const prior_missing = 0.1 / n;
        const weight_H0 = likelihood_H0 * prior_H0;
        let totalMissingWeight = 0;
        for (const id in likelihoodsMissing) {
            totalMissingWeight += likelihoodsMissing[id] * prior_missing;
        }
        const totalWeight = weight_H0 + totalMissingWeight;
        const post_H0 = weight_H0 / totalWeight;

        // Log overall classification.
        console.log("=== Classification ===");
        console.log(`Expected complete weight: ${predicted.toFixed(2)} g`);
        console.log(`Observed weight: ${sample.actualWeight.toFixed(2)} g`);
        console.log(`Probability cart is complete (H0): ${post_H0.toFixed(4)}`);
        console.log(`Probability cart is missing at least one item: ${(1 - post_H0).toFixed(4)}`);

        // Compute individual missing probabilities.
        let missingPosteriors = {};
        for (const id in likelihoodsMissing) {
            missingPosteriors[id] = (likelihoodsMissing[id] * prior_missing) / totalWeight;
        }

        // Set a threshold: if the probability that something is missing is below 5%, report the cart as complete.
        const missingThreshold = 0.05;
        let missingArray = [];
        if ((1 - post_H0) < missingThreshold) {
            console.log("Cart is most likely complete.");
        } else {
            // Build an array of missing product information.
            missingArray = [];
            for (const id in missingPosteriors) {
                missingArray.push({
                    productId: id,
                    probability: missingPosteriors[id],
                    predictedMissingWeight: predictedMissingWeights[id]
                });
            }
            // Sort descending by probability.
            missingArray.sort((a, b) => b.probability - a.probability);

            // Log the most likely missing product (top 1).
            if (missingArray.length > 0) {
                console.log(`Most likely missing product: ${missingArray[0].productId}`);
                console.log(`Expected weight if ${missingArray[0].productId} were missing: ${missingArray[0].predictedMissingWeight.toFixed(2)} g`);
            }
            // Also print the top 3 (or fewer) missing products.
            console.log("Top likely missing products:");
            const topN = missingArray.slice(0, 3);
            topN.forEach(item => {
                console.log(`Product ${item.productId}: probability missing = ${item.probability.toFixed(4)}, expected weight if missing = ${item.predictedMissingWeight.toFixed(2)} g`);
            });
        }

        return new OrderMeasurement(sample.actualWeight, predicted, varPredict,post_H0, (1 - post_H0), missingArray.slice(0, 3));
    }
}
