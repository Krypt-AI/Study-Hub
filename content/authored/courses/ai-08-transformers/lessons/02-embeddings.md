---
id: ai-08-transformers.l02
title: Embeddings
summary: Dense vector representations of meaning, how similarity is measured, the difference between static and contextual embeddings, and their central role in search and RAG.
objectives:
  - Explain what an embedding is and why geometry encodes meaning
  - Measure similarity with cosine and interpret it
  - Distinguish static word vectors from contextual embeddings
estimatedMinutes: 50
topics: [ai08.embeddings]
resources:
  - { title: "Google ML Crash Course: Embeddings", url: "https://developers.google.com/machine-learning/crash-course/embeddings", free: true, official: true }
  - { title: "Hugging Face: sentence embeddings", url: "https://huggingface.co/blog/getting-started-with-embeddings", free: true, official: true }
  - { title: "TensorFlow Embedding Projector", url: "https://projector.tensorflow.org/", free: true, official: true }
---

## Meaning as geometry

An **embedding** maps a piece of text (a word, sentence or document) to a **dense vector** of a few hundred to a few
thousand numbers, such that **nearby vectors mean similar things**. Unlike a token id (an arbitrary label) or a hash
(no structure), an embedding's geometry carries semantics: "king" and "queen" land near each other, far from
"bicycle".

The classic illustration is that directions can carry meaning — the vector from "man" to "woman" is similar to the one
from "king" to "queen" — so relationships become arithmetic. Modern sentence embeddings extend this to whole texts.

## Measuring similarity

Similarity is **direction**, measured by **cosine similarity** (Stage 3): 1 means the same direction (very similar),
0 unrelated, −1 opposite. It ignores magnitude, which suits text where length should not dominate.

```python
import numpy as np

def cosine(a, b):
    a, b = np.asarray(a), np.asarray(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))
```

To find the best matches to a query, embed the query and every candidate, then rank by cosine similarity — this is the
engine of **semantic search** and **retrieval-augmented generation** (Stage 10), which find by *meaning* rather than
by exact keywords.

## Static versus contextual embeddings

- **Static** embeddings (word2vec, GloVe) give each word one fixed vector regardless of context, so "bank" has a single
  vector blending "river bank" and "money bank".
- **Contextual** embeddings, produced by transformer models, give a word a vector that depends on its **sentence**, so
  "bank" in "river bank" and "bank account" get different vectors. These come from running text through the model
  (lessons 3–4) and are what power today's search and RAG.

Sentence-embedding models are tuned so that whole sentences with similar meaning embed close together, which is what
you use in practice.

## Where embeddings are used

- **Semantic search / RAG** — retrieve passages by meaning (Stage 10).
- **Clustering and classification** — group or label texts by their vectors (Stage 5 methods apply).
- **Recommendation and deduplication** — "find similar" of any kind.
- **Guardrails and routing** — detect whether a query is similar to known categories.

Embeddings are the bridge between unstructured text and the vector maths of machine learning: once text is a vector,
all the tools from the earlier stages apply. The next lessons show how transformers produce these rich,
context-sensitive representations in the first place.
