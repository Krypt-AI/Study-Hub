---
id: ai-06-evaluation.l02
title: Validation strategies
summary: k-fold and stratified cross-validation, group and time-series splits, nested cross-validation, learning curves and bootstrap confidence intervals.
objectives:
  - Choose a cross-validation splitter that matches how the data was generated
  - Use nested cross-validation to tune and evaluate without bias
  - Read learning curves and put confidence intervals on scores
estimatedMinutes: 50
topics: [ai06.validation]
resources:
  - { title: "scikit-learn: Cross-validation", url: "https://scikit-learn.org/stable/modules/cross_validation.html", free: true, official: true }
  - { title: "scikit-learn: Visualizing cross-validation behavior", url: "https://scikit-learn.org/stable/auto_examples/model_selection/plot_cv_indices.html", free: true, official: true }
  - { title: "scikit-learn: Validation curves and learning curves", url: "https://scikit-learn.org/stable/modules/learning_curve.html", free: true, official: true }
---

## k-fold cross-validation

Split the training data into k folds; train on k − 1 folds and validate on the remaining one, k times; report the mean
and spread of the k scores.

```python
from sklearn.model_selection import cross_validate, StratifiedKFold
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
res = cross_validate(model, X, y, cv=cv, scoring=["roc_auc", "f1"], return_train_score=True)
res["test_roc_auc"].mean(), res["test_roc_auc"].std()
```

Every example is validated exactly once, so the estimate is less noisy than a single split. The spread across folds
tells you how much the score depends on which data you happened to get.

## Match the splitter to the data

| Data | Splitter | Why |
|---|---|---|
| Independent rows, balanced | `KFold` | Simple |
| Classification, imbalanced | `StratifiedKFold` | Same class ratio in every fold |
| Several rows per patient, user, device or document | `GroupKFold` / `StratifiedGroupKFold` | The same group must not be in train and validation |
| Time-ordered (sales, logs, prices) | `TimeSeriesSplit` | Always validate on the future, never the past |

The rule: **validate the way the model will be used.** If it will predict for new patients, validate on patients it has
never seen; if it will forecast next month, validate on later months.

## Tuning without fooling yourself

If you pick hyperparameters by cross-validated score and then report that same score, it is optimistic: you selected
the luckiest configuration. Either keep a separate **test set** that tuning never sees, or use **nested
cross-validation**: an inner loop tunes, an outer loop evaluates the whole tuning procedure.

```python
from sklearn.model_selection import GridSearchCV, cross_val_score
inner = GridSearchCV(model, {"clf__C": [0.1, 1, 10]}, cv=3)
outer_scores = cross_val_score(inner, X, y, cv=5)
```

## Learning curves

Plot training and validation scores as the training set grows (`LearningCurveDisplay`):

- Both low and close together: **underfitting**; more data will not help, a better model or features will.
- Large gap that narrows as data grows: **overfitting**; more data is likely to help.

## Confidence intervals by bootstrap

Resample the test predictions with replacement many times, recompute the metric each time, and take the 2.5th and
97.5th percentiles:

```python
import numpy as np
rng = np.random.default_rng(0)
scores = []
for _ in range(1000):
    idx = rng.integers(0, len(y_test), len(y_test))
    scores.append(f1_score(y_test[idx], pred[idx]))
np.percentile(scores, [2.5, 97.5])
```

Report "F1 0.82 (95% CI 0.78–0.86)", not just "0.82".
