---
id: ai-06-evaluation.l04
title: Feature engineering
summary: Numeric transforms and binning, dates and cyclical features, interactions, aggregations, text features with TF-IDF, and feature selection.
objectives:
  - Transform skewed numeric features and encode dates and cycles
  - Build aggregate and interaction features without leakage
  - Turn text into features with TF-IDF and select useful features
estimatedMinutes: 55
topics: [ai06.features]
resources:
  - { title: "Google ML Crash Course: Working with numerical data", url: "https://developers.google.com/machine-learning/crash-course/numerical-data", free: true, official: true }
  - { title: "Google ML Crash Course: Working with categorical data", url: "https://developers.google.com/machine-learning/crash-course/categorical-data", free: true, official: true }
  - { title: "scikit-learn: Feature extraction (text)", url: "https://scikit-learn.org/stable/modules/feature_extraction.html", free: true, official: true }
  - { title: "scikit-learn: Feature selection", url: "https://scikit-learn.org/stable/modules/feature_selection.html", free: true, official: true }
---

Better features usually beat better algorithms on tabular data. Feature engineering encodes what you know about the
problem in a form the model can use.

## Numeric features

- **Log transform** for long-tailed values (income, prices, counts): `np.log1p(x)` handles zeros.
- **Ratios and differences**: price per m², debt-to-income, days since last login.
- **Binning** (`KBinsDiscretizer`) turns a number into ranges; helps linear models capture non-linear effects.
- **Clipping** extreme values at a percentile limits the influence of outliers.

Tree models are invariant to monotonic transforms such as log; linear models, k-NN and neural networks are not.

## Dates and time

```python
df["hour"] = df["timestamp"].dt.hour
df["dayofweek"] = df["timestamp"].dt.dayofweek
df["is_weekend"] = df["dayofweek"] >= 5
df["days_since_signup"] = (df["timestamp"] - df["signup_date"]).dt.days
df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
```

**Cyclical encoding** with sine and cosine puts 23:00 next to 00:00 and December next to January.

## Interactions and aggregates

- **Interactions**: products or combinations (`area * is_city_centre`) let linear models express "it depends".
- **Aggregates** over related records: a customer's number of orders in the last 30 days, average basket size, time
  since the last order. Compute them using only data **before** each prediction time (no future rows), and for model
  training from the training period only.

## Text features

```python
from sklearn.feature_extraction.text import TfidfVectorizer
vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=20000)
X_text = vec.fit_transform(train_texts)    # sparse matrix: one column per word or word pair
```

**TF-IDF** weights a word by how often it appears in a document, discounted by how common it is across documents, so
"the" counts little and "refund" a lot. TF-IDF with logistic regression is a strong baseline for text classification;
Stage 8 replaces it with learned embeddings.

## Feature selection

- Drop constant, near-duplicate and leaky features.
- **Filter** methods rank features by a statistic (mutual information, chi-squared).
- **Wrapper** methods search subsets with a model (recursive feature elimination, `RFECV`).
- **Embedded** methods select while training (Lasso, tree importances with `SelectFromModel`).

Do selection inside the cross-validation pipeline; selecting on all data first is leakage.
