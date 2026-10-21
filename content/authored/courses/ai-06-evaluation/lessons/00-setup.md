---
id: ai-06-evaluation.l00
title: "Setup: MLflow in VS Code"
summary: Install MLflow, start the tracking UI locally, and log a first run from a VS Code notebook or script.
objectives:
  - Install MLflow into a project and start the local tracking UI
  - Log parameters, metrics and a model from VS Code
  - Keep tracking data out of Git
estimatedMinutes: 25
topics: [ai06.setup]
resources:
  - { title: "MLflow documentation", url: "https://mlflow.org/docs/latest/", free: true, official: true }
  - { title: "MLflow: Tracking", url: "https://mlflow.org/docs/latest/ml/tracking/", free: true, official: true }
  - { title: "VS Code: Port forwarding and the Ports view", url: "https://code.visualstudio.com/docs/debugtest/port-forwarding", free: true, official: true }
---

Builds on lesson 0 of Stages 1–5. MLflow is an open-source tool for tracking experiments and storing models; lesson 5
explains why you need one.

## Step 1: Install

```powershell
cd $HOME\code\ml-basics          # the Stage 5 project, or a new one
uv add mlflow
```

Add to `.gitignore`:

```gitignore
mlruns/
mlartifacts/
mlflow.db
```

## Step 2: Start the tracking UI

Open a **second** terminal in VS Code (click **+** in the terminal panel, or split it with **Ctrl+Shift+5**) and run:

```powershell
uv run mlflow ui --port 5000
```

Leave it running and open http://127.0.0.1:5000 (Ctrl+click the link in the terminal). The UI only listens on your own
machine by default; do not expose it to a network, as it has no authentication out of the box.

## Step 3: Log a first run

In a notebook or `track.py`:

```python
import mlflow
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

mlflow.set_tracking_uri("http://127.0.0.1:5000")
mlflow.set_experiment("breast-cancer")

X, y = load_breast_cancer(return_X_y=True)
for depth in [2, 4, 8]:
    with mlflow.start_run(run_name=f"rf-depth-{depth}"):
        model = RandomForestClassifier(max_depth=depth, random_state=0)
        score = cross_val_score(model, X, y, cv=5, scoring="roc_auc").mean()
        mlflow.log_param("max_depth", depth)
        mlflow.log_metric("cv_roc_auc", score)
```

Refresh the UI, open the *breast-cancer* experiment, tick the three runs and click **Compare** to see parameters
against metrics.

## Optional: open the UI inside VS Code

The UI is a web page, so you can also open it in VS Code's built-in browser: **Ctrl+Shift+P → Simple Browser: Show**
and enter http://127.0.0.1:5000.

## Check your setup

`uv run mlflow --version` prints a version, and the UI lists your experiment with three runs.
