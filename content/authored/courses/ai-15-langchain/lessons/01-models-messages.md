---
id: ai-15-langchain.l01
title: Models and messages
summary: LangChain's provider-agnostic model interface — init_chat_model, message classes, invoke/stream/batch, binding tools, and structured output with a schema.
objectives:
  - Initialise and call a chat model provider-agnostically
  - Use invoke, stream and batch, and message classes
  - Get structured output with with_structured_output
estimatedMinutes: 50
topics: [ai15.basics]
resources:
  - { title: "LangChain: models", url: "https://docs.langchain.com/oss/python/langchain/models", free: true, official: true }
  - { title: "LangChain: messages", url: "https://docs.langchain.com/oss/python/langchain/messages", free: true, official: true }
  - { title: "LangChain: structured output", url: "https://docs.langchain.com/oss/python/langchain/structured-output", free: true, official: true }
---

## One interface, many providers

LangChain's value is a **common interface**: write your logic once and swap providers by changing a model string. The
entry point is `init_chat_model`:

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("anthropic:claude-sonnet-4-6", temperature=0)   # or "openai:gpt-...", "google_genai:..."
```

The provider prefix selects the integration (lesson 0). Parameters like `temperature`, `timeout` and `max_tokens`
(Stage 9) are passed here. Use the current model strings from the provider/docs.

## Messages

You can call the model with plain role/content dicts (Stage 9) or with LangChain **message classes**, which are
clearer and carry structured content:

```python
from langchain.messages import SystemMessage, HumanMessage, AIMessage

history = [
    SystemMessage("You are a concise study assistant."),
    HumanMessage("What is spaced repetition?"),
]
reply = model.invoke(history)      # returns an AIMessage
print(reply.text)
```

The conversation is still **stateless** (Stage 9): you pass the full history each call. LangChain just gives typed
message objects and helpers around it.

## invoke, stream, batch

The model (and most LangChain components) share a standard interface:

- **`invoke(input)`** — one call, one result.
- **`stream(input)`** — yields the response in chunks as it is generated (Stage 9 streaming), for responsive UIs.
- **`batch([inputs])`** — run many inputs efficiently.

```python
for chunk in model.stream("Explain attention in one sentence."):
    print(chunk.text, end="", flush=True)

answers = model.batch(["Define RAG.", "Define a token.", "Define an embedding."])
```

This uniform interface is why LangChain components compose: anything that implements it can be swapped or chained.

## Binding tools and structured output

- **`model.bind_tools([...])`** attaches tool definitions so the model can request tool calls (the mechanism behind
  agents, lesson 2; concept from Stage 11).
- **`model.with_structured_output(Schema)`** makes the model return data matching a schema (a Pydantic model, Stage
  9), parsed for you:

```python
from pydantic import BaseModel

class Flashcard(BaseModel):
    front: str
    back: str

structured = model.with_structured_output(Flashcard)
card = structured.invoke("Make a flashcard about photosynthesis.")   # a Flashcard instance
```

This is the reliable structured-output pattern from Stage 9, wrapped in one call. With models, messages, the
invoke/stream/batch interface, tool binding and structured output, you have the pieces LangChain composes into agents
— which the next lesson assembles with `create_agent`.
