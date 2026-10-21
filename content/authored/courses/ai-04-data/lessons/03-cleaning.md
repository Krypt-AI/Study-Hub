---
id: ai-04-data.l03
title: Cleaning data
summary: Missing values, duplicates, inconsistent text, wrong types, outliers and dates, and doing all of it without leaking test information.
objectives:
  - Diagnose and handle missing values, duplicates and inconsistent categories
  - Convert messy strings to numbers and dates
  - Detect outliers and decide whether to keep, cap or remove them
estimatedMinutes: 60
topics: [ai04.cleaning]
resources:
  - { title: "pandas: Working with missing data", url: "https://pandas.pydata.org/docs/user_guide/missing_data.html", free: true, official: true }
  - { title: "pandas: Working with text data", url: "https://pandas.pydata.org/docs/user_guide/text.html", free: true, official: true }
  - { title: "Kaggle Learn: Data Cleaning (free micro-course)", url: "https://www.kaggle.com/learn/data-cleaning", free: true, official: true }
  - { title: "Google ML Crash Course: Working with numerical data", url: "https://developers.google.com/machine-learning/crash-course/numerical-data", free: true, official: true }
---

Real data is messy, and the model only ever learns from what you give it. Cleaning is usually most of the work.

## A cleaning checklist

1. **Types**: every column has the dtype it should.
2. **Missing values**: how many, where, and *why*.
3. **Duplicates**: exact and near duplicates.
4. **Consistency**: one spelling per category, one unit per column.
5. **Validity**: values in plausible ranges (age 0–120, percentages 0–100).
6. **Outliers**: errors or real extremes?

Write each step as code (a function or script), never as manual edits to the file.

## Missing values

```python
df.isna().mean().sort_values(ascending=False)   # share missing per column
df.dropna(subset=["label"])                      # rows without a target cannot be used for training
df["age"] = df["age"].fillna(df["age"].median())
df["city"] = df["city"].fillna("unknown")
df["income_missing"] = df["income"].isna()      # keep the information that it was missing
```

| Approach | When |
|---|---|
| Drop rows | Very few rows affected, missing at random, or the target is missing |
| Drop the column | Mostly empty and not important |
| Median / mode imputation | Simple, robust baseline for numeric / categorical columns |
| Model-based imputation | Values are predictable from other columns (scikit-learn `IterativeImputer`, `KNNImputer`) |
| Indicator column | Missingness might itself predict the target |

## Duplicates

```python
df.duplicated().sum()
df = df.drop_duplicates()
df = df.drop_duplicates(subset=["email"], keep="last")   # one row per key
```

Duplicates that land in both training and test data inflate scores; deduplicate *before* splitting.

## Messy text and numbers

```python
df["state"] = df["state"].str.strip().str.title().replace({"Kl": "Kuala Lumpur", "W.P. Kuala Lumpur": "Kuala Lumpur"})
df["price"] = pd.to_numeric(df["price"].str.replace(r"[RM,\s]", "", regex=True), errors="coerce")
df["joined"] = pd.to_datetime(df["joined"], format="%d/%m/%Y", errors="coerce")
df["year"] = df["joined"].dt.year
```

`errors="coerce"` turns unparseable values into NaN so you can count and inspect them, instead of crashing or silently
keeping text.

## Outliers

```python
q1, q3 = df["price"].quantile([0.25, 0.75])
iqr = q3 - q1
outliers = df[(df["price"] < q1 - 1.5 * iqr) | (df["price"] > q3 + 1.5 * iqr)]
df["price_capped"] = df["price"].clip(upper=df["price"].quantile(0.99))
```

An outlier may be a data-entry error (a price of 1,000,000 for a phone), which you fix or remove, or a genuine rare
case (a mansion), which you keep, perhaps with a log transform (`np.log1p`). Look at examples before deciding.

## Do not leak the test set

Any statistic used for cleaning (medians, category lists, caps, scaling parameters) must be computed on the
**training split only** and then applied to validation and test data. Computing it on all the data lets information
from the test set influence training, which makes evaluation optimistic. Stage 5 shows how scikit-learn pipelines
enforce this automatically.
