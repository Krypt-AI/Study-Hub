---
id: linux-fundamentals.m05.l4
title: "Practical assessment: a software and patching baseline"
summary: Install the software a role needs, prove where it came from, patch the server and record the change.
objectives:
  - Install and verify packages from trusted repositories
  - Patch a server and handle a required reboot
  - Document software state for an audit
estimatedMinutes: 60
topics: [linux.m05]
---

## The request

> **Change request CR-2026-031** — "Prepare `lab01` as a small web server: install nginx, curl, htop, tree and acl from Ubuntu's repositories. Apply all pending updates, reboot if required, and confirm automatic security updates are on. Record installed versions for the asset register."

## Steps

1. Take a snapshot (`m05-before-baseline`).
2. Update the index, then **review** what an upgrade would do before applying it.
3. Install the five packages in one command.
4. Verify each came from Ubuntu's archive (`apt policy`), and that nginx answers locally: `curl -I http://localhost`.
5. Apply updates; reboot if `/var/run/reboot-required` exists and confirm the running kernel afterwards.
6. Show that unattended-upgrades is enabled.
7. Produce the asset list:

   ```bash
   dpkg-query -W -f='${Package}\t${Version}\n' nginx curl htop tree acl
   ```

## Marking

Describe your steps and evidence, then tick the points you covered.
