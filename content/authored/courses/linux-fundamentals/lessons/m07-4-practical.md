---
id: linux-fundamentals.m07.l4
title: "Practical assessment: a supervised internal service"
summary: Deploy a small internal web service under systemd, make it survive failures and reboots, and diagnose a broken start from the journal.
objectives:
  - Create and harden a systemd service for an internal tool
  - Diagnose and fix a failing unit using status and the journal
estimatedMinutes: 75
topics: [linux.m07]
---

## Scenario

Kedai Kira wants a simple internal status page on port 8080, served by Python's built-in web server from `/srv/kira/status`. It must start at boot, restart automatically if it crashes, and run without root.

## Part A — build it

1. Install Python if needed (`python3 --version`), create `/srv/kira/status/index.html` with a short message, and a system user: `sudo useradd -r -s /usr/sbin/nologin kira-status`.
2. Create `/etc/systemd/system/kira-status.service` that runs `/usr/bin/python3 -m http.server 8080 --directory /srv/kira/status` as `kira-status`, with `Restart=on-failure` and `NoNewPrivileges=yes`, wanted by `multi-user.target`.
3. Enable and start it; test with `curl -s localhost:8080`.
4. Kill its process with `kill -9` and show that systemd restarted it.
5. Reboot and show that it started at boot.

## Part B — fix it

Introduce this fault: change the port in `ExecStart` to `80`, run `daemon-reload` and restart. The service fails, because ports below 1024 need privileges.

1. Show `systemctl status` and the relevant journal lines.
2. Explain the error, put the port back to 8080 and verify.

## Marking

Paste your unit file and describe both parts.
