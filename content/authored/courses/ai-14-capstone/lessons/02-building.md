---
id: ai-14-capstone.l02
title: Scoping and building
summary: Building the project the engineering way — baseline first, iterate against the metric, keep it reproducible and version-controlled, and track experiments.
objectives:
  - Build a baseline end to end before optimising
  - Iterate against the metric with tracked experiments
  - Keep the project reproducible from the first commit
estimatedMinutes: 50
topics: [ai14.build]
resources:
  - { title: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course", free: true, official: true }
  - { title: "MLflow (experiment tracking)", url: "https://mlflow.org/docs/latest/", free: true, official: true }
  - { title: "GitHub: start a repository", url: "https://docs.github.com/en/get-started/quickstart/create-a-repo", free: true, official: true }
---

## Baseline first, end to end

Build the **simplest version that works all the way through** before optimising anything (Stages 5–6): load the data,
a trivial model or a basic prompt, the evaluation, and a result. A weak end-to-end baseline is worth more than a
brilliant component with no pipeline around it, because it:

- proves the whole thing connects,
- gives you a **number to beat** (Stage 6's baseline),
- surfaces the real problems (messy data, leakage, a broken metric) early.

Only then improve — better features, a stronger model, a better prompt or retrieval — each change **measured against
the baseline** on your evaluation set (Stage 6). Keep what helps; discard what does not.

## Iterate with tracked experiments

Resist changing five things at once. Change one, measure, record (Stage 6 experiment tracking with MLflow or
LangSmith for LLM work, Stage 15). Log the parameters, the metric, the code version and the data version for each run
so you can say exactly what produced your best result and reproduce it. This also becomes the evidence for your
write-up (lesson 4).

## Reproducible from the first commit

Set the project up properly from the start (Stage 2), not as a cleanup at the end:

- A **Git repo** with sensible commits and a branch workflow.
- A **virtual environment** and **locked dependencies** so anyone can recreate it.
- A clear **project layout** (src, tests, notebooks for exploration only — Stage 2).
- A `.gitignore` that keeps data, model files and **secrets** out of the repo (Stage 2) — check this before every
  push.
- A **README** that grows as you go: what it does, how to set it up and run it, and the current results.

Reproducibility is not bureaucracy; it is what lets you (next month) and others (ever) run and trust the project.

## Use the whole roadmap

A capstone is where the stages come together, so reach back for the right tool:

- Data cleaning and EDA (Stage 4) before modelling.
- Pipelines and the fit/predict discipline, avoiding leakage (Stages 5–6).
- For LLM work: prompting, structured output, RAG, agents (Stages 9–11, 15).
- Serving, containers and CI if you take it that far (Stage 12).
- Privacy, safety and fairness considered as you build, not bolted on (Stage 13).

Build steadily, measure every step, and keep it reproducible. When the metric is where you want it and the project
runs cleanly from a fresh clone, you move to proving it is solid (lesson 3) and presenting it (lesson 4).
