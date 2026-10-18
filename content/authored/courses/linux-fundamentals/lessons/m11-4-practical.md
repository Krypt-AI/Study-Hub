---
id: linux-fundamentals.m11.l4
title: "Practical assessment: harden the office server"
summary: Apply and evidence a security baseline on lab01, measuring the improvement with Lynis.
objectives:
  - Implement a hardening baseline safely
  - Measure, evidence and justify security decisions
estimatedMinutes: 90
topics: [linux.m11]
---

## The request

> **CR-2026-047** — "Before Kedai Kira's server goes live, apply the IT security baseline: patched, SSH keys only for staff in the `sshusers` group, no root SSH, firewall default deny with only SSH (admin network) and HTTP open, unnecessary services disabled, password policy for local accounts, and evidence of each. Report the Lynis hardening index before and after."

## Steps

1. Snapshot. Run `sudo lynis audit system --quick` and record the **before** index.
2. Apply the baseline (Modules 5, 9, 11). Keep a fallback session for SSH changes.
3. Collect evidence:

   ```bash
   apt list --upgradable
   sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|allowgroups'
   sudo ufw status verbose
   sudo ss -tulpn
   systemctl list-unit-files --type=service --state=enabled
   grep -v '^#' /etc/security/pwquality.conf | grep -v '^$'
   timedatectl | grep synchronized
   ```

4. Test from your laptop: key login works, password login and root login are refused.
5. Run Lynis again and record the **after** index.

## Marking

Report the evidence and your decisions, then compare with the model answer.
