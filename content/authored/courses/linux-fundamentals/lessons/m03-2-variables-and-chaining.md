---
id: linux-fundamentals.m03.l2
title: Variables, the environment, quoting and chaining
summary: Store values in variables, understand environment variables and PATH, quote correctly, and chain commands on success or failure.
objectives:
  - Set and use shell variables and command substitution
  - Explain environment variables, `export` and `PATH`
  - Choose between single quotes, double quotes and no quotes
  - Chain commands with `;`, `&&` and `||`
  - Make settings and aliases permanent in `~/.bashrc`
estimatedMinutes: 50
topics: [linux.m03]
resources:
  - { title: "GNU Bash manual: Shell parameters", url: "https://www.gnu.org/software/bash/manual/html_node/Shell-Parameters.html", free: true, official: true }
  - { title: "GNU Bash manual: Quoting", url: "https://www.gnu.org/software/bash/manual/html_node/Quoting.html", free: true, official: true }
  - { title: "GNU Bash manual: Lists of commands", url: "https://www.gnu.org/software/bash/manual/html_node/Lists.html", free: true, official: true }
  - { title: "GNU Bash manual: Bash startup files", url: "https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html", free: true, official: true }
---

## Shell variables

```bash
site=kira
echo $site
echo "Backing up ${site}-data"
```

```text
kira
Backing up kira-data
```

- **No spaces** around `=`: `site = kira` runs a command called `site`.
- Read a variable with `$name`; use `${name}` when letters follow it.
- Names are case-sensitive. By convention, your own variables are lower case; environment variables are UPPER CASE.

### Command substitution

`$(command)` is replaced by the command's output:

```bash
today=$(date +%F)
echo "Report for $today on $(hostname)"
kernel=$(uname -r)
```

```text
Report for 2026-10-18 on lab01
```

## Environment variables

A shell variable is visible only in the current shell. `export` makes it an **environment variable**, copied to every program the shell starts.

```bash
printenv HOME USER SHELL LANG
echo $PATH
```

```text
/home/student
student
/bin/bash
C.UTF-8
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
```

**`PATH`** is the list of directories the shell searches for commands, left to right. That is why `ls` works without typing `/usr/bin/ls`, and why a script in the current directory must be run as `./script.sh`: `.` is not in `PATH`, deliberately.

To add your own scripts directory:

```bash
mkdir -p ~/bin
export PATH="$HOME/bin:$PATH"
```

## Quoting

| Quotes | Variables and `$( )` expanded? | Wildcards expanded? | Use for |
|---|---|---|---|
| none | yes | yes | simple words |
| `"double"` | **yes** | no | text with variables, names with spaces |
| `'single'` | no | no | literal text, patterns for `grep` and `find` |

```bash
name="Lab Notes"
echo "Folder: $name"
echo 'Folder: $name'
touch "$name"      # one file called "Lab Notes"
touch $name        # two files: "Lab" and "Notes"
```

**Quote your variables** (`"$name"`) unless you have a reason not to. Unquoted variables with spaces or wildcards are a classic source of bugs, including dangerous ones in `rm` commands.

## Chaining commands

| Operator | Runs the next command... | Example |
|---|---|---|
| `;` | always | `cd /tmp; ls` |
| `&&` | only if the previous **succeeded** (exit 0) | `sudo apt update && sudo apt upgrade` |
| `\|\|` | only if the previous **failed** | `ping -c1 db01 \|\| echo "db01 unreachable"` |

```bash
mkdir -p ~/reports && cd ~/reports && echo "ready"
grep -q student /etc/passwd && echo "user exists" || echo "user missing"
```

`&&` is the safe default when later steps depend on earlier ones: `cd /some/dir && rm -r old` never removes `old` from the wrong directory if `cd` fails.

## Making it permanent: `~/.bashrc` and aliases

Settings typed at the prompt disappear when you log out. Interactive Bash reads `~/.bashrc` at startup (login shells read `~/.profile`, which on Ubuntu reads `.bashrc`). Add lines at the end:

```bash
nano ~/.bashrc
```

```bash
export PATH="$HOME/bin:$PATH"
alias ll='ls -alF'
alias ports='sudo ss -tulpn'
```

Reload without logging out: `source ~/.bashrc`. List aliases with `alias`; bypass one with `\ls`.

System-wide settings live in `/etc/profile`, `/etc/profile.d/*.sh` and `/etc/bash.bashrc`; `/etc/environment` holds plain `NAME=value` pairs for all users.

## Guided lab

1. Set `backup_dir=/srv/backup` and print `Backups go to /srv/backup` using the variable.
2. Store today's date in `today` with command substitution and create `~/report-$today.txt`.
3. Run `bash -c 'echo $site'` after `site=kira` (empty), then after `export site` (prints `kira`). Explain.
4. Create `~/bin/hello` containing `echo hello from my bin`, make it executable with `chmod +x ~/bin/hello`, and run `hello` after adding `~/bin` to `PATH`.
5. Run `mkdir /root/test && echo created || echo "could not create"`.
6. Add the `ll` alias to `~/.bashrc`, `source` it, and use it.

## Independent exercises

1. Show the difference between `echo "$HOME"`, `echo '$HOME'` and `echo \$HOME`.
2. Write one line that prints `online` if `ping -c1 -W1 192.168.56.1` succeeds and `offline` if it fails, without printing ping's own output.
3. Look at Ubuntu's default `~/.bashrc` and find where it sets the prompt (`PS1`).
