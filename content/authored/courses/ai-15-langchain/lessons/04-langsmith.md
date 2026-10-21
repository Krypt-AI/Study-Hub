---
id: ai-15-langchain.l04
title: Testing and monitoring with LangSmith
summary: The testing, deploying and monitoring parts of the agent lifecycle — tracing, evaluation datasets and evaluators, LLM-as-judge, and production observability — with LangSmith.
objectives:
  - Use tracing to debug an agent's steps
  - Build an evaluation dataset and run evaluators
  - Monitor agents in production and close the lifecycle loop
estimatedMinutes: 55
topics: [ai15.langsmith]
resources:
  - { title: "LangSmith: observability (tracing)", url: "https://docs.langchain.com/langsmith/observability", free: true, official: true }
  - { title: "LangSmith: evaluation", url: "https://docs.langchain.com/langsmith/evaluation", free: true, official: true }
  - { title: "LangSmith: evaluation quickstart", url: "https://docs.langchain.com/langsmith/evaluation-quickstart", free: true, official: true }
---

LangChain builds agents; **LangSmith** is how you **test, deploy-check and monitor** them — the second half of the
agent development lifecycle the LCAE exam covers. It applies the evaluation and monitoring disciplines from Stages 6,
12 and 13 to LangChain apps specifically.

## Tracing (observability)

With tracing on (lesson 0), every run is recorded as a **trace**: the full tree of model calls, tool calls, inputs,
outputs, tokens and latency. For an agent that takes many hidden steps (Stage 11), this is how you actually see *why*
it did something — which tool it called, what the model reasoned, where it went wrong. Tracing is the single most
useful thing for debugging agents; turn it on from day one.

## Evaluation on datasets

Testing an agent means running it over a **dataset** of examples and scoring the results (Stages 6, 13):

1. **Create a dataset** — examples with `inputs` and reference `outputs` (the eval set from Stage 13, stored in
   LangSmith).
2. **Define a target** — the function/agent under test.
3. **Define evaluators** — functions that score each output: exact/structured checks, or an **LLM-as-judge**
   (Stage 13) for open-ended quality, with a feedback key like `correctness`.
4. **Run `evaluate`** — it runs the target over the dataset, applies the evaluators, and reports results in the UI so
   you can compare experiments.

```python
# shape only — copy the current API from the evaluation quickstart
from langsmith import Client
client = Client()
client.evaluate(target, data="my-dataset", evaluators=[correctness_evaluator],
                experiment_prefix="agent-v2")
```

Run this on every change (prompt, model, tools, graph) and compare experiments — the Stage 6 discipline, built in.
Include **safety and injection** cases (Stage 13), not just happy-path quality.

## Deploying and monitoring

- **Pre-deploy checks** — the evaluation suite is your gate: promote a new agent version only if it beats the current
  one on the dataset (Stage 12's quality gate).
- **Production monitoring** — traces continue in production, so you can watch latency, cost/tokens, error rate and
  failures live (Stage 12), filter and inspect bad runs, and collect real examples.
- **Feedback and curation** — capture user feedback and flagged runs, and **add them to the dataset** so the eval set
  reflects reality and the next version is tested against real failures (Stages 12–13 feedback loop).

## Closing the lifecycle

Put together, this course is the agent development lifecycle the LCAE exam is organised around:

1. **Build** — models, messages, tools, `create_agent`, and LangGraph for custom flow (lessons 1–3).
2. **Test** — LangSmith datasets and evaluators, including safety (this lesson).
3. **Deploy** — gate on evaluation, version the agent, roll out carefully (Stage 12).
4. **Monitor** — traces, metrics and feedback in production, feeding back into the dataset (this lesson).

That loop — and the responsible-AI concerns threaded through it (Stage 13) — is what turns a LangChain demo into an
agent you can run, trust and improve. Work through the free LangChain Academy courses next to prepare for the LCAE
exam, and keep every claim in your prompts and tools backed by evaluation.
