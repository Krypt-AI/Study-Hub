---
id: ai-15-langchain.l02
title: Agents with create_agent
summary: Building agents with LangChain's create_agent — defining tools, the system prompt, structured responses, memory with checkpointers, and middleware.
objectives:
  - Build a tool-using agent with create_agent
  - Add memory with a checkpointer and thread_id
  - Use structured responses and middleware
estimatedMinutes: 55
topics: [ai15.agents]
resources:
  - { title: "LangChain: agents (create_agent)", url: "https://docs.langchain.com/oss/python/langchain/agents", free: true, official: true }
  - { title: "LangChain: tools", url: "https://docs.langchain.com/oss/python/langchain/tools", free: true, official: true }
  - { title: "LangChain: middleware", url: "https://docs.langchain.com/oss/python/langchain/middleware/overview", free: true, official: true }
---

## create_agent: the agent loop, batteries included

`create_agent` (from `langchain.agents`) builds a production-ready agent that runs the reason–act loop from Stage 11
for you: the model decides, tools run, results feed back, repeat until a final answer. You provide the model, the
tools and a system prompt:

```python
from langchain.agents import create_agent

agent = create_agent(
    model="anthropic:claude-sonnet-4-6",     # or a model object from init_chat_model
    tools=[search_docs, calculator],
    system_prompt="You are a research assistant. Use tools to ground your answers.",
)
result = agent.invoke({"messages": [{"role": "user", "content": "..."}]})
print(result["messages"][-1].content_blocks)
```

You get the loop, tool dispatch and message handling without writing them — but the Stage 11 concepts (good tool
design, step limits, safety) still apply; the framework implements them, you still reason about them.

## Defining tools

Decorate a function with `@tool`; its **docstring and type hints become the schema** the model sees (Stage 9/11):

```python
from langchain.tools import tool

@tool
def search_docs(query: str) -> str:
    """Search the knowledge base and return the most relevant passage."""
    ...
    return passage
```

Clear names, a precise docstring and typed parameters are what let the model choose and call the tool correctly.
Tools can wrap retrieval (Stage 10), APIs, or any Python you trust — with the safety limits of Stage 11.

## Memory with a checkpointer

By default the agent is stateless (Stage 9). Pass a **checkpointer** and invoke with a **thread_id** to persist the
conversation per thread:

```python
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(model=model, tools=[...], system_prompt="...", checkpointer=InMemorySaver())
cfg = {"configurable": {"thread_id": "user-123"}}
agent.invoke({"messages": [{"role": "user", "content": "Hi, I'm Aina."}]}, config=cfg)
agent.invoke({"messages": [{"role": "user", "content": "What's my name?"}]}, config=cfg)   # remembers
```

`InMemorySaver` is for development; production uses a persistent checkpointer (a database) so memory survives restarts
(Stage 11's "memory is something you build").

## Structured responses

Pass `response_format=SomePydanticModel` to get a parsed, typed result alongside the messages — it appears under the
`structured_response` key of the returned state (Stage 9's structured output, at the agent level):

```python
from pydantic import BaseModel

class Answer(BaseModel):
    summary: str
    sources: list[str]

agent = create_agent(model=model, tools=[...], response_format=Answer)
result = agent.invoke({"messages": [...]})
answer = result["structured_response"]      # an Answer instance
```

## Middleware

**Middleware** hooks into the agent loop to add cross-cutting behaviour without rewriting it — summarising long
histories, human-in-the-loop approval before sensitive tools (Stage 11 safety), PII handling (Stage 13), retries and
fallbacks. You pass a list of middleware to `create_agent`:

```python
from langchain.agents.middleware import SummarizationMiddleware, HumanInTheLoopMiddleware

agent = create_agent(model=model, tools=[...], middleware=[SummarizationMiddleware(...), HumanInTheLoopMiddleware(...)])
```

Middleware is where the production concerns from earlier stages — context management, safety approvals, reliability —
plug into a LangChain agent cleanly. For flows more custom than the standard loop (branching, loops, multiple agents),
you drop down to LangGraph, the next lesson.
