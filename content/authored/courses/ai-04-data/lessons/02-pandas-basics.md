---
id: ai-04-data.l02
title: pandas DataFrames
summary: Series and DataFrames, reading files, inspecting a table, selecting with loc and iloc, filtering, new columns, sorting and dtypes.
objectives:
  - Load a CSV and inspect its shape, types and summary statistics
  - Select rows and columns with loc, iloc and boolean filters
  - Create and transform columns without chained-assignment bugs
estimatedMinutes: 55
topics: [ai04.pandas]
resources:
  - { title: "pandas: 10 minutes to pandas", url: "https://pandas.pydata.org/docs/user_guide/10min.html", free: true, official: true }
  - { title: "pandas: Getting started tutorials", url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html", free: true, official: true }
  - { title: "Kaggle Learn: Pandas (free micro-course)", url: "https://www.kaggle.com/learn/pandas", free: true, official: true }
---

## Series and DataFrames

A **Series** is a labelled 1-D array; a **DataFrame** is a table of Series that share an **index** (row labels).

```python
import pandas as pd

df = pd.DataFrame({
    "student": ["Aina", "Ben", "Chen", "Devi"],
    "topic": ["kanji", "grammar", "kanji", "vocab"],
    "score": [0.82, 0.55, 0.91, None],
    "minutes": [30, 45, 20, 15],
})
```

## Reading and inspecting

```python
df = pd.read_csv("data/raw/results.csv")     # also read_parquet, read_excel, read_json, read_sql
df.shape          # (rows, columns)
df.head()         # first 5 rows
df.info()         # columns, non-null counts, dtypes, memory
df.describe()     # count, mean, std, min, quartiles, max of numeric columns
df["topic"].value_counts()
df.isna().sum()   # missing values per column
```

Always look at `info()` first: a numeric column with dtype `object` means some values are text ("N/A", "1,200").

## Selecting

```python
df["score"]                        # one column → Series
df[["student", "score"]]           # several columns → DataFrame
df.loc[0, "score"]                 # by label
df.iloc[0, 2]                      # by integer position
df.loc[df["score"] > 0.8, ["student", "score"]]   # filter rows, choose columns
df[(df["topic"] == "kanji") & (df["minutes"] >= 20)]   # combine with & | ~ and parentheses
df.query("topic == 'kanji' and minutes >= 20")         # the same, as a string
df[df["topic"].isin(["kanji", "vocab"])]
```

Use `&`, `|` and `~` (not `and`, `or`, `not`) with brackets around each condition.

## New and changed columns

```python
df["score_pct"] = df["score"] * 100
df["long_session"] = df["minutes"] > 25
df["topic"] = df["topic"].str.strip().str.lower()     # string methods with .str
df = df.assign(per_minute=lambda d: d["score"] / d["minutes"])
df = df.rename(columns={"minutes": "study_minutes"})
df = df.sort_values("score", ascending=False)
```

### Avoid chained assignment

```python
df[df["topic"] == "kanji"]["score"] = 1.0      # may modify a temporary copy: does nothing useful
df.loc[df["topic"] == "kanji", "score"] = 1.0  # correct: one .loc call
```

pandas 3 makes every selection behave as a copy (copy-on-write), so the chained form never changes `df`; `.loc` with
a row condition and a column in a single call is always the right way.

## Types

```python
df["minutes"] = pd.to_numeric(df["minutes"], errors="coerce")   # bad values become NaN
df["date"] = pd.to_datetime(df["date"])
df["topic"] = df["topic"].astype("category")                      # saves memory for repeated labels
```
