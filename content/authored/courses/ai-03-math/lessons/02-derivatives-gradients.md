---
id: ai-03-math.l02
title: Derivatives, gradients and the chain rule
summary: What a derivative measures, the rules you need, partial derivatives and gradients, the chain rule behind backpropagation, and checking derivatives numerically.
objectives:
  - Differentiate polynomials, exponentials and logs with the basic rules
  - Compute a gradient of a function of several variables
  - Apply the chain rule and verify a derivative numerically
estimatedMinutes: 55
topics: [ai03.calculus]
resources:
  - { title: "MIT OpenCourseWare 18.01 Single Variable Calculus", url: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/", free: true, official: true }
  - { title: "Khan Academy: Multivariable calculus", url: "https://www.khanacademy.org/math/multivariable-calculus", free: true, official: true }
  - { title: "Mathematics for Machine Learning, chapter 5 (Vector calculus)", url: "https://mml-book.github.io/", free: true, official: true }
---

## What a derivative tells you

The derivative f′(x) is the **slope** of f at x: how fast f changes when x changes a little.

  f′(x) ≈ (f(x + h) − f(x − h)) / 2h  for a small h

In training, f is the **loss** and x are the model's **parameters**. The derivative says which way to nudge each
parameter to make the loss smaller.

## Rules worth knowing

| Function | Derivative |
|---|---|
| c (constant) | 0 |
| xⁿ | n·xⁿ⁻¹ |
| eˣ | eˣ |
| ln x | 1/x |
| c·f(x) | c·f′(x) |
| f + g | f′ + g′ |
| f·g (product rule) | f′g + fg′ |
| f(g(x)) (chain rule) | f′(g(x))·g′(x) |
| σ(x) = 1/(1 + e⁻ˣ) (sigmoid) | σ(x)(1 − σ(x)) |

Example: f(x) = (3x + 1)². Outer u² has derivative 2u; inner 3x + 1 has derivative 3. So f′(x) = 2(3x + 1)·3 = 6(3x + 1).

## Partial derivatives and the gradient

For a function of several variables, a **partial derivative** ∂f/∂xᵢ treats every other variable as a constant.
The **gradient** ∇f collects them into a vector that points in the direction of steepest increase.

  f(w, b) = (w·2 + b − 5)²
  ∂f/∂w = 2(2w + b − 5)·2  ∂f/∂b = 2(2w + b − 5)·1

At w = 1, b = 0: the error 2 + 0 − 5 = −3, so ∇f = (−12, −6). Both are negative: increasing w and b reduces the loss.

## The chain rule is backpropagation

A network is a chain of functions: input → layer → activation → layer → loss. The chain rule multiplies local
derivatives along that chain, from the loss back to each weight. Frameworks (PyTorch autograd, Stage 7) record the
operations in a forward pass and apply the chain rule automatically in the backward pass.

```text
x ──(×w)──► z ──(σ)──► a ──(loss)──► L
∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w = ∂L/∂a · σ(z)(1 − σ(z)) · x
```

The product also explains **vanishing gradients**: σ′ is at most 0.25, so many sigmoid layers multiply many small
numbers and the gradient reaching early layers shrinks towards zero. ReLU activations largely avoid this.

## Numerical gradient checking

When you derive a gradient by hand, check it with central differences:

```python
def numeric_derivative(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)

numeric_derivative(lambda x: x ** 3, 2.0)   # ≈ 12.0, and 3·2² = 12
```

If the analytic and numeric values disagree beyond about 1e-6 relative error, the analytic formula is wrong.
