---
id: linux-fundamentals.m14.l3
title: "Capstone: evidence and documentation"
summary: Assemble the as-built document, runbooks, change record, test report and troubleshooting tickets the client asked for.
objectives:
  - Produce an as-built document someone else can maintain the server from
  - Present test evidence against every acceptance criterion
  - Write runbooks and tickets to workplace standard
estimatedMinutes: 240
topics: [linux.m14]
resources:
  - { title: "Write the Docs: documentation guide", url: "https://www.writethedocs.org/guide/", free: true, official: false }
  - { title: "Ubuntu Server documentation", url: "https://documentation.ubuntu.com/server/", free: true, official: true }
---

## What to hand over

The client asked to "document everything so Hafiz can look after it, and tell us how you tested it". Deliver one folder (or Git repository) containing:

| Document | Contents |
|---|---|
| **1. As-built document** | purpose; system overview (hostname, IP, OS version, disks, LVM layout, mounts); accounts and groups; folder structure with modes and ACLs; services and ports; firewall rules; SSH policy; backup design (what, when, where, retention); monitoring; where scripts and units live; known limitations |
| **2. Test report** | every acceptance criterion R1–R13 with the test, the evidence (command and trimmed output) and PASS/FAIL |
| **3. Runbooks** | at least: check last night's backup; restore a file; add a staff member; what to do when the intranet is down |
| **4. Change record** | the initial build as a change: summary, impact, risk, plan, test, rollback, approval |
| **5. Tickets** | the two troubleshooting incidents from M8 |
| **6. Recommendations** | what you would do next and why (off-site backup, second server, central authentication, SMB shares for Windows users, monitoring system) |

## Writing for the reader

Your reader is **Hafiz**, a part-time technician who knows basic Linux, and the **director**, who is not technical.

- Start the as-built document with a half-page summary in plain language for the director.
- Use tables for facts (IP, groups, paths, ports); prose for reasons.
- Give **exact commands** in runbooks, copyable, with what the output should look like.
- Explain **why** for non-obvious decisions (why keys only; why ACLs; why the backup is on a separate volume, and why that is still not off-site).
- Never include passwords or private keys. Say where credentials are kept instead.

## Evidence that convinces

Evidence is the output of a command that a reviewer could run again. Collect it with the commands you already know:

```bash
hostnamectl; ip -br a; timedatectl | grep -E 'zone|synchronized'
lsblk -f; sudo lvs; findmnt /srv/teratai /srv/backup
getent group admin teachers management sshusers
ls -ld /srv/teratai/*; getfacl -p /srv/teratai/admin/timetable
sudo -l -U hafiz
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|allowgroups'
sudo ufw status verbose; sudo ss -tulpn
systemctl list-timers teratai-backup.timer; journalctl -u teratai-backup -n 5 --no-pager
journalctl -t healthcheck -n 4 --no-pager
```

Trim long output to the relevant lines, keep the command with it, and date each piece of evidence.

## Self-review before submission

Ask a classmate (or yourself, a day later) to do two things using only your documents:

1. Restore a file using your runbook.
2. Answer "which ports are open to whom, and why?" from your as-built document.

Fix anything they could not do without asking you.

## Task for this lesson

Write the documents. In the questions below, submit the executive summary, two runbooks and the test report summary.
