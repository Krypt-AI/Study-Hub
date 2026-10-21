---
id: ai-15-langchain.l03
title: LangGraph
summary: When and how to use LangGraph for custom agent control flow — state, nodes, edges and conditional edges, loops, persistence and human-in-the-loop.
objectives:
  - Explain when LangGraph is needed over create_agent
  - Describe state, nodes and edges in a StateGraph
  - Build conditional routing, loops and human-in-the-loop with the graph
estimatedMinutes: 55
topics: [ai15.graph]
resources:
  - { title: "LangGraph overview", url: "https://docs.langchain.com/oss/python/langgraph/overview", free: true, official: true }
  - { title: "LangGraph quickstart (graph API)", url: "https://docs.langchain.com/oss/python/langgraph/quickstart", free: true, official: true }
  - { title: "LangGraph: persistence and memory", url: "https://docs.langchain.com/oss/python/langgraph/persistence", free: true, official: true }
---

## When you need a graph

`create_agent` runs one standard loop. Many real systems need **custom control flow**: branch based on a
classification, loop a fixed number of times, run steps in a particular order, insert an approval step, or coordinate
several agents (Stage 11 multi-agent). **LangGraph** models an application as a **graph** of steps with explicit
state, giving you that control while keeping LangChain's components. `create_agent` is in fact built on LangGraph; you
drop to the graph when you outgrow the default loop.

## State, nodes and edges

A LangGraph app is a **StateGraph** over a shared **state** object (a `TypedDict`), where:

- **State** — the data flowing through the graph (e.g. the message list, plus any fields you add). Fields can have
  **reducers** that say how updates combine — the messages field appends rather than overwrites.
- **Nodes** — functions that take the state and return an update to it (call a model, run a tool, transform data).
- **Edges** — connections that route from node to node. `START` and `END` are the entry and exit.

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict, Annotated
import operator

class State(TypedDict):
    messages: Annotated[list, operator.add]   # reducer: new messages are appended

def call_model(state: State):
    ...                                        # returns {"messages": [response]}

builder = StateGraph(State)
builder.add_node("model", call_model)
builder.add_edge(START, "model")
builder.add_edge("model", END)
graph = builder.compile()
graph.invoke({"messages": [{"role": "user", "content": "hi"}]})
```

## Conditional edges and loops

Branching and looping come from **conditional edges**: a routing function reads the state and returns the name of the
next node. This is how you build a tool-calling loop by hand (model → if it called a tool, go to the tool node and
back; else END) or route to different specialists:

```python
def should_continue(state: State):
    last = state["messages"][-1]
    return "tools" if last.tool_calls else END

builder.add_conditional_edges("model", should_continue, ["tools", END])
builder.add_edge("tools", "model")            # loop back after running tools
```

Because you control the edges, you can bound loops, add retry paths, and shape exactly how the application flows —
the explicit version of Stage 11's agent loop.

## Persistence and human-in-the-loop

Compiling the graph with a **checkpointer** persists the state at each step, keyed by a thread (lesson 2). That
enables:

- **Memory** across invocations (the state is restored per thread).
- **Human-in-the-loop** (Stage 11 safety): the graph can **interrupt** before a sensitive node, wait for a human to
  approve or edit the state, then resume exactly where it paused.
- **Time travel / resumability** — inspect or replay from a past state, invaluable for debugging long runs.

## Choosing the altitude

Use the **highest-level tool that fits**: `create_agent` for a standard tool-using agent; **LangGraph** when you need
custom flow, explicit branching/loops, human-in-the-loop, or multi-agent coordination. Both run on the same
components and both trace to LangSmith (lesson 4). Reaching for the graph when the standard agent would do adds
complexity for nothing (Stage 11's "simplest thing that works"); reaching for it when you genuinely need control is
exactly what it is for.
