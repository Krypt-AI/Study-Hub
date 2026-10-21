---
id: ai-05-machine-learning.l02
title: Linear models for regression
summary: Linear regression, interpreting coefficients, R² and error metrics, polynomial features, and regularisation with Ridge and Lasso.
objectives:
  - Fit and interpret a linear regression
  - Evaluate regression with MAE, RMSE and R²
  - Control overfitting with Ridge (L2) and Lasso (L1) regularisation
estimatedMinutes: 55
topics: [ai05.regression]
resources:
  - { title: "scikit-learn: Linear models", url: "https://scikit-learn.org/stable/modules/linear_model.html", free: true, official: true }
  - { title: "Google ML Crash Course: Linear regression", url: "https://developers.google.com/machine-learning/crash-course/linear-regression", free: true, official: true }
  - { title: "An Introduction to Statistical Learning (free book)", url: "https://www.statlearning.com/", free: true, official: true }
---

## Linear regression

ŷ = w₁x₁ + w₂x₂ + … + wₙxₙ + b, fitted by minimising mean squared error (the gradient-descent idea from Stage 3;
scikit-learn's `LinearRegression` solves it directly with least squares).

```python
from sklearn.linear_model import LinearRegression
reg = LinearRegression().fit(X_train, y_train)
reg.coef_, reg.intercept_
reg.predict(X_val)
```

### Interpreting coefficients

A coefficient of 3,500 on `area_m2` means "holding the other features fixed, each extra m² adds RM3,500 to the
predicted price". Cautions:

- Coefficients are only comparable across features if the features are on the same scale (standardise first).
- Correlated features (multicollinearity) make individual coefficients unstable even when predictions are fine.
- A coefficient is an association learned from the data, not a cause.

## Regression metrics

| Metric | Formula | Notes |
|---|---|---|
| MAE | mean \|y − ŷ\| | In target units; robust to outliers |
| RMSE | √(mean (y − ŷ)²) | In target units; punishes big errors |
| R² | 1 − SS_res / SS_tot | Share of variance explained; 1 is perfect, 0 equals predicting the mean, can be negative |
| MAPE | mean \|y − ŷ\| / \|y\| | Percentage; breaks down when y is near 0 |

```python
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
```

Report errors in the business's units: "typical error RM18,000 on a RM450,000 house" is more useful than R² = 0.81.

## Non-linear relationships

Linear models can fit curves if you give them non-linear features:

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
model = make_pipeline(PolynomialFeatures(degree=2), LinearRegression())
```

Higher degrees fit the training data better and better, and eventually overfit.

## Regularisation

Regularisation adds a penalty on large weights to the loss:

- **Ridge (L2)**: loss + α Σ wᵢ². Shrinks all weights smoothly; good default with many correlated features.
- **Lasso (L1)**: loss + α Σ |wᵢ|. Pushes some weights to exactly 0, so it also selects features.
- **ElasticNet** mixes both.

α (alpha) controls the strength: α = 0 is plain linear regression; large α makes the model simpler (more bias, less
variance). Choose α by cross-validation (`RidgeCV`, `LassoCV`). Always **scale features** before regularising, or the
penalty treats features unfairly.
