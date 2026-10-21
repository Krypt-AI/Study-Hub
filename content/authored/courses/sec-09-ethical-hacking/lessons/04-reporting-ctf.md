---
id: sec-09-ethical-hacking.l04
title: Reporting, CTFs and careers
summary: Why the report is the real deliverable, how to write findings with severity and remediation, how capture-the-flag events and hackathons build skill legally, and the certification and career paths.
objectives:
  - Structure a penetration-test finding with risk and remediation
  - Use CTFs and hackathons to build skill within the rules
  - Map the certifications and roles in offensive and defensive security
estimatedMinutes: 50
topics: [sec09.reporting]
resources:
  - { title: "CEH certification (EC-Council)", url: "https://www.eccouncil.org/train-certify/certified-ethical-hacker-ceh/", free: true, official: true }
  - { title: "CompTIA PenTest+", url: "https://www.comptia.org/en-us/certifications/pentest/", free: true, official: true }
  - { title: "OWASP Web Security Testing Guide (reporting)", url: "https://owasp.org/www-project-web-security-testing-guide/", free: true, official: true }
  - { title: "CTFtime (CTF event calendar)", url: "https://ctftime.org/", free: true, official: false }
---

## The report is the product

Clients do not pay for the thrill of a break-in; they pay for a clear picture of their risk and how to reduce it. The
**report** is the deliverable, and the skill of writing it well is as important as any technical ability.

A good **finding** contains:

- **Title and severity** — rated by likelihood and impact (often using CVSS), so the client can prioritise.
- **Affected assets** — exactly where it applies.
- **Description** — what the weakness is, in plain terms.
- **Evidence / reproduction** — enough for the client to confirm it, without gratuitous sensitive data.
- **Business impact** — what it would mean for the organisation, not just the technical detail.
- **Remediation** — concrete, actionable steps to fix it, and references.

Order findings by **risk**, lead with an **executive summary** for management, and keep a technical appendix for the
engineers (the same audience split as incident reporting, Stage 8). A report that is accurate, prioritised and
actionable is what turns testing into security improvement.

## CTFs and hackathons: skill-building within the rules

**Capture the Flag (CTF)** events are legal, time-boxed competitions where you solve security challenges (web,
crypto, reverse-engineering, forensics, "pwn") to find **flags**, on infrastructure the organisers provide and
authorise. They are the best way to build and prove hands-on skill safely:

- **Jeopardy** CTFs offer independent challenges by category and points.
- **Attack-defense** CTFs have teams attack each other's provided services while defending their own — on the
  competition's own isolated network.

Security **hackathons** similarly provide a sanctioned environment and a goal (build a defensive tool, solve a
challenge). In all of these, authorisation is built in: you act only on the organisers' infrastructure under their
rules. Track events on CTFtime and practise on the ranges from lesson 0.

## Certifications and careers

The field has well-mapped credentials (details and current facts are in Study Hub's Certifications area):

- **Entry / foundational:** ISC2 CC, CompTIA Security+ (defensive grounding).
- **Offensive:** **CEH** (EC-Council) and **CompTIA PenTest+** validate ethical-hacking knowledge and methodology;
  hands-on certifications go further into practical exploitation on provided labs.
- **Defensive / analyst:** CompTIA CySA+, blue-team and SOC analyst credentials.
- **Advanced:** specialised and expert certifications in offensive security, cloud, and more.

Roles span **penetration tester / red teamer**, **security analyst / blue team**, **incident responder**, **security
engineer**, and **GRC**. The strongest practitioners understand both sides — which is the whole shape of this
roadmap: foundations, networking, Linux, principles, cryptography, web security, defence, incident response, and this
authorised-offensive capstone. Keep practising on legal ranges, document what you learn, and let the certifications
mark the milestones.
