---
id: sec-04-principles.l02
title: Threats, vulnerabilities and risk
summary: The precise meaning of asset, threat, vulnerability and risk, threat actors and vectors, how risk is assessed, and the four ways to treat it.
objectives:
  - Define asset, threat, vulnerability, likelihood, impact and risk precisely
  - Identify threat actors, vectors and the attack surface
  - Assess a risk and choose a treatment
estimatedMinutes: 50
topics: [sec04.risk]
resources:
  - { title: "NIST SP 800-30 (Guide for Conducting Risk Assessments)", url: "https://csrc.nist.gov/pubs/sp/800/30/r1/final", free: true, official: true }
  - { title: "NIST SP 800-37 (Risk Management Framework)", url: "https://csrc.nist.gov/pubs/sp/800/37/r2/final", free: true, official: true }
  - { title: "MITRE ATT&CK", url: "https://attack.mitre.org/", free: true, official: true }
---

## The vocabulary, used precisely

These words have exact meanings in security; mixing them up muddles every discussion:

- **Asset** — something of value to protect (data, a system, a reputation).
- **Vulnerability** — a weakness that could be exploited (an unpatched service, a weak password, an untrained user).
- **Threat** — something that could cause harm (a criminal group, malware, a flood, an insider).
- **Threat vector** — the path a threat uses (a phishing email, an exposed port, a USB stick).
- **Likelihood** — how probable the harm is.
- **Impact** — how bad it would be if it happened.
- **Risk** — the combination: **risk = likelihood × impact**, given a threat meeting a vulnerability.

A threat with no matching vulnerability is low risk; a serious vulnerability with no threat or no impact is low risk.
Risk needs all the pieces.

## Threat actors

Who might act against you shapes what you defend against:

| Actor | Motivation | Typical capability |
|---|---|---|
| Opportunistic criminals | Money (ransomware, fraud) | Broad, automated |
| Organised crime | Money, at scale | High |
| Nation-state / APT | Espionage, disruption | Very high, persistent |
| Hacktivists | Ideology | Variable |
| Insiders | Grievance, money, mistakes | High access already |

The **attack surface** is the sum of all the points an attacker could try. Reducing it (fewer services, fewer
accounts, less exposed data) lowers risk directly. **MITRE ATT&CK** catalogues the techniques real actors use, a shared
language for describing and defending against them.

## Assessing and treating risk

A simple **qualitative** assessment rates likelihood and impact (low/medium/high) and plots them on a matrix to
prioritise. **Quantitative** methods put numbers on it (e.g. annualised loss expectancy). Either way, you then choose a
**treatment**:

| Treatment | Meaning | Example |
|---|---|---|
| **Mitigate** | Reduce likelihood or impact with controls | Patch, segment, add MFA |
| **Transfer** | Shift the loss to someone else | Cyber-insurance, outsourcing |
| **Avoid** | Stop doing the risky thing | Retire a vulnerable legacy system |
| **Accept** | Live with it (consciously, documented) | A low risk too costly to fix |

The risk left after mitigation is **residual risk**, which the business must formally accept. Security is not about
eliminating all risk — impossible — but about reducing it to a level the organisation can live with, and knowing
which risks those are.
