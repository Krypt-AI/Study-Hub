---
id: ai-10-rag.l03
title: Embedding and indexing
summary: Turning chunks into vectors, the vector index and approximate nearest-neighbour search, vector databases, and hybrid search with keywords.
objectives:
  - Build a vector index from chunk embeddings
  - Explain exact versus approximate nearest-neighbour search
  - Describe hybrid search and when to use it
estimatedMinutes: 50
topics: [ai10.indexing]
resources:
  - { title: "Pinecone: vector database basics", url: "https://www.pinecone.io/learn/vector-database/", free: true, official: false }
  - { title: "FAISS (Facebook AI Similarity Search)", url: "https://github.com/facebookresearch/faiss", free: true, official: false }
  - { title: "Weaviate / pgvector docs", url: "https://github.com/pgvector/pgvector", free: true, official: false }
---

## From chunks to vectors

Run every chunk (lesson 2) through an **embedding model** (Stage 8) to get a vector per chunk, and store each vector
alongside its text and metadata. Two rules matter:

- Use the **same embedding model** for indexing the chunks and for embedding queries at search time, or the vectors
  live in different spaces and similarity is meaningless.
- **Normalise** vectors (or use cosine similarity, Stage 3) so length does not distort comparisons.

Embedding the whole corpus is a one-time (per-update) batch job; keep it reproducible and re-run it when documents or
the embedding model change.

## The index and nearest-neighbour search

Given a query vector, retrieval finds the chunks with the **most similar** vectors — the **nearest neighbours** by
cosine similarity. The simplest index compares the query against **every** stored vector (brute force / exact): fine
for thousands of chunks, too slow for millions.

At scale you use **approximate nearest neighbour (ANN)** algorithms (such as HNSW) that find *almost* the best matches
far faster, trading a little accuracy for big speed and memory gains. You tune how approximate: more accuracy vs more
speed.

## Vector databases

A **vector database** stores embeddings, runs ANN search, and adds the production features you need: metadata
filtering (lesson 2), updates and deletes, persistence, scaling and access control. Options range from libraries
(FAISS) and extensions (**pgvector** in PostgreSQL) to dedicated services (Pinecone, Weaviate, Qdrant, Milvus). Choose
by scale, existing infrastructure and operational needs; for a small app, pgvector or an in-memory index is plenty.

## Hybrid search

Dense embeddings capture **meaning** but can miss exact terms — a specific product code, error number or rare name
that does not embed distinctively. **Keyword search** (e.g. BM25) nails exact matches but misses paraphrase. **Hybrid
search** combines both — run each and merge/re-rank the results — and usually beats either alone, especially for
technical content with precise identifiers.

A **re-ranker** (a model that scores each candidate against the query more carefully than the vector similarity) is a
common final step: retrieve a broader set cheaply, then re-rank to pick the best few for the prompt.

## The index is the memory

The index is your RAG system's long-term memory. Its quality — good chunks, the right embedding model, enough recall,
sensible filtering — caps everything downstream: the generator can only ground on what the index returns (lesson 4),
which is why lesson 5 measures retrieval directly. Build the index so you can rebuild it (new data, better embeddings)
without disturbing the rest of the system.
