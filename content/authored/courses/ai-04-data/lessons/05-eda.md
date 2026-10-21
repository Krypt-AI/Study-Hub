---
id: ai-04-data.l05
title: Exploratory data analysis and visualisation
summary: A repeatable EDA routine, choosing the right chart, Matplotlib and seaborn basics, correlations, class balance and writing up findings.
objectives:
  - Follow an EDA routine before any modelling
  - Choose and draw the right chart for a question
  - Spot class imbalance, skew, leakage candidates and data problems
estimatedMinutes: 55
topics: [ai04.eda]
resources:
  - { title: "Matplotlib: Tutorials", url: "https://matplotlib.org/stable/tutorials/index.html", free: true, official: true }
  - { title: "seaborn: User guide and tutorial", url: "https://seaborn.pydata.org/tutorial.html", free: true, official: true }
  - { title: "pandas: Chart visualization", url: "https://pandas.pydata.org/docs/user_guide/visualization.html", free: true, official: true }
  - { title: "Kaggle Learn: Data Visualization (free micro-course)", url: "https://www.kaggle.com/learn/data-visualization", free: true, official: true }
---

**Exploratory data analysis (EDA)** means understanding the data before modelling: what each column means, how values
are distributed, how they relate to the target, and what is wrong. Skipping it is the most common reason models fail
quietly.

## An EDA routine

1. **Shape and types**: `df.shape`, `df.info()`, `df.head()`.
2. **The target**: its distribution; for classification, the class balance (`value_counts(normalize=True)`).
3. **Each feature**: distribution (histogram, `describe()`), missing values, unique counts.
4. **Feature vs target**: does the feature separate the classes or track the value?
5. **Feature vs feature**: correlations, duplicated information.
6. **Suspicious columns**: IDs, timestamps and anything recorded *after* the outcome (leakage, Stage 6).
7. **Write down findings** and the cleaning or feature decisions they lead to.

## Choosing a chart

| Question | Chart |
|---|---|
| How is one numeric column distributed? | Histogram, box plot |
| How often does each category occur? | Bar chart (sorted) |
| How do two numeric columns relate? | Scatter plot |
| How does a value change over time? | Line chart |
| How does a numeric column differ across categories? | Box or violin plot |
| Which pairs of features correlate? | Correlation heat map |

## Matplotlib and seaborn

```python
import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
df["price"].plot.hist(bins=40, ax=axes[0], title="Price")
sns.boxplot(data=df, x="state", y="price", ax=axes[1])
sns.scatterplot(data=df, x="area", y="price", hue="type", ax=axes[2])
fig.tight_layout()
fig.savefig("reports/eda_overview.png", dpi=150)

corr = df.select_dtypes("number").corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="vlag", center=0)
```

Label axes with units, use titles that state the finding ("Price rises with area, except in Johor"), and avoid 3-D and
pie charts.

## Things EDA catches

- **Class imbalance**: 98% "not fraud" means accuracy is a misleading metric (Stage 6).
- **Skew**: a long right tail suggests a log transform.
- **Leakage**: a feature that predicts the target almost perfectly is usually a bug (for example `refund_date` when
  predicting refunds).
- **Data errors**: impossible values, a spike at a default value such as 0 or 1970-01-01.
- **Correlated features**: two columns carrying the same information (area in m² and in ft²).

## Correlation caution

Pearson correlation only measures *linear* association and is sensitive to outliers; a correlation of 0 does not mean
independence (a U-shaped relationship has correlation near 0). Always look at the scatter plot, too.
