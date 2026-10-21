---
id: ai-08-transformers.l04
title: The transformer architecture
summary: Assembling attention into a transformer block, positional information, encoder/decoder/decoder-only variants, and how size and pretraining scale into LLMs.
objectives:
  - Describe a transformer block and the role of each sub-layer
  - Explain positional encoding and why it is needed
  - Distinguish encoder, decoder and decoder-only models
estimatedMinutes: 50
topics: [ai08.transformer]
resources:
  - { title: "The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", free: true, official: false }
  - { title: "Hugging Face: how transformers work", url: "https://huggingface.co/learn/nlp-course/chapter1/4", free: true, official: true }
  - { title: "Dive into Deep Learning: the Transformer", url: "https://d2l.ai/chapter_attention-mechanisms-and-transformers/transformer.html", free: true, official: true }
---

## The transformer block

A transformer stacks identical **blocks**. Each block has two sub-layers, each wrapped with a **residual connection**
and **layer normalisation** (Stage 7):

1. **Multi-head self-attention** — tokens exchange information (lesson 3).
2. **Position-wise feed-forward network** — a small MLP (Stage 7) applied to each token independently, giving the
   model capacity to transform each representation.

```text
x → LayerNorm → Multi-head attention → + x  (residual)
  → LayerNorm → Feed-forward MLP      → + x  (residual)
```

Residual connections let gradients flow through very deep stacks (Stage 7), and normalisation keeps training stable.
Stacking many such blocks (dozens to over a hundred in large models) builds up richer and richer representations.

## Positional information

Self-attention is **order-agnostic**: by itself it treats the input as a set, so "dog bites man" and "man bites dog"
would look the same. Transformers add **positional information** — classic **positional encodings** added to the token
embeddings, or modern schemes like **rotary embeddings (RoPE)** — so the model knows each token's place. Without it,
word order would be lost.

## Three architectural flavours

The original transformer had an encoder and a decoder; models specialise:

| Type | Attention | Good at | Examples |
|---|---|---|---|
| **Encoder-only** | Bidirectional (sees whole input) | Understanding: classification, embeddings, search | BERT-family |
| **Decoder-only** | Causal (left-to-right) | Generation: next-token prediction | GPT-family, most modern LLMs |
| **Encoder-decoder** | Encoder reads, decoder generates with cross-attention | Transformation: translation, summarisation | T5-family |

Most of today's general LLMs are **decoder-only**: they generate text one token at a time, each new token attending to
all previous ones (causal attention, lesson 3).

## From architecture to LLM

A transformer becomes a large language model through **scale** and **pretraining** (lesson 5): many blocks, wide
layers, billions of parameters, trained to predict the next token over enormous text corpora. Two practical
consequences follow from the architecture:

- **The context window is finite.** Attention is computed over a fixed maximum number of tokens; cost grows with
  sequence length, so there is a hard limit on how much the model can consider at once (lesson 5, and Stage 10's
  retrieval works around it).
- **It is fundamentally a next-token predictor.** Everything the model does — answering, coding, reasoning — emerges
  from repeatedly predicting the most likely next token given the context. Keeping that in mind demystifies both its
  power and its failure modes (lesson 5).

You have now seen the whole stack: text → tokens → embeddings → attention → transformer blocks → next-token
probabilities. The final lesson looks at how these models behave and where they break.
