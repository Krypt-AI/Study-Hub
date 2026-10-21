---
id: sec-09-ethical-hacking.l01
title: Law, ethics and authorisation
summary: The legal basis of authorised testing, scope and rules of engagement, the kinds of engagement, responsible disclosure, and the professional ethics that define the field.
objectives:
  - Explain why authorisation and scope are legal boundaries, not formalities
  - Describe the engagement paperwork and the types of assessment
  - Apply responsible disclosure and professional ethics
estimatedMinutes: 50
topics: [sec09.legal]
resources:
  - { title: "EC-Council Code of Ethics", url: "https://www.eccouncil.org/code-of-ethics/", free: true, official: true }
  - { title: "CREST (penetration testing standards)", url: "https://www.crest-approved.org/", free: true, official: false }
  - { title: "CISA Coordinated Vulnerability Disclosure", url: "https://www.cisa.gov/coordinated-vulnerability-disclosure-process", free: true, official: true }
  - { title: "OWASP Firing Range / legal practice note", url: "https://owasp.org/", free: true, official: true }
---

## Authorisation is the whole thing

An ethical hacker and a criminal may run the same command; what separates them is **authorisation**. Testing a system
without the owner's explicit permission is a criminal offence in most jurisdictions (for example computer-misuse and
unauthorised-access laws), regardless of intent or whether damage occurred. So before any testing:

- There must be **written** authorisation from someone with the **authority** to grant it for those systems.
- It must define **scope** — exactly which systems, addresses, applications and accounts are in, and which are
  explicitly out.
- Finding something interesting **out of scope** does not extend your permission: stop, do not touch, report it to the
  client to decide.

Scope is a legal boundary. "I was only being thorough" is not a defence.

## The engagement paperwork

A professional engagement is wrapped in agreements that protect both sides:

- **Scope / statement of work** — what will be tested, to what depth (black/grey/white box), and the goals.
- **Rules of engagement (RoE)** — timing (hours, blackout windows), permitted and forbidden methods (e.g. no
  denial-of-service, no social-engineering of staff unless agreed), data-handling rules, and **emergency contacts** if
  something breaks or a real compromise is found.
- **Authorisation letter / "get out of jail" letter** — written proof the tester may do this, carried during the
  engagement.
- **NDA** — testers see sensitive systems and data; confidentiality is contractual.

## Types of engagement

- **Vulnerability assessment** — find and report weaknesses, usually without exploiting them.
- **Penetration test** — authorised simulated attack to demonstrate real impact, within scope and RoE.
- **Red team** — goal-oriented, stealthy, broad-scope exercise testing detection and response, usually against a
  **blue team** (defenders); a **purple team** has them collaborate to improve defences.
- **Bug bounty** — ongoing, scoped programmes where organisations authorise researchers to test and reward valid
  findings under published rules. Only test within a programme's stated scope and rules.

## Responsible disclosure

If you find a vulnerability (in authorised testing, a bounty, or your own systems), handle it **responsibly**: report
it privately to the owner, give them reasonable time to fix it, and do not release details or exploit it publicly
before a fix (**coordinated vulnerability disclosure**). Publishing a working exploit against others' live systems, or
selling access, is the opposite of ethical.

## Professional ethics

Bodies like EC-Council (CEH) and CREST publish **codes of ethics**: act only with authorisation, protect
confidentiality, do no unnecessary harm, report honestly, and stay within the law. These are not box-ticking —
testers are trusted with the keys to an organisation, and the entire profession depends on that trust. The skill of
this field is valuable precisely because it is wielded under these constraints.
