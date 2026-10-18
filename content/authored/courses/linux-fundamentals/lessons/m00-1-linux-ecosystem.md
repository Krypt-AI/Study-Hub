---
id: linux-fundamentals.m00.l1
title: The Linux ecosystem
summary: What Linux is, how the kernel, distributions, shells and terminals fit together, and why employers care.
objectives:
  - Explain the difference between the Linux kernel and a Linux distribution
  - Name the two main distribution families used in workplaces and one member of each
  - Tell apart a terminal, a shell and a command
  - Explain why this course uses Ubuntu Server LTS
estimatedMinutes: 40
topics: [linux.m00]
resources:
  - { title: "The Linux Kernel documentation", url: "https://docs.kernel.org/", free: true, official: true }
  - { title: "Ubuntu Server documentation", url: "https://documentation.ubuntu.com/server/", free: true, official: true }
  - { title: "Ubuntu release cycle", url: "https://ubuntu.com/about/release-cycle", free: true, official: true }
  - { title: "Red Hat Enterprise Linux documentation", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/", free: true, official: true }
  - { title: "GNU Bash manual", url: "https://www.gnu.org/software/bash/manual/", free: true, official: true }
---

## Why Linux matters for your first IT job

Most servers on the internet, almost every cloud virtual machine, every Android phone, most network appliances, and nearly all container platforms run Linux. In an entry-level role you will meet it when you:

- connect to a web or database server with SSH to check why a site is slow;
- read logs to find out when a service stopped;
- add a user account for a new colleague or reset permissions on a shared folder;
- apply security updates during a maintenance window;
- follow a runbook written by a senior administrator.

None of this needs a graphical desktop. Linux servers are run from the **command line**, which is why most of this course happens in a terminal.

## Kernel, distribution, and everything in between

**Linux** strictly means the **kernel**: the program that starts first, talks to the hardware, schedules processes, manages memory and enforces permissions. On its own the kernel cannot do anything useful for a person. A **distribution** (distro) packages the kernel with everything else a working system needs:

| Layer | Examples | What it does |
|---|---|---|
| Kernel | Linux 7.0 | Hardware, processes, memory, files, networking, security checks |
| System and service manager | systemd | Starts services at boot, restarts them, collects logs |
| Core utilities | `ls`, `cp`, `mv`, `cat` | The small commands you combine every day |
| Shell | Bash | Reads your commands and runs them |
| Package manager | APT (Ubuntu, Debian), DNF (RHEL, Fedora) | Installs and updates software from trusted repositories |
| Applications | nginx, OpenSSH, PostgreSQL | The services the server exists to provide |

### Distribution families

You will mostly meet two families at work. Skills transfer between them; the differences are in packaging, defaults and a few tools.

| | Debian family | Red Hat family |
|---|---|---|
| Examples | **Ubuntu**, Debian, Linux Mint | **Red Hat Enterprise Linux (RHEL)**, Rocky Linux, AlmaLinux, Fedora, CentOS Stream |
| Package format and tools | `.deb`, `apt`, `dpkg` | `.rpm`, `dnf`, `rpm` |
| Default firewall front end | `ufw` (Ubuntu) | `firewalld` (`firewall-cmd`) |
| Mandatory access control | AppArmor | SELinux |
| Administrators' group | `sudo` | `wheel` |
| Typical certification | LFCS, Linux+, LPIC-1 (any distro) | RHCSA, RHCE |

### Ubuntu releases and LTS

Ubuntu publishes a release every April and October, numbered by year and month: 26.04 came out in April 2026. Every second April release is **LTS** (long-term support): five years of free security updates, extendable with Ubuntu Pro. Organisations run LTS releases on servers because they change slowly and stay patched. This course uses **Ubuntu Server 26.04 LTS**; 24.04 LTS works for every lab.

## Terminal, shell and command

These three words are often mixed up:

- A **terminal** (terminal emulator) is the window that shows text and sends your keystrokes: Windows Terminal, the macOS Terminal, GNOME Terminal, or the console of a virtual machine.
- A **shell** is the program inside the terminal that reads what you type, interprets it and starts programs. Ubuntu's default shell for users is **Bash**; others include `zsh` and `fish`. Scripts often use `sh`, a smaller POSIX shell (on Ubuntu, `dash`).
- A **command** is what you ask the shell to run: a program such as `ls`, or a shell built-in such as `cd`.

When you log in, the shell prints a **prompt** and waits:

```text
student@lab01:~$
```

| Part | Meaning |
|---|---|
| `student` | the user you are logged in as |
| `lab01` | the machine's hostname |
| `~` | the current directory (`~` is your home directory) |
| `$` | an ordinary user; `#` means you are `root`, the all-powerful administrator |

## Open source and licences, briefly

The kernel is licensed under the GNU GPL version 2, and most core tools come from the GNU project. Open-source licences let anyone read, change and redistribute the code, which is why so many distributions exist. Companies such as Canonical (Ubuntu) and Red Hat (RHEL) sell support, certification and long-term maintenance rather than the code itself.

## Guided lab: identify a Linux system

You do not have your own server until the next lesson, so this lab reads a real system's identity from sample output. On any Linux machine these commands are safe: they only read information.

```bash
cat /etc/os-release
uname -r
echo $SHELL
```

Expected output on Ubuntu Server 26.04 (yours may show a newer point release or kernel):

```text
PRETTY_NAME="Ubuntu 26.04.1 LTS"
NAME="Ubuntu"
VERSION_ID="26.04"
VERSION="26.04.1 LTS (Resolute Raccoon)"
VERSION_CODENAME=resolute
ID=ubuntu
ID_LIKE=debian
...
7.0.0-15-generic
/bin/bash
```

1. Find the line that tells a script which family this distribution belongs to. (`ID_LIKE=debian`.)
2. Which line is the kernel version, and which is the distribution version? (`7.0.0-15-generic` is the kernel; `26.04.1 LTS` is Ubuntu's release.)
3. On a Rocky Linux server the same file would show `ID="rocky"` and `ID_LIKE="rhel centos fedora"`. Which package manager would you expect there? (DNF.)

## Independent exercises

1. Make a two-column table of five tasks a junior administrator might do on a Linux server, and for each the kind of tool you expect to use (package manager, shell, service manager, log viewer...).
2. Visit the Ubuntu release-cycle page and write down when standard support for 24.04 LTS and 26.04 LTS ends.
3. In one paragraph, explain to a classmate the difference between "Linux" and "Ubuntu".
