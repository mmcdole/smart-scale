# QSR Smart Scale Simulator

## Overview
A simulation of a smart scale system for Quick Service Restaurants (QSR) that learns to estimate order weights over time using Welford's algorithm for online statistics. The system focuses on detecting potential missing items by comparing measured weights against expected weights using sigma-based thresholds. It continuously adapts its learning rates and leverages high-confidence items to refine estimates.

## Core Features

### Weight Learning System
- **Online Weight Estimation:**  
  Uses Welford's algorithm to update running statistics (mean and M2) for each product.
- **Adaptive Updates:**  
  Implements adaptive learning rates:
  - **High-confidence items** (≥ 5 observations with RSD < 10%) update slowly (e.g., 10% learning rate) to preserve stability.
  - **Low-confidence items** update at full rate (100%) to learn quickly.
  - **Single-item orders** update directly at full rate.
- **High-Confidence Anchors:**  
  In multi-item orders, items with high confidence serve as anchors. Remaining weight error is distributed among less-known items.
- **Measurement Variability:**  
  Tracks observation counts and rolling windows (e.g., last 10 measurements) to assess recent stability.
- **Observed Data Only:**  
  Uses only measurements from orders; hidden true ranges are used solely for simulation purposes.

### Order Processing
- **Order Generation:**  
  Randomly generates orders of 1–3 items.
- **Simulated Weights:**  
  For simulation, true weights are drawn from a Gaussian distribution within each product's true range.
- **Measurement Noise:**  
  Total order weight is measured with added Gaussian noise (σ = 2g).
- **Inference:**  
  The inferred total weight is computed as the sum of each product's estimated weight (or a default weight when no observations exist).

### Weight Difference Detection
- **Sigma-Based Analysis:**  
  Compares the measured total weight to the inferred total weight using the order's aggregated standard deviation:
  - **Verified (Green):** Difference ≤ 1σ.
  - **Warning (Yellow):** Difference > 1σ but ≤ 2σ.
  - **Flagged (Red):** Difference > 2σ.
- **Confidence Gating:**  
  If any item in the order is still in a lower confidence state (Learning or Medium), the system displays a warning state rather than triggering a full alert.

## Weight Inference Algorithm

1. **Per-Product Statistics**
   - **Estimated Weight (Mean):** Updated incrementally using each new measurement.
   - **M2:** Accumulates the squared differences to compute variance.
   - **Observation Count (n):** Tracks the number of measurements.
   - **Default Weight:** Used when no observations exist (e.g., 200g).

2. **Statistical Updates (Welford's Algorithm)**
   - **First Measurement:**  
     Set the initial estimated weight; M2 is 0.
   - **Subsequent Measurements:**  
     ```javascript
     const delta = newMeasurement - product.estimatedWeight;
     product.estimatedWeight += delta / product.n;
     const delta2 = newMeasurement - product.estimatedWeight;
     product.M2 += delta * delta2;
     product.n++;
     ```
   - **Variance Calculation:**  
     For n > 1, `variance = M2 / (n - 1)`.
   - **Standard Deviation (σ):**  
     `std = sqrt(variance)`.
   - **Relative Standard Deviation (RSD):**  
     `RSD = (std / estimatedWeight) * 100`.

3. **Measurement Stability Assessment**
   - **Learning Phase:**  
     Fewer than 5 observations.
   - **Medium Phase:**  
     5 or more observations with RSD ≥ 10%.
   - **High Phase:**  
     5 or more observations with RSD < 10%.
   - A rolling window (e.g., last 10 measurements) is used to gauge recent stability.

4. **Order Weight Analysis**
   - **Inferred Weight:**  
     The sum of each product's estimated weight (or default weight if unobserved).
   - **Order Standard Deviation:**  
     Computed as the square root of the sum of individual product variances (assuming independence).
   - **Sigma-Based Thresholds:**
     - Verified: Difference ≤ 1σ.
     - Warning: Difference > 1σ and ≤ 2σ.
     - Flagged: Difference > 2σ.
   - **Confidence Gating:**  
     Orders are flagged only when all items are in the High phase. If any items are still Learning or Medium, the order is marked as "Learning in Progress."

5. **Multi-Item Weight Learning**
   - **Learning Rate Strategy:**
     - **Single Items:** Direct learning at full rate (100%)
     - **Multiple Items:** Learning rate scales with uncertainty
       - Base rate decays exponentially with item count: 2^(n-1) × 0.5
       - Examples: 1 item → 1.0, 2 items → 0.5, 3 items → 0.25, etc.
       - Rationale: More items = more uncertainty in weight distribution
   - **Adaptive Adjustments:**
     - Learning rate scales with observation count: min(1.0, 5/observations)
     - High RSD (>15%) increases learning rate by 50% to allow faster correction
     - Combined scaling ensures:
       - New items learn quickly
       - Stable items maintain accuracy
       - Poor estimates can self-correct
   - **Single-Item Orders:** Direct learning at full rate
   - **Weight Distribution:**
     - Uses proportional distribution based on current estimates
     - Ratio = item_estimate / total_estimated_weight
     - Individual weight = measured_weight × ratio

## Requirements

1. **Display Requirements**
   - **Product Table:**  
     Show:
     - Product name.
     - Hidden true weight range (simulation only).
     - Estimated weight (g).
     - Observation count (n).
     - Variability (RSD %).
     - Status indicator:
       - **Learning:** n < 5.
       - **Medium:** n ≥ 5 and RSD ≥ 10%.
       - **High:** n ≥ 5 and RSD < 10%.
     - Use color coding for status (e.g., red for Learning, yellow for Medium, green for High).
     - Clearly mark missing items in red.
   
2. **Statistical Requirements**
   - Use Welford's algorithm for online statistics.
   - Require a minimum of 5 observations for high confidence.
   - Track per-product variance and handle edge cases (e.g., single samples).
   - Implement confidence gating based on observation count and RSD.

3. **Operational Requirements**
   - Allow configuration of default weights.
   - Incrementally build confidence as more data is gathered.
   - Properly handle incomplete orders.
   - Update estimates in real time.

4. **Performance Targets**
   - Achieve high confidence (n ≥ 5 and RSD < 10%) as early as possible.
   - Maintain low RSD (< 10%) for high confidence.
   - Degrade confidence if measurements become inconsistent.

## User Interface

### Current Order Display
- **Status:**  
  Display each item's name and its stability status (Learning, Medium, High).
- **Warning States:**  
  - **Green (Success):**  
    "Order weight within expected range" when measured weight difference is ≤ 1σ.
  - **Yellow (Warning):**  
    When weight difference is between 1σ and 2σ or when some items are still Learning/Medium.
  - **Red (Danger):**  
    When weight difference exceeds 2σ and all items are High confidence.
  
### Weight Analysis Panel
- Display measured and inferred weights.
- Visualize the weight difference with color coding based on sigma thresholds.
- Include a user-adjustable sigma multiplier slider (range: 1.0 to 3.0) for detection threshold adjustment.

### Product Database View
- List all products with:
  - True weight ranges (simulation only).
  - Estimated weights.
  - Observation counts.
  - RSD values.
  - Status indicators (Learning, Medium, High) with color coding.

### Controls
- **Batch Size Selection:**  
  For processing multiple orders simultaneously.
- **Sigma Multiplier Adjustment:**  
  Adjust the weight difference threshold.
- **Order Generation Options:**  
  Toggle between complete and incomplete orders.

## Simulation Parameters

### Measurement Noise
- Small random variation added to true weights.
- Uses Gaussian distribution with a standard deviation of 2g for measurement error.

### Order Generation
- Randomly selects 1–3 items per order.
- Option to generate incomplete orders by omitting one item.
- True weights are generated using a Gaussian distribution within each product's true range.

### Statistical Parameters
- Minimum observations for high confidence: 5.
- RSD threshold for high confidence: < 10%.
- Sigma thresholds for flagging:
  - Verified: ≤ 1σ.
  - Warning: > 1σ and ≤ 2σ.
  - Flagged: > 2σ.
- Default weight: 200g (used when no observations exist).

## Summary
This system uses online statistical methods to continuously refine product weight estimates, leveraging adaptive learning rates and high-confidence anchors to improve accuracy. Orders are evaluated using sigma-based thresholds, with confidence gating ensuring that only orders with fully calibrated items trigger alerts. The approach emphasizes single-item orders for direct calibration and uses proportional updates for multi-item orders to minimize error propagation.
