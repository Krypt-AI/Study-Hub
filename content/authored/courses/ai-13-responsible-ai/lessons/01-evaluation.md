---
id: ai-13-responsible-ai.l01
title: Evaluating LLM systems
summary: Why LLM evaluation is hard, building an eval set, reference-based and reference-free metrics, LLM-as-judge, and evaluating whole systems not just prompts.
objectives:
  - Build an evaluation set and choose appropriate metrics
  - Use and validate LLM-as-judge
  - Evaluate end-to-end systems, including safety, at the system level
estimatedMinutes: 55
topics: [ai13.eval]
resources:
  - { title: "LangSmith: evaluation", url: "https://docs.langchain.com/langsmith/evaluation", free: true, official: true }
  - { title: "OpenAI Evals", url: "https://github.com/openai/evals", free: true, official: false }
  - { title: "Stanford HELM (holistic evaluation)", url: "https://crfm.stanford.edu/helm/", free: true, official: false }
---

## Why it is hard

Evaluating a classifier is easy: compare the predicted label to the gold label (Stage 6). LLM outputs are **open-ended
text** with many acceptable phrasings and no single right answer, so exact-match fails. Evaluation must judge
qualities like correctness, relevance, faithfulness and tone — which are fuzzier and partly subjective. Yet without
evaluation you cannot tell if a change (prompt, model, RAG setup) helped, so it is not optional; it just takes more
design.

## Build an eval set

As in Stage 6, start with a **representative dataset**: real or realistic inputs covering the common cases, the edge
cases, and known failure modes. For each, record what a good output looks like — a reference answer, or the criteria
it must meet. Keep it **versioned** (Stage 2) and grow it with every bug you find (a failure becomes a permanent test
case). This set is the ground truth you measure every change against.

## Metrics: reference-based and reference-free

- **Reference-based** — compare the output to a known-good answer. Exact match works only for constrained outputs
  (a label, a number, extracted JSON — Stage 9). For free text, similarity metrics (embedding similarity, Stage 8) or
  overlap metrics give a rough signal.
- **Reference-free** — judge a property of the output without a gold answer: is it grounded in the provided context
  (faithfulness, Stage 10), does it answer the question, is it safe, does it follow the format? For RAG, the retrieval
  metrics of Stage 10 apply.
- **Task metrics** — where the output drives a downstream outcome, measure that (did the extracted data match the
  record? did the generated code pass the tests?). The most trustworthy signal is an **objective check** when you can
  design one.

## LLM-as-judge

For qualities that need human-like judgement at scale, use an **LLM as a judge**: give a strong model the input, the
output, and clear scoring **criteria** (or a reference), and have it rate or compare. It is cheap and fast, but:

- It must be **validated against human judgement** on a sample — confirm the judge agrees with people before trusting
  it.
- Use **clear rubrics**, and prefer **pairwise comparison** ("is A or B better?") which is more reliable than absolute
  scores.
- Beware biases (position, verbosity, self-preference). Keep a human-reviewed sample as the anchor.

LLM-as-judge is powerful for scaling evaluation, not a replacement for ever looking at outputs yourself.

## Evaluate the system, not just the prompt

A production LLM app is prompts + retrieval + tools + model + glue. Evaluate it **end to end** on realistic tasks, and
also test the pieces (retrieval quality, Stage 10; tool use, Stage 11). Crucially, evaluation includes **safety and
robustness**, not just quality: does it refuse harmful requests, resist prompt injection (lesson 2), avoid leaking
data (lesson 3), and behave on adversarial and out-of-distribution inputs? Run the eval set on every meaningful change
and compare (Stage 6 discipline). A system you can measure — for quality **and** safety — is one you can improve and
trust; the rest of this course is the safety, privacy, fairness and governance dimensions that belong in that eval.
