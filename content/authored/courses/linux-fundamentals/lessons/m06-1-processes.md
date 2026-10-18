---
id: linux-fundamentals.m06.l1
title: Processes
summary: What a process is, how to list and inspect processes with `ps`, `pgrep`, `top` and `/proc`, and how to read their states.
objectives:
  - Explain programs, processes, PIDs, parents and process states
  - List and filter processes with `ps`, `pgrep` and `pstree`
  - Read `top` and `htop` to find the busiest processes
  - Inspect a single process under `/proc/PID`
estimatedMinutes: 50
topics: [linux.m06]
resources:
  - { title: "man 1 ps", url: "https://manpages.ubuntu.com/manpages/noble/man1/ps.1.html", free: true, official: true }
  - { title: "man 1 top", url: "https://manpages.ubuntu.com/manpages/noble/man1/top.1.html", free: true, official: true }
  - { title: "The /proc filesystem (kernel docs)", url: "https://docs.kernel.org/filesystems/proc.html", free: true, official: true }
---

## Programs and processes

A **program** is a file on disk (`/usr/sbin/nginx`). A **process** is a running instance of it, with its own memory, open files, user and **PID** (process ID). One program can run as many processes: nginx runs one master and several workers.

Every process has a **parent** (PPID). The first process, PID 1, is **systemd**, which starts services at boot and adopts orphaned processes. Your shell is the parent of the commands you run.

## `ps`: a snapshot

```bash
ps
ps aux | head -5
ps -ef --forest | grep -A3 sshd
ps -o pid,ppid,user,%cpu,%mem,stat,cmd -C nginx
```

```text
    PID TTY          TIME CMD
   1532 pts/0    00:00:00 bash
   1610 pts/0    00:00:00 ps
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.6  22528 13312 ?        Ss   09:12   0:02 /sbin/init
root           2  0.0  0.0      0     0 ?        S    09:12   0:00 [kthreadd]
...
    PID    PPID USER     %CPU %MEM STAT CMD
    880       1 root      0.0  0.1 Ss   nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
    881     880 www-data  0.0  0.3 S    nginx: worker process
    882     880 www-data  0.0  0.3 S    nginx: worker process
```

| Column | Meaning |
|---|---|
| `PID` / `PPID` | process ID / parent's PID |
| `USER` | the account it runs as (note nginx workers run as `www-data`: least privilege) |
| `%CPU`, `%MEM` | share of CPU time and of RAM |
| `VSZ`, `RSS` | virtual size and resident (actually in RAM) memory, in KiB |
| `TTY` | terminal; `?` means none (a service) |
| `STAT` | state (below) |
| `COMMAND` | the command line; names in `[brackets]` are kernel threads |

`ps aux` (BSD style) and `ps -ef` (System V style) both list everything; use whichever you remember.

### Process states

| STAT | State |
|---|---|
| `R` | running or ready to run |
| `S` | sleeping, waiting for something (most processes, most of the time) |
| `D` | uninterruptible sleep, usually waiting for disk or network storage; many `D` processes suggest an I/O problem |
| `T` | stopped (for example with `Ctrl+Z`) |
| `Z` | zombie: finished, but the parent has not collected its exit code |

Extra letters: `s` session leader, `<` high priority, `N` low priority, `+` foreground.

## Finding processes

```bash
pgrep -a nginx
pgrep -u www-data
pidof sshd
pstree -p | head
```

`pgrep` is safer than `ps aux | grep name`, which also matches the `grep` process itself.

## `top` and `htop`: live view

```bash
top
```

```text
top - 10:15:02 up  1:03,  1 user,  load average: 0.08, 0.05, 0.01
Tasks: 112 total,   1 running, 111 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.3 us,  0.7 sy,  0.0 ni, 97.9 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   1967.7 total,    958.4 free,    412.6 used,    753.3 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   1555.1 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    881 www-data  20   0   55380   6324   4480 S   0.3   0.3   0:00.21 nginx
```

Keys: `P` sort by CPU, `M` by memory, `k` kill (asks for a PID), `1` per-CPU view, `q` quit. In the CPU line, `wa` (waiting for I/O) and `st` (stolen by the hypervisor) explain slowness that is not caused by your processes' own work. Module 10 reads these numbers in depth.

`htop` (install it) shows the same with colours, a tree view (`F5`) and easier sorting and killing.

## `/proc/PID`

Each process has a directory under `/proc`:

```bash
pid=$(pgrep -o nginx)
sudo ls /proc/$pid
sudo cat /proc/$pid/status | head -9
sudo ls -l /proc/$pid/cwd /proc/$pid/exe
```

`status` shows the state, the user, and memory; `cwd` and `exe` show the working directory and the program file. Tools like `ps` and `top` read their data from here.

## Guided lab

1. Run `ps` and `ps aux | wc -l`. How many processes are running?
2. Show nginx's processes with `ps -o pid,ppid,user,stat,cmd -C nginx` and explain the parent–child relation.
3. Run `pstree -p` and find `sshd`, your shell (`bash`), and the `pstree` command itself.
4. Open `top`, sort by memory (`M`), then by CPU (`P`), and quit.
5. In a second SSH session, run `sleep 600`. In the first, find it with `pgrep -a sleep` and read its state in `/proc/<PID>/status`.

## Independent exercises

1. Find the five processes using the most memory with one `ps` command (`--sort=-%mem` and `head`).
2. Explain why `ps aux | grep sshd` shows one more line than `pgrep -a sshd`.
3. What is PID 1 on your system, and which command shows its full path?
