---
id: sec-01-it-fundamentals.l04
title: Processes, memory and the command line
summary: Processes and threads, how programs use memory, the command line on both platforms, environment and PATH, and inspecting what is running and listening.
objectives:
  - Describe processes, threads and process memory
  - Use core command-line tools on Linux and Windows to inspect a system
  - List running processes and open network ports
estimatedMinutes: 50
topics: [sec01.processes]
resources:
  - { title: "Linux man pages (man7.org)", url: "https://man7.org/linux/man-pages/", free: true, official: true }
  - { title: "Microsoft: Windows Commands reference", url: "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands", free: true, official: true }
  - { title: "Microsoft: PowerShell documentation", url: "https://learn.microsoft.com/en-us/powershell/", free: true, official: true }
---

## Processes and threads

A **process** is a running instance of a program, with its own memory space, open files and one or more **threads**
(independent flows of execution that share the process's memory). Each process has a numeric **PID** and a parent
(the process that launched it), forming a tree. Understanding the process tree is central to spotting something that
should not be running, or a normal-looking process launched by an unexpected parent.

Process memory is divided into regions: **code**, **data** (globals), the **heap** (dynamic allocation) and the
**stack** (function calls and local variables). Memory-safety bugs in this layout are the root of a whole class of
exploits, which is why memory-safe languages and OS protections (ASLR, DEP/NX) matter.

## The command line

The **command line** (shell) is where security work mostly happens, because it is scriptable, works over SSH, and is
all you get on a server. Linux uses **Bash** (or similar); Windows has **PowerShell**.

| Task | Linux (Bash) | Windows (PowerShell) |
|---|---|---|
| Where am I | `pwd` | `pwd` / `Get-Location` |
| List files | `ls -la` | `ls` / `Get-ChildItem` |
| Read a file | `cat`, `less` | `Get-Content` |
| Find text | `grep pattern file` | `Select-String pattern file` |
| Which executable runs | `which cmd` | `Get-Command cmd` |
| Running processes | `ps aux`, `top` | `Get-Process`, Task Manager |
| Open network ports | `ss -tulpn` | `Get-NetTCPConnection`, `netstat -ano` |

The **Linux Fundamentals** course (Stage 3) teaches the shell in depth; here just get oriented.

## Environment and PATH

Processes inherit **environment variables**, including **PATH** — the list of directories the shell searches for a
command you type. This matters for security: if an attacker can place a malicious `ls` earlier in your PATH, you might
run theirs instead of the real one. Secrets are often passed through environment variables too (see the AI course's
secrets lesson), so a process's environment can be sensitive.

## Seeing what is running and listening

Two questions you will ask constantly:

- **What is running?** `ps aux` / `Get-Process` — unexpected processes, odd names, high resource use.
- **What is listening on the network?** `ss -tulpn` / `netstat -ano` — every listening port is a door; map each to the
  process that owns it. An unexplained listener is a classic sign of something wrong.

```bash
ss -tulpn          # Linux: TCP/UDP listening sockets with the owning process
ps aux --sort=-%mem | head    # top memory users
```

These same tools, used deliberately, are how you take a baseline of a healthy system — so that later, on an incident,
you can tell what is abnormal.
