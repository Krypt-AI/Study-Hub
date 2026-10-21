---
id: ai-10-rag.l01
title: Why RAG
summary: The knowledge problem RAG solves, the retrieve-then-generate pattern, how it compares with fine-tuning and long context, and its limits.
objectives:
  - Explain why grounding beats relying on model memory
  - Describe the retrieve-then-generate pipeline end to end
  - Choose between RAG, fine-tuning and long context
estimatedMinutes: 45
topics: [ai10.why]
resources:
  - { title: "Original RAG paper (Lewis et al., 2020)", url: "https://arxiv.org/abs/2005.11401", free: true, official: true }
  - { title: "Anthropic: retrieval and RAG guidance", url: "https://docs.claude.com/en/docs/build-with-claude/embeddings", free: true, official: true }
  - { title: "Hugging Face: RAG overview", url: "https://huggingface.co/docs/transformers/model_doc/rag", free: true, official: true }
---

## The knowledge problem

An LLM knows only what was in its training data, up to its cutoff, and it does not know your private documents (Stage
8). Asking it about your company's policies, last week's news or a specific manual invites **hallucination** — fluent
guesses. **Retrieval-augmented generation (RAG)** fixes this by *fetching the relevant text and putting it in the
prompt*, so the model answers from real, current, specific material rather than memory.

## The retrieve-then-generate pattern

RAG has two phases:

**Indexing (offline, once per corpus):**
1. **Load** your documents.
2. **Chunk** them into passages (lesson 2).
3. **Embed** each chunk into a vector (Stage 8) and store it in a **vector index** (lesson 3).

**Query (at request time):**
4. **Embed the question** and **retrieve** the most similar chunks (lesson 4).
5. **Generate**: put the question + retrieved chunks in the prompt and ask the model to answer from them, with
   citations.

```text
question → embed → search index → top-k chunks → [question + chunks] → LLM → grounded answer + sources
```

The LLM is unchanged; you are feeding it the right context just in time.

## RAG vs fine-tuning vs long context

Three ways to give a model new knowledge; they solve different problems:

| Approach | Good for | Weak for |
|---|---|---|
| **RAG** | Changing, large, private, citeable knowledge; update data without retraining | Needs a retrieval pipeline; quality depends on retrieval |
| **Fine-tuning** | Teaching *style, format or behaviour*; narrow consistent tasks | Facts (bakes them in, hard to update, no citations) |
| **Long context** | Pasting a modest, known set of documents directly into the prompt | Large/changing corpora (cost, limits); still needs selecting what to paste |

A good rule: **RAG for knowledge, fine-tuning for behaviour.** They combine — fine-tune how the model responds, use
RAG for what it responds about. Even with large context windows, retrieval is usually cheaper and more precise than
stuffing everything in.

## Limits to keep in mind

- **Garbage in, garbage out.** If retrieval returns the wrong passages, the answer is wrong — retrieval quality is the
  make-or-break (lesson 5).
- **It does not reason beyond the retrieved text.** RAG grounds facts; complex multi-step reasoning still needs good
  prompting (Stage 9) or tools/agents (Stage 11).
- **Stale or wrong sources** produce confident wrong answers; the knowledge base must be maintained.
- **Citations must be checked.** Ask for them (lesson 4), but a cited claim can still misread its source.

RAG is the most common way production LLM apps become useful on real, specific data. The rest of this course builds
each piece and then measures whether it actually works.
