---
id: ai-13-responsible-ai.l04
title: Fairness and bias
summary: Where bias comes from, the harms it causes, how to measure fairness across groups, mitigation at each stage, and why there is no single definition of fair.
objectives:
  - Explain the sources of bias in ML and LLM systems
  - Measure outcomes across groups and name fairness criteria
  - Apply mitigations and accept the trade-offs
estimatedMinutes: 50
topics: [ai13.fairness]
resources:
  - { title: "NIST: Towards a Standard for Identifying and Managing Bias in AI (SP 1270)", url: "https://csrc.nist.gov/pubs/sp/1270/final", free: true, official: true }
  - { title: "Google: Fairness (ML Crash Course)", url: "https://developers.google.com/machine-learning/crash-course/fairness/overview", free: true, official: true }
  - { title: "Fairlearn (open-source fairness toolkit)", url: "https://fairlearn.org/", free: true, official: false }
---

## Where bias comes from

Models learn from data, and data reflects the world and the choices made in collecting it. Bias enters through:

- **Historical bias** — the data mirrors real-world inequities (past hiring favoured one group), which the model then
  reproduces.
- **Representation bias** — some groups are under-represented, so the model performs worse for them.
- **Measurement/label bias** — the labels or features are proxies that encode bias (using arrests as a proxy for
  crime).
- **Aggregation/evaluation bias** — one model or metric fits the majority and hides poor performance on subgroups.

For **LLMs** specifically, pretraining on vast internet text absorbs societal stereotypes, so generated text can be
biased in tone, assumptions or representation even without a "decision". **Do not assume neutrality** — test for it.

## Harms

Bias is not abstract: it causes **allocative harm** (who gets a loan, job, or bail) and **representational harm**
(stereotyping, erasure, demeaning outputs). The stakes decide how much fairness work is warranted — a meme generator
and a loan model are not the same risk.

## Measuring fairness

You cannot manage what you do not measure. Evaluate outcomes **disaggregated by group** (across the relevant protected
attributes), not just overall:

- **Performance parity** — is accuracy/error similar across groups? (Representation bias shows here.)
- **Demographic parity** — are positive outcomes given at similar rates across groups?
- **Equalised odds** — are true-positive and false-positive rates similar across groups?

Crucially, these criteria can be **mutually incompatible**: except in trivial cases you cannot satisfy all fairness
definitions at once (an impossibility result). So fairness is not one number — you must choose, with domain and
ethical reasoning, **which** notion matters for **this** use, and be explicit about it.

## Mitigation across the pipeline

- **Data** — improve representation, audit labels and features, remove proxies that leak protected attributes.
- **Model/training** — fairness-aware training, constraints, or reweighting (tools like Fairlearn).
- **Post-processing** — adjust thresholds per group to meet the chosen criterion.
- **For LLMs** — curate training data, test prompts across demographics, add guardrails, and evaluate generated text
  for stereotyping as part of the eval set (lesson 1).

Mitigation involves trade-offs (often fairness vs aggregate accuracy, and between fairness criteria); make them
deliberately and document them.

## Fairness is contextual and ongoing

There is no universal "fair"; it depends on the context, the harms, and legal and ethical norms. Treat fairness like
security: a continuous process, not a one-off check — measure across groups, decide the criterion that fits, mitigate,
monitor in production for drift that reopens gaps (Stage 12), and keep humans accountable for consequential decisions
(lesson 5). The goal is systems that do not quietly disadvantage people, and being able to show that they do not.
