---
id: ai-05-machine-learning.l06
title: Pipelines and preprocessing
summary: Encoding categories, scaling and imputing inside a ColumnTransformer, Pipeline objects, hyperparameter search, and saving the whole thing as one model.
objectives:
  - Build a ColumnTransformer for numeric and categorical columns
  - Combine preprocessing and a model in a Pipeline to prevent leakage
  - Tune hyperparameters with GridSearchCV over a pipeline
estimatedMinutes: 55
topics: [ai05.pipelines]
resources:
  - { title: "scikit-learn: Pipelines and composite estimators", url: "https://scikit-learn.org/stable/modules/compose.html", free: true, official: true }
  - { title: "scikit-learn: Preprocessing data", url: "https://scikit-learn.org/stable/modules/preprocessing.html", free: true, official: true }
  - { title: "scikit-learn: Tuning the hyper-parameters of an estimator", url: "https://scikit-learn.org/stable/modules/grid_search.html", free: true, official: true }
---

## Why pipelines

Preprocessing steps (imputation, scaling, encoding) learn statistics from data. If you fit them on all the data, or
forget to apply the same step at prediction time, you get leakage or mismatched inputs. A **Pipeline** bundles the
steps with the model so `fit` learns everything from the training data only, and `predict` applies exactly the same
transformations.

## Encoding categorical features

| Encoder | Output | Use for |
|---|---|---|
| `OneHotEncoder` | One 0/1 column per category | Nominal categories (state, colour) |
| `OrdinalEncoder` | One integer column | Ordered categories (low < medium < high), or for tree models |
| Target encoding (`TargetEncoder`) | Category's mean target, cross-fitted | Very many categories |

`OneHotEncoder(handle_unknown="ignore")` turns a category never seen in training into all zeros instead of crashing.

## ColumnTransformer + Pipeline

```python
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression

numeric = ["age", "income", "tenure_months"]
categorical = ["state", "plan"]

preprocess = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
    ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                      ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical),
])

model = Pipeline([("prep", preprocess), ("clf", LogisticRegression(max_iter=1000))])
model.fit(X_train, y_train)          # imputers, scaler and encoder learn from X_train only
model.predict(X_new)                 # raw rows in, predictions out
```

## Hyperparameter search

Step parameters are addressed as `<step>__<parameter>`:

```python
from sklearn.model_selection import GridSearchCV
grid = GridSearchCV(
    model,
    param_grid={"clf__C": [0.01, 0.1, 1, 10], "prep__num__impute__strategy": ["mean", "median"]},
    cv=5, scoring="f1", n_jobs=-1,
)
grid.fit(X_train, y_train)
grid.best_params_, grid.best_score_
best_model = grid.best_estimator_     # refit on all of X_train with the best settings
```

Because the whole pipeline is cross-validated, each fold fits its own imputer and scaler: no leakage between folds.
`RandomizedSearchCV` samples settings and is better when there are many hyperparameters.

## Ship the pipeline, not just the model

Save `best_model` (the whole pipeline) with joblib. The serving code (Stage 12) then receives raw feature values and
calls `predict`, with no preprocessing code to keep in sync.
