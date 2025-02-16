/**
 * This is an interface for weight estimators.
 * 
 * Concrete implementations should implement:
 *  - inferItemWeight(items): returns an object with properties { weight, variance }
 *  - update(newWeight): updates the estimator based on a new measurement.
 * 
 * Additionally, concrete classes should maintain an `estimatedWeight` property.
 * 
 * NOTE: JavaScript does not have a built-in interface construct,
 * so here we create a base class that throws errors if the concrete
 * methods are not implemented.
 */
export default class WeightEstimator {
    constructor(productName) {
        if (new.target === WeightEstimator) {
            throw new TypeError("Cannot construct WeightEstimator instances directly");
        }
        this.productName = productName;
        // Default initialization for estimatedWeight. Concrete implementations can update this.
        this.estimatedWeight = 0;
    }

    /**
     * Given an array of order items for this product, infer the total weight and associated variance.
     * @param {Array} items - Array of order items
     * @returns {Object} An object with properties: { weight: number, variance: number }
     */
    inferItemWeight(items) {
        throw new Error("inferItemWeight must be implemented by subclass");
    }

    /**
     * Update the internal estimate with a new measured weight.
     * @param {number} newWeight - The newly measured weight for this product
     */
    update(newWeight) {
        throw new Error("update must be implemented by subclass");
    }

    get notes() {
        return "";  // Default empty notes, implementations can override
    }

    get uncertainty() {
        throw new Error('uncertainty must be implemented');
    }

    calculateConfidenceLevel() {
        throw new Error('calculateConfidenceLevel() must be implemented');
    }
} 