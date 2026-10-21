---
id: ai-08-transformers.l01
title: Tokenization
summary: Why models work in tokens not characters or words, subword tokenization (BPE), vocabularies and special tokens, and the practical consequences for context and cost.
objectives:
  - Explain why LLMs use subword tokens
  - Describe byte-pair encoding at a high level
  - Reason about token counts, context windows and cost
estimatedMinutes: 45
topics: [ai08.tokens]
resources:
  - { title: "Hugging Face: tokenizers (NLP course)", url: "https://huggingface.co/learn/nlp-course/chapter2/4", free: true, official: true }
  - { title: "Hugging Face: Byte-Pair Encoding", url: "https://huggingface.co/learn/nlp-course/chapter6/5", free: true, official: true }
  - { title: "OpenAI tokenizer (interactive)", url: "https://platform.openai.com/tokenizer", free: true, official: true }
---

## Why tokens

A language model cannot process raw text; it processes numbers. **Tokenization** turns text into a sequence of
**token ids** (integers), and the model's output is a probability distribution over the token vocabulary. The choice
of token unit matters:

- **Characters** give a tiny vocabulary but very long sequences, and the model must relearn spelling for everything.
- **Words** give short sequences but a huge, open-ended vocabulary (every typo and rare word is "unknown").
- **Subwords** are the practical middle ground and what modern LLMs use.

## Subword tokenization (BPE)

**Byte-Pair Encoding (BPE)** and relatives build a vocabulary of frequent character sequences. Common words become a
single token; rare words split into meaningful pieces:

```text
"tokenization"  → ["token", "ization"]
"ChatGPT"       → ["Chat", "G", "PT"]
"antidisestablishmentarianism" → several subword pieces
```

This keeps the vocabulary bounded (typically 30k–100k+ tokens) while representing any text, including words never seen
in training, by composing pieces. Working at the **byte** level means even emoji and other scripts are representable.
A rough rule of thumb for English: ~1 token ≈ 4 characters ≈ ¾ of a word.

## Vocabulary and special tokens

The tokenizer has a fixed **vocabulary** mapping each token to an id, learned once and shipped with the model. It also
defines **special tokens** the model uses structurally — for example beginning/end-of-sequence markers, padding, and
the role/turn markers chat models use to separate system, user and assistant messages (Stage 9). You must use the
**same tokenizer** the model was trained with; mismatched tokenization produces nonsense.

## Practical consequences

Token counts are not a detail — they drive real constraints:

- **Context window.** A model can attend to only a fixed number of tokens at once (its context window, lesson 5).
  Long inputs must fit, or be chunked (Stage 10).
- **Cost and latency.** Paid APIs bill per token (input + output), and more tokens mean slower responses. Concise
  prompts save money and time.
- **Languages differ.** Text in some languages tokenizes into many more tokens than the equivalent English, affecting
  both cost and how much fits.
- **Odd behaviour.** Because the model sees tokens, tasks like counting letters or reversing a string are genuinely
  hard for it — it never saw the individual characters as the unit.

Understanding tokens explains a surprising amount of LLM behaviour, and estimating token counts is a routine part of
designing prompts and systems in the later stages.
