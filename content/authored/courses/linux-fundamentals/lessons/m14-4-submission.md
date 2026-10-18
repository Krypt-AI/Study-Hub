---
id: linux-fundamentals.m14.l4
title: "Capstone: submission, reflection and next steps"
summary: Submit the capstone, assess it against the marking guide, reflect on your skills, and plan your path to a certification and a job.
objectives:
  - Assess your capstone against a marking guide
  - Reflect on strengths and gaps
  - Choose a next step towards workforce readiness and certification
estimatedMinutes: 60
topics: [linux.m14]
resources:
  - { title: "CompTIA Linux+", url: "https://www.comptia.org/en-us/certifications/linux/", free: true, official: true }
  - { title: "Linux Foundation: LFCS", url: "https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/", free: true, official: true }
  - { title: "Red Hat: RHCSA exam (EX200)", url: "https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam", free: true, official: true }
  - { title: "LPI: LPIC-1", url: "https://www.lpi.org/our-certifications/lpic-1-overview/", free: true, official: true }
---

## Marking guide

Assess your work honestly against this guide (or have an instructor do it). Each area is marked 0–4: **0** missing, **1** attempted but not working, **2** working with gaps, **3** working and evidenced, **4** working, evidenced and well explained.

| Area | Requirements | What a 4 looks like |
|---|---|---|
| Base system and storage | R1, R9 | static network, patched, LVM data volume mounted by UUID, reboot-tested |
| Users, groups and permissions | R2–R5 | all nine matrix tests pass; least privilege for Hafiz explained |
| Services and intranet | R6 | nginx site with its own config, tested config, correct ownership |
| Security | R7, R8 | key-only SSH tested from outside; firewall scoped by source; Lynis before/after with decisions |
| Backup and recovery | R10 | verified nightly backups, restore tested and timed, off-site gap reported |
| Monitoring and automation | R11 | scheduled check with useful thresholds, logs in the journal, scripts in Git |
| Troubleshooting | R12 | two incidents found with the method and written as clear tickets |
| Documentation | R13 | a colleague can operate the server from your documents alone |

A total of 24 or more out of 32, with no area below 2, shows the practical skills of an entry-level Linux administrator.

## Reflection

Answer the reflection questions below. Be specific: "LVM" is less useful than "I can grow a volume online, but I am unsure how to replace a failed disk in a VG".

## What this course gives you, and what it does not

You can now install, configure, secure, back up, monitor, automate and document a single Ubuntu server, and work the same way on RHEL-family systems with some extra practice. That is the foundation employers look for in IT support, junior system administration, NOC and junior cloud roles.

It is **not** the whole of any professional certification. Each exam goes deeper or wider, for example:

| Next goal | What to add beyond this course |
|---|---|
| **CompTIA Linux+** | broader troubleshooting, containers basics, Git and automation (Ansible), more security (SELinux, PKI) |
| **LFCS** | speed and accuracy on a live system under time pressure, more networking (bridges, bonding, routing), storage (RAID, NFS), virtual machines and containers |
| **RHCSA** | RHEL specifics: dnf and Flatpak, firewalld, **SELinux** in depth, autofs and NFS, tuned, boot recovery, all from RHEL documentation without internet |
| **LPIC-1** | broader theory across two exams: hardware, boot loaders, X11 and desktop basics, printing, localisation, more shell and text detail |
| **Cloud** (AWS, Azure, Google Cloud) | provider-specific services, identity and networking; Linux VMs, SSH and automation transfer directly |
| **Security** (Security+, then CySA+ or similar) | threats, detection, incident response and governance; Linux logs and hardening help, but are not enough on their own |

The certification pages in Study Hub show, for each certification, how much it relies on Linux, which of these modules support it, and what to learn next. The **Linux Administration** roadmap lays out the advanced path.

## Next steps

1. Choose one target certification and read its official objectives. Map each objective to "done in this course", "need practice" or "new".
2. Track it in Study Hub (Certifications → the exam → **Track this certification**) with a target date.
3. Keep your lab: rebuild the capstone from your own documentation once more, faster. That is the best exam practice for performance-based exams such as LFCS and RHCSA.
4. Put the capstone (without secrets) in a public Git repository as a portfolio piece for job applications.
