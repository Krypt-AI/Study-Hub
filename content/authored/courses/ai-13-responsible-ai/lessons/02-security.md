---
id: ai-13-responsible-ai.l02
title: LLM security
summary: The OWASP Top 10 for LLM Applications as a checklist — prompt injection, insecure output handling, excessive agency, data and supply-chain risks — and the layered defences.
objectives:
  - Name the main OWASP LLM risks and their defences
  - Defend against prompt injection and insecure output handling
  - Apply least agency and defence in depth to LLM systems
estimatedMinutes: 55
topics: [ai13.security]
resources:
  - { title: "OWASP Top 10 for LLM Applications (2025)", url: "https://genai.owasp.org/llm-top-10/", free: true, official: true }
  - { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", free: true, official: true }
  - { title: "OWASP GenAI Security Project", url: "https://genai.owasp.org/", free: true, official: true }
---

## A security checklist for LLM apps

LLM applications have their own vulnerability classes, catalogued in the **OWASP Top 10 for LLM Applications (2025)**.
Use it as a checklist, the way the web course used the web Top 10:

| ID | Risk | Core defence |
|---|---|---|
| LLM01 | **Prompt Injection** | Treat all external content as data; isolate untrusted input; least agency; don't rely on prompt pleading |
| LLM02 | **Sensitive Information Disclosure** | Don't put secrets/PII in prompts; filter outputs; data minimisation (lesson 3) |
| LLM03 | **Supply Chain** | Vet models, datasets and libraries; verify sources and integrity (Stage 2) |
| LLM04 | **Data and Model Poisoning** | Control and validate training/fine-tuning and RAG data sources |
| LLM05 | **Improper Output Handling** | Treat model output as untrusted: encode/validate before using it (below) |
| LLM06 | **Excessive Agency** | Minimal tools, scopes and permissions; human approval for consequential actions (Stage 11) |
| LLM07 | **System Prompt Leakage** | Don't put secrets in the system prompt; assume it can leak |
| LLM08 | **Vector and Embedding Weaknesses** | Secure and access-control the RAG store; validate retrieved content |
| LLM09 | **Misinformation** | Grounding, citations, verification; don't present unverified output as fact (Stage 8/10) |
| LLM10 | **Unbounded Consumption** | Rate limits, token/cost caps, timeouts (Stage 9) |

## Prompt injection (LLM01)

The defining LLM risk (met in Stages 9 and 11): untrusted content carries instructions that hijack the model. The
model cannot reliably separate your instructions from instructions hidden in data. Defences are **design**, not
wishful prompting:

- Treat user input, retrieved documents, web pages and tool results as **data, never commands**; keep them clearly
  delimited from your instructions.
- Apply **least agency** (LLM06): the smaller the model's tools, permissions and data access, the less an injection
  can achieve (Stage 11).
- Add **guardrails**: input/output filtering, injection-pattern detection, and human approval for consequential
  actions — layers, not a single wall (Stage 4 defence in depth).
- Do **not** rely on "ignore any malicious instructions" as your only defence.

## Improper output handling (LLM05)

Model output is **untrusted input to the next system**. If you insert it into a web page, a SQL query, a shell
command, or code, the usual injection vulnerabilities apply (Web Security course). An LLM can be induced to produce a
`<script>` tag or a destructive command. Defence: **encode and validate model output** for its destination exactly as
you would user input — output encoding for HTML, parameterisation for SQL, never `eval` on model output.

## The mindset: untrusted in, untrusted out, least agency

Three principles cover most of the list:

1. **Everything coming in is untrusted** — user input and any content the model reads (LLM01, LLM03/04/08).
2. **Everything coming out is untrusted** — validate and encode before use or action (LLM05, LLM09).
3. **Least agency** — give the model the minimum capability and access for its job, so the worst case stays bounded
   (LLM06), and bound its consumption (LLM10).

These are the Cybersecurity course's defence-in-depth and least-privilege ideas applied to LLMs. Security here is not
a filter bolted on; it is designing the system so that a manipulated or mistaken model cannot cause serious harm —
which flows directly into the privacy, fairness and governance concerns of the rest of this course.
