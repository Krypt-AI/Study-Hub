---
id: ai-08-transformers.l03
title: Attention
summary: The attention mechanism at the heart of transformers — queries, keys and values, scaled dot-product attention, self- versus cross-attention, and multi-head attention.
objectives:
  - Explain attention as a weighted lookup using queries, keys and values
  - Compute scaled dot-product attention with softmax
  - Describe self-attention and multi-head attention
estimatedMinutes: 55
topics: [ai08.attention]
resources:
  - { title: "Attention Is All You Need (Vaswani et al., 2017)", url: "https://arxiv.org/abs/1706.03762", free: true, official: true }
  - { title: "The Illustrated Transformer (Jay Alammar)", url: "https://jalammar.github.io/illustrated-transformer/", free: true, official: false }
  - { title: "Dive into Deep Learning: Attention mechanisms", url: "https://d2l.ai/chapter_attention-mechanisms-and-transformers/index.html", free: true, official: true }
---

## The idea: a soft, learned lookup

**Attention** lets each position in a sequence pull in information from the other positions that are **relevant** to
it, with the relevance learned from data. For "it" in "the cat sat because **it** was tired", attention lets "it"
draw strongly on "cat". It is like a dictionary lookup, but soft: instead of one exact match, you get a weighted
blend of all entries by how well each matches.

## Queries, keys and values

Each token is projected into three vectors:

- **Query (Q)** — what this token is looking for.
- **Key (K)** — what each token offers, to be matched against queries.
- **Value (V)** — the information each token passes on if attended to.

The attention score between a query and a key is their **dot product** (Stage 3): high when they point the same way.
Softmax (Stage 3) turns the scores for one query into weights that sum to 1, and the output is the weighted sum of the
values.

## Scaled dot-product attention

For matrices Q, K, V (one row per token):

  Attention(Q, K, V) = softmax( Q Kᵀ / √dₖ ) V

- **Q Kᵀ** gives every query-key score at once (a token-by-token grid).
- **÷ √dₖ** (the key dimension) keeps the scores from growing too large, which would make softmax too peaky — the
  "scaled" part.
- **softmax** per row turns scores into attention weights.
- multiplying by **V** blends the values by those weights.

It is all matrix multiplies (Stage 3), which is why it runs fast in parallel on GPUs — a key reason transformers
scaled.

## Self-attention vs cross-attention

- **Self-attention**: Q, K and V all come from the **same** sequence — every token attends to every token in its own
  context. This is the core of the transformer.
- **Cross-attention**: queries come from one sequence and keys/values from another (e.g. a decoder attending to an
  encoder's output in translation).

In generative LLMs, attention is usually **causal (masked)**: a token may attend only to earlier tokens, not future
ones, so the model predicts the next token without peeking ahead.

## Multi-head attention

Instead of one attention, transformers run several **heads** in parallel, each with its own learned Q/K/V
projections. Different heads learn to focus on different relationships — syntax, coreference, position — and their
outputs are concatenated and combined. **Multi-head attention** gives the model several "views" of the token
interactions at once, which is far more expressive than a single attention.

Attention is the mechanism; the next lesson assembles it, with the feed-forward layers, normalisation and residual
connections (Stage 7), into the full transformer block.
