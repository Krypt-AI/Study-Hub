---
id: ai-09-llm-apis.l02
title: Prompting techniques
summary: Practical prompt engineering — being specific, giving role and format, few-shot examples, chain-of-thought, decomposition, and iterating with evaluation rather than superstition.
objectives:
  - Write clear, specific prompts with role, context and format
  - Apply few-shot and chain-of-thought where they help
  - Iterate on prompts using examples, not guesswork
estimatedMinutes: 55
topics: [ai09.prompting]
resources:
  - { title: "Anthropic: prompt engineering overview", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview", free: true, official: true }
  - { title: "OpenAI: prompt engineering guide", url: "https://platform.openai.com/docs/guides/prompt-engineering", free: true, official: true }
  - { title: "Google: prompting guide", url: "https://ai.google.dev/gemini-api/docs/prompting-strategies", free: true, official: true }
---

## Prompting is specification

A prompt is a **specification** of the task in natural language. Vague specs get vague results. The reliable gains
come from clarity, not magic words:

- **Be specific.** Say exactly what you want, for whom, how long, in what tone, and what to exclude. "Summarise this
  for a 10-year-old in three bullet points" beats "summarise this".
- **Give a role and context.** A system prompt that sets the role and the relevant background steers everything that
  follows (lesson 1).
- **Specify the output format.** Ask for the exact shape you need — a list, a table, JSON (lesson 3) — and the model
  will usually produce it.
- **Provide the material.** For anything about specific content, put the content in the prompt (or retrieve it, Stage
  10); do not rely on the model's training memory (Stage 8).
- **Say what to do when unsure.** "If the text does not contain the answer, reply 'not stated'." This reduces
  hallucination on grounded tasks.

## Few-shot examples

Showing a few **worked examples** of input→output teaches the pattern better than describing it, especially for a
specific format or style:

```text
Classify the sentiment as positive/negative/neutral.
Review: "Loved it, works perfectly." → positive
Review: "Broke after a day." → negative
Review: "It's fine, nothing special." →
```

Zero-shot (no examples) is often enough for simple tasks; add examples when the model keeps getting the format or
edge cases wrong. Keep examples representative and consistent.

## Chain-of-thought and decomposition

For multi-step reasoning, giving the model room to think before answering improves accuracy:

- **Chain-of-thought**: "Think step by step, then give the final answer." The model reasons in the output, which helps
  on arithmetic-style and logic tasks (Stage 8's weakness, partly mitigated).
- **Decomposition**: break a complex task into smaller prompts or steps, each simpler and checkable, rather than one
  giant prompt. This is also the seed of agent design (Stage 11).

Trade-off: these use more tokens and time, and for truly exact computation you should still hand off to a **tool**
(Stage 11), not trust the reasoning alone.

## Iterate with evaluation, not superstition

Prompt engineering goes wrong when it becomes cargo-culting ("adding 'you are an expert' made it better once"). Do it
like engineering:

1. Collect a small set of **representative inputs** with known good outputs.
2. Change **one thing** in the prompt.
3. Run the set and compare — did it actually improve, across the cases, not just the one you eyeballed?
4. Keep changes that help; discard the rest.

This is the same evaluation discipline as Stage 6, applied to prompts, and it becomes essential once you build real
LLM systems (Stage 13 covers evaluating them properly). A prompt you cannot measure, you cannot improve.

## Keep prompts versioned

Treat prompts as **code**: store them in your repository, version them (Stage 2), and record which prompt produced
which results (Stage 6 experiment tracking). When a model or prompt changes, you want to know what changed and whether
it helped.
