---
id: ai-10-rag.l02
title: Chunking
summary: Splitting documents into retrievable passages, why chunk size and overlap matter, structure-aware chunking, and attaching metadata.
objectives:
  - Explain why documents are chunked and how size affects retrieval
  - Apply overlap and structure-aware splitting
  - Attach metadata for filtering and citation
estimatedMinutes: 50
topics: [ai10.chunking]
resources:
  - { title: "LangChain: text splitters", url: "https://docs.langchain.com/oss/python/langchain/text-splitters", free: true, official: true }
  - { title: "Pinecone: chunking strategies", url: "https://www.pinecone.io/learn/chunking-strategies/", free: true, official: false }
  - { title: "Weaviate: chunking", url: "https://weaviate.io/developers/academy/py/standalone/chunking", free: true, official: false }
---

## Why chunk

You embed and retrieve **passages**, not whole documents. A single embedding summarises its whole input into one
vector, so embedding a 50-page document produces a vague average that matches everything weakly and nothing well, and
retrieving it would dump far too much into the prompt. **Chunking** splits documents into passages small enough to
embed precisely and to fit several into the context window.

## Chunk size: the core trade-off

- **Too small** (a sentence): precise, but a chunk may lack the surrounding context needed to be useful, and answers
  get fragmented across many chunks.
- **Too large** (many pages): one vector blurs several topics, retrieval is imprecise, and each hit costs a lot of
  context.
- **A middle size** (often a few hundred tokens) usually works best; the right value depends on your content and is
  something you **tune by measuring** (lesson 5).

## Overlap

Split points can cut through the middle of a relevant passage. Adding **overlap** — repeating the last part of one
chunk at the start of the next — means information straddling a boundary still appears whole in at least one chunk:

```text
chunk 1: tokens   0–300
chunk 2: tokens 250–550   (50-token overlap with chunk 1)
chunk 3: tokens 500–800
```

Overlap costs some duplication but reduces "the answer was split in half" misses. Typical overlap is 10–20% of the
chunk size.

## Structure-aware chunking

Naively cutting every N characters can split mid-word or mid-sentence. Better splitters respect structure:

- Prefer to break on **paragraph**, then **sentence**, then word boundaries (recursive splitting).
- For Markdown/code, split on **headings** or **functions** so each chunk is a coherent unit.
- Keep tables and lists intact where possible.

The goal is chunks that each make sense on their own, because that is what both the embedder and the LLM will see.

## Metadata

Attach **metadata** to each chunk when indexing: source document, title, section, page, URL, date, and any access
tags. It pays off in two ways:

- **Citation** — you can tell the user (and the model) exactly where an answer came from (lesson 4).
- **Filtering** — you can restrict retrieval by metadata (only this product's docs, only documents the user may see,
  only recent ones), which improves precision and enforces access control.

Chunking is unglamorous but decisive: most RAG quality problems trace back to chunks that were too big, too small, or
cut badly. Build it thoughtfully, then let the quality measurements in lesson 5 tune the size and overlap.
