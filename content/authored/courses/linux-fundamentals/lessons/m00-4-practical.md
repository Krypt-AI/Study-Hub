---
id: linux-fundamentals.m00.l4
title: "Practical assessment: a working, documented lab"
summary: Prove that your lab server is installed, updated, reachable over SSH with a key, and protected by a snapshot.
objectives:
  - Demonstrate a working Ubuntu Server lab reachable over SSH
  - Record evidence of the installation in a lab log
estimatedMinutes: 45
topics: [linux.m00]
---

## The task

Your team lead asks you to prepare a practice server before training starts. Deliver:

1. An Ubuntu Server LTS VM named `lab01`, fully updated.
2. SSH access from your laptop with an Ed25519 key.
3. A snapshot named `01-clean-install` (or `02-ssh-ready` after this task).
4. A lab-log entry describing what you did.

## Evidence to collect

Run these on the server over SSH and keep the output in your lab log:

```bash
hostnamectl
ip -br address
lsb_release -a
apt list --upgradable
```

Expected, in outline:

```text
 Static hostname: lab01
Operating System: Ubuntu 26.04.1 LTS
          Kernel: Linux 7.0.0-15-generic
...
enp0s8           UP             192.168.56.101/24
...
Description:    Ubuntu 26.04.1 LTS
...
Listing...
```

`apt list --upgradable` printing only `Listing...` (or `Listing... Done`) means nothing is waiting to be upgraded.

## Marking

Answer the questions below in your own words, then compare with the model answer and tick the points you covered. Aim for every point before moving on: later modules assume this lab works.
