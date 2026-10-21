---
id: ai-13-responsible-ai.l03
title: Privacy and data
summary: Data minimisation, PII and redaction, where data goes when you call a model, data-protection law, retention and the right to deletion, and training-data consent.
objectives:
  - Apply data minimisation and redaction to LLM inputs
  - Reason about where prompt data goes and the legal obligations
  - Handle retention, deletion and training-data consent
estimatedMinutes: 50
topics: [ai13.privacy]
resources:
  - { title: "OWASP: Sensitive Information Disclosure (LLM02)", url: "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/", free: true, official: true }
  - { title: "NIST Privacy Framework", url: "https://www.nist.gov/privacy-framework", free: true, official: true }
  - { title: "ICO: guidance on AI and data protection", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/", free: true, official: true }
---

## Data minimisation first

The safest data is the data you never collect or send. **Data minimisation** — collect and process only what the task
genuinely needs — is the foundation of privacy and reduces the blast radius of any breach (Cybersecurity course). For
an LLM app that means: do not stuff whole records into a prompt when a few fields suffice, do not log full prompts
containing personal data, and do not send personal data to a model at all where the task does not require it.

## PII and redaction

**Personally identifiable information (PII)** — names, emails, phone numbers, IDs, health and financial data — needs
special care. Where personal data is not needed by the model, **redact or pseudonymise** it before sending:

```python
import re

def redact(text: str) -> str:
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[EMAIL]", text)
    text = re.sub(r"\b\d{10,}\b", "[NUMBER]", text)
    return text
```

(Real redaction uses robust detectors, not just regex, and must be tuned for your data and language.) Redaction is a
mitigation, not a guarantee — some tasks genuinely need the data, in which case the controls below apply.

## Where does the data go?

When you call a hosted model, your prompt leaves your systems. You must know and tell users:

- **Which provider** receives the data, under what terms, and whether it may be **used for training** (many offer
  settings or enterprise terms that exclude this — check and configure it).
- **Where** it is processed (data residency can be a legal requirement).
- Whether a **local/self-hosted** model (Stage 9's Ollama, or a private deployment) is required for sensitive data.

Treat the provider as a **data processor** and put the right agreements and configuration in place before sending
regulated data.

## Law, retention and deletion

Data-protection laws (GDPR in Europe, PDPA in Malaysia and others) impose obligations: a **lawful basis** for
processing, **transparency** about AI use, **purpose limitation**, and individual rights including **access** and
**deletion** ("right to be forgotten"). Practical consequences for LLM systems:

- **Retention** — keep prompts/logs only as long as needed, then delete; define a policy, do not hoard.
- **Deletion** — you must be able to delete a person's data on request, including from logs and any vector store
  (Stage 10) — design for it.
- **Consent and transparency** — tell users when they are interacting with AI and how their data is used.

## Training-data consent and leakage

Two further risks: using data to **train or fine-tune** without a lawful basis or consent, and models **memorising
and regurgitating** training data (which can leak PII or copyrighted text). Mitigations: curate and document training
data, avoid training on sensitive data, and test outputs for leakage. On the input side, remember **system-prompt
leakage** (lesson 2) — never place secrets or others' personal data in the prompt.

Privacy is both a legal duty and part of trust. Minimise, redact, know where data goes, honour the law and user
rights, and design deletion and transparency in from the start rather than bolting them on after a complaint.
