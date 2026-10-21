---
id: ai-07-deep-learning.l01
title: Tensors and autograd
summary: PyTorch tensors, dtypes and devices, how autograd records a computation graph, backward passes and gradient accumulation.
objectives:
  - Create and manipulate tensors and move them between devices
  - Explain how autograd builds a graph and computes gradients
  - Use requires_grad, backward, no_grad and detach correctly
estimatedMinutes: 50
topics: [ai07.tensors]
resources:
  - { title: "PyTorch: Learn the basics", url: "https://docs.pytorch.org/tutorials/beginner/basics/intro.html", free: true, official: true }
  - { title: "PyTorch: Tensors", url: "https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html", free: true, official: true }
  - { title: "PyTorch: Automatic differentiation with torch.autograd", url: "https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html", free: true, official: true }
---

## Tensors

A tensor is PyTorch's NumPy-like array, with two extras: it can live on a **GPU**, and it can **track gradients**.

```python
import torch
t = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
torch.zeros(2, 3), torch.ones(4), torch.randn(64, 784)   # standard normal
t.shape, t.dtype, t.device          # torch.Size([2, 2]), torch.float32, cpu
t @ t, t * 2, t.sum(dim=0), t.mean()
t.reshape(4), t.T, t.unsqueeze(0).shape   # (1, 2, 2): add a batch dimension
torch.from_numpy(np_array); t.numpy()     # share memory with NumPy (CPU tensors)
t = t.to("cuda")                          # move to the GPU (if available)
```

NumPy uses `axis`, PyTorch uses `dim`; broadcasting rules are the same. Deep learning uses **float32** by default
(and float16/bfloat16 for speed on GPUs). Labels for classification are **int64** (`torch.long`).

## Autograd: gradients for free

Mark tensors whose gradient you need with `requires_grad=True`. Every operation on them is recorded in a
**computation graph**; `backward()` walks the graph in reverse, applying the chain rule (Stage 3) to fill `.grad`.

```python
w = torch.tensor(2.0, requires_grad=True)
b = torch.tensor(0.5, requires_grad=True)
x, y = torch.tensor(3.0), torch.tensor(7.0)

y_hat = w * x + b            # forward: 6.5
loss = (y_hat - y) ** 2      # 0.25
loss.backward()              # backward
w.grad, b.grad               # dL/dw = 2(y_hat − y)·x = −3.0, dL/db = 2(y_hat − y) = −1.0
```

## Three rules that prevent bugs

1. **Gradients accumulate.** Each `backward()` *adds* to `.grad`. Clear them every step with
   `optimizer.zero_grad()` (or `w.grad = None`).
2. **Update weights without tracking**: an update is not part of the model's computation.
   ```python
   with torch.no_grad():
       w -= 0.1 * w.grad
       b -= 0.1 * b.grad
   ```
3. **Evaluation and inference run under `torch.no_grad()`** (or `torch.inference_mode()`), which saves memory and
   time. `t.detach()` returns a tensor cut off from the graph, for example to log a value or convert it to NumPy.

`loss.item()` turns a one-element tensor into a Python number; use it for logging so you do not keep the whole graph
alive.

## Gradient descent with autograd

```python
xs = torch.tensor([0.0, 1.0, 2.0, 3.0]); ys = torch.tensor([1.0, 3.0, 5.0, 7.0])
w = torch.zeros((), requires_grad=True); b = torch.zeros((), requires_grad=True)
for step in range(500):
    loss = ((w * xs + b - ys) ** 2).mean()
    loss.backward()
    with torch.no_grad():
        w -= 0.05 * w.grad; b -= 0.05 * b.grad
    w.grad = None; b.grad = None
print(w.item(), b.item())     # ≈ 2.0, 1.0
```

This is Stage 3's `fit_line`, with the derivative work done by autograd instead of by hand.
