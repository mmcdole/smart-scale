# QSR Smart Scale Simulator

## Overview
A simulation of a smart scale system for Quick Service Restaurants (QSR) that uses a Kalman filter to learn and track product weights. The system detects potential missing items by comparing measured weights against inferred weights using sigma-based thresholds.

## Core Features

### Weight Learning System
- **Kalman Filter Implementation:**
  - Each product maintains its own Kalman filter state
  - State estimate (x): Current weight estimate
  - State uncertainty (P): Confidence in the estimate
  - Measurement noise (R = 4): Reflects 2g std dev in scale measurements
  - Process noise (Q = 16): Accounts for natural weight variation
- **Adaptive Updates:**
  - All updates use Kalman filter
  - Early updates naturally more aggressive due to high initial uncertainty
  - Later updates more conservative as uncertainty decreases
- **Confidence Levels:**
  - Learning: Fewer than 5 observations
  - Medium: Uncertainty (P) > 20
  - High: Uncertainty (P) ≤ 20

### Order Processing
- **Order Generation:**
  - Randomly generates orders of 1-6 items
  - True weights drawn from Gaussian distribution within product ranges
- **Measurement Simulation:**
  - Adds Gaussian noise (σ = 2g) to true weights
- **Weight Inference:**
  - Sums individual Kalman estimates for total weight
  - Combines individual uncertainties for total variance

### Weight Difference Detection
- **Sigma-Based Analysis:**
  - Compares measured vs inferred weights using Kalman uncertainty
  - Verified (Green): Difference ≤ 1σ
  - Warning (Yellow): 1σ < Difference ≤ 2σ
  - Flagged (Red): Difference > 2σ
- **Confidence Gating:**
  - Full alerts only when all items at high confidence
  - Warning state when any items still learning/medium confidence

## Weight Learning Algorithm

1. **Kalman Filter State**
   - **State (x):** Current weight estimate
   - **Uncertainty (P):** Starts at 1000, decreases with observations
   - **Parameters:**
     - Measurement noise (R = 4): Scale precision
     - Process noise (Q = 16): Natural weight variation

2. **Update Process**
   - **Single-Item Orders:**
     ```javascript
     // Direct Kalman update with measured weight
     P = P + Q                    // Increase uncertainty
     K = P / (P + R)             // Compute Kalman gain
     x = x + K * (measurement - x)// Update estimate
     P = (1 - K) * P             // Update uncertainty
     ```
   
   - **Multi-Item Orders:**
     ```javascript
     // Distribute total error proportionally
     ratio = item_estimate / total_estimate
     target = item_estimate + (total_error * ratio)
     // Then Kalman update with target
     ```

3. **Confidence Assessment**
   - **Learning Phase:** n < 5 observations
   - **Medium Phase:** P > 20 (higher uncertainty)
   - **High Phase:** P ≤ 20 (lower uncertainty)

4. **Order Analysis**
   - **Total Weight:** Sum of Kalman estimates
   - **Total Variance:** Sum of individual uncertainties (P values)
   - **Sigma Calculation:** difference / sqrt(total_variance)

## Requirements

### Display Requirements
- **Product Table:**
  - Product name
  - True range (simulation only)
  - Estimated weight (g)
  - Observation count (n)
  - Current uncertainty (P)
  - Status indicator:
    - Learning: n < 5
    - Medium: P > 20
    - High: P ≤ 20

### Statistical Requirements
- Use Kalman filter for weight tracking
- Require minimum 5 observations before confidence assessment
- Track per-product uncertainty (P)
- Implement confidence gating based on uncertainty

### Operational Requirements
- Allow configuration of Kalman parameters
- Build confidence incrementally
- Handle incomplete orders
- Real-time updates

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
- Measurement noise: 2g std dev (R = 4)
- Process noise: 4g std dev (Q = 16)
- Initial uncertainty: P = 1000
- Confidence thresholds:
  - Medium to High: P ≤ 20
  - Learning to Medium: n ≥ 5

## Summary
This system uses Kalman filters to track product weights, providing a statistically sound basis for weight estimation and uncertainty quantification. The approach emphasizes proper uncertainty tracking and confidence assessment, using sigma-based thresholds for anomaly detection while ensuring alerts are only triggered when confidence is high.
