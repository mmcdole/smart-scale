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
        this.model = new BayesianLRModel(100, 200, 10000);
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
        this.updateModel(sample);
        this.classifyCart(sample);
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

    /**
     * classifyCart(sample)
     *
     * Given a new cart sample (with expected products/quantities and observed weight),
     * compute the predictive distribution under the complete-cart hypothesis (H0)
     * and under alternative hypotheses (each missing one product). Then, combine
     * likelihoods with simple priors to compute posterior probabilities.
     */
    classifyCart(sample) {
        const d = this.model.productIds.length;
        // Build design vector x_complete as a column vector [d, 1].
        let x_complete = math.matrix(math.zeros([d, 1]));
        sample.products.forEach(prod => {
            const idx = this.model.productIds.indexOf(prod.id);
            if (idx >= 0) {
                x_complete.subset(math.index(idx, 0), prod.quantity);
            }
        });
        // Compute predicted total weight under H0:
        const predictedMat = math.multiply(math.transpose(x_complete), this.model.betaMean);
        const predicted = predictedMat.subset(math.index(0, 0));

        // Compute predictive variance: xᵀ * betaCov * x + measurementNoise.
        const varPredictMat = math.multiply(
            math.multiply(math.transpose(x_complete), this.model.betaCov),
            x_complete
        );
        const varPredict = varPredictMat.subset(math.index(0, 0)) + this.model.measurementNoise;

        // Likelihood for H0 (complete cart).
        const likelihood_H0 = this.normalPDF(sample.actualWeight, predicted, varPredict);

        // For each product in the sample, compute the likelihood if that product were missing.
        let likelihoodsMissing = {}; // productId -> likelihood.
        sample.products.forEach(prod => {
            let x_missing = math.clone(x_complete);
            const idx = this.model.productIds.indexOf(prod.id);
            if (idx >= 0) {
                x_missing.subset(math.index(idx, 0), 0); // simulate missing product.
                const predictedMissingMat = math.multiply(math.transpose(x_missing), this.model.betaMean);
                const predictedMissing = predictedMissingMat.subset(math.index(0, 0));
                const varMissingMat = math.multiply(
                    math.multiply(math.transpose(x_missing), this.model.betaCov),
                    x_missing
                );
                const varMissing = varMissingMat.subset(math.index(0, 0)) + this.model.measurementNoise;
                likelihoodsMissing[prod.id] = this.normalPDF(sample.actualWeight, predictedMissing, varMissing);
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

        console.log("=== Classification ===");
        console.log(`Predicted complete weight: ${predicted.toFixed(2)} g`);
        console.log(`Observed weight: ${sample.actualWeight.toFixed(2)} g`);
        // console.log(`Probability cart is complete (H0): ${post_H0.toFixed(4)}`);
        // console.log(`Probability cart is missing at least one item: ${(1 - post_H0).toFixed(4)}`);

        // JS TODO: // this isn't working correctly

        // Determine most likely missing product.
        let missingPosteriors = {};
        for (const id in likelihoodsMissing) {
            missingPosteriors[id] = (likelihoodsMissing[id] * prior_missing) / totalWeight;
        }
        let mostLikelyMissing = null;
        let maxProb = 0;
        for (const id in missingPosteriors) {
            if (missingPosteriors[id] > maxProb) {
                maxProb = missingPosteriors[id];
                mostLikelyMissing = id;
            }
        }
        if (mostLikelyMissing) {
            console.log(`Most likely missing product: ${mostLikelyMissing}`);
        } else {
            console.log("Cart is most likely complete.");
        }
    }
}
