---
id: ai-14-capstone.l01
title: Choosing a project
summary: Picking a capstone that is finishable, meaningful and shows the skills from the roadmap, with a few concrete project archetypes to adapt.
objectives:
  - Choose a scoped, finishable capstone project
  - Pick a project that exercises the roadmap's skills
  - Define success and a dataset before building
estimatedMinutes: 45
topics: [ai14.choose]
resources:
  - { title: "Kaggle (datasets and competitions)", url: "https://www.kaggle.com/", free: true, official: true }
  - { title: "Hugging Face Datasets", url: "https://huggingface.co/datasets", free: true, official: true }
  - { title: "Google Dataset Search", url: "https://datasetsearch.research.google.com/", free: true, official: true }
---

## Finish beats ambitious

The most valuable capstone is one you **complete end to end and can show works** — not the most ambitious idea that
stalls half-built. A finished small project with a real evaluation (lesson 3) demonstrates more skill than an
unfinished grand one. So choose something you can take from data to a working, measured result in the time you have,
then improve it.

## Pick something that exercises the roadmap

Aim for a project that touches several stages, because that is what shows you can build a system, not just a model:

- **data** work (Stage 4): loading, cleaning, exploration;
- a **model** or **LLM** at the core (Stages 5, 7, 8–11);
- **evaluation** (Stages 6, 13): metrics proving it works;
- **engineering** (Stages 2, 12): reproducible, version-controlled, ideally served behind an API or simple UI;
- **responsibility** (Stage 13): privacy, safety and limitations considered.

You do not need all of them, but a project spanning data → model → evaluation → a runnable artifact is a strong
portfolio piece.

## Project archetypes to adapt

Pick one and make it yours with a domain and dataset you care about:

- **A classic ML predictor** (Stage 5): predict something useful from tabular data (prices, churn, demand), with a
  clean pipeline, honest evaluation, and a small prediction API.
- **A RAG assistant** (Stages 9–10): a question-answering assistant over a document set you choose (manuals, your
  notes, a public corpus), with retrieval evaluation and citations.
- **A tool-using agent** (Stages 11, 15): an agent that accomplishes a real task with a couple of safe tools, built
  with LangChain and traced/evaluated in LangSmith.
- **A fine-tuned or specialised text model** (Stage 8): a focused classifier or extractor with a strong baseline and
  a proper evaluation set.

## Define success before you build

Before writing code, write down:

- **The problem** in one or two sentences, and who it is for.
- **The data**: what you will use, where it comes from, and any licensing/privacy constraints (Stage 13). Public
  datasets (Kaggle, Hugging Face, Google Dataset Search) are good sources; respect their licences.
- **Success criteria**: the metric(s) that will show it works, and a baseline to beat (Stages 5–6).
- **Scope**: what is in and, importantly, what is **out** for the first version.

Writing this upfront turns a vague ambition into a buildable plan and stops scope creep. With a scoped problem, a
dataset and a definition of success, you are ready to build (lesson 2) — baseline first, then improve against your
own metric.
