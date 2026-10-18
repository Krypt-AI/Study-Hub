---
id: linux-fundamentals.m01.l1
title: Commands, options and arguments
summary: How the shell reads a command line, and the first commands for finding out who and where you are.
objectives:
  - Split a command line into command, options and arguments
  - Use short and long options, and combine short options
  - Run `whoami`, `hostname`, `uname`, `date`, `uptime` and `history` and read their output
  - Use tab completion, history and the essential keyboard shortcuts
estimatedMinutes: 45
topics: [linux.m01]
resources:
  - { title: "GNU Bash manual: Shell syntax", url: "https://www.gnu.org/software/bash/manual/html_node/Shell-Syntax.html", free: true, official: true }
  - { title: "GNU Coreutils manual", url: "https://www.gnu.org/software/coreutils/manual/coreutils.html", free: true, official: true }
  - { title: "Ubuntu tutorial: The Linux command line for beginners", url: "https://ubuntu.com/tutorials/command-line-for-beginners", free: true, official: true }
---

## Anatomy of a command line

```text
ls  -l -h  /var/log
│   │      └── argument: what to act on
│   └── options: how to do it
└── command: which program to run
```

- The **command** is the first word. The shell finds it as a built-in (`cd`, `echo`) or as a program in one of the directories listed in `$PATH`.
- **Options** (also called flags or switches) change the behaviour. Short options are one letter after one dash (`-l`); long options are words after two dashes (`--human-readable`).
- **Arguments** are what the command works on: files, directories, users, hostnames.

Words are separated by spaces, so spaces matter: `ls -l` works, `ls-l` is a command that does not exist.

### Short options combine; long options do not

These three are the same:

```bash
ls -l -a -h
ls -lah
ls -l --all --human-readable
```

Some options take a value: `head -n 5 file` or `head --lines=5 file`.

### Linux is case-sensitive

`ls -r` (reverse order) and `ls -R` (recursive) are different options, and `Report.txt` and `report.txt` are different files. Commands are almost always lower case.

## Who, where and what

| Command | What it shows |
|---|---|
| `whoami` | your username |
| `id` | your user ID, group ID and groups |
| `hostname` | the machine's name |
| `uname -a` | kernel name, hostname, kernel release and architecture |
| `date` | current date and time, with the time zone |
| `uptime` | how long since boot, logged-in users, load averages |
| `pwd` | the directory you are in (next lesson) |
| `history` | the commands you ran before |
| `clear` | clears the screen (`Ctrl+L` does the same) |

```bash
whoami
hostname
uname -srm
date
uptime
```

```text
student
lab01
Linux 7.0.0-15-generic x86_64
Sat Oct 18 09:42:17 AM +08 2026
 09:42:17 up  1:05,  1 user,  load average: 0.00, 0.02, 0.00
```

`uname -s` is the kernel name, `-r` the release, `-m` the machine architecture (`x86_64`, or `aarch64` on Apple silicon and ARM servers). `uname -a` prints all of it.

## Keyboard shortcuts that save hours

| Keys | Effect |
|---|---|
| `Tab` | complete a command, file or directory name; press twice to list choices |
| `↑` / `↓` | previous / next command from history |
| `Ctrl+R` | search history backwards: type part of an old command |
| `Ctrl+C` | stop the running command |
| `Ctrl+D` | end of input; at an empty prompt, log out |
| `Ctrl+A` / `Ctrl+E` | jump to the start / end of the line |
| `Ctrl+U` | delete from the cursor to the start of the line |
| `!!` | repeat the previous command (`sudo !!` reruns it with sudo) |

Tab completion is also a typing check: if Tab does not complete a path, the path probably does not exist.

## Guided lab

1. SSH to `lab01` and run `whoami`, `id`, `hostname` and `uname -a`. In your lab log, label each part of the `uname -a` output.
2. Run `ls -l /etc` and then `ls -lh /etc`. What changed? (Sizes become human-readable, such as `4.0K`.)
3. Type `ls /usr/sh` and press Tab. It completes to `/usr/share/`. Press Tab twice after `ls /usr/s` and see the choices.
4. Press `↑` until you reach `uname -a` and run it again. Then press `Ctrl+R`, type `id`, and press Enter.
5. Run `sleep 100`, then stop it with `Ctrl+C`.
6. Run `history | tail -5` to see your last five commands.

## Independent exercises

1. Use `date +%Y-%m-%d` and `date +%H:%M`. What do you think `date +%A` prints? Try it.
2. Find out the difference between `ls -t` and `ls -tr` on `/var/log`.
3. `uname --kernel-release` and `uname -r` should print the same thing. Check.
4. Write three commands from this lesson, label the command, options and arguments in each.
