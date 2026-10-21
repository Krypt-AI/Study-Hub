---
id: ai-06-evaluation.l03
title: Data leakage
summary: Target leakage and train–test contamination, how each happens, how to detect suspiciously good results, and the habits that prevent them.
objectives:
  - Distinguish target leakage from train–test contamination
  - Spot leakage from suspicious scores and feature importances
  - Apply the "available at prediction time" test to every feature
estimatedMinutes: 40
topics: [ai06.leakage]
resources:
  - { title: "scikit-learn: Common pitfalls (data leakage)", url: "https://scikit-learn.org/stable/common_pitfalls.html#data-leakage", free: true, official: true }
  - { title: "Kaggle Learn: Data leakage (Intermediate ML)", url: "https://www.kaggle.com/code/alexisbcook/data-leakage", free: true, official: true }
---

**Leakage** is information in training that will not be available, or will not look the same, when the model is used.
It produces models that score brilliantly in evaluation and fail in production. It is the most expensive bug in ML
because nothing crashes.

## Target leakage

A feature that is caused by, or recorded after, the outcome:

| Predicting | Leaky feature | Why |
|---|---|---|
| Loan default | `collections_agency_contacted` | Happens after a default |
| Hospital readmission | `discharge_summary` written after readmission | Recorded later |
| Churn | `cancellation_reason` | Only filled for churners |
| Pneumonia from X-rays | Hospital-specific scanner marks | Sicker patients went to a particular hospital |

**The test**: for every feature ask, *"At the moment the prediction is made, would I know this value, and would it look
like this?"* Data warehouses often overwrite fields with later values; use snapshots as of the prediction date.

## Train–test contamination

Information from validation or test data reaches training:

- Fitting scalers, imputers, encoders or feature selection on all the data before splitting.
- Duplicates or near-duplicates across splits (the same photo resized, the same customer twice).
- Random splits of time series or grouped data (lesson 2).
- Tuning on the test set, or looking at test errors and adjusting features.
- Oversampling before splitting.

Pipelines (Stage 5) fix most of the first item; correct splitters fix the third.

## Detecting leakage

- **Too good to be true**: 99.9% accuracy on a hard problem, or a big jump after adding one feature.
- **Importance check**: one feature dominating, especially an ID, timestamp, or something administrative.
- **Production gap**: the model is much worse on live data than in evaluation.
- **Ablation**: remove a suspicious feature; if the score collapses to the baseline, investigate it.

## Habits that prevent it

1. Split first (by group or time when needed), then explore and preprocess using training data only.
2. Put all learned preprocessing in a pipeline.
3. Document for each feature when it becomes available.
4. Keep a final test set untouched until the end, ideally from a later period.
5. Shadow-test on live data before trusting a model.
