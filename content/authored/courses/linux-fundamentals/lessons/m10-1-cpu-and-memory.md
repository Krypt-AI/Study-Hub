---
id: linux-fundamentals.m10.l1
title: CPU, load and memory
summary: Read load averages, CPU breakdowns and memory figures correctly, and spot the signs of CPU, memory and I/O pressure.
objectives:
  - Interpret load averages relative to the number of CPUs
  - Read the CPU breakdown (`us`, `sy`, `wa`, `st`) in `top`, `vmstat` and `mpstat`
  - Read `free` correctly, including "available" and buff/cache
  - Recognise memory pressure, swapping and the OOM killer
estimatedMinutes: 50
topics: [linux.m10]
resources:
  - { title: "man 8 vmstat", url: "https://manpages.ubuntu.com/manpages/noble/man8/vmstat.8.html", free: true, official: true }
  - { title: "man 1 free", url: "https://manpages.ubuntu.com/manpages/noble/man1/free.1.html", free: true, official: true }
  - { title: "sysstat (sar, iostat, mpstat)", url: "https://sysstat.github.io/", free: true, official: true }
  - { title: "Kernel docs: PSI (pressure stall information)", url: "https://docs.kernel.org/accounting/psi.html", free: true, official: true }
---

## Monitoring starts with a baseline

A number means little on its own. Record what **normal** looks like for each server (load, memory, disk, response time) when users are happy; then you can tell when something is abnormal. Your lab log is the start of a baseline.

## Load average

```bash
nproc
uptime
cat /proc/loadavg
```

```text
2
 11:20:41 up  2:08,  1 user,  load average: 0.35, 0.22, 0.10
0.35 0.22 0.10 2/131 4012
```

The three numbers are averages over **1, 5 and 15 minutes** of the number of processes running or waiting to run (including those waiting for disk in state `D`).

- Compare with the **number of CPUs** (`nproc`): on 2 CPUs, a load of 2 means fully busy; 4 means processes are queuing.
- The trend matters: `4.0, 2.0, 0.5` is rising (something just started); `0.5, 2.0, 4.0` is recovering.
- A high load with idle CPUs points to **I/O waits**, not computation.

## CPU breakdown

```bash
vmstat 2 5
```

```text
procs -----------memory---------- ---swap-- -----io---- -system-- -------cpu-------
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st gu
 1  0      0 981244  51212 720400    0    0    12    20  150  260  2  1 97  0  0  0
 3  0      0 979880  51212 720420    0    0     0     4  930 1100 97  3  0  0  0  0
```

| Field | Meaning | High value suggests |
|---|---|---|
| `r` | processes waiting for CPU | CPU saturation if above the number of CPUs |
| `b` | processes blocked (usually on I/O) | storage problems |
| `si`, `so` | swap in / out per second | memory pressure if constantly non-zero |
| `us` | user programs | application work |
| `sy` | kernel | many system calls, networking, drivers |
| `wa` | waiting for I/O | slow or overloaded disks |
| `st` | stolen by the hypervisor | an overloaded host; tell the virtualisation or cloud team |
| `id` | idle | spare capacity |

The first line of `vmstat` is an average since boot; read the following lines. `mpstat -P ALL 2` (package `sysstat`) shows each CPU separately, revealing a single-threaded program pinning one core.

## Memory

```bash
free -h
```

```text
               total        used        free      shared  buff/cache   available
Mem:           1.9Gi       610Mi       195Mi       4.0Mi       1.2Gi       1.2Gi
Swap:          2.0Gi        12Mi       2.0Gi
```

The most misunderstood output in Linux:

- **free** is memory doing nothing. Linux deliberately keeps it low by using spare RAM as a disk **cache** (`buff/cache`), which makes the system faster.
- **available** estimates how much memory programs could get without swapping, including reclaimable cache. **This is the number to watch.**
- A low "free" with a healthy "available" is normal. A low "available" with swap growing (`so` > 0 in vmstat) is **memory pressure**.

Find the biggest users with `ps aux --sort=-%mem | head` or `top` sorted by memory (`M`).

### When memory runs out

If memory and swap are exhausted, the kernel's **OOM killer** ends a process (usually the largest) to save the system. It is logged:

```bash
journalctl -k -g "out of memory" --since today
```

```text
Oct 18 14:03:12 lab01 kernel: Out of memory: Killed process 3311 (python3) total-vm:2457600kB, anon-rss:1650332kB, ...
```

A service that "randomly dies" is often an OOM kill: check the kernel log before blaming the application. The fix is less memory use, a memory limit (`MemoryMax=` in a systemd unit), or more RAM.

### Pressure stall information

Modern kernels report how much time tasks are stalled waiting for CPU, memory or I/O:

```bash
cat /proc/pressure/cpu /proc/pressure/memory /proc/pressure/io
```

`avg10=25.00` on memory means tasks spent 25 % of the last 10 seconds waiting for memory: a direct measure of pain.

## Guided lab

1. Record your baseline: `nproc`, `uptime`, `free -h`, `vmstat 2 5`, and `cat /proc/pressure/*`.
2. Generate CPU load: `stress-ng --cpu 2 --timeout 60s` (`sudo apt install stress-ng`). Watch `uptime` and `vmstat 2` in another session. Which columns change?
3. Generate memory pressure (carefully, on your lab VM only): `stress-ng --vm 1 --vm-bytes 80% --timeout 60s`. Watch `free -h`, `si`/`so` and `/proc/pressure/memory`.
4. Generate disk I/O: `stress-ng --hdd 1 --timeout 60s` and watch `wa` and `b`.
5. Look for any OOM kills in the kernel log.

## Independent exercises

1. A 4-CPU server shows load `7.8, 7.5, 7.1` and CPU `us 15, wa 70`. Explain what is happening and what you would check next.
2. Explain to a colleague why `free` showing 150 MB "free" on a 16 GB server is not an emergency.
3. Write a one-line command that prints the five processes using the most memory, with PID, user, %MEM and command.
