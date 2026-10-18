---
id: linux-fundamentals.m01.l4
title: "Practical assessment: find your way around a server"
summary: Answer a support request using only the command line and the documentation on the server.
objectives:
  - Gather system facts from the command line
  - Use the built-in documentation without searching online
  - Report results with the commands and exit codes that prove them
estimatedMinutes: 40
topics: [linux.m01]
---

## The ticket

> **Ticket #1042** — From: Helpdesk. "A vendor needs basic facts about `lab01` before installing their agent: the kernel release, CPU architecture, time zone, how long it has been running, and which user account you are working as. They also ask whether the directory `/opt/vendor` exists yet. Please reply with the commands you used."

## Rules

- Work over SSH, in your lab VM only.
- No internet searches: use `--help`, `man`, `apropos`, `type`.
- For the `/opt/vendor` question, show the **exit code** that proves your answer.

## Hints

- `uname` has options for each kernel fact.
- `timedatectl` shows the time zone; so does `date +%Z`.
- `ls -ld /opt/vendor; echo $?` answers the last question.

## Marking

Write your reply to the ticket below, then compare with the model answer and tick the points you covered.
