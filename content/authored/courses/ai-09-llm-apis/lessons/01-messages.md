---
id: ai-09-llm-apis.l01
title: Messages and roles
summary: The chat message format shared across providers, the system/user/assistant roles, multi-turn conversations and why the model is stateless, and core parameters.
objectives:
  - Build a messages array with system, user and assistant roles
  - Explain why each call must carry the whole conversation
  - Use the core generation parameters correctly
estimatedMinutes: 45
topics: [ai09.messages]
resources:
  - { title: "Anthropic: messages and system prompts", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview", free: true, official: true }
  - { title: "OpenAI: text generation and messages", url: "https://platform.openai.com/docs/guides/text-generation", free: true, official: true }
  - { title: "Google Gemini: text generation", url: "https://ai.google.dev/gemini-api/docs/text-generation", free: true, official: true }
---

## The message format

Modern chat APIs share a common shape: you send a **list of messages**, each with a **role** and **content**, and the
model returns the next assistant message. The roles:

- **system** — sets the assistant's role, rules, tone and context for the whole conversation. It is your main lever
  for behaviour.
- **user** — input from the person.
- **assistant** — the model's replies (and, in a multi-turn history, what it said before).

```python
messages = [
    {"role": "system", "content": "You are a concise study assistant. Answer in one short paragraph."},
    {"role": "user", "content": "What is spaced repetition?"},
]
# → the API returns an assistant message with the answer
```

(Exact field names and the call signature vary slightly by provider — check their docs, Stage 9 lesson 0. The *shape*
is the same.)

## Conversations are stateless

The model does **not** remember previous calls. To continue a conversation, you resend the **entire history** —
system, prior user and assistant turns, then the new user message — every time:

```python
messages = [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "What is spaced repetition?"},
    {"role": "assistant", "content": "It schedules reviews at increasing intervals..."},
    {"role": "user", "content": "How do I apply it to vocabulary?"},   # needs the history for context
]
```

Two consequences: the history consumes **context window** and **tokens** (so long chats cost more and eventually must
be trimmed or summarised — Stage 8, Stage 10), and your application is responsible for storing and replaying the
conversation. "Memory" in an LLM app is something *you* build, not something the model has.

## Core parameters

Alongside the messages you set generation parameters (names vary by provider):

| Parameter | Effect |
|---|---|
| `temperature` | Randomness (Stage 8): low = focused/consistent, high = varied/creative |
| `max_tokens` (output cap) | Upper bound on the response length — controls cost and runaway output |
| `top_p` / `top_k` | Restrict the candidate tokens sampled from |
| `stop` sequences | Strings that end generation early |
| `seed` (where supported) | Make sampling more reproducible for testing |

For tasks that need consistency (extraction, classification, tests), use a **low temperature**. For brainstorming or
varied drafts, raise it. Always set a sensible output cap.

## The system prompt is your steering wheel

Most of the behaviour you want — the role, format, constraints, tone, what to do when unsure — belongs in a clear
**system prompt**. The next lesson is about writing the prompt well; here the point is the mechanics: a list of
role-tagged messages, resent in full each turn, with parameters that control *how* the model generates but not
*whether* it is correct.
