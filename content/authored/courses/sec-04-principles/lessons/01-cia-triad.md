---
id: sec-04-principles.l01
title: The CIA triad
summary: Confidentiality, integrity and availability as the three goals of security, the controls that serve each, and the tensions between them and with usability.
objectives:
  - Define confidentiality, integrity and availability with examples
  - Map common controls to the goal they serve
  - Explain the trade-offs between the three and with usability
estimatedMinutes: 40
topics: [sec04.cia]
resources:
  - { title: "NIST glossary: CIA", url: "https://csrc.nist.gov/glossary", free: true, official: true }
  - { title: "ISC2 Certified in Cybersecurity exam outline", url: "https://www.isc2.org/certifications/cc/cc-certification-exam-outline", free: true, official: true }
  - { title: "CISA: cybersecurity best practices", url: "https://www.cisa.gov/topics/cybersecurity-best-practices", free: true, official: true }
---

## Three goals

Almost every security measure serves one of three goals, the **CIA triad**:

- **Confidentiality** — only authorised people can read the data. Breached by theft, eavesdropping, or oversharing.
- **Integrity** — data is accurate and unaltered except by authorised actions. Breached by tampering, corruption, or
  faulty processing.
- **Availability** — the data and services are there when needed. Breached by outages, ransomware, or
  denial-of-service.

A fourth idea, **non-repudiation** (you cannot deny an action you took), is often added; digital signatures provide it
(Cryptography course).

## Controls mapped to goals

| Goal | Example controls |
|---|---|
| Confidentiality | Encryption, access control, least privilege, data classification |
| Integrity | Hashing, digital signatures, checksums, change control, input validation |
| Availability | Backups, redundancy, failover, DDoS protection, capacity planning, patching |

Naming the goal a control serves is a habit worth building: it tells you *why* a measure exists and what you lose if it
fails. In an incident, asking "which of C, I, A was hit, and how badly?" structures the whole response.

## Tensions

The three goals pull against each other and against usability:

- Locking data down hard (confidentiality) can hurt **availability** — if the one key-holder is away, no one can read
  it.
- Aggressive integrity checks or MFA can frustrate users, who then work around them, weakening security overall.
- Maximising availability (open access, no friction) usually erodes confidentiality.

Security is therefore about **balance proportionate to risk**, not maximising every control. A public weather page
needs integrity and availability but little confidentiality; a patient record needs all three, heavily. The right
level comes from the risk assessment in the next lesson, and good design keeps the secure path also the easy path.
