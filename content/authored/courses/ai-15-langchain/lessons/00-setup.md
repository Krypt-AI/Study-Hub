---
id: ai-15-langchain.l00
title: "Setup: LangChain and LangSmith"
summary: Install LangChain v1 with a provider, set up a LangSmith account for tracing and evaluation, store keys safely, and run a first agent — with the free LangChain Academy courses that prepare for the LCAE exam.
objectives:
  - Install LangChain and a model provider, with keys stored safely
  - Turn on LangSmith tracing
  - Know the free LCAE preparation courses
estimatedMinutes: 40
topics: [ai15.setup]
resources:
  - { title: "LangChain install (v1 docs)", url: "https://docs.langchain.com/oss/python/langchain/install", free: true, official: true }
  - { title: "LangChain quickstart", url: "https://docs.langchain.com/oss/python/langchain/quickstart", free: true, official: true }
  - { title: "LangSmith tracing quickstart", url: "https://docs.langchain.com/langsmith/trace-with-langchain", free: true, official: true }
  - { title: "LangChain Academy (free courses)", url: "https://academy.langchain.com/", free: true, official: true }
  - { title: "LCAE certification", url: "https://academy.langchain.com/pages/certifications-lcae", free: true, official: true }
---

Builds on the AI Engineering developer-tooling (Stage 2) and LLM API (Stage 9) setups: a project, a virtual
environment, the secrets discipline, and a provider API key. Code in this course follows the **official LangChain v1
docs**; always copy the current signatures from the docs linked above, since the framework evolves.

## Step 1: Install LangChain with a provider

```bash
# in your project's virtual environment
pip install -U langchain "langchain[anthropic]"
# or langchain[openai], langchain[google-genai], etc. — use your provider's extra
```

LangChain uses a **provider extra** (the part in brackets) to pull in the integration for the model you will use. The
quickstart lists the exact extra and model string for each provider.

## Step 2: Store keys safely

As in Stages 2 and 9, keep keys in the environment, never in code:

```bash
# .env  (git-ignored)
ANTHROPIC_API_KEY=...        # or OPENAI_API_KEY / GOOGLE_API_KEY, per your provider
LANGSMITH_API_KEY=...        # for tracing (step 3)
```

## Step 3: Turn on LangSmith tracing

**LangSmith** records every model and tool call so you can see exactly what your agent did — invaluable for debugging
and required for the evaluation and monitoring in lesson 4. Create a free account, get an API key, and enable tracing
with environment variables:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=...
```

With these set, running any LangChain code sends traces to your LangSmith project automatically; open the LangSmith UI
to inspect runs.

## Step 4: A first agent

The quickstart's minimal agent (copy the current form from the docs):

```python
from langchain.agents import create_agent

def get_weather(city: str) -> str:
    """Get the weather for a city."""
    return f"It's sunny in {city}."

agent = create_agent(
    model="anthropic:claude-sonnet-4-6",   # use your provider's current model string
    tools=[get_weather],
    system_prompt="You are a helpful assistant.",
)
result = agent.invoke({"messages": [{"role": "user", "content": "Weather in Kuala Lumpur?"}]})
print(result["messages"][-1].content_blocks)
```

If tracing is on, this run appears in LangSmith with the model call and the tool call laid out.

## Step 5: The LCAE preparation path

The **LangChain Certified Agent Engineer (LCAE)** exam covers the agent development lifecycle — building, testing,
deploying and monitoring agents — exactly this course's shape. LangChain publishes **free** Academy courses that
prepare for it (Introduction to LangChain, Introduction to Deep Agents, and the LangSmith testing/deployment/
monitoring courses). Study Hub's Certifications area has the current LCAE details; the official Academy is the source
of truth. Work through this course, then the free Academy courses, then sit the exam.

## Check your setup

- `python -c "import langchain; print(langchain.__version__)"` prints a version.
- The first agent runs and returns a message.
- The run appears in your LangSmith project (tracing on).
