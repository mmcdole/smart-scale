import WeightEstimator from './WeightEstimator.js';

export default class BasicWeightEstimator extends WeightEstimator {
    constructor(productName) {
        super(productName);
        // Initialize with a default estimated weight; for example, you might start with an average value
        this.estimatedWeight = 0;
    }

    inferItemWeight(items) {
        // A simple implementation: 
        // For each present item, assume the weight as the current estimate (with zero variance)
        const weight = this.estimatedWeight * items.length;
        return { weight, variance: 0 };
    }

    update(newWeight) {
        // In this basic estimator, simply set the estimated weight as the new weight.
        // More complex logic (like smoothing) could be applied here.
        this.estimatedWeight = newWeight;
    }
} 