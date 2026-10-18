---
id: linux-fundamentals.m06.l4
title: "Practical assessment: the slow server"
summary: Investigate a simulated performance problem, contain it without collateral damage, and write the ticket.
objectives:
  - Diagnose CPU-hungry and long-running processes
  - Choose proportionate actions and record them
estimatedMinutes: 50
topics: [linux.m06]
---

## Set up the scenario

Run this script (it simulates a misbehaving report job owned by `farid` and a forgotten job of your own):

```bash
sudo -u farid bash -c 'nohup bash -c "while :; do :; done" >/dev/null 2>&1 &'
nohup sleep 7200 > /dev/null 2>&1 &
```

## The ticket

> **Ticket #1077** — "Since this morning `lab01` responds slowly. Please find out why and fix it. Do not disrupt anyone's legitimate work without a reason."

## What to do

1. Find the cause with `top`/`htop` and `ps`, recording PID, user, command and run time.
2. Determine whether it is a service or a user process.
3. Contain it proportionately: first reduce its priority or pause it, then stop it with the gentlest signal that works.
4. Find and clean up your own forgotten `sleep` job.
5. Confirm the load has returned to normal (`uptime`, `top`).
6. Write the ticket update.

## Marking

Write your ticket update, then compare with the model answer.
