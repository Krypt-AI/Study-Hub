---
id: ai-06-evaluation.l01
title: Choosing the right metric
summary: Accuracy and its limits, precision, recall, F1 and F-beta, ROC-AUC and PR-AUC, log loss and calibration, and metrics tied to business cost.
objectives:
  - Compute precision, recall, F1 and specificity from a confusion matrix
  - Choose between ROC-AUC and PR-AUC, and understand threshold-free metrics
  - Check calibration and connect metrics to the cost of errors
estimatedMinutes: 55
topics: [ai06.metrics]
resources:
  - { title: "scikit-learn: Metrics and scoring", url: "https://scikit-learn.org/stable/modules/model_evaluation.html", free: true, official: true }
  - { title: "Google ML Crash Course: Accuracy, precision, recall", url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall", free: true, official: true }
  - { title: "scikit-learn: Probability calibration", url: "https://scikit-learn.org/stable/modules/calibration.html", free: true, official: true }
---

## Accuracy and why it misleads

Accuracy = (TP + TN) / all. With 99% negatives, predicting "negative" every time scores 99% and finds nothing. Use
accuracy only when classes are balanced and errors cost about the same.

## The core classification metrics

| Metric | Formula | Question it answers |
|---|---|---|
| Precision | TP / (TP + FP) | When we flag something, how often is it right? |
| Recall (sensitivity, TPR) | TP / (TP + FN) | Of all real positives, how many do we catch? |
| Specificity (TNR) | TN / (TN + FP) | Of all negatives, how many do we correctly leave alone? |
| False positive rate | FP / (FP + TN) | How often are negatives wrongly flagged? |
| F1 | 2PR / (P + R) | Harmonic mean: high only when both P and R are high |
| F-beta | (1 + β²)PR / (β²P + R) | β > 1 weights recall more (F2), β < 1 precision more |

Precision and recall trade off through the threshold: lowering it raises recall and usually lowers precision.

## Threshold-free metrics

- **ROC curve**: TPR against FPR at every threshold. **ROC-AUC** is the probability that a random positive is scored
  above a random negative (0.5 = random, 1.0 = perfect).
- **Precision–recall curve** and **average precision (PR-AUC)**: precision against recall. With rare positives,
  PR-AUC is more honest, because ROC's FPR stays tiny even when false positives vastly outnumber true positives.
- **Log loss** (cross-entropy) scores the probabilities themselves and punishes confident mistakes.

```python
from sklearn.metrics import roc_auc_score, average_precision_score, log_loss, precision_recall_curve
roc_auc_score(y_val, proba)
average_precision_score(y_val, proba)
```

## Calibration

A model is **calibrated** if, among cases it scores 0.8, about 80% are positive. Calibrated probabilities matter when
you act on them (pricing, risk scores, combining models). Check with a reliability diagram
(`CalibrationDisplay.from_estimator`) and fix with `CalibratedClassifierCV` (sigmoid or isotonic). Tree ensembles and
models trained with class weights are often poorly calibrated.

## Multi-class averaging

- **Macro** average: the mean of per-class scores, so every class counts equally (good for rare classes).
- **Weighted** average: weighted by class frequency.
- **Micro** average: computed from pooled counts (equals accuracy for single-label problems).

## Tie metrics to cost

Write down what each error costs. If a missed fraud costs RM2,000 and reviewing a false alarm costs RM20, choose the
threshold that minimises expected cost on validation data:

  cost = 2000·FN + 20·FP

The best model is the one that best serves the decision, not the one with the highest generic score.
