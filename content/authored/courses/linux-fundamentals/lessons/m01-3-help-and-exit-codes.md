---
id: linux-fundamentals.m01.l3
title: Getting help and reading exit codes
summary: Find answers on the system itself with `man`, `--help`, `type` and `apropos`, and check whether a command succeeded.
objectives:
  - Read a man page and search inside it
  - Use `--help`, `type`, `which` and `apropos`
  - Explain exit codes and read `$?`
  - Tell standard output from error messages
estimatedMinutes: 40
topics: [linux.m01]
resources:
  - { title: "Ubuntu manpages", url: "https://manpages.ubuntu.com/", free: true, official: true }
  - { title: "GNU Bash manual: Exit status", url: "https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html", free: true, official: true }
  - { title: "man-pages project", url: "https://www.kernel.org/doc/man-pages/", free: true, official: true }
---

## Help is already installed

Exams such as RHCSA and LFCS give you **no internet**, only the documentation on the system. Practise using it now.

### `--help`

Most commands print a short summary of their options:

```bash
ls --help | head -5
```

```text
Usage: ls [OPTION]... [FILE]...
List information about the FILEs (the current directory by default).
Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

Mandatory arguments to long options are mandatory for short options too.
```

`[ ]` marks something optional, and `...` means it can repeat: `ls` takes any number of options and files, or none.

### `man`: the manual

```bash
man ls
```

| Key in `man` | Action |
|---|---|
| `Space` / `b` | page down / up |
| `/word` then `Enter` | search forward; `n` next match, `N` previous |
| `g` / `G` | top / bottom |
| `q` | quit |

Man pages are grouped in **sections**. The two you will use most: **1** user commands, **5** file formats, **8** administration commands. The same name can exist in several: `man passwd` is the command, `man 5 passwd` describes `/etc/passwd`.

Ubuntu Server is "minimized" in a few places; if `man` says pages were removed, run `sudo unminimize` (or check that the `man-db` package is installed).

### Finding the right command

```bash
apropos "list directory"
type cd
type ls
which ls
```

```text
dir (1)              - list directory contents
ls (1)               - list directory contents
vdir (1)             - list directory contents
cd is a shell builtin
ls is aliased to `ls --color=auto'
/usr/bin/ls
```

- `apropos` (or `man -k`) searches man page descriptions.
- `type` tells you whether a name is a **built-in**, an **alias** or a program. Built-ins are documented in `help cd`, not `man cd`.
- `which` shows the program file that runs.

## Exit codes

Every command finishes with an **exit code** (exit status): `0` means success, anything from 1 to 255 means some failure. The shell stores the last one in `$?`.

```bash
ls /etc/hostname
echo $?
ls /etc/nothing-here
echo $?
```

```text
/etc/hostname
0
ls: cannot access '/etc/nothing-here': No such file or directory
2
```

Conventions worth knowing:

| Code | Usual meaning |
|---|---|
| 0 | success |
| 1 | general failure (also `grep`: "no match") |
| 2 | misuse: bad option or missing file (for many tools) |
| 126 | found but not executable (permission) |
| 127 | command not found |
| 130 | stopped by `Ctrl+C` |

Scripts (Module 3) and monitoring tools rely on exit codes, so a command that "printed nothing" is not necessarily a success: check `$?`.

## Output and errors are separate streams

Commands write normal results to **standard output** (stdout) and problems to **standard error** (stderr). Both appear in your terminal, but they can be separated, which Module 3 uses for logging:

```bash
ls /etc/hostname /nope
```

```text
ls: cannot access '/nope': No such file or directory
/etc/hostname
```

The error line came from stderr, the file name from stdout.

## Reading error messages

| Message | Usually means |
|---|---|
| `command not found` | typo, or the package is not installed |
| `No such file or directory` | wrong path; check with `ls` and Tab completion |
| `Permission denied` | you need different permissions or `sudo` (think before adding it) |
| `Is a directory` | the command expected a file |
| `invalid option` | wrong option letter; check `--help` |

On Ubuntu, `command not found` often suggests the package: `Command 'tree' not found, but can be installed with: sudo apt install tree`.

## Guided lab

1. Open `man ls`, search for `/human`, and find the option that prints sizes like `1K 234M 2G`. Quit with `q`.
2. Compare `man passwd` and `man 5 passwd`: one is a command, the other a file format.
3. Run `type cd`, `type ls` and `type pwd`. Which are built-ins?
4. Run `ls /root`, then `echo $?`. Explain the code. Run `sudo ls /root` and `echo $?` again.
5. Type `tree` (not installed). Read the suggestion, then `echo $?` (127).

## Independent exercises

1. Use `apropos` to find a command that shows free and used memory.
2. Find in `man cp` which option asks before overwriting files.
3. What exit code does `grep root /etc/passwd` give? And `grep nobodyxyz /etc/passwd`? Explain the difference.
4. Write in your lab log the man sections 1, 5 and 8, with one example page from each.
