---
id: linux-fundamentals.m14.l2
title: "Capstone: build plan and milestones"
summary: Plan and carry out the build in safe milestones, each with its checks, snapshot and log entry.
objectives:
  - Sequence a server build so each step can be verified and rolled back
  - Reuse the skills from Modules 0–13 to meet each requirement
  - Keep a build log that becomes the as-built documentation
estimatedMinutes: 600
topics: [linux.m14]
---

## Work in milestones

Build in this order. At the end of each milestone: run its checks, take a **snapshot** named after it, commit your scripts and notes to Git, and write a log entry. If something goes wrong later, you can return to the last good milestone instead of starting again.

### M1 — Base system (R1) · Modules 0, 5, 9

- Install Ubuntu Server LTS; hostname `teratai-srv01`; OpenSSH server.
- Static address with netplan (`netplan try`); time sync checked; full upgrade and reboot if required; unattended-upgrades on.
- **Checks**: `hostnamectl`, `ip -br a`, `timedatectl`, `apt list --upgradable`.

### M2 — Storage (R9) · Module 8

- Second disk: GPT, LVM partition, `vg_data`, `lv_teratai` (ext4) and `lv_backup` (ext4 or XFS).
- Mount at `/srv/teratai` and `/srv/backup` by UUID; `findmnt --verify`; `mount -a`; reboot test.
- **Checks**: `lsblk -f`, `sudo lvs`, `findmnt /srv/teratai /srv/backup`.

### M3 — Accounts, groups and folders (R2–R5) · Module 4, 11

- Groups `admin`, `teachers`, `management`, `sshusers`; six test users; password policy (pwquality, ageing); forced change at first login.
- Folders with setgid and `2770`; timetable ACL with default ACL; Hafiz's sudoers file via `visudo -f` and `systemd-journal` membership.
- Teachers must pass **through** `/srv/teratai/admin` to reach the timetable without being able to list it: give `teachers` execute-only access there (`setfacl -m g:teachers:x /srv/teratai/admin`). Module 4 explained why `x` without `r` allows exactly that.
- Prefer a script (`add-staff.sh` from Module 13) over typing: it documents itself.
- **Checks**: the access test matrix below.

### M4 — Intranet (R6) · Modules 5, 7

- nginx installed; site `/etc/nginx/sites-available/teratai` with `root /var/www/teratai;`, enabled with a symlink in `sites-enabled` (remove the default site); `nginx -t`; reload.
- `/var/www/teratai` owned `root:management`, `2775`, files readable by `www-data`.
- **Checks**: `curl -I http://teratai-srv01` (or its IP) returns 200; `siti` can edit `index.html`; `mei` cannot.

### M5 — Security (R7, R8) · Modules 9, 11

- Lynis **before**. Keys for test users who need SSH; `10-hardening.conf`; `sshd -t`; second session; restart; external tests.
- ufw: default deny incoming; SSH (limit) from the admin network; HTTP from the staff network; enable.
- Disable unused services; risky-file scans; Lynis **after**.
- **Checks**: `sshd -T | grep -E ...`, `ufw status verbose`, `ss -tulpn`, refused password and root logins.

### M6 — Backups (R10) · Module 12, 13

- `teratai-backup.sh` (strict mode, logs, tar with ACLs, package list, checksums, tests, retention) and its **timer**.
- One manual run; then a **restore test** of one file and of the whole admin folder into `/tmp`, compared with `diff -r` and `getfacl`.
- **Checks**: `systemctl list-timers`, journal of the run, restore evidence.

### M7 — Monitoring (R11) · Modules 3, 10, 13

- Health check (load vs CPUs, available memory, disk ≥ 80 %, failed units, nginx active) every 15 minutes to the journal.
- **Checks**: two runs in `journalctl -t healthcheck`; force a warning (fill a test volume or lower the threshold) and see it logged.

### M8 — Troubleshooting evidence (R12) · Module 10

- Ask a classmate to inject two faults (or use the Module 10 drill script), diagnose with the method, fix, and write each up as a ticket.

## The access test matrix (R3–R5)

Run every cell and record PASS/FAIL:

| Test | Expected |
|---|---|
| `sudo -u aina touch /srv/teratai/admin/fees.csv` | allowed |
| `sudo -u mei ls /srv/teratai/admin` | **denied** |
| `sudo -u mei cat /srv/teratai/admin/timetable/term1.txt` | allowed |
| `sudo -u mei touch /srv/teratai/admin/timetable/x` | **denied** |
| `sudo -u mei touch /srv/teratai/teachers/notes.txt` | allowed; group `teachers` |
| `sudo -u siti cat /srv/teratai/admin/fees.csv` | **denied** |
| `sudo -u hafiz sudo systemctl restart nginx` | allowed |
| `sudo -u hafiz ls /srv/teratai/admin` | **denied** |
| `sudo -u hafiz journalctl -u nginx -n 5` | allowed |

(`sudo -u hafiz sudo ...` asks for hafiz's password; test it from a real `su - hafiz` session if you prefer.)

## Keep a build log

For each milestone: date and time, what you did (commands), the checks and their output, problems and how you solved them, the snapshot name, the Git commit. This log is the raw material for the next lesson's documents.

## Task for this lesson

Build the server. When all milestones pass, answer the questions below.
