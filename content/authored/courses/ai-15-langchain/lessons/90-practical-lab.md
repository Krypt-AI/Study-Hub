---
id: ai-15-langchain.lab
title: "Practical lab: trace and evaluate an agent in LangSmith"
subtitle: Hands-on session with the real tools
summary: "Run a LangChain agent with tracing on, read its trace in LangSmith, build a small evaluation dataset, run an evaluation and compare two experiments, the test-and-monitor half of the agent lifecycle."
objectives:
  - Read a real trace and identify the model and tool calls in it
  - Create a dataset and run an evaluation against it
  - Compare two experiments and decide whether a change helped
estimatedMinutes: 60
topics: [ai15.lab]
resources:
  - { title: "LangSmith observability and tracing", url: "https://docs.langchain.com/langsmith/observability", free: true, official: true }
  - { title: "LangSmith evaluation quickstart", url: "https://docs.langchain.com/langsmith/evaluation-quickstart", free: true, official: true }
  - { title: "LangChain quickstart", url: "https://docs.langchain.com/oss/python/langchain/quickstart", free: true, official: true }
  - { title: "LangChain Academy (free LCAE preparation)", url: "https://academy.langchain.com/", free: true, official: true }
---

This session uses the **real LangChain and LangSmith**. LangSmith is an online product with its own interface and SDK, which
LangChain updates, so this guide tells you **what to look for and why**, and sends you to the **official documentation linked
above for the exact current menu names and code**. Copy code from there; do not rely on memory.

> **Costs and data.** LangSmith has a free tier; check the current limits on its site. Each agent run also uses your model
> provider's API, so keep prompts short. Never trace real personal data or secrets: traces are stored.

## Part 1: Trace one run

You enabled tracing in the setup lesson with `LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY`. Run the weather agent from that
lesson **twice** with different questions, one that needs the tool and one that does not:

```python
agent.invoke({"messages": [{"role": "user", "content": "What is the weather in Kuala Lumpur?"}]})
agent.invoke({"messages": [{"role": "user", "content": "Say hello in one word."}]})
```

Open LangSmith in your browser and find your **tracing project**. Each `invoke` is one **trace**. Open the first and look at
the **tree of steps** inside it:

| Look for | What it tells you |
|---|---|
| a **model call** step | the messages sent, the model's response, and its token counts and latency |
| a **tool call** step | the tool name, the **arguments** the model chose, and the **result** returned |
| a second **model call** after the tool | the model reading the tool result to write the final answer |
| **total latency** and **token** figures | where the time and cost went |

Open the second trace: there is **no tool step**. That difference is the agent loop from Stage 11 made visible. Write down, for
each trace, *how many model calls were made, whether a tool ran and what the arguments were.* Finding out **why** an agent did
something is the main use of tracing.

## Part 2: Build a dataset

An evaluation needs examples with expected answers. Create a small **dataset** of about five examples for the weather agent,
each with an input question and a reference output (for instance, whether a tool should be used, or a keyword the answer must
contain). You can create it in the LangSmith interface or with the SDK; the **evaluation quickstart** shows the current calls
for both. The shape is:

```python
# Shape only. Copy the current calls from the evaluation quickstart.
from langsmith import Client

client = Client()
dataset = client.create_dataset(dataset_name="weather-agent-eval", description="Questions for the weather agent")
client.create_examples(
    dataset_id=dataset.id,
    examples=[
        {"inputs": {"question": "Weather in Kuala Lumpur?"}, "outputs": {"must_mention": "sunny"}},
        {"inputs": {"question": "Weather in Penang?"}, "outputs": {"must_mention": "sunny"}},
    ],
)
```

Include at least one **edge case** (an empty question, or a city that does not exist) and one **out-of-scope** question the agent
should decline. A dataset that only has easy cases proves nothing (Stage 13).

## Part 3: Run an evaluation

An **evaluation** runs your agent over every example and scores each answer with **evaluators**. The quickstart's pattern:

- a **target function** that takes an example's `inputs` and returns the agent's answer;
- one or more **evaluator functions** taking the run's `inputs`, `outputs` and the example's `reference_outputs` and returning a
  score;
- a call to **`evaluate`** with the target, the dataset name, the evaluators and an `experiment_prefix`.

Start with a **simple, objective evaluator** you write yourself, such as "does the answer contain the required word?". Then run
the evaluation. LangSmith prints a link to the results: open it and read, per example, the input, the output, the score and
the trace behind it.

## Part 4: Compare two experiments

Change **one thing**: make the system prompt stricter, or add a rule such as "always answer in one sentence". Run `evaluate`
again with a new `experiment_prefix`. In LangSmith open the dataset, choose **both experiments** and **compare**. For each
example you can see whether the score went up, stayed or went down.

Decide as an engineer: *did the change help overall? Did it fix some examples while breaking others? Is the difference large
enough to trust with only five examples?* With so few examples, small gains are noise (Stage 3). Say what you would do next,
such as adding more examples before deciding.

## Part 5: Connect to the exam

The **LCAE** exam is organised around building, **testing**, deploying and **monitoring** agents. This session was the testing
and monitoring half: traces to see what happened, a dataset and evaluators to measure it, experiments to compare changes. The
LangChain Academy courses (free, linked above) cover the same ground with the product's current interface, and they are the
official preparation.

## If something goes wrong

| Problem | Fix |
|---|---|
| No traces appear | check `LANGSMITH_TRACING=true` and a valid `LANGSMITH_API_KEY` are set in the environment that runs the code, and look in the right project and workspace |
| The evaluator raises an error | print the `outputs` value; the target's return shape must match what your evaluator reads |
| Scores look random | too few examples, or the evaluator is vague; make the check objective and add examples |
| Free-tier limits | reduce the number of examples and runs, or wait for the quota to reset |
