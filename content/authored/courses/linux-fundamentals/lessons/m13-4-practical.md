---
id: linux-fundamentals.m13.l4
title: "Practical assessment: automate and document a routine"
summary: Schedule the backup and health check, deliver a runbook and a change request, and show the evidence that the automation works.
objectives:
  - Schedule jobs with a systemd timer and cron, with logging and verification
  - Produce a runbook and a change request to workplace standard
estimatedMinutes: 90
topics: [linux.m13]
---

## The request

> **CR-2026-052** — "Automate Kedai Kira's nightly backup and the 15-minute health check. Provide a runbook for checking that last night's backup succeeded, and a change record for this change."

## Deliverables

1. **Backup timer**: `kira-backup.service` and `kira-backup.timer` (01:30 nightly, `Persistent=true`), enabled. Evidence: `systemctl list-timers`, one manual run with `systemctl start`, its journal output, and the new dated backup directory.
2. **Health check**: scheduled every 15 minutes, either as a cron entry with output to the journal (`| logger -t healthcheck`) or as a second timer. Evidence: two runs visible with `journalctl -t healthcheck` (or `-u`).
3. **Runbook**: "Check last night's backup" with prerequisites, steps, verification, what to do if it failed, escalation.
4. **Change record** for CR-2026-052 with summary, impact, risk, plan, test, rollback, schedule.
5. **Version control**: scripts, units, runbook and change record committed to your `~/admin` repository.

## Marking

Paste the key parts and evidence, then compare with the model answer.
