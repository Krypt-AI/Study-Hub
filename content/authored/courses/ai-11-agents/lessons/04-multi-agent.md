---
id: ai-11-agents.l04
title: Multi-agent patterns
summary: Coordinating multiple specialised agents — orchestrator/worker, pipelines, debate and review — and when multiple agents help versus adding needless complexity.
objectives:
  - Describe common multi-agent coordination patterns
  - Weigh multi-agent designs against a single capable agent
  - Apply specialisation and review patterns appropriately
estimatedMinutes: 45
topics: [ai11.multi]
resources:
  - { title: "Anthropic: building effective agents (orchestrator-workers)", url: "https://www.anthropic.com/engineering/building-effective-agents", free: true, official: true }
  - { title: "Anthropic: multi-agent research system", url: "https://www.anthropic.com/engineering/multi-agent-research-system", free: true, official: false }
  - { title: "LangGraph: multi-agent", url: "https://docs.langchain.com/oss/python/langgraph/multi-agent", free: true, official: true }
---

## Why more than one agent

A single agent with many tools and a huge prompt can become unfocused. Splitting work across **specialised agents**,
each with a narrow role, a tight prompt and only the tools it needs, can be clearer, more reliable and easier to test
— the same "small focused units" idea as good software design. But every added agent adds coordination cost, latency
and new failure modes, so multi-agent is a tool, not a default.

## Common patterns

- **Orchestrator / workers.** A coordinator agent breaks a task into subtasks and dispatches each to a worker agent
  (often running in parallel), then combines their results. Good for research, broad gathering, or map-reduce-shaped
  work.
- **Pipeline / sequential.** Agents hand off in a fixed order, each transforming the previous output (writer →
  editor → fact-checker). Really a chain of agents; use when the stages are known.
- **Router.** A lightweight classifier agent sends each request to the right specialist (billing vs technical vs
  sales).
- **Debate / review.** One agent produces, another critiques or verifies (a "generator" and a "critic"). This is the
  reflection pattern (lesson 3) split across agents, useful for quality and for catching errors.

Each worker is itself an agent loop (lesson 2) with its own tools and memory; the patterns just describe how they are
wired together.

## The cost of coordination

Multi-agent systems are powerful but expensive: more model calls (more cost and latency), more places to fail, harder
debugging, and the risk of agents talking past each other or compounding errors. Before reaching for it, ask whether a
**single well-designed agent**, or even a **fixed chain** (lesson 2), would do. Use multiple agents when:

- the subtasks are genuinely **independent** and benefit from **parallelism**, or
- they need **genuinely different** specialisations, tools or permissions, or
- a **separate reviewer** materially improves reliability.

Otherwise the extra agents add complexity without adding capability.

## Keep it observable and bounded

Everything from the single-agent lessons still applies, more so: **bound** every agent's steps (lesson 2), **log**
every agent's reasoning and messages (so you can see which agent did what), and define clear **interfaces** between
agents (what each receives and returns) so the system is debuggable. A multi-agent system you cannot trace is a
multi-agent system you cannot fix.

Start simple — one agent, the right tools — and introduce multiple agents only when a specific need (parallelism,
specialisation, review) justifies the coordination cost. Then make the whole thing safe (lesson 5) before it can act
on anything that matters.
