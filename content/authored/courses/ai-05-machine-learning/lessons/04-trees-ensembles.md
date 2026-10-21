---
id: ai-05-machine-learning.l04
title: Decision trees and ensembles
summary: How decision trees split, controlling their depth, bagging and random forests, gradient boosting (XGBoost, LightGBM, HistGradientBoosting) and feature importance.
objectives:
  - Explain how a decision tree chooses splits and why deep trees overfit
  - Compare bagging (random forests) with boosting
  - Read feature importances, including permutation importance
estimatedMinutes: 55
topics: [ai05.trees]
resources:
  - { title: "scikit-learn: Decision trees", url: "https://scikit-learn.org/stable/modules/tree.html", free: true, official: true }
  - { title: "scikit-learn: Ensembles (gradient boosting, random forests, bagging)", url: "https://scikit-learn.org/stable/modules/ensemble.html", free: true, official: true }
  - { title: "XGBoost: Introduction to boosted trees", url: "https://xgboost.readthedocs.io/en/stable/tutorials/model.html", free: true, official: true }
  - { title: "scikit-learn: Permutation feature importance", url: "https://scikit-learn.org/stable/modules/permutation_importance.html", free: true, official: true }
---

## Decision trees

A tree asks a sequence of yes/no questions ("area > 120 m²?") and predicts the majority class (or mean value) of the
training examples in each leaf. At each node it picks the split that makes the children **purest**:

- **Gini impurity** = 1 − Σ pₖ² (0 for a pure node; 0.5 for a 50/50 binary node).
- **Entropy** = −Σ pₖ log₂ pₖ.
- For regression, the split that most reduces squared error.

```python
from sklearn.tree import DecisionTreeClassifier, export_text
tree = DecisionTreeClassifier(max_depth=3, min_samples_leaf=20, random_state=0).fit(X_train, y_train)
print(export_text(tree, feature_names=list(X_train.columns)))
```

Trees need no scaling, handle non-linear interactions and are easy to explain when shallow. An unlimited tree keeps
splitting until every leaf is pure, which **memorises** the training data: limit `max_depth`, `min_samples_leaf` or
use cost-complexity pruning (`ccp_alpha`).

## Bagging and random forests

**Bagging** trains many models on bootstrap samples (random samples with replacement) and averages them, which
reduces variance. A **random forest** also lets each split consider only a random subset of features, so the trees
differ more and their average is more stable.

```python
from sklearn.ensemble import RandomForestClassifier
rf = RandomForestClassifier(n_estimators=300, n_jobs=-1, random_state=0).fit(X_train, y_train)
```

Random forests are strong, hard-to-break defaults that need little tuning.

## Boosting

**Boosting** trains trees **one after another**, each fitting the errors (gradients of the loss) of the ensemble so
far, with a small **learning rate**. Gradient boosted trees are usually the most accurate models on tabular data.

| Library | Notes |
|---|---|
| `HistGradientBoostingClassifier` (scikit-learn) | Fast, handles missing values natively |
| XGBoost | Widely used, many options, GPU support |
| LightGBM | Very fast on large data |
| CatBoost | Strong handling of categorical features |

Key hyperparameters: number of trees, learning rate (smaller rates need more trees), tree depth or number of leaves,
and subsampling. Use **early stopping** on validation data to choose the number of trees.

| | Bagging / random forest | Boosting |
|---|---|---|
| Trees trained | Independently, in parallel | Sequentially |
| Mainly reduces | Variance | Bias (and variance with care) |
| Overfitting risk with more trees | Low | Yes, without early stopping |

## Feature importance

- `rf.feature_importances_` (impurity-based) is fast but biased towards high-cardinality features.
- **Permutation importance** shuffles one feature on validation data and measures how much the score drops; it is more
  reliable:

```python
from sklearn.inspection import permutation_importance
result = permutation_importance(rf, X_val, y_val, n_repeats=10, random_state=0)
```

Importance tells you what the model relies on, not what causes the outcome. A surprisingly important ID or date column
often reveals leakage.
