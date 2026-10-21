---
id: ai-05-machine-learning.l01
title: The machine learning workflow
summary: Kinds of ML, features and labels, train/validation/test splits, the scikit-learn estimator API, baselines, and underfitting versus overfitting.
objectives:
  - Frame a problem as regression, classification or unsupervised learning
  - Split data correctly and use the fit/predict API
  - Diagnose underfitting and overfitting with the bias–variance trade-off
estimatedMinutes: 50
topics: [ai05.workflow]
resources:
  - { title: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course", free: true, official: true }
  - { title: "scikit-learn: Common pitfalls and recommended practices", url: "https://scikit-learn.org/stable/common_pitfalls.html", free: true, official: true }
  - { title: "scikit-learn MOOC (Inria, free)", url: "https://inria.github.io/scikit-learn-mooc/", free: true, official: true }
---

## Kinds of machine learning

| Kind | Data | Examples |
|---|---|---|
| **Supervised: regression** | Features + numeric target | House price, delivery time |
| **Supervised: classification** | Features + category target | Spam or not, digit 0–9 |
| **Unsupervised** | Features only | Customer segments, anomaly detection, compression |
| **Reinforcement learning** | Actions and rewards | Game playing, robot control, RLHF for LLMs |

Each **example** (row) has **features** X and, in supervised learning, a **label** (target) y. The model learns a
function f(X) ≈ y from training examples and must **generalise** to new ones.

## Splitting the data

- **Training set**: used to fit the model.
- **Validation set**: used to choose models and hyperparameters.
- **Test set**: used **once** at the end to estimate real-world performance.

```python
from sklearn.model_selection import train_test_split
X_trainval, X_test, y_trainval, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_trainval, y_trainval, test_size=0.25, random_state=42, stratify=y_trainval)
```

`stratify=y` keeps class proportions equal in each split. For time-ordered data, split by time instead (train on the
past, test on the future); a random split would let the model peek at the future. Cross-validation (Stage 6) uses
the data more efficiently than one validation split.

## The estimator API

Every scikit-learn model follows the same pattern:

```python
from sklearn.linear_model import LogisticRegression
model = LogisticRegression(C=1.0)       # hyperparameters go in the constructor
model.fit(X_train, y_train)             # learn parameters from data
model.predict(X_val)                    # predicted labels
model.predict_proba(X_val)              # class probabilities (classifiers)
model.score(X_val, y_val)               # default metric: accuracy or R²
```

**Parameters** are learned from data (the weights). **Hyperparameters** are chosen by you (C, tree depth, number of
neighbours). Transformers (scalers, encoders) have `fit` and `transform`.

## Always start with a baseline

```python
from sklearn.dummy import DummyClassifier, DummyRegressor
DummyClassifier(strategy="most_frequent").fit(X_train, y_train).score(X_val, y_val)
```

A model is only useful if it beats the baseline by a margin that matters. If a 97% accurate model is compared with a
96.8% majority-class baseline, it has learned very little.

## Underfitting and overfitting

| | Training score | Validation score | Fix |
|---|---|---|---|
| Underfitting (high bias) | Low | Low | More expressive model, better features, less regularisation |
| Good fit | High | Close to training | — |
| Overfitting (high variance) | Very high | Much lower | More data, regularisation, simpler model, early stopping |

The **bias–variance trade-off**: simple models make systematic errors (bias); complex models are sensitive to the
particular training sample (variance). Plot training and validation scores against model complexity (a validation
curve) to find the sweet spot.
