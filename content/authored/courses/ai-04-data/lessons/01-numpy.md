---
id: ai-04-data.l01
title: NumPy arrays and vectorised computation
summary: Creating arrays, dtypes and shapes, indexing and boolean masks, vectorised arithmetic, axes and aggregation, broadcasting and reshaping.
objectives:
  - Create arrays and read their shape and dtype
  - Select data with slicing, fancy indexing and boolean masks
  - Replace loops with vectorised operations, axis aggregations and broadcasting
estimatedMinutes: 55
topics: [ai04.numpy]
resources:
  - { title: "NumPy: the absolute basics for beginners", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", free: true, official: true }
  - { title: "NumPy: Broadcasting", url: "https://numpy.org/doc/stable/user/basics.broadcasting.html", free: true, official: true }
  - { title: "NumPy: Indexing on ndarrays", url: "https://numpy.org/doc/stable/user/basics.indexing.html", free: true, official: true }
---

## Arrays

```python
import numpy as np

a = np.array([1.0, 2.0, 3.0])          # from a list
z = np.zeros((2, 3))                    # 2 rows, 3 columns of 0.0
r = np.arange(0, 10, 2)                 # [0 2 4 6 8]
g = np.random.default_rng(seed=0).normal(size=(1000, 4))   # reproducible random data

g.shape   # (1000, 4)
g.ndim    # 2
g.dtype   # float64
```

Unlike lists, an array holds **one dtype** in one contiguous block of memory. That is what makes it fast and what
deep learning tensors (Stage 7) build on. Use `float32` to halve memory when precision allows.

## Indexing

```python
X = np.arange(12).reshape(3, 4)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]
X[1, 2]        # 6        row 1, column 2
X[:, 0]        # [0 4 8]  every row, column 0
X[0:2, 1:3]    # [[1 2] [5 6]]
X[[0, 2]]      # rows 0 and 2 (fancy indexing)
X[X > 6]       # [ 7  8  9 10 11] boolean mask
```

Slices are **views** that share memory with the original; changing them changes `X`. Use `.copy()` when you need an
independent array. Boolean masks and fancy indexing always return copies.

## Vectorised operations

```python
prices = np.array([10.0, 25.5, 4.0])
prices * 1.06               # element-wise, no loop
np.sqrt(prices)             # universal functions (ufuncs) work element by element
np.where(prices > 5, "high", "low")
```

A rule of thumb: if you write a Python `for` loop over array elements, look for the vectorised version.

## Axes and aggregation

For a 2-D array, **axis 0 runs down the rows** (collapsing them) and **axis 1 runs across the columns**:

```python
X.sum()          # 66 everything
X.sum(axis=0)    # [12 15 18 21]  one value per column
X.sum(axis=1)    # [ 6 22 38]     one value per row
X.mean(axis=0), X.std(axis=0), X.max(axis=1), X.argmax(axis=1)
```

`argmax(axis=1)` on a matrix of class scores gives each row's predicted class.

## Broadcasting

Arrays of different shapes combine when, comparing shapes from the right, each dimension is equal or 1:

```python
X = g                        # (1000, 4)
mu = X.mean(axis=0)          # (4,)
sigma = X.std(axis=0)        # (4,)
X_std = (X - mu) / sigma     # (1000, 4): every row standardised, no loop
```

Shape (1000, 4) with (4,) works; (1000, 4) with (1000,) does not, because the trailing dimensions 4 and 1000 differ. Use
`X - v[:, None]` (shape (1000, 1)) to subtract one value per row.

## Reshaping

`reshape` changes the shape without copying data (the total size must match; `-1` means "work it out"):
`np.arange(12).reshape(3, -1)` gives shape (3, 4). `X.T` transposes, `np.concatenate` and `np.stack` join arrays,
`X.ravel()` flattens.
