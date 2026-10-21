---
id: ai-07-deep-learning.l03
title: The PyTorch training loop
summary: nn.Module, Dataset and DataLoader, loss functions and optimisers, the five-line training step, train and eval modes, devices, and saving checkpoints.
objectives:
  - Define a model as an nn.Module and feed it with a DataLoader
  - Write a correct training and evaluation loop
  - Move work to the GPU and save and restore checkpoints
estimatedMinutes: 60
topics: [ai07.training]
resources:
  - { title: "PyTorch: Build the neural network", url: "https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html", free: true, official: true }
  - { title: "PyTorch: Datasets and DataLoaders", url: "https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html", free: true, official: true }
  - { title: "PyTorch: Optimizing model parameters", url: "https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html", free: true, official: true }
  - { title: "PyTorch: Saving and loading models", url: "https://docs.pytorch.org/tutorials/beginner/basics/saveloadrun_tutorial.html", free: true, official: true }
---

## A model is an nn.Module

```python
import torch
from torch import nn

class MLP(nn.Module):
    def __init__(self, n_in=784, n_hidden=128, n_out=10):
        super().__init__()
        self.net = nn.Sequential(
            nn.Flatten(),
            nn.Linear(n_in, n_hidden), nn.ReLU(),
            nn.Linear(n_hidden, n_out),          # logits: no softmax
        )

    def forward(self, x):
        return self.net(x)

model = MLP()
sum(p.numel() for p in model.parameters())     # 101,770
```

Layers assigned as attributes are registered automatically, so `model.parameters()` finds every weight.

## Data: Dataset and DataLoader

```python
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

tf = transforms.ToTensor()
train_ds = datasets.FashionMNIST("data", train=True, download=True, transform=tf)
val_ds = datasets.FashionMNIST("data", train=False, download=True, transform=tf)
train_dl = DataLoader(train_ds, batch_size=64, shuffle=True)
val_dl = DataLoader(val_ds, batch_size=256)
```

A **Dataset** returns one `(x, y)` by index; a **DataLoader** batches, shuffles (training only) and can load in
parallel (`num_workers`). For your own data, subclass `Dataset` with `__len__` and `__getitem__`, or use
`TensorDataset(X, y)`.

## The loop

```python
device = "cuda" if torch.cuda.is_available() else "cpu"
model = MLP().to(device)
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

for epoch in range(5):
    model.train()
    for x, y in train_dl:
        x, y = x.to(device), y.to(device)
        logits = model(x)                 # 1. forward
        loss = loss_fn(logits, y)         # 2. loss
        optimizer.zero_grad()             # 3. clear old gradients
        loss.backward()                   # 4. backward
        optimizer.step()                  # 5. update

    model.eval()
    correct = total = 0
    with torch.no_grad():
        for x, y in val_dl:
            x, y = x.to(device), y.to(device)
            correct += (model(x).argmax(dim=1) == y).sum().item()
            total += y.numel()
    print(f"epoch {epoch}: val acc {correct / total:.3f}")
```

- `model.train()` / `model.eval()` switch the behaviour of dropout and batch normalisation (lesson 5). Forgetting
  `eval()` gives noisy, pessimistic validation scores.
- The model **and** each batch must be on the same device.
- Expect about 85–88% validation accuracy on Fashion-MNIST with this MLP; a CNN (lesson 4) does better.

## Checkpoints

```python
torch.save({"model": model.state_dict(), "optimizer": optimizer.state_dict(), "epoch": epoch}, "ckpt.pt")

ckpt = torch.load("ckpt.pt", map_location=device)     # weights_only=True is the default for safety
model.load_state_dict(ckpt["model"]); optimizer.load_state_dict(ckpt["optimizer"])
```

Save the **state dict** (the tensors), not the whole model object. Keep the best checkpoint by validation score, not
the last one.

## Reproducibility

`torch.manual_seed(0)` (plus NumPy and Python seeds) makes runs repeatable on the same hardware; some GPU operations are
still non-deterministic unless you enable `torch.use_deterministic_algorithms(True)`.
