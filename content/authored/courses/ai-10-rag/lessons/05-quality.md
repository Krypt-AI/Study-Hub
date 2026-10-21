---
id: ai-10-rag.l05
title: Retrieval quality
summary: Measuring a RAG system — retrieval metrics (recall@k, precision, MRR), answer-quality evaluation, building an eval set, and the common failure modes and fixes.
objectives:
  - Measure retrieval with recall@k, precision@k and MRR
  - Evaluate answer faithfulness and relevance
  - Diagnose RAG failures to the right component
estimatedMinutes: 50
topics: [ai10.quality]
resources:
  - { title: "Ragas (RAG evaluation framework)", url: "https://docs.ragas.io/", free: true, official: false }
  - { title: "LangSmith: evaluation", url: "https://docs.langchain.com/langsmith/evaluation", free: true, official: true }
  - { title: "Google ML Crash Course: Classification metrics", url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall", free: true, official: true }
---

## Measure, or you are guessing

A RAG system has two stages that can each fail — **retrieval** and **generation** — so you must measure each. Without
metrics you cannot tell whether a change helped, and "it looked better on one example" is not evidence (Stage 6).

## Retrieval metrics

Build an **evaluation set**: representative questions, each labelled with which chunk(s) actually contain the answer.
Then, for the retriever:

- **Recall@k** — of the relevant chunks, what fraction appear in the top k? The key metric: if the right chunk is not
  retrieved, the generator cannot use it.
- **Precision@k** — of the k retrieved, what fraction are relevant? Low precision means noise crowding the context.
- **MRR (mean reciprocal rank)** — how high up the first relevant chunk appears (1/rank, averaged). Rewards putting
  the right chunk near the top.

These are the Stage 6 metrics applied to retrieval. Tune chunk size/overlap (lesson 2), k, the embedding model and
hybrid/re-ranking (lesson 3) against recall@k first.

## Answer-quality metrics

Even with good retrieval, the generated answer can be wrong. Evaluate it on:

- **Faithfulness / groundedness** — is every claim supported by the retrieved context (no hallucination)?
- **Answer relevance** — does it actually address the question?
- **Context relevance** — were the retrieved chunks on-topic?

These are judged against references or by an **LLM-as-judge** (Stage 13), using tools like Ragas or LangSmith. Track
them over time and per change, exactly as you tracked model metrics in Stage 6.

## Diagnosing failures to the right component

When an answer is bad, localise the cause before fixing:

| Symptom | Likely cause | Fix |
|---|---|---|
| Right chunk never retrieved | Retrieval (low recall@k) | Chunking, embedding model, k, hybrid search |
| Right chunk retrieved but answer ignores it | Generation / prompt | Grounding instructions, fewer chunks, re-rank |
| Answer adds facts not in context | Hallucination | Stronger "only from context", lower k, cite + verify |
| Correct but buried in noise | Precision | Re-ranking, smaller k, better filtering |
| Confident answer to out-of-scope question | No abstain path | Similarity threshold + "I don't know" (lesson 4) |

Fixing the wrong component wastes effort — a better prompt cannot rescue a passage that was never retrieved.

## Keep it honest and current

- Re-run the eval set on every meaningful change (prompt, chunking, model) and compare — the Stage 6 discipline.
- Watch **production** too: log questions, retrieved chunks and answers (with privacy care, Stage 13), and sample
  them for review.
- Maintain the corpus: stale documents produce confident wrong answers no metric on old data will catch.

A measured RAG system is one you can improve deliberately. With retrieval and answer quality tracked, you can push
recall and faithfulness up change by change — turning RAG from a demo that sometimes works into a component you trust,
ready to be given tools (Stage 11), served (Stage 12), and governed (Stage 13).
