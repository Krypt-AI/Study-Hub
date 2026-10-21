---
id: sec-08-incident-response.l01
title: The incident-response lifecycle
summary: What counts as an incident, the NIST IR phases, the roles and the plan, and why preparation decides how well the rest goes.
objectives:
  - Define an event versus an incident and name the IR phases
  - Describe the key roles and the incident-response plan
  - Explain why preparation is the most important phase
estimatedMinutes: 45
topics: [sec08.lifecycle]
resources:
  - { title: "NIST SP 800-61 (Computer Security Incident Handling Guide)", url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final", free: true, official: true }
  - { title: "SANS Incident Handler's Handbook", url: "https://www.sans.org/white-papers/33901/", free: true, official: false }
  - { title: "CISA Incident Response resources", url: "https://www.cisa.gov/resources-tools/resources", free: true, official: true }
---

## Event versus incident

An **event** is any observable occurrence (a login, a connection). A **security incident** is an event, or series of
events, that actually or imminently harms confidentiality, integrity or availability, or breaks security policy. Not
every alert is an incident; triage (lesson 2) decides. Having an agreed definition and severity scale avoids both
panic and complacency.

## The NIST lifecycle

NIST SP 800-61 organises incident response into phases that form a loop:

1. **Preparation** — before anything happens: the plan, the team, the tools, logging (Stage 7), backups, contacts and
   training.
2. **Detection & Analysis** — notice something is wrong (from monitoring, a user report, a third party), confirm it,
   and understand scope and impact.
3. **Containment, Eradication & Recovery** — stop the spread, remove the attacker and their footholds, and restore
   systems to safe operation.
4. **Post-incident Activity** — learn: what happened, how to prevent recurrence, what to improve (lesson 5).

The loop feeds back: lessons from one incident strengthen preparation for the next.

## Containment, eradication, recovery — in order and with care

- **Containment** limits damage now: isolate affected hosts, disable compromised accounts, block malicious
  infrastructure — while **preserving evidence** (lesson 3), so do not just wipe everything.
- **Eradication** removes the cause: the malware, the backdoor, the vulnerability that was exploited. If you skip the
  root cause, the attacker returns.
- **Recovery** restores clean systems (often from known-good backups), monitors them closely, and confirms normal
  operation before standing down.

Rushing to "reboot and move on" often destroys evidence and leaves the attacker's access intact.

## Roles and the plan

An **incident-response plan** written in advance says who does what: an **incident commander** coordinating, technical
responders, and clear lines to **legal, communications, management** and, where required, **regulators and law
enforcement**. It lists contacts, severity levels, decision authority (who may disconnect a production system?), and
escalation paths. Some incidents trigger legal **breach-notification** deadlines, so legal and privacy involvement is
part of the plan, not an afterthought.

## Preparation wins incidents

The phase that most determines the outcome is the one before the incident. Teams that have the logs (Stage 7), tested
backups (Stage 7), a written and **rehearsed** plan (tabletop exercises), and clear roles respond calmly and fast.
Teams that improvise during a crisis make avoidable mistakes. You cannot control when an incident happens; you can
control how ready you are.
