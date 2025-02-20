# smart-scale

## Evals
- TODO

## Demo
- TODO

## js

### Changes
- Added math/js
- Added an interface for order generation
- Added item weight to the item object (see TODO on fixing this)
- Refactored Order Generator to use the interface, kept Matt's default values
- Fixed bug in order generator, min/max number of items in true random range.
- Refactored Simulator to allow abstract OrderGenerator injection
- Added GaussianOrderGenerator as a 2nd type of OrderGenerator, samples individual item weights from guassian a distribution.
- Added options in the main to use a Simulator backed by either order generator
- Fixed an bug where an item with a quanity >1 wasn't correctly calculating the missing value of an individual product
- Added a BayesianEstimator
- Added Bayesian Estimator to UI
- Fixed bug to improve the uniformity of random sampling from the products array
- Added UI configuration for order generator settings
- Refactored Main UI to better handle state management and resets on configuration changes-
- Added selectors for Taco Bell and KFC products to the UI. Added appropriate generators
- Added visuals for weight actuals vs inference
- Added visuals for probability complete and missing
- Added visuals for predicted products missing 

### Todo
- Figure out a better weight to handle individual items w/ weights and groups of items w/ weights (intefaces)
- Figure out a better way to quantify the confidence during training, per prod, per sample
- Separate out update model from classify cart
- It thinks the range for product weights can go negative in early training for missing samples
- Refactor the order object, include expectedItems, actualItems
- Create an OrderGenerator mirroring production data (count num items, distribution of items, items per order, modifiers per item)
- Add learning visualizations
- Instead of a simple product of a sample factor and a variance factor, consider deriving confidence intervals directly from the posterior (e.g., a 95% credible interval).
- Explore alternative formulations that incorporate the number of observations in a more principled way (for example, Bayesian credible intervals naturally narrow with more data).
- Include cases where item IS ADDED
- Allowing Product-Specific Measurement Noise:
    - For example, if some items are known to have more variability in weight than others, incorporate that into the model.
- Adjusting the Prior Variance Per Product:
    - If you have product-specific prior information, setting different prior variances can lead to different rates of uncertainty reduction.