---
id: linux-fundamentals.m06.l3
title: Job control and process troubleshooting
summary: Run commands in the background, move jobs between foreground and background, keep work running after logout, and investigate a misbehaving process.
objectives:
  - Use `&`, `jobs`, `fg`, `bg` and `Ctrl+Z`
  - Keep a command running after you disconnect with `nohup` or `tmux`
  - Find what a process is doing with `lsof`, `ss` and `/proc`
  - Follow a structured approach to a runaway process
estimatedMinutes: 45
topics: [linux.m06]
resources:
  - { title: "GNU Bash manual: Job control", url: "https://www.gnu.org/software/bash/manual/html_node/Job-Control.html", free: true, official: true }
  - { title: "tmux wiki: Getting started", url: "https://github.com/tmux/tmux/wiki/Getting-Started", free: true, official: true }
  - { title: "man 8 lsof", url: "https://manpages.ubuntu.com/manpages/noble/man8/lsof.8.html", free: true, official: true }
---

## Foreground and background jobs

A command normally runs in the **foreground**: the shell waits for it. A **job** is a command (or pipeline) the shell is managing.

```bash
sleep 300 &
jobs
sleep 400
# press Ctrl+Z
jobs
bg %2
fg %1
# press Ctrl+C
```

```text
[1] 2471
[1]+  Running                 sleep 300 &
^Z
[2]+  Stopped                 sleep 400
[1]-  Running                 sleep 300 &
[2]+  Stopped                 sleep 400
[2]+ sleep 400 &
sleep 300
^C
```

| Action | How |
|---|---|
| start in the background | `command &` |
| pause the foreground job | `Ctrl+Z` |
| resume it in the background | `bg` (or `bg %N`) |
| bring a job to the foreground | `fg %N` |
| list jobs | `jobs -l` (with PIDs) |
| kill a job | `kill %N` |

Job numbers (`%1`) belong to **your shell**; PIDs are system-wide.

## Surviving logout

When an SSH session ends, its jobs receive `SIGHUP` and usually stop. For long tasks:

- **`nohup command > out.log 2>&1 &`** ignores HUP and keeps running; output goes to the file.
- **`tmux`** (installed on Ubuntu Server) keeps a whole terminal session alive on the server. Start it with `tmux new -s work`, detach with `Ctrl+B` then `D`, log out, and later reattach with `tmux attach -t work`. Run long upgrades inside tmux so a dropped Wi-Fi connection does not interrupt them.
- Anything that must keep running permanently belongs in a **systemd service** (Module 7), not in a background job.

## What is this process doing?

```bash
sudo lsof -p 880 | head
sudo ss -tlnp | grep nginx
sudo ls -l /proc/880/fd | head
sudo lsof +D /var/log/nginx
sudo lsof -i :80
```

```text
COMMAND PID USER   FD   TYPE DEVICE SIZE/OFF    NODE NAME
nginx   880 root  cwd    DIR  252,0     4096       2 /
nginx   880 root  txt    REG  252,0  1290712 1311021 /usr/sbin/nginx
nginx   880 root    2w   REG  252,0        0  524911 /var/log/nginx/error.log
...
LISTEN 0      511          0.0.0.0:80        0.0.0.0:*    users:(("nginx",pid=881,fd=6),("nginx",pid=880,fd=6))
```

- `lsof -p PID` lists open files: its program, libraries, logs, sockets.
- `lsof -i :80` shows who uses port 80; `ss -tlnp` lists listening TCP ports and their processes (Module 9).
- `lsof +D dir` shows which processes hold files in a directory, which explains "device is busy" when unmounting (Module 8).

## A runaway process: a structured approach

A user reports the server is slow. `top` shows one process at 100 % CPU.

1. **Identify**: PID, user, command line (`ps -o pid,user,etime,cmd -p PID`). `etime` shows how long it has run.
2. **Understand**: is it a service (child of systemd, managed by a unit: `systemctl status PID` tells you which), a user's job, or a cron task? Check its logs.
3. **Decide with the owner** where possible: is it expected (a monthly report) or broken (a loop)?
4. **Reduce impact first**: `renice` it, or pause it with `kill -STOP PID` and resume with `kill -CONT PID`.
5. **Stop it properly**: `systemctl stop` for services, `kill` (TERM) for others, `kill -9` only if needed.
6. **Record** what you saw, what you did, and the follow-up (fix the script, schedule it at night).

`systemctl status 1234` is a quick way to see which service a PID belongs to.

## Guided lab

1. Start `sleep 500 &` and `sleep 600`, suspend the second with `Ctrl+Z`, list with `jobs -l`, resume it in the background, then bring the first to the foreground and stop it.
2. Run `nohup sleep 900 > ~/nohup-test.log 2>&1 &`, log out, log back in, and find it with `pgrep -a sleep`.
3. Start `tmux new -s lab`, run `top`, detach, log out and reattach.
4. Simulate a runaway: `yes > /dev/null &`. Find it in `top`, renice it to 19, pause it with `kill -STOP`, check its state (`T`), resume it, then terminate it.
5. Use `sudo lsof -i :22` and `sudo ss -tlnp` to find the process listening for SSH, and `systemctl status <PID>` to name its unit.

## Independent exercises

1. Explain the difference between `%1` and PID 2471 in the examples.
2. Write down when you would use `nohup`, `tmux`, and a systemd service.
3. Write a five-line ticket note for the runaway-process lab: symptom, cause, action, result, follow-up.
