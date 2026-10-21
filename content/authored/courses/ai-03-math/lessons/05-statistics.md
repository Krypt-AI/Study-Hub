---
id: ai-03-math.l05
title: Distributions and statistical inference
summary: Common distributions, descriptive statistics, sampling and the central limit theorem, confidence intervals, hypothesis tests and comparing two models fairly.
objectives:
  - Describe data with mean, median, standard deviation and percentiles
  - Use the normal, binomial and uniform distributions
  - Build a confidence interval and interpret a p-value correctly
estimatedMinutes: 60
topics: [ai03.stats]
resources:
  - { title: "OpenIntro Statistics (free textbook)", url: "https://www.openintro.org/book/os/", free: true, official: true }
  - { title: "NIST/SEMATECH e-Handbook of Statistical Methods", url: "https://www.itl.nist.gov/div898/handbook/", free: true, official: true }
  - { title: "Python statistics module", url: "https://docs.python.org/3/library/statistics.html", free: true, official: true }
---

## Describing data

| Statistic | Meaning | Sensitive to outliers? |
|---|---|---|
| Mean | Arithmetic average | Yes |
| Median | Middle value | No |
| Mode | Most common value | No |
| Standard deviation | Typical distance from the mean | Yes |
| Percentiles / IQR | Spread of the middle 50% (Q3 − Q1) | No |

Income, response times and file sizes are **skewed**: a few huge values pull the mean far above the median. Report the
median and percentiles (p50, p95, p99) for such data; latency SLOs in MLOps (Stage 12) are stated as p95 or p99.

Sample variance divides by **n − 1** (Bessel's correction) because the sample mean is itself estimated from the data.

## Distributions you will meet

| Distribution | Models | Parameters |
|---|---|---|
| Bernoulli | One yes/no trial | p |
| Binomial | Number of successes in n trials | n, p; mean np, variance np(1 − p) |
| Uniform | Every value in a range equally likely | a, b |
| Normal (Gaussian) | Sums of many small effects, measurement noise | mean μ, standard deviation σ |
| Poisson | Counts of events per interval (requests per second) | rate λ |

For a normal distribution about 68% of values fall within 1σ of the mean, 95% within 1.96σ (≈ 2σ) and 99.7% within 3σ.
A **z-score** (x − μ)/σ says how many standard deviations a value is from the mean; |z| > 3 is a common outlier rule.

## Sampling and the central limit theorem

You rarely see the whole population, only a **sample**. The **central limit theorem** says the mean of n independent
samples is approximately normal for large n, whatever the original distribution, with standard deviation
σ/√n: the **standard error**. Quadrupling the data halves the standard error.

## Confidence intervals

A 95% confidence interval for a mean: x̄ ± 1.96 · s/√n.

For a model's accuracy measured on n test examples, the standard error is √(p(1 − p)/n). With accuracy 0.90 on 400
examples: √(0.9·0.1/400) = 0.015, so the 95% interval is about 0.90 ± 0.029, roughly 0.87 to 0.93. Two models
scoring 0.90 and 0.91 on that test set are **not** clearly different.

## Hypothesis tests and p-values

1. State a **null hypothesis** H₀ (for example "the new model is no better").
2. Compute a test statistic from the data.
3. The **p-value** is the probability of data at least this extreme *if H₀ were true*.
4. If p is below a threshold α chosen in advance (often 0.05), reject H₀.

Common mistakes:

- A p-value is **not** the probability that H₀ is true.
- "Statistically significant" is not "large" or "important": report the effect size and its interval.
- Testing many variations and reporting the best one inflates false positives (**multiple comparisons**).

To compare two models fairly, evaluate them on the **same** test examples (a paired comparison), use cross-validation or
bootstrap resampling to see the spread, and fix the test set before you start tuning.

## Correlation is not causation

Correlation measures linear association between −1 and 1. Two variables can correlate because a third causes both
(ice-cream sales and drownings both rise in summer). Models learn correlations; they do not prove causes.
