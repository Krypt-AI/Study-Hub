---
id: ai-04-data.l04
title: Joining and aggregating
summary: merge and its join types, validating keys, concat, groupby with agg and transform, pivot tables, and time-based resampling.
objectives:
  - Merge tables with the right join type and catch row explosions
  - Aggregate with groupby, agg and transform
  - Reshape with pivot_table and melt
estimatedMinutes: 55
topics: [ai04.combine]
resources:
  - { title: "pandas: Merge, join, concatenate and compare", url: "https://pandas.pydata.org/docs/user_guide/merging.html", free: true, official: true }
  - { title: "pandas: Group by: split-apply-combine", url: "https://pandas.pydata.org/docs/user_guide/groupby.html", free: true, official: true }
  - { title: "pandas: Reshaping and pivot tables", url: "https://pandas.pydata.org/docs/user_guide/reshaping.html", free: true, official: true }
---

## Merging tables

```python
customers = pd.DataFrame({"customer_id": [1, 2, 3], "name": ["Aina", "Ben", "Chen"]})
orders = pd.DataFrame({"order_id": [10, 11, 12], "customer_id": [1, 1, 4], "total": [50, 20, 99]})

customers.merge(orders, on="customer_id", how="inner")   # only customers with orders: Aina twice
customers.merge(orders, on="customer_id", how="left")    # all customers; Ben and Chen get NaN orders
customers.merge(orders, on="customer_id", how="outer", indicator=True)  # everything, with a _merge column
```

| how | Keeps |
|---|---|
| inner | Keys in both tables |
| left | Every row of the left table |
| right | Every row of the right table |
| outer | Every key from either table |

These are SQL joins (see the Databases and SQL course).

### Guard against row explosions

If the key is not unique on the side you expect, a merge multiplies rows. Check it:

```python
merged = customers.merge(orders, on="customer_id", how="left", validate="one_to_many")
assert len(merged) >= len(customers)
```

`validate` raises an error if `customers` has duplicate ids. Also check for keys stored with different types
(`"1"` vs `1`), which silently fail to match.

`pd.concat([df_2025, df_2026])` stacks tables with the same columns (rows); `axis=1` places them side by side.

## groupby: split, apply, combine

```python
sessions.groupby("topic")["score"].mean()
sessions.groupby(["student", "topic"]).agg(
    attempts=("score", "size"),
    mean_score=("score", "mean"),
    best=("score", "max"),
    minutes=("minutes", "sum"),
).reset_index()
```

`agg` reduces each group to one row. `transform` returns a value **for every original row**, which is how you build
features such as "this score compared with the student's average":

```python
sessions["student_mean"] = sessions.groupby("student")["score"].transform("mean")
sessions["vs_mean"] = sessions["score"] - sessions["student_mean"]
```

Group-level features like this must also be computed on the training data only when they are used by a model.

## Pivot and melt

```python
wide = sessions.pivot_table(index="student", columns="topic", values="score", aggfunc="mean")
long = wide.reset_index().melt(id_vars="student", var_name="topic", value_name="score")
```

**Wide** format has one column per category (good for reading and some models); **long** format has one row per
observation (good for groupby and plotting).

## Time series

```python
daily = sessions.set_index("date").resample("D")["minutes"].sum()     # per day
weekly = sessions.set_index("date").resample("W")["score"].mean()
rolling7 = daily.rolling(7).mean()                                     # 7-day moving average of the daily totals
```
