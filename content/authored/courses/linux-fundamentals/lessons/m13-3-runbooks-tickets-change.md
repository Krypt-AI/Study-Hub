---
id: linux-fundamentals.m13.l3
title: Runbooks, tickets and change management
summary: Write runbooks others can follow, document tickets so work is traceable, and make changes through a simple change process.
objectives:
  - Write a runbook with prerequisites, steps, verification and rollback
  - Write ticket updates that are clear, factual and reusable
  - Explain incidents, service requests, problems and changes
  - Prepare a change request with risk, plan, test, rollback and communication
estimatedMinutes: 45
topics: [linux.m13]
resources:
  - { title: "Google SRE book: Postmortem culture", url: "https://sre.google/sre-book/postmortem-culture/", free: true, official: true }
  - { title: "Write the Docs: documentation guide", url: "https://www.writethedocs.org/guide/", free: true, official: false }
---

## Why documentation is part of the job

In an organisation, work that is not written down did not happen: nobody can review it, repeat it, audit it, or continue it when you are away. Employers notice juniors who document well, because it saves everyone time.

Three kinds of document matter most day to day:

- **Runbooks**: how to do a task, step by step.
- **Tickets**: the record of each request or incident.
- **Change records**: what will change, why, how, and how to undo it.

## Runbooks

A runbook lets a colleague with the right access perform a task correctly, at 3 a.m., without asking you.

```markdown
# Runbook: Restore a file from the Kedai Kira share backup

Owner: IT support · Last tested: 2026-10-18 · Applies to: lab01 (Ubuntu 26.04)

## When to use
A user needs an earlier version of a file in /srv/kira.

## Prerequisites
- sudo on lab01; the user's ticket with file path and approximate date.

## Steps
1. Find versions:
   `ls -l /srv/backup/snapshots/*/accounts/<file>`
2. Choose the version with the user; copy it to /tmp:
   `sudo cp -a /srv/backup/snapshots/<date>/accounts/<file> /tmp/`
3. Place it beside the current file (never overwrite):
   `sudo cp -a /tmp/<file> /srv/kira/accounts/<name>.restored-<date>.<ext>`
4. Check ownership and ACL: `ls -l`, `getfacl`.

## Verify
The user opens the restored file and confirms it is correct.

## Rollback
Delete the `.restored-` copy. Nothing else was changed.

## Escalate
If no snapshot contains the file: IT lead (Aina, ext. 201).
```

Good runbooks are specific (exact commands and paths), include verification and rollback, name an owner and a "last tested" date, and are **tested** by someone other than the author.

## Tickets

Organisations track work in a ticketing system (Jira Service Management, ServiceNow, Freshservice, GLPI, osTicket). ITIL vocabulary is common:

| Type | Meaning | Example |
|---|---|---|
| **Incident** | something is broken or degraded; restore service | "Intranet is down" |
| **Service request** | a standard ask | "New account for Zul" |
| **Problem** | the underlying cause of one or more incidents | "Disk fills every month-end" |
| **Change** | a planned modification to a system | "Enable key-only SSH" |

A good ticket update is **factual**, **timestamped** and **reproducible**:

```text
2026-10-18 10:14  Investigated. `systemctl status nginx` → failed, "bind() to 0.0.0.0:80 failed
                  (98: Address already in use)". `ss -tlnp` → python3 (PID 3901, user farid) on :80.
2026-10-18 10:18  Contacted farid: leftover test server. Stopped PID 3901 with SIGTERM. Started nginx.
2026-10-18 10:20  Verified: http://192.168.56.10 returns 200 from office PC. Resolved.
                  Follow-up: problem ticket PRB-12 to stop test servers using port 80.
```

Avoid "fixed it", "did some stuff", or blaming people. Write so that someone reading it in six months understands what happened.

## Change management

Unplanned changes cause most outages. A **change process** makes changes visible, reviewed and reversible. Even a small team benefits from a lightweight version:

| Section of a change request | Example |
|---|---|
| Summary and reason | "Disable SSH password logins on lab01 to stop password-guessing risk (audit finding A-7)." |
| Scope and impact | "All staff SSH access; staff without keys cannot log in." |
| Risk and its mitigation | "Medium: lock-out. Mitigation: confirm keys for all sshusers members first; console access available." |
| Implementation plan | numbered steps with commands |
| Test plan | "From an office PC: key login OK; password login refused; root refused." |
| **Rollback plan** | "Remove /etc/ssh/sshd_config.d/10-hardening.conf; `sshd -t`; restart ssh." |
| Schedule | "Tue 21 Oct 2026, 18:00–18:30 (after hours)." |
| Approval and communication | "Approved by IT lead; staff emailed on 17 Oct." |

Change types: **standard** (pre-approved, low risk, routine: a runbook task), **normal** (reviewed and approved before scheduling), and **emergency** (to fix an incident now; documented and reviewed afterwards).

After any significant incident, a **blameless post-incident review** asks what happened, why the system allowed it, and what will prevent it next time, focusing on processes and systems rather than on individuals.

## Guided lab

1. Write the runbook above for your lab, test it by restoring a file, and correct anything that did not match reality.
2. Rewrite a vague ticket ("server slow, restarted it, fine now") as a proper update with timestamps, evidence, action, verification and follow-up.
3. Write a change request for the SSH hardening you did in Module 11, including a rollback plan you have tested.

## Independent exercises

1. Classify each as incident, service request, problem or change: "password reset", "website returns 500 since 9:00", "add a firewall rule for the new payroll vendor", "backups fail every Sunday".
2. Explain why a rollback plan must be written **before** a change, not during it.
3. Find a publicly published post-incident review from a well-known company and list its timeline, root cause and follow-up actions.
