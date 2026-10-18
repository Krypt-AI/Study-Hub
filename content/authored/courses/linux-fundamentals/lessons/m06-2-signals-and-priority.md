---
id: linux-fundamentals.m06.l2
title: Signals and priority
summary: Stop, reload and kill processes with signals, and change how much CPU they get with nice and renice.
objectives:
  - Name the common signals and choose the right one
  - Send signals with `kill`, `pkill` and `killall`
  - Explain why `kill -9` is a last resort
  - Start a process with a lower priority and change the priority of a running one
estimatedMinutes: 40
topics: [linux.m06]
resources:
  - { title: "man 7 signal", url: "https://manpages.ubuntu.com/manpages/noble/man7/signal.7.html", free: true, official: true }
  - { title: "man 1 kill", url: "https://manpages.ubuntu.com/manpages/noble/man1/kill.1.html", free: true, official: true }
  - { title: "man 1 nice", url: "https://manpages.ubuntu.com/manpages/noble/man1/nice.1.html", free: true, official: true }
---

## Signals

A **signal** is a short message the kernel delivers to a process. Most can be caught: the process decides how to react. Two cannot: `SIGKILL` and `SIGSTOP`.

| Signal | Number | Default effect | Typical use |
|---|---|---|---|
| `SIGHUP` | 1 | terminate | many daemons **reload configuration** on HUP |
| `SIGINT` | 2 | terminate | what `Ctrl+C` sends |
| `SIGQUIT` | 3 | terminate with core dump | `Ctrl+\` |
| `SIGKILL` | 9 | **kill immediately**, cannot be caught | last resort |
| `SIGTERM` | 15 | terminate (the default of `kill`) | ask politely to exit cleanly |
| `SIGSTOP` | 19 | pause, cannot be caught | freeze a process |
| `SIGTSTP` | 20 | pause | what `Ctrl+Z` sends |
| `SIGCONT` | 18 | continue | resume a stopped process |

`kill -l` lists them all.

## Sending signals

```bash
kill 2345              # SIGTERM to PID 2345
kill -HUP 880          # ask nginx's master to reload
kill -SIGTERM 2345     # same as the first, spelled out
pkill -u farid sleep   # by name, only farid's processes
killall sleep          # every process named exactly 'sleep'
```

You can signal your own processes; other users' need `sudo`.

### Why not always `kill -9`?

`SIGTERM` lets a program finish writing files, release locks, close database connections and remove temporary files. `SIGKILL` stops it instantly, which can leave corrupted data or stale lock files. The professional sequence is:

1. `kill PID` (TERM), wait a few seconds, check with `ps -p PID`.
2. Only if it is still there: `kill -9 PID`, and note in the ticket that it was force-killed.

For **services**, do not signal them by hand at all when you can use `systemctl stop` or `systemctl reload` (Module 7), which knows the right signals and records what happened.

### Processes that will not die

- A **zombie** (`Z`) is already dead; killing it does nothing. Its parent must collect it; restarting or killing the parent clears it.
- A process in `D` state ignores even `SIGKILL` until its I/O completes: the fix is in the storage layer.

## Priority: nice and renice

The scheduler shares CPU time by **niceness**, from `-20` (highest priority) to `19` (lowest); the default is `0`. A "nicer" process gives way to others.

```bash
nice -n 10 tar czf /tmp/etc-backup.tgz /etc     # start a backup at lower priority
ps -o pid,ni,cmd -C tar
sudo renice -n 15 -p 2345                       # make a running process even nicer
sudo renice -n -5 -p 880                        # raise priority (needs root)
```

Ordinary users can only make their processes **nicer** (raise the number); lowering it needs root. In `top`, `NI` is the niceness and `PR` the resulting kernel priority. Use `nice` for heavy batch jobs (backups, compression, reports) on servers that also serve users.

For disk-heavy jobs, `ionice -c3 command` gives them idle I/O priority.

## Guided lab

1. Start `sleep 1000 &` three times. List them with `pgrep -a sleep`.
2. Send `SIGTERM` to the first by PID, `SIGKILL` to the second, and use `pkill sleep` for the rest. Check after each with `pgrep`.
3. Start `nice -n 15 sleep 500 &` and confirm `NI` is 15 with `ps -o pid,ni,cmd -p <PID>`.
4. Try `renice -n 5 -p <PID>` as student (fails: lowering niceness), then `renice -n 19 -p <PID>` (works).
5. Find nginx's master PID and send `HUP` with `sudo kill -HUP`. Check `journalctl -u nginx -n 5` (Module 7) for the reload; then do the same with `sudo systemctl reload nginx`.

## Independent exercises

1. Write the difference between `kill`, `pkill` and `killall` in one sentence each.
2. A long `find / ...` slows down the server during working hours. List two ways to reduce its impact without stopping it.
3. Explain to a colleague why `kill -9` on a database server is dangerous.
