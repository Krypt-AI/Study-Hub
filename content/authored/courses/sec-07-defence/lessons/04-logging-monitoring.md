---
id: sec-07-defence.l04
title: Logging and monitoring
summary: What to log, central collection into a SIEM, detection by signature and anomaly, alerting and the SOC, and protecting the logs themselves.
objectives:
  - Decide what security events to log and why central collection matters
  - Explain how a SIEM detects and alerts, and the role of a SOC
  - Protect log integrity and tune to reduce alert fatigue
estimatedMinutes: 55
topics: [sec07.monitoring]
resources:
  - { title: "NIST SP 800-92 (Log Management)", url: "https://csrc.nist.gov/pubs/sp/800/92/final", free: true, official: true }
  - { title: "MITRE ATT&CK (detection mapping)", url: "https://attack.mitre.org/", free: true, official: true }
  - { title: "Microsoft: Windows security auditing", url: "https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/security-auditing-overview", free: true, official: true }
---

## If you cannot see it, you cannot stop it

Prevention is never perfect, so **detection** is the other half of defence. That rests on **logging** — recording what
happens — and **monitoring** — watching those records for signs of trouble. A09 of the OWASP Top 10 is literally
"Security Logging and Alerting Failures" (Stage 6), because so many breaches go undetected for months.

## What to log

Capture the events that reveal attacks and support investigation (Stage 8):

- **Authentication**: logons, failures, privilege use, new accounts, group changes.
- **Access**: to sensitive files and systems.
- **Network**: firewall allows/denies, connections, DNS queries (Stage 2).
- **System**: service start/stop, config changes, process creation.
- **Application**: errors, security-relevant actions.

Each entry needs **who, what, when, where**, and an accurate, synchronised **timestamp** (time sync across systems is
essential, or timelines fall apart). Do not log secrets or full sensitive data.

## Central collection and the SIEM

Logs scattered across hundreds of machines are useless in an incident, and an attacker can delete local logs. So ship
them to a **central** store. A **SIEM** (Security Information and Event Management) collects logs from everywhere,
normalises them, and **correlates** across sources to detect things no single log shows — for example, a failed logon
storm on one host followed by a success and then unusual outbound traffic.

Detection methods:

- **Signatures / rules** — known-bad patterns (a specific exploit, a known-malicious domain).
- **Anomaly / behaviour** — deviation from a **baseline** of normal (Stage 1), which can catch novel attacks. ATT&CK
  helps map detections to real techniques.

## Alerting, the SOC and alert fatigue

Alerts flow to analysts — in larger organisations, a **Security Operations Centre (SOC)** watching around the clock.
The chronic problem is **alert fatigue**: too many low-quality alerts bury the real one. Good monitoring is therefore
as much about **tuning** — suppressing noise, raising fidelity, prioritising by risk — as about collecting more.
**SOAR** tooling automates routine responses so analysts focus on what matters.

## Protect the logs themselves

Attackers try to erase their tracks, so logs are a target:

- **Forward off the host** quickly, so local tampering does not lose the evidence.
- **Restrict and monitor access** to the log store.
- Consider **write-once / immutable** storage for critical logs, and sign or hash them for integrity (Stage 5).

Well-designed logging turns an invisible intruder into an alert on a screen — and provides the timeline every incident
response (Stage 8) depends on.
