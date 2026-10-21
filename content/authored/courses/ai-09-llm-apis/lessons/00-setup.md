---
id: ai-09-llm-apis.l00
title: "Setup: API keys and a client"
summary: Get an API key from a provider, store it safely as an environment variable, install a client SDK, and make a first call — with free and local options if you have no budget.
objectives:
  - Obtain and safely store an LLM API key
  - Install a provider SDK and make a first call from VS Code
  - Know the free and local alternatives for practising
estimatedMinutes: 40
topics: [ai09.setup]
resources:
  - { title: "Anthropic Claude Docs — get started", url: "https://docs.claude.com/en/docs/get-started", free: true, official: true }
  - { title: "OpenAI API documentation", url: "https://platform.openai.com/docs", free: true, official: true }
  - { title: "Google AI for Developers (Gemini API)", url: "https://ai.google.dev/", free: true, official: true }
  - { title: "Ollama (run open models locally)", url: "https://ollama.com/", free: true, official: true }
  - { title: "Hugging Face Inference", url: "https://huggingface.co/docs/api-inference/index", free: true, official: true }
---

Builds on the AI Engineering developer-tooling setup (Stage 2): a project, a virtual environment, and the secrets
discipline from that course. The Study Hub exercises run offline in the browser; to build real LLM apps you call a
provider.

## Step 1: Choose a provider and get a key

Major providers (Anthropic Claude, OpenAI, Google Gemini) each offer an API with a developer console where you create
an **API key**. Paid usage is billed per token (Stage 8). Check the provider's current pricing and any free trial
credit before you start — do not assume amounts, as they change.

> Always read the latest model names, limits and prices from the provider's own documentation (linked above). This
> course keeps code **provider-neutral** and does not hard-code model ids or prices, because those change often.

## Step 2: Store the key safely

Treat the key like a password (Stage 2 and the Cryptography course):

```bash
# .env  (git-ignored — never commit this)
LLM_API_KEY=sk-...your-key...
```

```python
import os
API_KEY = os.environ["LLM_API_KEY"]   # loaded from the environment, not written in code
```

Keep `.env` in `.gitignore`, commit a `.env.example` with the variable name only, and if a key ever leaks, **revoke
it at the provider immediately** (Stage 2). A leaked key can run up real charges.

## Step 3: Install a client and make a first call

Install the provider's official SDK into your virtual environment (for example `pip install anthropic`, `openai`, or
`google-genai` — check the provider's quickstart for the exact package and current call signature). A first call
sends a short message and prints the reply. The provider's **quickstart** always has the current, correct code; copy
it from there rather than from memory, since SDKs evolve.

Confirm it works with a trivial prompt ("Say hello in one word"), then you are ready for the rest of the course.

## Step 4: Free and local options

You do not need to spend money to learn:

- **Free tiers / trial credit** — most providers give some free usage to start.
- **Ollama** — run open-weight models **locally** on your own machine, no API key or cost, good for experimenting
  (needs enough RAM; smaller models run on modest hardware).
- **Hugging Face** — hosted inference for many open models, with a free tier.
- **Provider playgrounds** — web consoles where you can try prompts without writing code, useful for Stage 9's
  prompting practice.

## Keep calls out of tests, and costs in view

As in Stage 2: do not let unit tests hit a paid API (use fakes); run the few real-API checks only where a key is
available. Log token usage so cost never surprises you (lesson 4). With the key stored safely and a client working,
the rest of this course is about using the model well.
