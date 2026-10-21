---
id: ai-12-mlops.l01
title: Serving a model
summary: Turning a trained model into a service — a prediction API, loading once, request/response design, batching and latency, and the serving mindset.
objectives:
  - Design a prediction API around a loaded model
  - Explain load-once, input validation and error handling for serving
  - Reason about latency, batching and throughput
estimatedMinutes: 50
topics: [ai12.serving]
resources:
  - { title: "FastAPI documentation", url: "https://fastapi.tiangolo.com/", free: true, official: true }
  - { title: "scikit-learn: model persistence", url: "https://scikit-learn.org/stable/model_persistence.html", free: true, official: true }
  - { title: "Google: MLOps (CI/CD and automation)", url: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning", free: true, official: true }
---

## From notebook to service

A model that only runs in your notebook helps no one. **Serving** makes it callable by other software: wrap it behind
an **API** (usually HTTP/JSON) that takes inputs, runs the model, and returns predictions. A web framework such as
**FastAPI** is the common choice for Python model services.

```python
# Sketch of a prediction service.
model = load_model("model.joblib")          # once, at startup

def predict(features: dict) -> dict:
    validate(features)                       # reject bad input early
    y = model.predict([to_row(features)])[0]
    return {"prediction": y}
```

Ship the **whole pipeline** (preprocessing + model, Stage 5) as one artifact, so the service receives raw features and
the exact training-time transformations are applied — no preprocessing drift between training and serving.

## Load once, serve many

The model is expensive to load (reading weights, initialising). Load it **once at startup** and keep it in memory; do
**not** reload it per request. Each request then just runs inference, keeping latency low. For large deep-learning
models this also means choosing the device (CPU/GPU, Stage 7) once and reusing it.

## Request and response design

Treat the serving boundary like any API (Stage 2, full-stack course):

- **Validate inputs** — reject missing/malformed features with a clear error, never feed garbage to the model.
- **Define a stable schema** for request and response (types, units, allowed values), and version it.
- **Handle errors** — a bad input returns a 4xx with a reason; an internal failure returns a 5xx and is logged, not a
  crash.
- **Return useful metadata** where helpful — model version, confidence — so callers and monitoring (lesson 5) can use
  it.
- **Never trust the caller** (Cybersecurity course) — validate and authenticate.

## Latency, batching and throughput

Production serving cares about **latency** (per-request time) and **throughput** (requests/second):

- **Batching** several requests into one model call raises throughput and GPU efficiency, at some latency cost;
  dynamic batching balances the two.
- **Right-size** the compute: CPU is fine for small models; large models need a GPU or a managed inference service.
- Measure the **tail** (p95/p99, Stage 3), not just the average — the slow requests are what users complain about.
- For LLMs specifically, streaming (Stage 9), token budgets and caching are part of serving.

## The serving mindset

Serving shifts you from "does the model predict well?" (Stages 5–6) to "does the **service** behave well under real
load, bad input and failure?" The model is now a dependency inside a normal software system, subject to the same
engineering as any API — reproducible builds (lesson 2), automated deployment (lesson 3), safe rollout (lesson 4) and
monitoring (lesson 5). Those are the rest of this course.
