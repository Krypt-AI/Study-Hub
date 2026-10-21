---
id: ai-07-deep-learning.l04
title: Convolutional neural networks
summary: Why images need convolutions, filters, stride and padding, pooling, output-size arithmetic, a small CNN in PyTorch, and landmark architectures.
objectives:
  - Compute a convolution and the output size of a conv layer
  - Build a small CNN in PyTorch
  - Explain what makes ResNet-style architectures train well
estimatedMinutes: 55
topics: [ai07.cnn]
resources:
  - { title: "Stanford CS231n notes: Convolutional networks", url: "https://cs231n.github.io/convolutional-networks/", free: true, official: true }
  - { title: "Dive into Deep Learning: Convolutional neural networks", url: "https://d2l.ai/chapter_convolutional-neural-networks/index.html", free: true, official: true }
  - { title: "PyTorch: Training a classifier (CIFAR-10)", url: "https://docs.pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html", free: true, official: true }
---

## Why not an MLP for images?

A 224 × 224 colour image has 150,528 inputs; one dense layer of 1,000 units would need 150 million weights, and it
would treat a cat in the top-left as unrelated to the same cat in the bottom-right. Convolutions fix both:

- **Local connectivity**: each output looks at a small patch (for example 3 × 3).
- **Weight sharing**: the same filter slides over the whole image, so it detects a pattern anywhere.

## The convolution operation

A filter (kernel) is a small grid of weights. At each position, multiply it element-wise with the patch underneath and
sum. Early filters learn edges and colours; deeper layers combine them into textures, parts and objects.

**Output size** for input width W, kernel K, padding P and stride S:

  out = ⌊(W − K + 2P) / S⌋ + 1

- 32 × 32 input, 3 × 3 kernel, P = 1, S = 1 → 32 ("same" padding).
- 32 × 32, 3 × 3, P = 0, S = 1 → 30.
- 32 × 32, 2 × 2, S = 2 (typical pooling) → 16.

A conv layer with C_in input channels and C_out filters of size K × K has C_out·(C_in·K·K + 1) parameters:
`nn.Conv2d(3, 16, 3)` has 16·(3·9 + 1) = **448**.

## Pooling

**Max pooling** keeps the largest value in each window, halving the width and height with a 2 × 2 window and stride 2.
It reduces computation and adds a little translation invariance. Modern networks often use strided convolutions
instead, and **global average pooling** before the classifier.

## A small CNN in PyTorch

```python
from torch import nn

cnn = nn.Sequential(
    nn.Conv2d(1, 32, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),   # 28→14
    nn.Conv2d(32, 64, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),  # 14→7
    nn.Flatten(),
    nn.Linear(64 * 7 * 7, 128), nn.ReLU(),
    nn.Linear(128, 10),
)
```

PyTorch images are **(batch, channels, height, width)**. Dropped into the lesson 3 loop, this reaches about 91% on
Fashion-MNIST.

## Landmark architectures

| Network | Idea |
|---|---|
| LeNet (1998) | Conv + pool + dense for digits |
| AlexNet (2012) | Deep CNN on GPUs with ReLU and dropout won ImageNet |
| VGG (2014) | Stacks of small 3 × 3 convolutions |
| ResNet (2015) | **Residual connections** y = x + F(x) let gradients flow through 100+ layers |
| EfficientNet, ConvNeXt | Scaled, modernised CNNs |
| Vision Transformer (2020) | Image patches as tokens with attention (Stage 8) |

Residual connections are the single most important trick: they reappear in every transformer.
