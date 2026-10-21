---
id: sec-04-principles.l04
title: Security design principles
summary: Timeless principles for building secure systems — defence in depth, fail-safe defaults, economy of mechanism, complete mediation, zero trust and more.
objectives:
  - State the classic secure-design principles and why each helps
  - Apply defence in depth and secure defaults to a scenario
  - Explain the shift from perimeter trust to zero trust
estimatedMinutes: 45
topics: [sec04.principles]
resources:
  - { title: "Saltzer and Schroeder: The Protection of Information in Computer Systems", url: "https://www.cs.virginia.edu/~evans/cs551/saltzer/", free: true, official: false }
  - { title: "NIST Zero Trust Architecture (SP 800-207)", url: "https://csrc.nist.gov/pubs/sp/800/207/final", free: true, official: true }
  - { title: "OWASP: Security by Design Principles", url: "https://owasp.org/www-project-developer-guide/", free: true, official: true }
---

## Principles that keep paying off

Most security failures violate a small set of long-known principles. Learn them as a checklist you can apply to any
design:

- **Defence in depth.** Layer independent controls so that the failure of one does not expose the asset. A firewall
  *and* host hardening *and* monitoring *and* least privilege — not a single wall.
- **Fail-safe / secure defaults.** When something fails or is unconfigured, deny by default. New accounts start with no
  access; a crashed filter blocks rather than passes.
- **Least privilege** (lesson 3) and **separation of duties.**
- **Economy of mechanism.** Keep security mechanisms as simple as possible — complexity hides bugs. Simple, reviewed
  code beats clever code.
- **Complete mediation.** Check authorisation on *every* access, not just the first. Caching "they were allowed
  earlier" is how broken access control happens (Web Security course).
- **Open design.** Security must not depend on secrecy of the design (Kerckhoffs's principle, Cryptography course);
  secrecy belongs to keys, not algorithms. "Security through obscurity" is at best a thin extra layer.
- **Minimise attack surface.** Expose the fewest features, ports and privileges needed.
- **Separation / isolation.** Keep components apart (segmentation, sandboxing, containers) so one breach does not
  spread.
- **Keep humans in mind (psychological acceptability).** If the secure way is painful, people bypass it. Make the
  secure path the easy path.

## Applying them

Imagine securing an internet-facing web app:

1. **Secure defaults**: deny all inbound except the needed port; new users get no admin.
2. **Minimise surface**: one service exposed, everything else firewalled off.
3. **Defence in depth**: WAF, input validation, least-privilege DB account, host hardening, monitoring.
4. **Complete mediation**: every request re-checks the user's authorisation for that resource.
5. **Isolation**: the database on a separate segment the internet cannot reach (Stage 2).

No single measure is relied upon; each assumes the others might fail.

## From perimeter to zero trust

The old model trusted anything "inside" the network perimeter. Remote work, cloud and insider threats broke that
assumption. **Zero trust** (NIST SP 800-207) replaces "trusted inside / untrusted outside" with **"never trust, always
verify"**: every request is authenticated, authorised and encrypted based on identity, device health and context,
regardless of where it comes from. It is defence in depth, complete mediation and least privilege applied
relentlessly — the direction modern security architecture is heading.
