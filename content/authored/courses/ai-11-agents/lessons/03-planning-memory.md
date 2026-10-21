---
id: ai-11-agents.l03
title: Planning and memory
summary: Helping agents tackle complex goals — planning and task decomposition, short- and long-term memory, reflection, and keeping the context window under control.
objectives:
  - Apply planning and decomposition to complex agent tasks
  - Distinguish short-term, long-term and working memory
  - Manage the context window with summarisation and retrieval
estimatedMinutes: 50
topics: [ai11.planning]
resources:
  - { title: "Anthropic: building effective agents (patterns)", url: "https://www.anthropic.com/engineering/building-effective-agents", free: true, official: true }
  - { title: "LangGraph: agent state and memory", url: "https://docs.langchain.com/oss/python/langgraph/overview", free: true, official: true }
  - { title: "Hugging Face Agents Course", url: "https://huggingface.co/learn/agents-course/unit0/introduction", free: true, official: true }
---

## Planning and decomposition

For anything beyond a couple of steps, asking the model to **plan first** — break the goal into an ordered list of
subtasks — makes the agent far more reliable. It can then execute the subtasks one at a time (each a smaller, checkable
problem, Stage 9's decomposition), and re-plan if something changes. Patterns range from a single upfront plan to
interleaved plan-and-execute. The benefit is the same reason decomposition helps prompts: smaller steps are easier to
get right and easier to debug.

## Three kinds of memory

Agents need to remember different things over different timescales:

- **Short-term / working memory** — the current conversation and the results of this run's tool calls. It lives in the
  **context window** (Stage 8) and is lost when the session ends.
- **Long-term memory** — facts to persist across sessions (user preferences, past outcomes, learned knowledge).
  Stored **outside** the model and **retrieved** when relevant.
- **Scratchpad** — the agent's own notes/plan during a run, kept in context so it does not lose track.

The model itself has **no** persistent memory (Stage 9); every kind of memory is something **you** build around it.

## Long-term memory is retrieval

You cannot keep thousands of past interactions in the context window. Long-term memory is therefore the same machinery
as RAG (Stage 10): **store** memories (as text + embeddings) in a vector index, and at each step **retrieve** the ones
relevant to the current situation and put only those in the prompt. "The agent remembers you prefer concise answers"
means: that preference was stored, and retrieved when you returned.

## Managing the context window

As an agent runs, the history grows and will overflow the context window (Stage 8). Keep it bounded:

- **Summarise** older turns into a compact running summary, keeping recent turns verbatim.
- **Retrieve** only the relevant memories and documents rather than carrying everything.
- **Prune** tool results that are no longer needed, or store large results externally and keep a reference.
- Track token usage so you see it approaching the limit (Stage 9, Stage 12).

A long-running agent that never manages its context will slow down, cost more, and eventually fail when it overflows.

## Reflection

Letting an agent **review its own work** before finishing — "check your answer against the requirements; fix any
issues" — catches mistakes and improves quality, at the cost of extra steps. A reflection or critique step (sometimes
a second model/agent, lesson 4) is a cheap, effective reliability pattern. As always, measure whether it actually
helps on your tasks (Stage 6/13) rather than assuming.

Planning, memory and reflection turn a reactive tool-loop into something that can pursue a goal over many steps — and
set up multi-agent coordination (lesson 4) and the safety constraints (lesson 5) that any capable agent needs.
