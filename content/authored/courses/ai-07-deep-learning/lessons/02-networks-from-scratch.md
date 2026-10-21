---
id: ai-07-deep-learning.l02
title: Neural networks from scratch
summary: Neurons, layers and activation functions, the forward pass of a multilayer perceptron, softmax with cross-entropy, backpropagation and initialisation, written in NumPy.
objectives:
  - Compute a multilayer perceptron's forward pass and count its parameters
  - Choose activation functions and output layers for each task
  - Derive and implement backpropagation for a two-layer network
estimatedMinutes: 60
topics: [ai07.networks]
resources:
  - { title: "Dive into Deep Learning (free book): Multilayer perceptrons", url: "https://d2l.ai/chapter_multilayer-perceptrons/index.html", free: true, official: true }
  - { title: "Stanford CS231n notes: Neural networks", url: "https://cs231n.github.io/neural-networks-1/", free: true, official: true }
  - { title: "Deep Learning book (Goodfellow, Bengio, Courville), free online", url: "https://www.deeplearningbook.org/", free: true, official: true }
---

## From neuron to network

A **neuron** computes a weighted sum and applies a non-linear **activation**: a = f(w·x + b). A **layer** is many
neurons sharing the input, which is a matrix product: a = f(Wx + b). A **multilayer perceptron** (MLP) stacks layers:

```text
input (784) → Linear 784→128 → ReLU → Linear 128→10 → softmax → class probabilities
```

Parameters of a linear layer = inputs × outputs + outputs (biases). This network has
784·128 + 128 + 128·10 + 10 = **101,770** parameters.

Without non-linear activations, stacked linear layers collapse into one linear layer: the activation is what lets
networks learn curved decision boundaries.

## Activation functions

| Activation | Formula | Use |
|---|---|---|
| ReLU | max(0, z) | Default for hidden layers; cheap, no saturation for z > 0 |
| GELU / SiLU | Smooth ReLU variants | Transformers (Stage 8) |
| Sigmoid | 1 / (1 + e⁻ᶻ) | Binary output probability |
| Tanh | (eᶻ − e⁻ᶻ)/(eᶻ + e⁻ᶻ) | Older recurrent networks |
| Softmax | e^{zᵢ} / Σ e^{zⱼ} | Multi-class output probabilities |

## Output layer and loss per task

| Task | Output layer | Loss (PyTorch) |
|---|---|---|
| Regression | Linear, 1 unit | `MSELoss` |
| Binary classification | Linear, 1 unit (logit) | `BCEWithLogitsLoss` (sigmoid included) |
| Multi-class | Linear, k units (logits) | `CrossEntropyLoss` (softmax included) |

PyTorch's classification losses take **logits** and apply sigmoid/softmax internally in a numerically stable way: do
not add your own softmax before `CrossEntropyLoss`.

## Softmax + cross-entropy has a beautiful gradient

For logits z, probabilities p = softmax(z) and a one-hot label y, the gradient of cross-entropy with respect to the
logits is simply **p − y**. That is where backpropagation starts for classifiers.

## Backpropagation for a two-layer network

Forward (batch of n rows):

```text
Z1 = X W1 + b1    A1 = ReLU(Z1)    Z2 = A1 W2 + b2    P = softmax(Z2)    L = mean cross-entropy
```

Backward, applying the chain rule layer by layer:

```text
dZ2 = (P − Y) / n
dW2 = A1ᵀ dZ2            db2 = sum of dZ2 over rows
dA1 = dZ2 W2ᵀ
dZ1 = dA1 * (Z1 > 0)     (ReLU passes gradient only where it was active)
dW1 = Xᵀ dZ1             db1 = sum of dZ1 over rows
```

Each gradient has the **same shape as its parameter**, a quick sanity check. Autograd computes exactly this for you;
writing it once makes every later error message make sense.

## Initialisation

Weights start small and random (never all zeros, or every neuron in a layer learns the same thing). **He
initialisation** (variance 2/fan_in) suits ReLU; **Xavier/Glorot** suits tanh and sigmoid. PyTorch layers use sensible
defaults.
