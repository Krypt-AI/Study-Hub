---
id: linux-fundamentals.m03.l1
title: Redirection and pipes
summary: Send output to files, separate errors, feed one command into another, and save output with `tee`.
objectives:
  - Redirect standard output and standard error to files, overwriting or appending
  - Discard unwanted output with `/dev/null`
  - Build pipelines that combine small commands
  - Use `tee` and `sudo tee` to write files you need privileges for
estimatedMinutes: 45
topics: [linux.m03]
resources:
  - { title: "GNU Bash manual: Redirections", url: "https://www.gnu.org/software/bash/manual/html_node/Redirections.html", free: true, official: true }
  - { title: "GNU Bash manual: Pipelines", url: "https://www.gnu.org/software/bash/manual/html_node/Pipelines.html", free: true, official: true }
---

## Three standard streams

Every process starts with three open streams, numbered by **file descriptor**:

| Number | Name | Default |
|---|---|---|
| 0 | standard input (stdin) | the keyboard |
| 1 | standard output (stdout) | the terminal |
| 2 | standard error (stderr) | the terminal |

Redirection changes where they go. The shell sets it up before the command starts.

## Output redirection

| Syntax | Effect |
|---|---|
| `cmd > file` | stdout to `file`, **replacing** its contents |
| `cmd >> file` | stdout **appended** to `file` |
| `cmd 2> file` | stderr to `file` |
| `cmd 2>> file` | stderr appended |
| `cmd > file 2>&1` | both to `file` (order matters: first stdout, then stderr to wherever stdout goes) |
| `cmd &> file` | Bash shorthand for both |
| `cmd 2> /dev/null` | throw errors away |
| `cmd < file` | stdin from `file` |

```bash
ls /etc /nope > out.txt 2> err.txt
cat out.txt | head -3
cat err.txt
```

```text
/etc:
adduser.conf
alternatives
ls: cannot access '/nope': No such file or directory
```

`>` truncates the file **before** the command runs. `sort data.txt > data.txt` therefore leaves you with an empty file. Write to a new file and rename it. Bash's `set -o noclobber` makes `>` refuse to overwrite existing files (`>|` forces it).

A common use: search the whole tree without permission noise.

```bash
find / -name "sshd_config" 2>/dev/null
```

## Pipes

A **pipe** `|` connects the stdout of one command to the stdin of the next, so small tools combine into a larger one:

```bash
ls /etc | wc -l
cat /etc/passwd | cut -d: -f1 | sort | head -5
journalctl -b | grep -i error | tail -n 5
```

Read a pipeline left to right: "list `/etc`, then count the lines". Each command runs at the same time, passing data along as it is produced. Only stdout goes through the pipe; stderr still reaches the terminal unless you redirect it (`2>&1 |` or `|&`).

The exit code of a pipeline is that of the **last** command. In scripts, `set -o pipefail` makes the pipeline fail if any part fails.

## `tee`: see it and save it

`tee` copies its input to a file **and** to stdout:

```bash
df -h | tee disk-report.txt
```

### Why `sudo echo ... > /etc/file` fails

```bash
sudo echo "192.168.56.20 db01" >> /etc/hosts
```

```text
-bash: /etc/hosts: Permission denied
```

`sudo` runs `echo` as root, but the redirection `>>` is done by **your** shell, which is not root. Use `tee` under sudo instead:

```bash
echo "192.168.56.20 db01" | sudo tee -a /etc/hosts
```

`-a` appends; without it `tee` overwrites. Add `> /dev/null` at the end if you do not want the echo on screen.

## Here-documents

To feed several lines to a command, a **here-document** is easier than many `echo` lines:

```bash
cat > ~/motd.txt <<'EOF'
Authorised users only.
Maintenance: Sundays 02:00-04:00.
EOF
```

With the delimiter quoted (`'EOF'`), the text is taken literally; unquoted, variables inside are expanded.

## Guided lab

1. Save a listing of `/etc` to `~/etc-list.txt` and count its lines with `wc -l < ~/etc-list.txt`.
2. Append the date to the same file: `date >> ~/etc-list.txt`, and check the last line with `tail -1`.
3. Run `find / -name "*.conf" > ~/conf.txt 2> ~/conf-errors.txt`. Compare the line counts of both files.
4. Repeat with `2>/dev/null` and see that the errors are gone.
5. Add a host entry with `echo "192.168.56.20 db01" | sudo tee -a /etc/hosts` and check with `tail -2 /etc/hosts`.
6. Count how many accounts use `/usr/sbin/nologin` as their shell: `grep -c nologin /etc/passwd`, then do it again with a pipe: `grep nologin /etc/passwd | wc -l`.

## Independent exercises

1. Predict, then check, what `ls /nope 2>&1 > out.txt` writes to `out.txt`, and why it differs from `ls /nope > out.txt 2>&1`.
2. Write a pipeline that shows the five largest files in `/var/log` (hint: `ls -lS` or `du`, then `head`).
3. Explain to a classmate, in two sentences, why `sudo cmd > /etc/file` fails and how `tee` fixes it.
