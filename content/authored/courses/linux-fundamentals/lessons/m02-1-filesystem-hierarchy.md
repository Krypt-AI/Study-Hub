---
id: linux-fundamentals.m02.l1
title: The Linux directory hierarchy
summary: What lives where under `/`, so you know where to look for configuration, logs, programs and data.
objectives:
  - Name the purpose of the main top-level directories
  - Decide where configuration, logs, user data and temporary files belong
  - Explain why "everything is a file", including devices and `/proc`
estimatedMinutes: 35
topics: [linux.m02]
resources:
  - { title: "Filesystem Hierarchy Standard 3.0 (Linux Foundation)", url: "https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html", free: true, official: true }
  - { title: "man 7 hier", url: "https://manpages.ubuntu.com/manpages/noble/man7/hier.7.html", free: true, official: true }
---

## The Filesystem Hierarchy Standard

Distributions follow the **Filesystem Hierarchy Standard** (FHS), so a path you learn on Ubuntu usually means the same on RHEL. `man hier` describes it on the system itself.

| Directory | Contains | You go there to... |
|---|---|---|
| `/etc` | system-wide **configuration** (text files) | change how a service behaves: `/etc/ssh/sshd_config` |
| `/home` | users' home directories | find a user's files |
| `/root` | the root user's home | (rarely; it is private to root) |
| `/var` | **variable** data that grows: logs, caches, spools, databases | read logs in `/var/log`, check `/var/lib` |
| `/var/log` | log files | `/var/log/syslog`, `/var/log/auth.log` |
| `/tmp` | temporary files, cleared at boot | scratch files anyone can write |
| `/usr` | installed programs and their read-only data | `/usr/bin` (commands), `/usr/share/doc` |
| `/usr/local` | software installed by hand, outside the package manager | locally built tools |
| `/opt` | self-contained third-party applications | vendor software such as monitoring agents |
| `/srv` | data served by this machine | web sites, FTP data (by convention) |
| `/boot` | kernel and boot loader files | (Module 7) |
| `/dev` | **device files** for disks, terminals, random numbers | `/dev/sda`, `/dev/null` |
| `/proc`, `/sys` | **virtual** files the kernel creates to describe itself | `/proc/cpuinfo`, `/proc/meminfo` |
| `/run` | runtime state since boot (PIDs, sockets) | cleared at boot |
| `/mnt`, `/media` | mount points for temporary and removable media | Module 8 |

On modern Ubuntu and RHEL, `/bin`, `/sbin` and `/lib` are links into `/usr` ("merged /usr"):

```bash
ls -ld /bin /sbin /lib
```

```text
lrwxrwxrwx 1 root root 7 Apr 22  2026 /bin -> usr/bin
lrwxrwxrwx 1 root root 8 Apr 22  2026 /sbin -> usr/sbin
lrwxrwxrwx 1 root root 7 Apr 22  2026 /lib -> usr/lib
```

## Everything is a file

Linux presents many things as files, which is why the same small tools work everywhere:

- **Devices**: `/dev/sda` is the first disk; `/dev/null` discards whatever is written to it; `/dev/urandom` produces random bytes.
- **Kernel information**: `/proc/cpuinfo`, `/proc/meminfo` and `/proc/<PID>/` are generated on the fly by the kernel. They use no disk space.
- **Configuration** is plain text, so you can read it with `cat`, search it with `grep` and back it up with `cp`.

```bash
grep -c processor /proc/cpuinfo
head -3 /proc/meminfo
```

```text
2
MemTotal:        2014880 kB
MemFree:          982144 kB
MemAvailable:    1561208 kB
```

## Which directory? A quick guide

| You need to... | Look in |
|---|---|
| change the SSH server's settings | `/etc/ssh/` |
| see why a login failed | `/var/log/auth.log` (Ubuntu), `/var/log/secure` (RHEL), or the journal |
| find where `ls` is installed | `/usr/bin` |
| put a web site's files | `/srv/www` or `/var/www` (Ubuntu's default for Apache and nginx) |
| store a quick test file that can disappear | `/tmp` |
| install a vendor's agent | `/opt/<vendor>` |

## Guided lab

1. Run `man hier`, search for `/var`, and read its description.
2. List the top level with `ls -l /`. Identify the links and the real directories.
3. Run `ls /etc | wc -l` to count configuration entries, and `ls /etc/ssh`.
4. Read hardware facts from virtual files: `grep -c processor /proc/cpuinfo`, `head -3 /proc/meminfo`, `cat /proc/version`.
5. Run `ls -l /dev/sda* /dev/null`. Notice the `b` (block device) and `c` (character device) types.

## Independent exercises

1. For each, give the directory: the user `aina`'s files; the nginx configuration; nginx's log files; a monitoring agent from a vendor.
2. Explain why `/proc/meminfo` shows a size of 0 in `ls -l` but is full of text.
3. Look inside `/usr/share/doc/openssh-server` and list what documentation is installed there.
