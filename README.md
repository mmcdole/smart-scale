# smart-scale


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
- Refactored Main UI to better handle state management and resets on configuration changes

### Todo
- Figure out a better weight to handle individual items w/ weights and groups of items w/ weights (intefaces)
- Figure out a better way to quantify the confidence during training, per prod, per sample