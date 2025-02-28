# Smart Scale Project

## Overview
The Smart Scale project is an intelligent weight estimation system designed to predict and learn the weights of items in retail or warehouse environments. It uses various statistical algorithms to estimate item weights based on order data and actual scale measurements, continuously improving its predictions over time.

## Core Purpose
The system aims to solve the problem of weight prediction and verification in order fulfillment scenarios. It can:
- Predict the expected weight of orders based on historical data
- Learn and adapt weight estimates for individual products over time
- Detect potential errors or anomalies in order fulfillment
- Evaluate different estimation algorithms for accuracy and efficiency

## Architecture

### Key Components

1. **Weight Estimators**
   - EMA (Exponential Moving Average) Estimator
   - Kalman Filter Estimator
   - Bayesian Linear Regression Estimator
   Each estimator implements different statistical approaches to weight prediction and learning.

2. **Order Generation**
   - Standard Order Generator
   - Gaussian Order Generator
   These components simulate realistic order patterns for testing and evaluation.

3. **Simulator**
   A testing framework that generates orders and evaluates estimator performance.

4. **Evaluation System**
   Measures and compares the performance of different estimators based on:
   - Convergence speed
   - Outlier resistance
   - Prediction accuracy

### Core Data Structures

1. **Order**
   - Collection of items with quantities
   - Timestamp for order creation
   - Actual measured weight (when available)

2. **Item**
   - Product ID
   - Quantity
   - Total weight

3. **Product**
   - Unique identifier
   - True weight (for simulation)
   - Estimated weight (learned by estimators)

## Estimation Algorithms

1. **EMA Estimator**
   - Uses exponential moving average for weight estimation
   - Simple but effective for stable weight patterns
   - Quick to implement and computationally efficient

2. **Kalman Estimator**
   - Implements Kalman filtering for weight prediction
   - Better handling of noise and uncertainty
   - Good for systems with measurement noise

3. **Bayesian Linear Regression Estimator**
   - Uses Bayesian inference for weight estimation
   - Provides uncertainty estimates
   - More sophisticated handling of complex patterns

## Evaluation Framework

The project includes a comprehensive evaluation system that:
- Measures how quickly each estimator converges to accurate predictions
- Tests resistance to outliers and noise
- Provides detailed performance metrics
- Allows visual comparison of different estimators

## Usage

The system can be used to:
1. Train weight estimators on real or simulated order data
2. Compare different estimation algorithms
3. Evaluate estimator performance under various conditions
4. Predict weights for new orders
5. Detect anomalies in order fulfillment

## Future Improvements

1. Better handling of individual item weights vs. group weights
2. Improved confidence metrics during training
3. Enhanced per-product and per-sample confidence tracking
4. Additional estimation algorithms
5. More sophisticated outlier detection 