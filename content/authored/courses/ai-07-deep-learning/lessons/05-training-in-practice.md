---
id: ai-07-deep-learning.l05
title: Making training work
summary: A debugging recipe, regularisation (weight decay, dropout, augmentation, early stopping), normalisation layers, learning-rate schedules, mixed precision and transfer learning.
objectives:
  - Follow a step-by-step recipe to debug a network that will not learn
  - Choose regularisation, normalisation and learning-rate schedules
  - Fine-tune a pretrained model with transfer learning
estimatedMinutes: 60
topics: [ai07.practice]
resources:
  - { title: "PyTorch: Transfer learning for computer vision", url: "https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html", free: true, official: true }
  - { title: "PyTorch: Automatic mixed precision", url: "https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html", free: true, official: true }
  - { title: "Google Research: Deep Learning Tuning Playbook", url: "https://github.com/google-research/tuning_playbook", free: true, official: true }
  - { title: "fast.ai: Practical Deep Learning for Coders (free course)", url: "https://course.fast.ai/", free: true, official: true }
---

## A recipe for a network that will not learn

1. **Overfit one batch.** Train on a single batch of 16 examples; loss should go to almost 0. If not, the bug is in
   the model, loss or loop (wrong labels, softmax before CrossEntropyLoss, missing `zero_grad`, wrong shapes).
2. **Check the initial loss.** For k balanced classes it should be about ln k (2.30 for 10 classes).
3. **Check the data.** Plot a few inputs with their labels after all transforms.
4. **Learning rate.** Too high gives `nan` or a bouncing loss; try 3e-4 to 1e-3 for AdamW.
5. Only then scale up: full data, bigger model, regularisation.

## Regularisation

| Technique | How | Notes |
|---|---|---|
| Weight decay | `AdamW(..., weight_decay=0.01)` | Shrinks weights (L2-like) |
| Dropout | `nn.Dropout(p=0.2–0.5)` | Randomly zeroes activations during training; scaled so eval needs no change |
| Data augmentation | Random crops, flips, colour jitter (`torchvision.transforms.v2`) | Only on training data; must keep labels valid |
| Early stopping | Stop when validation loss stops improving for N epochs; keep the best checkpoint | Cheap and effective |
| Label smoothing | `CrossEntropyLoss(label_smoothing=0.1)` | Discourages over-confidence |

## Normalisation layers

- **Batch normalisation** (`nn.BatchNorm2d`) standardises activations across the batch, then learns a scale and
  shift. Speeds up training of CNNs; behaves differently in train and eval mode; weak with tiny batches.
- **Layer normalisation** (`nn.LayerNorm`) standardises across features of each example; used in transformers.

## Learning-rate schedules

A constant rate is rarely best. Common choices: a short **warm-up** then **cosine decay**
(`CosineAnnealingLR`), `OneCycleLR`, or `ReduceLROnPlateau` when validation loss stalls. Call `scheduler.step()` once
per epoch or per batch, as the scheduler's documentation says.

## Mixed precision

On modern GPUs, computing in 16-bit floats roughly doubles speed and halves memory:

```python
with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
    loss = loss_fn(model(x), y)
loss.backward()
```

With float16 (older GPUs) add a `torch.amp.GradScaler` to avoid underflow.

## Transfer learning

Networks pretrained on large datasets have learned general features. Reuse them:

```python
from torchvision.models import resnet18, ResNet18_Weights
weights = ResNet18_Weights.DEFAULT
model = resnet18(weights=weights)
for p in model.parameters():
    p.requires_grad = False                         # 1. freeze the backbone
model.fc = nn.Linear(model.fc.in_features, 5)       # 2. new head for 5 classes (trainable)
preprocess = weights.transforms()                   # 3. use the same preprocessing as pretraining
```

Train the head first; then optionally unfreeze the later layers and fine-tune with a small learning rate (about 1e-4 or
lower). With a few hundred images per class this usually beats training from scratch by a wide margin. The same idea,
applied to language, is fine-tuning a pretrained transformer (Stage 8).
