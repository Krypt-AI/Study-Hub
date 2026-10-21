---
id: ai-10-rag.l04
title: Retrieval and generation
summary: Assembling the query-time pipeline — retrieve top-k, build a grounded prompt with context and citations, handle "I don't know", and manage the context budget.
objectives:
  - Build a grounded prompt from retrieved chunks
  - Require citations and a truthful "not found" path
  - Budget the context window across chunks and history
estimatedMinutes: 50
topics: [ai10.retrieval]
resources:
  - { title: "Anthropic: long context and grounding tips", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips", free: true, official: true }
  - { title: "OpenAI: retrieval guidance", url: "https://platform.openai.com/docs/guides/retrieval", free: true, official: true }
  - { title: "LangChain: RAG tutorial", url: "https://docs.langchain.com/oss/python/langchain/rag", free: true, official: true }
---

## The query-time pipeline

With an index built (lesson 3), answering a question is:

1. **Embed the question** with the same model as the chunks.
2. **Retrieve** the top-k most similar chunks (and optionally re-rank, lesson 3).
3. **Assemble a prompt**: a system instruction to answer only from the provided context, the retrieved chunks (each
   tagged with its source), and the user's question.
4. **Generate** the answer, with **citations** back to the chunks.

```text
SYSTEM: Answer the question using only the context below. Cite the source id in brackets after each claim.
        If the answer is not in the context, say "I don't know".

CONTEXT:
[doc3 §2] <chunk text>
[doc7 §1] <chunk text>

QUESTION: <user question>
```

## Grounding instructions that matter

The prompt is where RAG's reliability is won or lost (Stage 9's prompting applies):

- **"Answer only from the context."** Stops the model falling back on training memory and inventing.
- **"If it is not in the context, say you don't know."** Gives a truthful escape hatch instead of a hallucination —
  the single most important line.
- **"Cite the source for each claim."** Lets users verify, and makes unsupported claims visible when a citation is
  missing or wrong.
- Tag each chunk with a stable **source id** (from its metadata, lesson 2) so citations are meaningful.

## The context budget

The retrieved chunks, the system prompt, any conversation history (Stage 9) and the answer all share the finite
context window (Stage 8). So you cannot just retrieve 100 chunks:

- Pick a **k** that balances coverage against noise and cost — more chunks can *lower* quality by burying the relevant
  one ("lost in the middle") and raise cost.
- Prefer **fewer, better** chunks (good retrieval + re-ranking) over many mediocre ones.
- Leave room for the question, instructions and the answer.
- Trim or summarise history when it competes with retrieved context.

## When retrieval returns nothing good

If the top chunks are weak (low similarity scores), it is often better to **not answer** than to answer from poor
context. You can threshold on the similarity score and, below it, return "I don't have information on that" — which
users trust far more than a confident wrong answer. This also protects against questions outside your corpus.

## Putting it together

RAG is ultimately a **prompt-construction** problem bolted onto good retrieval: find the right passages, present them
clearly with sources, instruct the model to stay within them and admit ignorance, and respect the context budget. The
remaining question — does it actually retrieve and answer well? — is what lesson 5 measures, because without that you
are flying blind.
