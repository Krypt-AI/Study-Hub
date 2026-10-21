---
id: ai-12-mlops.l04
title: Deployment strategies
summary: Releasing new models safely — rolling, blue-green and canary deployments, shadow mode, A/B testing, rollback, and scaling.
objectives:
  - Compare rolling, blue-green and canary deployments
  - Use shadow mode and A/B testing to de-risk model changes
  - Plan rollback and autoscaling
estimatedMinutes: 50
topics: [ai12.deploy]
resources:
  - { title: "Google: application deployment and testing strategies", url: "https://cloud.google.com/architecture/application-deployment-and-testing-strategies", free: true, official: true }
  - { title: "Martin Fowler: BlueGreenDeployment", url: "https://martinfowler.com/bliki/BlueGreenDeployment.html", free: true, official: false }
  - { title: "Kubernetes: deployments", url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/", free: true, official: true }
---

## Releasing without breaking things

A new model version can be worse in ways offline evaluation missed (Stage 6) — real traffic differs. The goal of a
deployment strategy is to release it so that if it is bad, **few users are affected and you can revert fast**.
"Big-bang" (swap 100% at once) maximises blast radius; the strategies below shrink it.

## The main strategies

| Strategy | How it works | Trade-off |
|---|---|---|
| **Rolling** | Replace instances a few at a time until all run the new version | Simple; both versions briefly coexist |
| **Blue-green** | Run new (green) alongside old (blue); switch all traffic at once, keep blue to revert | Instant rollback; needs double capacity briefly |
| **Canary** | Send a small % of traffic to the new version, watch metrics, then ramp up | Limits blast radius; needs good monitoring and routing |

**Canary** is especially suited to models: route 5% of traffic to the new model, compare its live metrics (errors,
latency, and quality where measurable) against the old, and only widen if it holds up — otherwise roll back having
affected few users.

## De-risking model changes

Two patterns specific to ML:

- **Shadow mode.** Run the new model on **real traffic in parallel** but do **not** serve its outputs to users — just
  log them and compare with the live model. You get real-world evidence with zero user risk before any rollout.
- **A/B testing.** Serve the old (A) and new (B) models to different user groups and compare outcome metrics that
  matter (conversion, satisfaction), with enough data to be statistically meaningful (Stage 3). This tests real
  impact, not just offline scores.

Both answer the question offline evaluation cannot: does the new model actually do better **in production**?

## Rollback and scaling

- **Rollback plan.** Always be able to revert quickly — move the model-registry alias back (lesson 3) or switch
  blue-green traffic. Decide the **trigger** in advance (error rate or latency crosses a threshold), ideally
  automated.
- **Health checks.** The platform should detect an unhealthy instance and restart or replace it (lesson 2's
  orchestration).
- **Autoscaling.** Scale instances with load so latency stays acceptable under spikes and cost stays low when quiet.
  For GPU-served models this is a real cost lever.

## Decide by risk

Match the strategy to the stakes: a low-risk internal tool can roll; a high-stakes model (fraud, medical, anything
user-facing at scale) deserves shadow mode and/or a slow canary with automated rollback. The common thread is the
engineering mindset from the start of this course — assume the new version might be worse, and make it cheap to find
out and cheap to undo. Monitoring (lesson 5) is what tells you which it is.
