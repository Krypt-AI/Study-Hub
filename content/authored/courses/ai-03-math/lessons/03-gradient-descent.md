---
id: ai-03-math.l03
title: Gradient descent and loss functions
summary: Loss functions (MSE and cross-entropy), the gradient descent update, learning rates, mini-batches and SGD, momentum and Adam, and convexity.
objectives:
  - Write mean squared error and binary cross-entropy
  - Fit a linear model with gradient descent from scratch
  - Choose a learning rate and recognise divergence and slow convergence
estimatedMinutes: 60
topics: [ai03.optim]
resources:
  - { title: "Google Machine Learning Crash Course: Linear regression and gradient descent", url: "https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent", free: true, official: true }
  - { title: "Stanford CS229 lecture notes", url: "https://cs229.stanford.edu/main_notes.pdf", free: true, official: true }
  - { title: "PyTorch: torch.optim", url: "https://docs.pytorch.org/docs/stable/optim.html", free: true, official: true }
---

## Loss functions

A **loss** turns "how wrong is the model" into one number to minimise.

| Task | Loss | Formula |
|---|---|---|
| Regression | Mean squared error (MSE) | (1/n) Σ (ŷᵢ − yᵢ)² |
| Regression, robust to outliers | Mean absolute error (MAE) | (1/n) Σ \|ŷᵢ − yᵢ\| |
| Binary classification | Binary cross-entropy (log loss) | −(1/n) Σ [yᵢ ln pᵢ + (1 − yᵢ) ln(1 − pᵢ)] |
| Multi-class | Cross-entropy | −(1/n) Σ ln p(correct class) |

Cross-entropy punishes confident wrong answers heavily: predicting p = 0.01 for a true positive costs −ln 0.01 ≈ 4.6,
while p = 0.9 costs only 0.105.

## The update rule

Gradient descent repeats:

  θ ← θ − η · ∇L(θ)

θ are the parameters, η (eta) the **learning rate**, ∇L the gradient of the loss. Step against the gradient, by an
amount proportional to its size.

### Linear regression from scratch

For ŷ = w·x + b with MSE: ∂L/∂w = (2/n) Σ (ŷᵢ − yᵢ)·xᵢ and ∂L/∂b = (2/n) Σ (ŷᵢ − yᵢ).

```python
def fit_line(xs, ys, lr=0.05, steps=2000):
    w, b, n = 0.0, 0.0, len(xs)
    for _ in range(steps):
        errors = [w * x + b - y for x, y in zip(xs, ys)]
        grad_w = 2 / n * sum(e * x for e, x in zip(errors, xs))
        grad_b = 2 / n * sum(errors)
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b

fit_line([0, 1, 2, 3], [1, 3, 5, 7])   # ≈ (2.0, 1.0): y = 2x + 1
```

## Learning rate

| Symptom | Likely cause |
|---|---|
| Loss decreases very slowly | η too small |
| Loss oscillates or grows, becomes `nan` | η too large |
| Loss falls then plateaus | Converged, stuck, or needs a smaller η (use a schedule) |

**Feature scaling** matters: when features have very different ranges, one learning rate cannot suit all of them.
Standardise inputs (mean 0, standard deviation 1) before gradient descent.

## Batch, mini-batch and stochastic

- **Batch** gradient descent uses all examples per step: accurate, slow on big data.
- **Stochastic** (SGD) uses one example: noisy but cheap.
- **Mini-batch** (typically 32–512 examples) is the standard compromise, and matches GPU hardware.
- One **epoch** is one pass through the whole training set.

## Better optimisers

- **Momentum** keeps a running average of past gradients, smoothing noise and speeding along consistent directions.
- **Adam** combines momentum with per-parameter step sizes; it is the default for most deep learning, often with
  η around 1e-3, while **AdamW** adds decoupled weight decay.

## Convexity

A **convex** loss (linear regression with MSE, logistic regression) has a single minimum, so gradient descent with a
suitable η finds it. Neural network losses are non-convex with many minima and saddle points; in practice, wide
networks trained with SGD-style methods still find good solutions.
