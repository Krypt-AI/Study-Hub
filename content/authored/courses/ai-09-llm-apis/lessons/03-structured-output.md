---
id: ai-09-llm-apis.l03
title: Structured output
summary: Getting machine-readable output from an LLM — JSON mode and schema-constrained generation, validation, tool/function schemas, and handling failures.
objectives:
  - Get reliable JSON via schema-constrained output rather than parsing prose
  - Validate structured output and handle invalid responses
  - Relate structured output to tool/function calling
estimatedMinutes: 50
topics: [ai09.structured]
resources:
  - { title: "OpenAI: structured outputs", url: "https://platform.openai.com/docs/guides/structured-outputs", free: true, official: true }
  - { title: "Anthropic: tool use (structured results)", url: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview", free: true, official: true }
  - { title: "Pydantic documentation", url: "https://docs.pydantic.dev/latest/", free: true, official: true }
---

## Why structured output

An LLM naturally produces prose, but programs need **structure** — a known set of fields with known types. Parsing
free text with regular expressions is brittle: the model phrases things differently each time, adds preambles, or
wraps JSON in explanation. The fix is to make the model emit data in a **defined schema**.

## Schema-constrained generation

Modern providers support asking for output that conforms to a **JSON schema** (sometimes called structured outputs or
JSON mode). You define the shape, and the model returns JSON matching it:

```python
# Define the shape you want (here with Pydantic, used widely for validation).
from pydantic import BaseModel

class Flashcard(BaseModel):
    front: str
    back: str
    difficulty: int   # 1-5

# You pass this schema to the provider's structured-output feature (see their docs),
# and receive JSON you can validate straight into the model object.
```

Schema-constrained output is far more reliable than "please reply in JSON" in a plain prompt, because the provider
enforces the structure during generation. Where a provider lacks it, the next-best option is a **tool/function
schema** (below) or a strict prompt plus validation.

## Always validate

Never trust the structure blindly, even with schema features — validate on the way in:

- Parse the JSON; if it fails, the response is unusable.
- Check required fields exist and have the right **types** and ranges (Pydantic does this for you and raises clear
  errors).
- Decide a **fallback**: retry with the error fed back to the model, use a default, or surface an error — but do not
  let malformed data flow downstream.

Validation turns "the model usually returns good JSON" into a guarantee your code can rely on.

## Structured output and tools

**Tool (function) calling** (Stage 11) is the same idea generalised: you describe functions with typed parameters
(a schema), and the model responds with a structured request to call one, with arguments. Your code runs the function
and returns the result. So "give me JSON matching this schema" and "call this function with these arguments" use the
same schema-driven machinery — which is why structured output is the bridge from a chatbot to a system that *does*
things.

## Design the schema for the task

- Keep fields **explicit and typed**; prefer enums for fixed sets of values.
- Make the schema **small and flat** where you can — deeply nested, sprawling schemas are harder for the model and for
  you.
- Include only what you will use. Every field is something the model must fill and you must validate.

With reliable structured output you can treat the LLM as a component that returns typed data, slotting it into normal
software (Stage 12 serves it; Stage 13 evaluates it) instead of a black box emitting unpredictable prose.
