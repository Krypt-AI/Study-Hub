---
id: sec-08-incident-response.l02
title: Detection and triage
summary: Where detections come from, how to triage an alert, scoping an incident, the kill-chain and ATT&CK as investigation aids, and prioritising by impact.
objectives:
  - Triage an alert from true/false positive to severity
  - Scope an incident across hosts, accounts and time
  - Use the kill chain and ATT&CK to structure an investigation
estimatedMinutes: 50
topics: [sec08.triage]
resources:
  - { title: "MITRE ATT&CK", url: "https://attack.mitre.org/", free: true, official: true }
  - { title: "Lockheed Martin Cyber Kill Chain", url: "https://www.lockheedmartin.com/en-us/capabilities/cyber/cyber-kill-chain.html", free: true, official: false }
  - { title: "NIST SP 800-61 (detection and analysis)", url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final", free: true, official: true }
---

## Where detections come from

Incidents surface from several directions: the **SIEM/EDR** alerts (Stage 7), a **user report** ("my machine is
acting strange", "I clicked a link"), a **third party** (a partner, a researcher, or law enforcement telling you), or
**proactive hunting**. User reports are gold — treat them seriously and make reporting easy (Stage 7).

## Triage: is it real, and how bad?

Most alerts are not incidents. **Triage** is the fast first assessment:

1. **True or false positive?** Does the evidence actually indicate malicious or unauthorised activity, or is it benign
   (a sysadmin's legitimate tool, a misconfiguration)?
2. **Severity and impact.** What is affected, how critical is it, is it spreading, is sensitive data involved?
3. **Prioritise.** Limited responders go to the highest impact first. A ransomware foothold on a domain controller
   outranks adware on one laptop.

Document as you go — time, what you saw, what you did — because triage notes become the incident timeline and must
stand up later (lesson 5).

## Scoping

A single alert is rarely the whole story. **Scoping** answers: which hosts, which accounts, and over what time window?
Pivot through the central logs — if this host is compromised, what did that account also log into, what else talked to
that malicious IP, when did it really start? Attackers move laterally (Stage 7), so assume one finding is a thread to
pull, not the end.

## Frameworks that structure the hunt

- **Cyber Kill Chain** — models an intrusion as stages (reconnaissance → delivery → exploitation → installation →
  command-and-control → actions on objectives). Knowing the stages suggests what to look for next and where you can
  break the chain.
- **MITRE ATT&CK** — a detailed catalogue of attacker **tactics and techniques** observed in the wild (Stage 4). In an
  investigation it helps you name what you are seeing, anticipate related techniques the same actor uses, and map
  detections and gaps.

These are maps, not scripts: they help you reason about an adversary's options and keep the investigation systematic
rather than hunch-driven.

## Decide and act

Triage ends in a decision: close as a false positive (with a note), handle as a minor event, or **declare an
incident** and trigger the plan (lesson 1). Declaring brings in the team, the roles and the authority to contain.
Hesitating to declare is a common failure; it is better to spin up and stand down than to let a real incident smoulder
unowned.
