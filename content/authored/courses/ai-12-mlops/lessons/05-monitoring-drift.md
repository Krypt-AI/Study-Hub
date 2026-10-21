---
id: ai-12-mlops.l05
title: Monitoring and drift
summary: Watching a model in production — operational and model-quality metrics, data and concept drift, feedback loops for ground truth, alerting, and when to retrain.
objectives:
  - Monitor operational health and model quality in production
  - Detect data and concept drift and explain the difference
  - Design feedback loops and a retraining trigger
estimatedMinutes: 50
topics: [ai12.monitoring]
resources:
  - { title: "Google: MLOps monitoring and continuous training", url: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning", free: true, official: true }
  - { title: "Evidently AI: ML monitoring (open source)", url: "https://docs.evidentlyai.com/", free: true, official: false }
  - { title: "Google SRE: monitoring distributed systems", url: "https://sre.google/sre-book/monitoring-distributed-systems/", free: true, official: false }
---

## A model is never "done"

Unlike ordinary software, a deployed model can degrade **without any code change**, because the world it predicts
shifts. So you monitor two layers continuously.

**Operational health** (like any service, Stage 7):

- request rate, **error rate**, **latency** (p95/p99, Stage 3), saturation (CPU/GPU/memory), cost/token usage.
- availability and health checks.

**Model quality** (the ML-specific layer):

- prediction distribution (are outputs shifting?), confidence, and — when you can get labels — live accuracy/metrics.
- input feature distributions compared with training.

Log predictions, inputs (with privacy care, Stage 13) and outcomes so these can be computed and reviewed.

## Drift

**Drift** is the gap opening between training and the live world:

- **Data drift (covariate shift)** — the input distribution changes (new user types, a changed upstream feature, a new
  product). The relationship may still hold, but the model sees inputs unlike its training data.
- **Concept drift** — the relationship between inputs and the target itself changes (what counted as fraud last year
  does not this year). Even unchanged inputs now map to different outcomes.

Detect drift by comparing live feature/prediction distributions against a training **baseline** (statistical tests,
population stability index; tools like Evidently). Drift is a leading indicator: it often shows **before** accuracy
visibly drops, giving you time to act.

## Ground truth and feedback loops

The hard part of monitoring quality is getting **labels** for live predictions — the truth often arrives later (did
the flagged transaction turn out fraudulent? did the user click?) or not at all. Design **feedback loops** to capture
it: delayed outcomes, human review of a sample, explicit user feedback. Without ground truth you can still watch drift
and output distributions as proxies, but captured labels are what let you measure real live performance and retrain.

## Alerting and retraining

- **Alert** on thresholds that matter — error rate, latency, significant drift, accuracy drop — tuned to avoid alert
  fatigue (Stage 7).
- **Decide a retraining trigger** in advance: on a schedule (e.g. weekly), on drift crossing a threshold, or on a
  measured quality drop. Retraining runs the pipeline (lesson 3) on fresh data, re-evaluates (Stage 6), and promotes
  only if better (lesson 4) — **continuous training**.
- Watch for **feedback loops in the world**: a model that affects the data it later trains on (recommendations shaping
  what users see) can spiral; monitor for it.

## Closing the loop

Monitoring closes the MLOps loop: serve (lesson 1), package (2), ship (3), release safely (4), **watch** (5), and when
the watch says so, retrain and go round again. A model in production is a living system — the engineering is keeping
it healthy, honest and improving over time, not shipping it once. That operational reality, plus the evaluation and
responsible-AI concerns of Stage 13, is what separates a demo from a dependable AI product.
