# QSR Smart Scale Simulator

## Overview
A simulation of a smart scale system for Quick Service Restaurants (QSR) that learns to estimate order weights over time. The system focuses on detecting potential missing items by comparing measured weights against expected weights, rather than trying to identify specific items in an order.

## Core Features

### Weight Learning System
- Maintains a database of products with their true weight ranges (used only for simulation)
- Learns expected weights for each product through repeated observations
- Uses conservative learning rates to prevent outliers from skewing estimates
- Tracks confidence levels based on measurement consistency and error rates
- Never peeks at true weight ranges for estimation - only uses them for simulation

### Order Processing
- Generates random orders of 1-3 items
- Simulates true weights using Gaussian distribution within item's true range
- Measures total order weight with small random measurement noise
- Calculates expected total weight based on learned item weights
- Flags orders where weight difference exceeds user-defined threshold

### Weight Difference Detection
- Compares measured total weight vs inferred total weight
- Calculates percentage difference between measurements
- Flags potential missing items when difference exceeds threshold
- Does not attempt to identify which specific item might be missing

## Weight Inference Algorithm

The system uses statistical analysis to learn and predict item weights. Key components:

1. **Weight Measurement**
   - Each item has a hidden true weight range (for simulation only)
   - Actual weights follow a Gaussian distribution within this range
   - System learns purely from measurements, without knowledge of true ranges

2. **Confidence Calculation**
   The system calculates confidence using multiple statistical factors:
   
   a. Sample Statistics:
   - Sample mean and standard deviation (n-1 for unbiased estimation)
   - Standard Error of the Mean (SEM)
   - Coefficient of Variation (CV)
   - 95% confidence interval margin of error

   b. Confidence Factors:
   - Sample size factor (based on Central Limit Theorem)
   - Precision factor (based on CV)
   - Stability factor (recent vs overall variation)
   - Error trend (recent measurement errors)

   c. Confidence Levels:
   - 0% for no observations
   - 50% base confidence for initial observations
   - Gradual increase based on:
     * Sample size
     * Measurement consistency
     * Statistical uncertainty
   - Maximum 99% with excellent consistency

3. **Incomplete Order Handling**
   - Missing items are marked with weight = 0
   - Total order weight is sum of present items only
   - System learns from present items in incomplete orders
   - Missing items do not affect weight estimation

4. **Learning Process**
   - No prior assumptions about weights
   - Learns from actual measurements
   - Uses exponential moving average for updates
   - Maintains history of recent measurements
   - Adapts learning rate based on sample size

## Requirements

1. **Display Requirements**
   - Show product table with:
     * Product name
     * Hidden range (g) - for simulation only
     * Estimated weight (g)
     * Confidence level with order count
   - Color-code confidence levels
   - Mark missing items in red

2. **Statistical Requirements**
   - Minimum 3 observations before statistical analysis
   - Consider measurement variance
   - Account for sample size in confidence
   - Handle edge cases (zero weights, single samples)
   - Degrade confidence for inconsistent measurements

3. **Operational Requirements**
   - Start with no weight assumptions
   - Build confidence gradually
   - Handle incomplete orders correctly
   - Maintain measurement history
   - Update estimates in real-time

4. **Performance Targets**
   - Achieve 90% confidence after ~25 consistent measurements
   - Reach 95% confidence after ~40 measurements with good consistency
   - Maximum 99% confidence with excellent long-term consistency
   - Degrade confidence if measurements become inconsistent

## User Interface

### Current Order Display
- Shows items in current order with individual confidence levels
- Displays three warning states for weight differences:
  1. Green (Success):
     - Weight within threshold
     - "Order weight within expected range"
  2. Yellow (Warning):
     - Weight exceeds threshold
     - One or more items have low confidence (<80%)
     - Shows number of low confidence items
  3. Red (Danger):
     - Weight exceeds threshold
     - All items have high confidence (≥80%)
     - Strong warning message

### Weight Analysis Panel
- Displays measured and inferred weights
- Shows weight difference with color coding:
  - Green: Within threshold
  - Yellow: Exceeds threshold but low confidence
  - Red: Exceeds threshold with high confidence
- User-adjustable weight difference threshold

### Product Database View
- Lists all available products
- Shows true weight ranges (simulation only)
- Displays learned weight estimates
- Shows confidence levels (0-95%):
  - Normal range: 0-80%
  - High confidence range: 80-95%
  - Color coded based on confidence level

### Controls
- Batch size selection for processing multiple orders
- Weight difference threshold adjustment (1-20%)
- Options to generate normal or incomplete orders

## Simulation Parameters

### Measurement Noise
- Small random variation added to true weights
- Uses Gaussian distribution for realistic variation
- Standard deviation of 2g for measurement error

### Order Generation
- Random selection of 1-3 items per order
- Option to generate incomplete orders by removing one item
- True weights generated within specified ranges
- Realistic variation in item weights using Gaussian distribution

### Learning Parameters
- Base learning rate: 0.2
- Learning rate reduced by:
  - Higher confidence levels
  - Larger error variance
  - More observations
- Weight estimates bounded by recent history (±10%)
- Minimum 3 observations before confidence calculation
- Rolling window of 10 measurements for history
- Uses last 5 measurements for variance calculation
