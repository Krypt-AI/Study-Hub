---
id: linux-fundamentals.m14.l1
title: "Capstone: the scenario and requirements"
summary: Meet the client, read their requirements, and turn them into a measurable specification for a server you will build and document.
objectives:
  - Analyse a client brief and extract technical requirements
  - Turn requirements into acceptance criteria you can test
  - Identify assumptions, risks and questions for the client
estimatedMinutes: 45
topics: [linux.m14]
---

## The client

**Teratai Learning Centre** is a tuition centre in Shah Alam with 3 branches and 14 staff. They have hired your small IT team to set up a central Linux server (`teratai-srv01`) in their main branch. Today they use a mixture of USB drives and personal email to share files; last month a branch lost a term's worth of student records when a laptop was stolen.

### The brief (as the director wrote it)

> We need one place for staff to keep and share files, separated by department: **Admin** (fees, student records — confidential), **Teachers** (lesson materials, shared by all teachers), and **Management** (reports, contracts). Teachers should be able to **read** the Admin team's timetable folder but nothing else in Admin. Our part-time **IT technician**, Hafiz, should be able to restart services and check logs but should not see confidential files.
>
> We would like a simple **internal web page** with announcements that staff can see in their browsers.
>
> The server must be **secure**: only staff, nobody from outside, and we read that passwords alone are not safe. It must be **backed up every night**, and we want to be sure we can get files back. We are not technical, so please **document everything** so Hafiz can look after it, and tell us how you tested it.

## From brief to specification

Your first job is to translate this into a specification with **testable acceptance criteria**. A starting point (you will refine it in the next lesson):

| # | Requirement | Acceptance criterion (how you will prove it) |
|---|---|---|
| R1 | Server identity | Hostname `teratai-srv01`, static IP, time synchronised, fully patched (`apt list --upgradable` empty) |
| R2 | Staff accounts | One account per staff member (use at least 6 test users across departments); password policy enforced; no shared accounts |
| R3 | Department folders | `/srv/teratai/{admin,teachers,management}` with setgid group ownership; each department reads/writes only its own |
| R4 | Teachers read Admin timetable | ACL on `/srv/teratai/admin/timetable` (read-only for `teachers`, default ACL included); teachers cannot list the rest of Admin |
| R5 | IT technician | `hafiz` can `systemctl status/restart` nginx and ssh and read the journal (`systemd-journal` group); **cannot** read department folders |
| R6 | Intranet page | nginx serves an announcements page on port 80 from `/var/www/teratai`; content editable by `management` group |
| R7 | Access security | SSH keys only, no root login, `sshusers` group; ufw default deny with SSH from the admin network and HTTP from the staff network only |
| R8 | Hardening | unused services disabled; Lynis index recorded before and after; risky-file scan clean or explained |
| R9 | Storage | Department data on a dedicated LVM volume mounted persistently by UUID, with room to grow |
| R10 | Backups | Nightly timer; `/etc`, `/srv/teratai`, `/var/www/teratai` and package list; checksums verified; 14-day retention; one tested restore |
| R11 | Monitoring | Health check every 15 minutes logging to the journal, warning on disk ≥ 80 % and on failed services |
| R12 | Troubleshooting evidence | At least two faults diagnosed and fixed, written up as tickets |
| R13 | Documentation | As-built document, runbooks (backup check, restore a file, add a staff member), change record, test report |

### Assumptions and questions

Real briefs leave gaps. Write them down and either ask or state your assumption, for example:

- *Which network do staff use?* Assume `192.168.56.0/24` (your host-only network) stands in for both the staff and admin networks; document it.
- *Off-site backup?* The brief says "backed up every night" but has no off-site storage. Recommend it (3-2-1) and note it as outstanding if not provided.
- *Who approves changes?* Assume the director.

## Your environment

Use a **fresh** Ubuntu Server LTS VM (or reset your lab VM from the clean snapshot of Module 0) with a second disk for data. Everything you build must be reproducible from your documentation.

## Task for this lesson

Complete the questions below: your refined specification and your list of assumptions, risks and client questions.
