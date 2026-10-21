---
id: sec-06-web-security.l04
title: The OWASP Top 10
summary: A tour of the OWASP Top 10 (2025) as a defender's checklist, plus CSRF, SSRF and security headers, and how to use the list in design and review.
objectives:
  - Name the OWASP Top 10 (2025) categories and the defence for each
  - Explain CSRF and SSRF and their defences
  - Use the Top 10 as a design and review checklist
estimatedMinutes: 55
topics: [sec06.owasp]
resources:
  - { title: "OWASP Top 10:2025", url: "https://owasp.org/Top10/2025/", free: true, official: true }
  - { title: "OWASP Cheat Sheet Series", url: "https://cheatsheetseries.owasp.org/", free: true, official: true }
  - { title: "OWASP Application Security Verification Standard (ASVS)", url: "https://owasp.org/www-project-application-security-verification-standard/", free: true, official: true }
  - { title: "MDN: web security headers", url: "https://developer.mozilla.org/en-US/docs/Web/Security", free: true, official: true }
---

## The list as a checklist

The **OWASP Top 10** is the industry's consensus list of the most critical web application security risks, updated
every few years. Use it as a checklist in design and review. The **2025** edition:

| # | Category | Core defence |
|---|---|---|
| A01 | Broken Access Control | Server-side authorisation on every request (lesson 2) |
| A02 | Security Misconfiguration | Harden defaults, patch, remove unused features, manage config |
| A03 | Software Supply Chain Failures | Inventory dependencies (SBOM), pin and verify, trusted sources, update |
| A04 | Cryptographic Failures | Encrypt sensitive data in transit and at rest; strong, correct crypto (Stage 5) |
| A05 | Injection | Parameterise, encode on output, validate (lesson 3) |
| A06 | Insecure Design | Threat-model early; security requirements, not just bug-fixing |
| A07 | Authentication Failures | MFA, strong session management, no weak credentials (Stage 5) |
| A08 | Software or Data Integrity Failures | Verify integrity of updates, CI/CD and deserialised data |
| A09 | Security Logging & Alerting Failures | Log security events, monitor and alert (Stage 7–8) |
| A10 | Mishandling of Exceptional Conditions | Handle errors safely; fail closed; do not leak details |

Two broad shifts in 2025: **supply chain** was broadened from "vulnerable components" into A03, and **mishandling of
exceptional conditions** (error handling, failing open) entered at A10.

## Two more you must know

- **CSRF (Cross-Site Request Forgery).** A malicious page makes the victim's browser send a state-changing request to
  a site they are logged into, riding on their cookies. Defences: **anti-CSRF tokens** (an unpredictable value the
  attacker's page cannot know) and **SameSite cookies**.
- **SSRF (Server-Side Request Forgery).** The attacker tricks the *server* into making a request to a target of their
  choosing — often internal systems or cloud metadata endpoints the attacker cannot reach directly. Defences:
  allowlist outbound destinations, block internal address ranges, and do not let user input dictate server-side URLs.

## Security headers

A few response headers add defence in depth cheaply:

- `Content-Security-Policy` — restrict script sources (anti-XSS, lesson 3).
- `Strict-Transport-Security` (HSTS) — force HTTPS.
- `X-Content-Type-Options: nosniff` — stop MIME sniffing.
- `X-Frame-Options` / `frame-ancestors` — stop clickjacking.

## Using it well

The Top 10 is awareness, not a complete standard — for thorough coverage use the **ASVS** (verification requirements)
and the **Cheat Sheet Series** (how-to per topic). In practice: threat-model during design (A06), build with the
defences above, review against the list, and test on authorised targets (the Web Security Academy covers every item).
Security is strongest when these checks are part of the development process, not a scan bolted on at the end.
