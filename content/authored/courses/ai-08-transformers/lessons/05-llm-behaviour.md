---
id: ai-08-transformers.l05
title: LLM behaviour — capabilities and limits
summary: Pretraining and alignment, what LLMs are good and bad at, hallucination, context windows, decoding and temperature, and the honest mental model for building with them.
objectives:
  - Explain pretraining, instruction tuning and alignment
  - Describe why LLMs hallucinate and how context limits bite
  - Hold an accurate mental model of LLM strengths and weaknesses
estimatedMinutes: 50
topics: [ai08.llm]
resources:
  - { title: "Hugging Face LLM Course", url: "https://huggingface.co/learn/llm-course", free: true, official: true }
  - { title: "Anthropic: Claude Docs — overview", url: "https://docs.claude.com/en/docs/intro", free: true, official: true }
  - { title: "Google: Introduction to Large Language Models", url: "https://developers.google.com/machine-learning/resources/intro-llms", free: true, official: true }
---

## How a chat model comes to be

1. **Pretraining.** A decoder-only transformer (lesson 4) learns to predict the next token over a vast text corpus. It
   absorbs grammar, facts, styles and reasoning patterns — but only to continue text, not to follow instructions.
2. **Instruction tuning.** It is further trained on examples of instructions and good responses, so it learns to *do
   what is asked* rather than merely continue the prompt.
3. **Alignment** (e.g. RLHF / preference optimisation). It is tuned toward helpful, honest and harmless responses
   using human/AI preference feedback. This is what makes a raw next-token predictor into a usable assistant.

The knowledge is frozen at training time (a **knowledge cutoff**); the base model does not know later events or your
private data unless they are supplied in the prompt (Stage 9) or retrieved (Stage 10).

## What LLMs are good and bad at

**Strong at:** fluent language, summarising, rewriting, translation, drafting, classification, extraction, explaining
concepts, and code — anything that is "likely-text completion" over patterns it has seen.

**Weak or unreliable at:**

- **Facts and precision.** It generates *plausible* text, which is not the same as *true* text.
- **Exact arithmetic and counting** (and character-level tasks — recall tokenization, lesson 1). Give it tools.
- **Up-to-date or private information** beyond its cutoff/training data.
- **Faithful reasoning on hard multi-step problems** without help.

## Hallucination

A **hallucination** is a confident, fluent statement that is false. It is not a bug layered on top; it is the direct
consequence of the model optimising for *likely* text. The model has no built-in notion of truth, so when it does not
"know", it produces something that *reads* right. Mitigations are architectural, not wishful:

- **Ground** it in supplied/retrieved sources (Stage 10, RAG) and ask it to cite them.
- **Give it tools** for facts and computation (Stage 11, agents).
- **Verify** outputs; never trust a lone, unchecked claim for anything that matters.
- Lowering **temperature** reduces randomness but does **not** make it truthful.

## Context window and decoding

- **Context window.** The model attends to a fixed maximum number of tokens (input + output). Exceed it and early
  content is dropped. This drives chunking, retrieval and summarisation strategies in later stages.
- **Decoding.** From the next-token distribution, the model samples. **Temperature** scales the distribution (Stage 3):
  low → focused and repetitive, high → diverse and more error-prone. **Top-p / top-k** restrict the candidate tokens.
  These control style and variability, not correctness.

## The honest mental model

Treat an LLM as a **fluent, knowledgeable, confident, and sometimes wrong next-token predictor** with a fixed context
window and no inherent access to truth, the current world, or your data. That framing — not magic, not a database —
is exactly what the rest of the AI Engineering roadmap builds on: prompt it well (Stage 9), ground it in your data
(Stage 10), give it tools and let it act (Stage 11), serve it in production (Stage 12), and evaluate and secure it
(Stage 13).
