---
id: sec-04-principles.l03
title: Access control
summary: Identification, authentication, authorisation and accounting; the access-control models (DAC, MAC, RBAC, ABAC); least privilege and separation of duties.
objectives:
  - Distinguish identification, authentication, authorisation and accounting
  - Compare the main access-control models
  - Apply least privilege and separation of duties
estimatedMinutes: 50
topics: [sec04.access]
resources:
  - { title: "NIST SP 800-162 (Attribute-Based Access Control)", url: "https://csrc.nist.gov/pubs/sp/800/162/final", free: true, official: true }
  - { title: "NIST SP 800-63 (Digital Identity Guidelines)", url: "https://pages.nist.gov/800-63-4/", free: true, official: true }
  - { title: "NIST Zero Trust Architecture (SP 800-207)", url: "https://csrc.nist.gov/pubs/sp/800/207/final", free: true, official: true }
---

## The four A's

Controlling access has four steps, often confused:

1. **Identification** — you claim who you are (a username).
2. **Authentication** — you prove it (password, passkey, biometric; see the Cryptography course).
3. **Authorisation** — the system decides what that identity may do.
4. **Accounting / Auditing** — the system records what was done, for review and non-repudiation.

Authentication asks "are you who you say?"; authorisation asks "are you allowed to do this?". Both are needed: a
correctly authenticated user must still be stopped from actions beyond their rights.

## Access-control models

| Model | Who decides access | Example |
|---|---|---|
| **DAC** (Discretionary) | The resource **owner** grants access at their discretion | File owner shares a document |
| **MAC** (Mandatory) | A central **policy** based on labels/clearances; users cannot override | Military classifications; SELinux |
| **RBAC** (Role-Based) | Permissions attach to **roles**, users get roles | "Nurse", "Billing", "Admin" roles |
| **ABAC** (Attribute-Based) | Rules over **attributes** of user, resource, context | "Allow if dept=finance and time is work hours and on managed device" |

**RBAC** is the workhorse of most organisations: managing access by role is far easier to administer and audit than
per-user grants. **ABAC** and **zero trust** add context (device health, location, risk) to every decision.

## Least privilege and need to know

**Least privilege**: every user, service and process gets only the access it needs to do its job, and no more. Its
cousin **need to know** restricts data access to those who require it for a task. Together they shrink what a
compromised account or careless user can reach — the single most effective structural defence.

Practical forms: standard (not admin) accounts for daily work, **just-in-time** elevation for admin tasks, scoped API
tokens, per-service accounts, and regular **access reviews** to remove rights people no longer need (privilege tends
to accumulate — "privilege creep").

## Separation of duties

**Separation of duties** splits a sensitive action so no single person can complete it alone — the person who requests
a payment cannot also approve it. It defends against both fraud and single points of failure. Related: **dual
control** (two people required) and **mandatory vacations / job rotation** (so hidden misuse surfaces). These are
organisational controls, not technical ones, and they matter as much as any firewall.
