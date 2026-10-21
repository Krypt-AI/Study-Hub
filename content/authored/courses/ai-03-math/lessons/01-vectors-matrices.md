---
id: ai-03-math.l01
title: Vectors and matrices
summary: Vectors as data points, dot products and similarity, norms, matrix multiplication and shapes, and why neural networks are mostly matrix products.
objectives:
  - Compute dot products, norms and cosine similarity
  - Multiply matrices and predict the result's shape
  - Read a dense layer as y = Wx + b
estimatedMinutes: 55
topics: [ai03.linalg]
resources:
  - { title: "MIT OpenCourseWare 18.06 Linear Algebra (Gilbert Strang)", url: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", free: true, official: true }
  - { title: "Khan Academy: Linear algebra", url: "https://www.khanacademy.org/math/linear-algebra", free: true, official: true }
  - { title: "NumPy: the absolute basics for beginners", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", free: true, official: true }
  - { title: "Mathematics for Machine Learning (free book PDF)", url: "https://mml-book.github.io/", free: true, official: true }
---

## Vectors are data

A **vector** is an ordered list of numbers. In ML each example is a vector of features: a house might be
`[120, 3, 2]` (area, bedrooms, bathrooms); a word embedding is a vector of hundreds of numbers.

| Operation | Formula | Python |
|---|---|---|
| Addition | (a + b)ᵢ = aᵢ + bᵢ | `a + b` (NumPy) |
| Scaling | (c·a)ᵢ = c·aᵢ | `c * a` |
| Dot product | a·b = Σ aᵢbᵢ | `a @ b` or `np.dot(a, b)` |
| Length (L2 norm) | ‖a‖ = √(Σ aᵢ²) | `np.linalg.norm(a)` |
| L1 norm | Σ \|aᵢ\| | `np.abs(a).sum()` |

### Dot product and cosine similarity

The dot product measures how much two vectors point the same way: a·b = ‖a‖‖b‖cos θ. Dividing out the lengths gives
**cosine similarity**, the standard similarity for embeddings in search and RAG (Stage 10):

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))

cosine([1, 0], [1, 0])    # 1.0  same direction
cosine([1, 0], [0, 1])    # 0.0  unrelated (orthogonal)
cosine([1, 0], [-1, 0])   # -1.0 opposite
```

## Matrices

A **matrix** is a grid of numbers with shape (rows, columns). A dataset of 1,000 examples with 20 features is a
(1000, 20) matrix: one row per example.

**Matrix multiplication** C = AB is defined when A's column count equals B's row count:
(m, **n**) × (**n**, p) → (m, p). Each entry Cᵢⱼ is the dot product of row i of A with column j of B.

```python
import numpy as np
A = np.array([[1, 2],
              [3, 4]])          # shape (2, 2)
B = np.array([[5],
              [6]])             # shape (2, 1)
A @ B                           # [[17], [39]]  shape (2, 1)
```

- Matrix multiplication is **not commutative**: AB ≠ BA in general.
- The **transpose** Aᵀ swaps rows and columns: shape (m, n) → (n, m).
- The **identity** matrix I leaves vectors unchanged: IA = A.
- **Element-wise** multiplication (`A * B` in NumPy) is a different operation from `A @ B`.

## A neural network layer is a matrix product

A dense layer with 784 inputs and 10 outputs stores a weight matrix W of shape (10, 784) and a bias b of shape (10,):

  y = W x + b

For a **batch** of 32 images stacked as rows, X has shape (32, 784) and the layer computes X Wᵀ + b → (32, 10).
Checking shapes is the fastest way to debug model code: write the shape of every tensor next to the line.

## Broadcasting (NumPy)

NumPy stretches dimensions of size 1 to match: adding b (shape (10,)) to a (32, 10) result adds b to every row. It is
convenient, and also the source of silent bugs when shapes are not what you think; check `.shape` often.
