---
id: ai-14-capstone.l03
title: Evaluating and hardening
summary: Proving the project works and making it solid — a real evaluation with honest limitations, edge cases and errors, security and privacy basics, and a reproducible run.
objectives:
  - Produce a credible evaluation with stated limitations
  - Handle edge cases, errors and basic security/privacy
  - Make the project run from a fresh clone
estimatedMinutes: 50
topics: [ai14.harden]
resources:
  - { title: "OWASP Top 10 for LLM Applications", url: "https://genai.owasp.org/llm-top-10/", free: true, official: true }
  - { title: "Model Cards (documentation)", url: "https://huggingface.co/docs/hub/model-cards", free: true, official: true }
  - { title: "The Twelve-Factor App", url: "https://12factor.net/", free: true, official: false }
---

## A credible evaluation

A capstone is only believable with evidence it works (Stages 6, 13). Present:

- The **metric(s)** on a proper held-out test set (or cross-validation), with the **baseline** for comparison.
- An honest statement of **uncertainty** (a confidence interval or fold spread, Stage 3) — "0.90 ± 0.03", not a bare
  "0.90".
- **Where it fails**: example error cases, the inputs it struggles with, and the known limitations. For LLM/RAG,
  include faithfulness and a few adversarial/safety cases (Stages 10, 13).

Stating limitations does not weaken a project; it is exactly what distinguishes an engineer from a hype merchant, and
reviewers trust it more.

## Edge cases and errors

Move the project from "works in the happy path" to "behaves when things go wrong" (Stages 9, 12):

- **Validate inputs** and handle bad ones with clear errors, not crashes.
- Handle **empty, malformed, or out-of-distribution** inputs sensibly (e.g. a RAG system that declines when it has no
  good context, Stage 10).
- For anything calling an API, handle **failures, timeouts and rate limits** (Stage 9).
- Add a few **tests** for the core logic (Stage 2).

## Security and privacy basics

Even a portfolio project should get the basics right (Stages 2, 13):

- **No secrets in the repo** — environment variables, `.env` git-ignored; check before every push.
- If it handles personal data, **minimise and redact** it and say what it does with data (Stage 13).
- For LLM apps, treat inputs and outputs as untrusted (prompt injection, output handling — Stage 13) and keep any
  tools least-privileged (Stage 11).

These are quick to do and conspicuous by their absence to anyone reviewing your code.

## Reproducible and documented

Finally, make it **run from a fresh clone**:

- Pinned dependencies, a documented setup, and a single command (or clear steps) to run it (Stage 2).
- A **README** that states the problem, how to set up and run, the results, and the limitations.
- A short **model/system card** (Stage 13) for anything consequential: intended use, data, evaluation, limits.
- If you containerised or served it (Stage 12), document that too.

Test the instructions yourself in a clean environment — the classic failure is a project that only runs on the
author's machine. A project that is evaluated honestly, handles the unhappy path, keeps secrets out, and runs from a
clean clone is one you can stand behind — ready to present (lesson 4).
