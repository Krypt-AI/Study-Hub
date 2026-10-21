---
id: ai-11-agents.l02
title: The agent loop
summary: Wrapping tool calling in a loop so the model takes multiple steps, the reason-act pattern, termination and step limits, error handling, and when an agent is the right tool.
objectives:
  - Describe and build the reason–act–observe agent loop
  - Bound the loop and handle tool errors
  - Decide when an agent is justified over a simpler design
estimatedMinutes: 50
topics: [ai11.loop]
resources:
  - { title: "Anthropic: building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents", free: true, official: true }
  - { title: "ReAct: synergizing reasoning and acting (paper)", url: "https://arxiv.org/abs/2210.03629", free: true, official: true }
  - { title: "LangChain: agents", url: "https://docs.langchain.com/oss/python/langchain/agents", free: true, official: true }
---

## From one call to a loop

A single tool call answers simple questions, but real tasks need several steps whose order is not known in advance:
search, read a result, decide, search again, then answer. An **agent** is a loop around the model and its tools:

```text
loop:
    response = model(messages, tools)
    if response is a tool call:
        result = run_tool(response)          # your code (lesson 1)
        append the call and result to messages
        continue                             # let the model see the result and decide next
    else:
        return response                      # final answer
```

This is the **reason–act–observe** pattern (ReAct): the model **reasons** about what to do, **acts** by calling a
tool, **observes** the result, and repeats until done. Each turn it has the full history of what it has tried.

## Termination and step limits

The loop must end. The normal exit is the model returning a final answer instead of a tool call. But models can get
stuck — repeating a call, oscillating, or chasing a dead end — so **always bound the loop**:

- A hard **maximum number of steps** (e.g. 10). On reaching it, stop and return the best answer so far or an error.
- Optionally detect obvious loops (the same call with the same args repeatedly) and break early.

Without a limit, a confused agent burns tokens and money indefinitely. This bound is non-negotiable in production.

## Handling tool errors

Tools fail — bad arguments, a down service, no results. Feed the **error back** to the model as the tool result so it
can adapt ("the city was not found; ask the user to clarify") rather than crashing the loop. Validate arguments before
running (lesson 1), and make tool results concise and informative. Robust agents treat tool errors as part of the
conversation, not exceptions that kill the run.

## When is an agent justified?

Agents add cost, latency, and new failure modes (loops, wrong tool use, injection — lesson 5). Use the **simplest
thing that works**:

- **Single prompt** — the task is one step of text transformation.
- **Fixed pipeline (chain)** — the steps are known and always the same (retrieve → answer; the order is fixed).
- **Agent** — the task needs **external actions or data** and the **path is decided at runtime** based on what each
  step returns.

Prefer a fixed chain when you can predict the steps; reach for an agent only when genuine, data-dependent
decision-making is required. Many "agent" problems are really a well-structured chain in disguise, and the chain is
cheaper and more reliable.

## Keep it observable

Because an agent takes many hidden steps, **log every step** — the model's reasoning, each tool call and result — so
you can see why it did what it did (Stage 6 tracking, Stage 13 monitoring). An opaque agent is impossible to debug or
trust. The loop is simple; making it reliable is the engineering, and the next lessons add planning, memory,
coordination and safety.
