---
id: sec-01-it-fundamentals.lab
title: "Practical lab: a first session on Linux and Windows"
subtitle: Hands-on session with the real tools
summary: "A guided tour of the real command-line tools on your lab VMs: who you are and what you may do, permissions, running processes, listening ports and where each system keeps its logs, on Ubuntu and on Windows."
objectives:
  - Inspect users, permissions, processes and listening ports on Linux and on Windows
  - Read logon events in the Linux journal and the Windows Event Viewer
  - Take a baseline of a healthy system to compare against later
estimatedMinutes: 55
topics: [sec01.lab]
resources:
  - { title: "Ubuntu command line for beginners", url: "https://ubuntu.com/tutorials/command-line-for-beginners", free: true, official: true }
  - { title: "journalctl manual", url: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html", free: true, official: true }
  - { title: "Microsoft: Get-NetTCPConnection", url: "https://learn.microsoft.com/en-us/powershell/module/nettcpip/get-nettcpconnection", free: true, official: true }
  - { title: "Microsoft: audit logon events (4624, 4625)", url: "https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624", free: true, official: true }
---

You built the lab in the setup lesson. This session uses it. You type the **real commands** in your own **Ubuntu** and
**Windows** VMs; the blocks below show what the output looks like so you know what you are looking for. Your values
(names, numbers, addresses) will differ, since the samples are illustrative.

> Run everything inside your lab VMs. Take a **snapshot** first (setup lesson) so you can roll back.

## Part 1: Linux, the Ubuntu VM

Open a terminal.

### Who am I, and what may I do?

```bash
whoami          # your user name
id              # your user id and groups
sudo -l         # what you may run with sudo (asks for your password)
```

A sample of `id`:

```text
uid=1000(aina) gid=1000(aina) groups=1000(aina),4(adm),27(sudo)
```

Reading it: you are an **ordinary user** (uid 1000, not root's 0), and membership of the **sudo** group is what allows you to
elevate. That is least privilege (lesson 3) in one line.

### Files and permissions

```bash
mkdir lab && cd lab
printf 'notes' > report.txt
ls -l report.txt
chmod 600 report.txt
ls -l report.txt
```

```text
-rw-rw-r-- 1 aina aina 5 Oct 21 10:02 report.txt     (before: 664)
-rw------- 1 aina aina 5 Oct 21 10:02 report.txt     (after:  600)
```

Decode both lines with the lesson: before, the **owner and group** could read and write and **others** could read
(`rw-rw-r--` = 664). After `chmod 600` only the **owner** can read and write (`rw-------`). Try `chmod 755` and
`chmod 000` and predict the `ls -l` text before you run it.

### Processes and ports

```bash
ps aux --sort=-%mem | head -5        # the five biggest memory users
ss -tulpn                            # what is listening on the network
```

A sample of `ss -tulpn` on a fresh Ubuntu server:

```text
Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
udp   UNCONN 0      0      127.0.0.53%lo:53   0.0.0.0:*        users:(("systemd-resolve",pid=612,fd=13))
tcp   LISTEN 0      4096   127.0.0.53%lo:53   0.0.0.0:*        users:(("systemd-resolve",pid=612,fd=14))
tcp   LISTEN 0      128    0.0.0.0:22         0.0.0.0:*        users:(("sshd",pid=801,fd=3))
```

Each row is a door. Read the **Local Address**: `127.0.0.53` is **loopback only** (reachable from this machine alone), while
`0.0.0.0:22` means **SSH accepts connections on every network interface**. The **Process** column names who owns the port.
**Save your own output** to a file (`ss -tulpn > ~/baseline-ports.txt`): that is your **baseline** for Stage 7 and Stage 8.

### Logs

```bash
journalctl -u ssh --since "1 hour ago"      # service log (the unit is `sshd` on Red Hat family systems)
sudo tail -n 20 /var/log/auth.log           # authentication events on Ubuntu
last -n 5                                   # recent logins
```

Look for `Accepted` and `Failed password` lines. Those are the events a defender watches (Stage 7).

## Part 2: Windows, the Windows VM

Open **PowerShell** (right-click Start, then Terminal).

```powershell
whoami                                              # domain\user
whoami /groups                                      # your groups
Get-Process | Sort-Object WS -Descending | Select-Object -First 5 Name, Id, WS
Get-NetTCPConnection -State Listen | Sort-Object LocalPort | Select-Object LocalAddress, LocalPort, OwningProcess
```

A sample of the last command's output:

```text
LocalAddress LocalPort OwningProcess
------------ --------- -------------
::                 135           980
0.0.0.0            445             4
127.0.0.1         5040          3412
```

`OwningProcess` is a process id: look it up with `Get-Process -Id 980`. **135** is RPC and **445** is SMB file sharing,
the Windows service that Stage 7 treats as a classic exposure to restrict. Compare with the Linux baseline: same idea,
different tool.

### Event Viewer

Open **Event Viewer**, then **Windows Logs → Security**. Filter the current log for the event ids below, or query from PowerShell:

```powershell
Get-WinEvent -FilterHashtable @{ LogName = 'Security'; Id = 4624, 4625 } -MaxEvents 5
```

| Event id | Meaning |
|---|---|
| **4624** | an account **successfully** logged on |
| **4625** | an account **failed** to log on |

Lock your own screen, unlock it, then enter a wrong password once at the sign-in screen, and refresh. You will find a **4625**
for the failed attempt and a **4624** for the successful one: your first real security log evidence. (The Security log needs
an administrator account to read.)

## Part 3: Write down your baseline

In a notes file record, for each VM: the **listening ports**, the **five largest processes**, the **users and groups**, and
**where the logs are**. When something looks wrong later (Stage 8), the question is always "what changed since the baseline?"

## If something goes wrong

| Problem | Fix |
|---|---|
| `Permission denied` on `/var/log/auth.log` | use `sudo`; the file is readable only by privileged users |
| `journalctl` shows nothing for `ssh` | the SSH server may not be installed or running; check with `systemctl status ssh` |
| `Get-WinEvent` says access denied | open PowerShell **as administrator** to read the Security log |
| No 4625 events | failed-logon auditing may be off; check Local Security Policy → Audit Policy → Audit logon events |
