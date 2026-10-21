---
id: sec-04-principles.l05
title: Governance and frameworks
summary: How organisations manage security through policy, standards and frameworks; the NIST CSF, ISO 27001 and CIS Controls; compliance and the human layer.
objectives:
  - Distinguish policy, standard, procedure and guideline
  - Describe the NIST CSF functions, ISO 27001 and CIS Controls at a high level
  - Explain the role of compliance, awareness and the human factor
estimatedMinutes: 45
topics: [sec04.governance]
resources:
  - { title: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework", free: true, official: true }
  - { title: "CIS Critical Security Controls", url: "https://www.cisecurity.org/controls", free: true, official: true }
  - { title: "ISO/IEC 27001 (overview)", url: "https://www.iso.org/standard/27001", free: true, official: false }
  - { title: "CISA: cyber hygiene and resources", url: "https://www.cisa.gov/resources-tools", free: true, official: true }
---

## Governance: steering security

Technical controls do not run themselves. **Governance** is how an organisation decides what to protect, sets the
rules, assigns responsibility, and checks it is working. Its documents form a hierarchy:

- **Policy** — high-level intent, mandated by leadership ("all data must be classified and protected accordingly").
- **Standard** — specific mandatory requirements ("laptops must use full-disk encryption").
- **Procedure** — step-by-step how-to ("to encrypt a laptop, do X, Y, Z").
- **Guideline** — recommended, non-mandatory advice.

Clear ownership matters: security is a business responsibility, not just IT's, which is why CSF 2.0 added a **Govern**
function.

## Frameworks you should recognise

Frameworks give a structured, reusable way to organise security rather than inventing it each time.

- **NIST Cybersecurity Framework (CSF) 2.0** — organises activities into six functions: **Govern, Identify, Protect,
  Detect, Respond, Recover**. A common language for assessing and improving a programme; widely used beyond the US.
- **ISO/IEC 27001** — an international standard for an **Information Security Management System (ISMS)**; organisations
  can be formally **certified** against it.
- **CIS Critical Security Controls** — a prioritised, practical list of safeguards (asset inventory, secure
  configuration, access control, logging, etc.), with implementation groups by organisation size. An excellent "what
  do we actually do first" list.
- **NIST SP 800-53 / 800-37 (RMF)** — detailed control catalogue and risk-management process, common in government.

You do not implement all of them; you pick what fits and map controls to it.

## Compliance versus security

Laws and regulations (GDPR, PDPA, HIPAA, PCI DSS for card data) impose requirements, and **compliance** means meeting
them. Compliance and security overlap but are not the same: you can be compliant yet insecure (meeting a checklist
while missing real risks), or secure in ways no regulation names. Treat compliance as a floor, not the goal.

## The human layer

Most incidents involve people — a clicked phishing link, a reused password, a misconfiguration. Governance therefore
includes the human controls: **security awareness training**, clear **acceptable-use** and **incident-reporting**
policies, onboarding/offboarding that grants and revokes access promptly, and a culture where reporting a mistake is
safe. The strongest technical stack fails if people are not brought along; the best programmes make secure behaviour
the default and the easy choice.
