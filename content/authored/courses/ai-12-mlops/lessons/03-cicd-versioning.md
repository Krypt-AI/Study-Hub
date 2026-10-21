---
id: ai-12-mlops.l03
title: CI/CD and versioning
summary: Automating build-test-deploy pipelines, versioning the three things ML has (code, data, model), the model registry, and reproducibility end to end.
objectives:
  - Describe a CI/CD pipeline for an ML service
  - Version code, data and models, and explain why all three matter
  - Use a model registry to decouple training from serving
estimatedMinutes: 50
topics: [ai12.cicd]
resources:
  - { title: "GitHub Actions documentation", url: "https://docs.github.com/en/actions", free: true, official: true }
  - { title: "MLflow Model Registry", url: "https://mlflow.org/docs/latest/ml/model-registry/", free: true, official: true }
  - { title: "DVC (data version control)", url: "https://dvc.org/doc", free: true, official: false }
---

## CI/CD for an ML service

**Continuous integration / continuous delivery** automates the path from a commit to a running service, so releases
are frequent, tested and repeatable rather than manual and risky (Stage 2 introduced CI). A pipeline (e.g. GitHub
Actions) typically:

1. **On every push/PR**: install locked deps, run **lint**, **type checks** and **tests** (unit tests, and the
   content/data checks), fail fast on problems.
2. **On merge to main**: build the **container image** (lesson 2), tag it with the commit, and push it to a registry.
3. **Deploy**: roll the new image out to staging, run smoke/integration tests, then to production (lesson 4), with the
   ability to **roll back**.

For ML there is often also a **training/eval pipeline**: retrain on new data, run the evaluation suite (Stage 6), and
only register the new model **if it beats the current one** on the agreed metrics — automation that guards quality,
not just mechanics.

## Versioning the three things

Ordinary software versions **code**. ML results depend on three things, and reproducing a result needs all three:

| What | Versioned with |
|---|---|
| **Code** | Git (Stage 2) |
| **Data** | Dataset snapshots/hashes, or a tool like **DVC**/lakeFS; never overwrite data in place |
| **Model** | A **model registry** with versions and stages (Stage 6) |

A result is reproducible only when you can say *which code, which data, which model* produced it — exactly the
experiment-tracking discipline of Stage 6, now enforced through the pipeline.

## The model registry decouples training from serving

Training and serving should not be glued together. Training **registers** a model version (with its metrics, data
version and code commit); serving **loads a named version** — for example by an alias like `champion` (Stage 6). This
means:

- You can promote a new model (move the alias) without redeploying the serving code.
- You can roll back to a previous version instantly by moving the alias back.
- The serving code has no file paths to maintain and no idea how the model was trained.

```text
train → evaluate → if better: register version N, set alias "staging"
                 → approve → set alias "champion"
serve: load models:/my-model@champion   (no code change when the alias moves)
```

## Reproducibility end to end

Put together: locked dependencies (Stage 2) in a pinned container image (lesson 2), code in Git, data snapshotted,
model in a registry, and a pipeline that rebuilds and re-tests from scratch. Then any production state can be
recreated and any result explained. That end-to-end reproducibility is the backbone of MLOps — without it you cannot
safely deploy (lesson 4) or diagnose problems in production (lesson 5), because you cannot even say what is running.
