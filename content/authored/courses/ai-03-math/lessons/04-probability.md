---
id: ai-03-math.l04
title: Probability and Bayes' rule
summary: Events, conditional probability, independence, Bayes' rule with base rates, random variables, expectation and variance, and softmax as a probability distribution.
objectives:
  - Compute conditional probabilities and apply Bayes' rule
  - Explain why base rates matter for classifiers
  - Compute expectation and variance, and turn scores into probabilities with softmax
estimatedMinutes: 55
topics: [ai03.prob]
resources:
  - { title: "Harvard Stat 110: Probability (free lectures and book)", url: "https://projects.iq.harvard.edu/stat110/home", free: true, official: true }
  - { title: "Khan Academy: Statistics and probability", url: "https://www.khanacademy.org/math/statistics-probability", free: true, official: true }
  - { title: "MIT OpenCourseWare 6.041 Probabilistic Systems Analysis", url: "https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/", free: true, official: true }
---

## The basics

- A probability is between 0 and 1. P(not A) = 1 − P(A).
- **Union**: P(A or B) = P(A) + P(B) − P(A and B).
- **Conditional**: P(A | B) = P(A and B) / P(B), "the probability of A among cases where B happened".
- **Independent**: P(A and B) = P(A)·P(B), equivalently P(A | B) = P(A).
- **Mutually exclusive**: P(A and B) = 0. (Exclusive events with non-zero probability are *dependent*: knowing one
  happened tells you the other did not.)

## Bayes' rule

  P(H | E) = P(E | H) · P(H) / P(E), where P(E) = P(E | H)P(H) + P(E | not H)P(not H)

- P(H) is the **prior** (base rate), P(E | H) the **likelihood**, P(H | E) the **posterior**.

### Base rates matter

A disease affects 1 in 1,000 people. A test detects 99% of cases (sensitivity) and wrongly flags 2% of healthy people.
If you test positive:

  P(sick | +) = 0.99·0.001 / (0.99·0.001 + 0.02·0.999) = 0.00099 / 0.02097 ≈ 0.047

Fewer than 5% of positives are truly sick, because healthy people vastly outnumber sick ones. The same effect makes
fraud and intrusion detectors produce many false alarms (Stage 6 calls this low **precision**).

## Random variables

A **random variable** maps outcomes to numbers. For a discrete variable:

- **Expectation** (mean): E[X] = Σ x·P(x)
- **Variance**: Var(X) = E[(X − E[X])²] = E[X²] − E[X]²; the **standard deviation** is √Var.

A fair die: E[X] = 3.5, Var(X) = 35/12 ≈ 2.92.

Linearity: E[aX + b] = aE[X] + b, and E[X + Y] = E[X] + E[Y] always (even when dependent).

## Softmax: scores to probabilities

Classifiers output raw scores (**logits**) z. Softmax turns them into a probability distribution:

  softmax(z)ᵢ = e^{zᵢ} / Σⱼ e^{zⱼ}

```python
import math

def softmax(z):
    m = max(z)                         # subtract the max for numerical stability
    exps = [math.exp(v - m) for v in z]
    total = sum(exps)
    return [e / total for e in exps]

softmax([2.0, 1.0, 0.1])   # ≈ [0.659, 0.242, 0.099]
```

Dividing logits by a **temperature** T before softmax makes the distribution sharper (T < 1) or flatter (T > 1). This is
exactly the `temperature` setting of LLM APIs (Stage 9).

## Naive Bayes

Bayes' rule with the "naive" assumption that features are independent given the class gives a fast text classifier:
P(spam | words) ∝ P(spam) · Π P(word | spam). It is a strong baseline for spam filtering.
