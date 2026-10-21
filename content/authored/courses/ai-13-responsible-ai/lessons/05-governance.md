---
id: ai-13-responsible-ai.l05
title: Responsible-AI governance
summary: Turning principles into practice — transparency, human oversight and accountability, risk frameworks (NIST AI RMF, EU AI Act), documentation, and the engineer's responsibility.
objectives:
  - State the core responsible-AI principles and make them operational
  - Apply a risk-based approach and human oversight to high-stakes use
  - Document systems and locate the engineer's responsibility
estimatedMinutes: 45
topics: [ai13.governance]
resources:
  - { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", free: true, official: true }
  - { title: "OECD AI Principles", url: "https://oecd.ai/en/ai-principles", free: true, official: true }
  - { title: "EU AI Act (overview)", url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", free: true, official: true }
---

## From principles to practice

Responsible-AI principles recur across frameworks (OECD, NIST, company policies): **fairness, transparency,
accountability, privacy, safety/robustness, and human oversight.** Principles are worthless unless made
**operational** — turned into concrete practices, checks and owners. This whole course has been doing that:
evaluation (lesson 1), security (2), privacy (3) and fairness (4) are these principles in engineering form. Governance
is the layer that ensures they actually happen and someone is answerable.

## A risk-based approach

Not every system needs the same rigour. Match effort to **impact**: a tool that suggests email subject lines is
low-risk; one that influences loans, medical care, hiring or safety is high-risk and warrants far more evaluation,
oversight and documentation. Regulation increasingly encodes this — the **EU AI Act** tiers obligations by risk
(banning some uses, heavily regulating "high-risk" ones) — and risk frameworks like the **NIST AI RMF** structure the
work: **Govern, Map, Measure, Manage** (identify context and risks, measure them, put controls in place, and govern
the whole).

## Transparency, oversight and accountability

- **Transparency** — tell people when they are interacting with or affected by AI, and explain decisions to the degree
  the stakes require. Avoid deceptive anthropomorphism.
- **Human oversight** — for consequential decisions keep a **human in the loop** who can review, override and is
  **accountable**; provide a route to **contest/appeal**. Full automation of high-stakes decisions removes
  accountability and can entrench bias (lesson 4).
- **Accountability** — a named owner answerable for the system, clear escalation, and the ability to turn it off.
  "The algorithm decided" is never an acceptable answer to a harmed person.

## Documentation

Make systems auditable and understandable:

- **Model/system cards** — what it does, intended use and **out-of-scope** uses, training data at a high level,
  evaluation results including across groups (lesson 4), limitations and known risks.
- **Decision records** — the fairness criterion chosen (lesson 4), the risks accepted (Stage 4 residual risk), and
  why.
- Link to the experiment tracking and versioning (Stages 6, 12) so any result and any production version can be
  explained.

## The engineer's responsibility

As the person who builds the system, you are closest to how it actually behaves, so you carry real responsibility:
raise risks early, insist on evaluation (including safety and fairness) before shipping, refuse to hide that AI is
used, and say no to uses that cannot be made safe or fair. Responsible AI is not a compliance checkbox at the end — it
is the evaluation, security, privacy and fairness engineering woven through the whole lifecycle (Stages 6–13), with
governance making sure it happens and someone owns the outcome. Build systems that are **capable, and that you can
stand behind.**
