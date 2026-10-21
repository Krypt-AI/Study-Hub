---
id: ai-05-machine-learning.l00
title: "Setup: scikit-learn in VS Code"
summary: Install scikit-learn (and optionally XGBoost and LightGBM) into a project, run a first model in a notebook, and save it with joblib.
objectives:
  - Install scikit-learn and the gradient boosting libraries into a project environment
  - Train and evaluate a first model on a built-in dataset in a VS Code notebook
  - Save and reload a fitted model
estimatedMinutes: 30
topics: [ai05.setup]
resources:
  - { title: "scikit-learn: Installing", url: "https://scikit-learn.org/stable/install.html", free: true, official: true }
  - { title: "scikit-learn: Getting started", url: "https://scikit-learn.org/stable/getting_started.html", free: true, official: true }
  - { title: "XGBoost: Installation guide", url: "https://xgboost.readthedocs.io/en/stable/install.html", free: true, official: true }
  - { title: "LightGBM: Installation guide", url: "https://lightgbm.readthedocs.io/en/stable/Installation-Guide.html", free: true, official: true }
---

Builds on lesson 0 of Stages 1–4 (VS Code, Python, Jupyter, pandas).

## Step 1: Packages

```powershell
mkdir $HOME\code\ml-basics; cd $HOME\code\ml-basics
uv init
uv add scikit-learn pandas matplotlib seaborn ipykernel joblib
uv add xgboost lightgbm          # optional, used in lesson 4
code .
```

No GPU is needed for anything in this course. All of these packages ship pre-built wheels for Windows, macOS and Linux.

## Step 2: A first model in a notebook

Create `first_model.ipynb`, select the `.venv` kernel, and run:

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

X, y = load_breast_cancer(return_X_y=True, as_frame=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))
```

You should see accuracy around 0.97–0.99. Hover over `LogisticRegression` in VS Code to read its documentation; press
**F12** on it to open the scikit-learn source.

## Step 3: Save and load a model

```python
import joblib
joblib.dump(model, "model.joblib")
reloaded = joblib.load("model.joblib")
```

Add `*.joblib` to `.gitignore`. Only load model files you created or trust: unpickling a file can run arbitrary code.
Record the scikit-learn version with the model, because a model saved with one version may not load in another.

## Helpful VS Code features for ML

- The **Variables** view shows the shapes of `X_train` and `y_train`; open DataFrames in **Data Wrangler**.
- **Run Cell and Below / Debug Cell** lets you step through a notebook cell with the debugger.
- Interactive plots: `%matplotlib widget` (after `uv add ipympl`) makes charts zoomable inside VS Code.

## Check your setup

```python
import sklearn; sklearn.show_versions()
```
