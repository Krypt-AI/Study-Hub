---
id: sec-01-it-fundamentals.l02
title: Operating systems
summary: What an OS does, the kernel/user-mode boundary, how Windows and Linux differ, services and the registry versus config files, and where each keeps its logs.
objectives:
  - Explain the kernel's role and the user/kernel privilege boundary
  - Compare how Windows and Linux manage services, configuration and logs
  - Locate the main log sources on each platform
estimatedMinutes: 50
topics: [sec01.os]
resources:
  - { title: "Microsoft: Windows security documentation", url: "https://learn.microsoft.com/en-us/windows/security/", free: true, official: true }
  - { title: "The Linux Documentation Project", url: "https://tldp.org/", free: true, official: true }
  - { title: "systemd journalctl manual", url: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html", free: true, official: true }
---

## What an operating system does

The OS sits between hardware and your programs and manages shared resources: the **CPU** (scheduling processes),
**memory** (giving each process its own address space), **storage** (the filesystem), **devices** (drivers) and
**access** (users and permissions). Security is a core OS job: it enforces who may do what.

## Kernel mode and user mode

The CPU runs code at different privilege levels. The **kernel** runs in **kernel mode** with full hardware access.
Your applications run in **user mode**, isolated from each other and from the hardware. When a program needs something
privileged — open a file, send on the network — it makes a **system call** into the kernel, which checks permissions
and does the work. This boundary is the backbone of OS security: a bug that lets user-mode code run in kernel mode
("privilege escalation to kernel") is among the most serious.

## Windows versus Linux

| Aspect | Windows | Linux |
|---|---|---|
| Configuration | Central **Registry** (plus files) | Mostly plain-text files in `/etc` |
| Background programs | **Services** (`services.msc`, `sc`) | **daemons**, managed by `systemd` (`systemctl`) |
| Admin account | Administrator; elevation via **UAC** | root; elevation via **sudo** |
| Package install | MSI/winget/Store | `apt`, `dnf`, etc. |
| Logs | **Event Log** (Event Viewer) | journal / files in `/var/log` |
| Permissions model | ACLs (access control lists) | owner/group/other rwx, plus ACLs |

Most servers and security tooling run on Linux; most endpoints are Windows. A security professional must be fluent in
both. The Linux Fundamentals course is Stage 3 of this roadmap and goes deep on the command line.

## Services and the attack surface

Every running **service** that listens on the network is a potential entry point. A core hardening idea (Stage 7) is to
**disable what you do not need**: fewer services means a smaller **attack surface**. Knowing how to list services
(`systemctl list-units --type=service`, `services.msc`) and what listens on which port is basic situational awareness.

## Logs: the analyst's evidence

When something goes wrong — or someone breaks in — the logs are where you find out.

- **Windows**: the Event Log, split into Security (logons, privilege use), System and Application channels; viewed in
  Event Viewer or queried with PowerShell.
- **Linux**: the systemd **journal** (`journalctl`) and text files under `/var/log` (`auth.log`/`secure` for
  authentication, service-specific logs).

Logs are only useful if they are **collected, kept and reviewed** — which is why later courses centralise them into a
SIEM. For now, learn to find and read them on each platform.
