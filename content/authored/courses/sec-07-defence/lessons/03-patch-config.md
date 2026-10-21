---
id: sec-07-defence.l03
title: Patch and configuration management
summary: Vulnerability and patch management, change control, asset inventory, secure configuration drift, and backups as the last line of defence.
objectives:
  - Describe a vulnerability and patch management cycle
  - Explain why asset inventory and change control underpin defence
  - Design a backup strategy that survives ransomware
estimatedMinutes: 50
topics: [sec07.patch]
resources:
  - { title: "NIST SP 800-40 (Patch Management)", url: "https://csrc.nist.gov/pubs/sp/800/40/r4/final", free: true, official: true }
  - { title: "CISA Known Exploited Vulnerabilities Catalog", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", free: true, official: true }
  - { title: "NIST SP 800-128 (security-focused configuration management)", url: "https://csrc.nist.gov/pubs/sp/800/128/final", free: true, official: true }
---

## You cannot protect what you do not know you have

Every defence starts with an **asset inventory**: a current list of your systems, software and data. Shadow IT — the
forgotten server, the unmanaged laptop — is where breaches hide, because nobody is patching or watching it. Inventory
is the first CIS Control for a reason (Stage 4).

## Vulnerability and patch management

Most breaches exploit **known** vulnerabilities for which a patch already exists; the attacker simply got there before
the defender patched. A patch management cycle keeps that window small:

1. **Discover** — scan for missing patches and known vulnerabilities; track vendor advisories.
2. **Prioritise** — by severity (CVSS score), exposure, and whether it is **actively exploited** (CISA's Known
   Exploited Vulnerabilities catalogue is the priority list). An exposed, exploited critical beats a theoretical one.
3. **Test** — apply patches in a staging environment first where possible.
4. **Deploy** — roll out, ideally automatically, within a defined timeframe per severity.
5. **Verify** — confirm the patch is actually present everywhere.

A **CVE** is a public identifier for a specific vulnerability; **CVSS** scores its severity 0–10. Speed matters most
for internet-facing systems and actively exploited bugs.

## Change control and configuration drift

Uncontrolled changes break things and open holes. **Change management** requires changes to be requested, reviewed,
tested and recorded, so you know what changed when something breaks or is breached. **Configuration drift** — systems
slowly diverging from their hardened baseline (Stage 7 lesson 1) — is countered by configuration-as-code and periodic
assessment that flags and re-converges drift.

## Backups: the last line of defence

When prevention fails — ransomware, destructive attack, hardware loss — **backups** decide whether you recover in
hours or never. A sound strategy:

- **3-2-1**: at least **3** copies of data, on **2** different media, with **1** off-site.
- **Immutable / offline copies.** Ransomware deliberately seeks and encrypts backups, so at least one copy must be
  offline or write-once (immutable) so it cannot be tampered with.
- **Test restores.** An untested backup is a hope, not a control. Regularly restore to prove it works and measure how
  long it takes (your recovery-time objective).
- **Protect the backups** with their own access control and monitoring; they contain everything.

Patch to shrink the chance of a breach, control changes so the system stays as hardened as you built it, and keep
tested backups so that when something still gets through, it is a bad day and not the end of the business.
