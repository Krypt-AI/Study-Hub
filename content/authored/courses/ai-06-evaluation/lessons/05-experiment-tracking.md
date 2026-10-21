---
id: ai-06-evaluation.l05
title: Experiment tracking and reproducibility
summary: What to record for every run, MLflow runs, autologging and the model registry, comparing runs, seeds, and writing up results honestly.
objectives:
  - Record parameters, metrics, code and data versions for every experiment
  - Use MLflow tracking, autologging and the model registry
  - Make runs reproducible and report results with their uncertainty
estimatedMinutes: 45
topics: [ai06.tracking]
resources:
  - { title: "MLflow: Tracking", url: "https://mlflow.org/docs/latest/ml/tracking/", free: true, official: true }
  - { title: "MLflow: Model registry", url: "https://mlflow.org/docs/latest/ml/model-registry/", free: true, official: true }
  - { title: "scikit-learn: Controlling randomness", url: "https://scikit-learn.org/stable/common_pitfalls.html#controlling-randomness", free: true, official: true }
---

Without tracking, three weeks of experiments turn into "I think the good one used depth 6… or was that before I fixed
the bug?" An experiment tracker is a lab notebook that writes itself.

## What to record for every run

| Record | Example |
|---|---|
| Code version | Git commit hash (and whether the tree had uncommitted changes) |
| Data version | Dataset path plus a hash, snapshot date or version tag |
| Parameters | Model type, hyperparameters, feature set, random seed |
| Metrics | Validation metrics per fold, mean and spread; training metrics |
| Artifacts | The fitted pipeline, plots (confusion matrix, curves), the environment (lock file) |
| Notes | Why you ran it and what you concluded |

## MLflow tracking

```python
import subprocess
import mlflow

mlflow.set_experiment("churn")
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()

with mlflow.start_run(run_name="hgb-lr0.05"):
    mlflow.set_tag("git_commit", commit)
    mlflow.log_params({"model": "HistGradientBoosting", "learning_rate": 0.05, "seed": 42})
    model.fit(X_train, y_train)
    mlflow.log_metric("val_pr_auc", average_precision_score(y_val, model.predict_proba(X_val)[:, 1]))
    mlflow.sklearn.log_model(model, name="model")
```

`mlflow.autolog()` (or `mlflow.sklearn.autolog()`) records parameters, metrics and the model automatically for
supported libraries.

## Model registry

Register a run's model under a name ("churn-classifier") to give it versions, and mark versions with **aliases** such
as `champion` or `challenger`. Serving code then loads `models:/churn-classifier@champion` and never needs a file path
(Stage 12).

## Reproducibility

- Set seeds (`random_state=42` in scikit-learn, `np.random.default_rng(42)`); deep learning needs more (Stage 7).
- Commit code before significant runs, and lock the environment (Stage 2).
- Version data: never overwrite a dataset in place; write new snapshots.
- Re-run the best configuration with several seeds; if its advantage disappears, it was noise.

## Reporting honestly

- Compare against a baseline and the previous best on the **same** validation data.
- Report the spread (fold standard deviation or a bootstrap interval), not just the mean.
- Say how many configurations you tried.
- Evaluate the final candidate once on the test set and report that number, even if it is lower.
