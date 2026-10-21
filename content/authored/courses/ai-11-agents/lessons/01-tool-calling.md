---
id: ai-11-agents.l01
title: Tool calling
summary: How an LLM uses tools — describing functions with schemas, the request/execute/return cycle, why tools overcome core LLM weaknesses, and MCP.
objectives:
  - Describe a tool to a model with a typed schema
  - Walk through the tool request / execute / return cycle
  - Choose good tools that cover LLM weaknesses
estimatedMinutes: 50
topics: [ai11.tools]
resources:
  - { title: "Anthropic: tool use overview", url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview", free: true, official: true }
  - { title: "OpenAI: function calling", url: "https://platform.openai.com/docs/guides/function-calling", free: true, official: true }
  - { title: "Model Context Protocol (MCP)", url: "https://modelcontextprotocol.io/", free: true, official: true }
---

## Why tools

An LLM predicts text; it cannot by itself fetch today's price, run a precise calculation, query your database, or send
an email (Stage 8's weaknesses). **Tools** (function calling) let it *ask your code* to do those things. This is what
turns a chatbot into a system that can act on the world and ground itself in live data.

## Describing a tool

You give the model, alongside the conversation, a list of available tools. Each tool has:

- a **name**,
- a **description** of what it does and when to use it (the model relies on this to choose),
- a **parameter schema** — the typed inputs, exactly like structured output (Stage 9).

```python
tools = [{
    "name": "get_weather",
    "description": "Get the current weather for a city. Use when the user asks about weather.",
    "parameters": {
        "type": "object",
        "properties": {"city": {"type": "string", "description": "City name"}},
        "required": ["city"],
    },
}]
```

(The exact wrapper differs by provider; the shape — name, description, typed params — is universal.)

## The request / execute / return cycle

Tool calling is a conversation, not a single step:

1. You send the user's message **and** the tool definitions.
2. The model replies either with a normal answer **or** a **tool call**: "call `get_weather` with `{city: 'Kuala
   Lumpur'}`" (structured, Stage 9).
3. **Your code** executes the function (the model never runs it) and gets a result.
4. You send the result back to the model as a tool-result message.
5. The model uses it to answer, or calls another tool. (Repeat — that is the agent loop, lesson 2.)

The division of responsibility is the key idea: the model **decides and requests**; your code **executes and
returns**. That boundary is also where safety lives (lesson 5) — your code can validate arguments and refuse.

## Good tools cover weaknesses

Design tools to plug exactly what the model is bad at:

- **Calculator / code execution** — for exact arithmetic and data processing.
- **Search / retrieval** — for current or private facts (RAG, Stage 10, as a tool).
- **Database / API queries** — for live system data.
- **Actions** — create a ticket, send a message, book a slot (with the safety controls of lesson 5).

Keep each tool **focused, well-described and validated**. A vague description makes the model misuse it; an unvalidated
tool is a liability. Fewer, sharper tools beat a sprawling toolbox the model cannot choose among.

## Standardising tools: MCP

The **Model Context Protocol (MCP)** is an open standard for connecting models to tools and data sources through a
common interface, so a tool built once can be reused across apps and models rather than re-wired for each. You will
meet it as the ecosystem matures; the concept — a standard contract between model and tools — matters more than any
single API.

Tool calling is the mechanism; the next lesson wraps it in a loop so the model can take several steps toward a goal.
