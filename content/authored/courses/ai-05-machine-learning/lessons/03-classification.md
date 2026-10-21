---
id: ai-05-machine-learning.l03
title: Classification
summary: Logistic regression and the decision threshold, k-nearest neighbours, the confusion matrix, multi-class classification and class imbalance.
objectives:
  - Train logistic regression and k-NN classifiers and read their probabilities
  - Build and read a confusion matrix
  - Adjust the decision threshold and handle class imbalance
estimatedMinutes: 55
topics: [ai05.classification]
resources:
  - { title: "scikit-learn: Logistic regression", url: "https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression", free: true, official: true }
  - { title: "scikit-learn: Nearest neighbors", url: "https://scikit-learn.org/stable/modules/neighbors.html", free: true, official: true }
  - { title: "Google ML Crash Course: Classification", url: "https://developers.google.com/machine-learning/crash-course/classification", free: true, official: true }
---

## Logistic regression

Logistic regression computes a linear score z = w·x + b and squashes it through the sigmoid σ(z) = 1/(1 + e⁻ᶻ) into a
probability between 0 and 1. It is trained with binary cross-entropy (Stage 3).

```python
from sklearn.linear_model import LogisticRegression
clf = LogisticRegression(C=1.0, max_iter=1000).fit(X_train, y_train)
proba = clf.predict_proba(X_val)[:, 1]      # probability of class 1
pred = clf.predict(X_val)                    # = proba >= 0.5
```

`C` is the **inverse** of regularisation strength: smaller C, stronger regularisation.

### The decision threshold

`predict` uses 0.5, but the right threshold depends on the cost of each mistake:

```python
pred_cautious = (proba >= 0.2).astype(int)   # flag more cases: more recall, less precision
```

For cancer screening you lower the threshold (missing a case is worse than a false alarm); for an email that
auto-deletes messages you raise it. Choose the threshold on validation data, never on the test set.

## k-nearest neighbours

k-NN predicts the majority label of the k closest training examples. It has no training phase, is easy to explain,
needs **scaled** features (it uses distances), and becomes slow and weak with many features (the curse of
dimensionality). Small k overfits; large k underfits.

## The confusion matrix

|  | Predicted negative | Predicted positive |
|---|---|---|
| **Actually negative** | True negative (TN) | False positive (FP) |
| **Actually positive** | False negative (FN) | True positive (TP) |

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, classification_report
confusion_matrix(y_val, pred)            # rows = true class, columns = predicted (scikit-learn's layout)
print(classification_report(y_val, pred))
```

- **Precision** = TP / (TP + FP): of the cases flagged, how many were right?
- **Recall** = TP / (TP + FN): of the real positives, how many were found?
- Stage 6 covers these and ROC/PR curves in depth.

## Multi-class

With classes 0–9, logistic regression uses a softmax over class scores (Stage 3), and the confusion matrix becomes
10 × 10; its off-diagonal cells show which classes are confused (4 vs 9, for instance).

## Class imbalance

When positives are rare (fraud, disease):

- Use **stratified** splits and metrics other than accuracy.
- `class_weight="balanced"` makes errors on the rare class cost more during training.
- Tune the threshold.
- Resampling (oversampling the minority, undersampling the majority) is another option; only ever resample the
  **training** data.
