---
id: linux-fundamentals.m03.l4
title: Bash scripting
summary: Write, run and debug Bash scripts with variables, arguments, conditions, loops, functions and exit codes.
objectives:
  - Create an executable script with a shebang and run it
  - Use arguments (`$1`, `$#`, `$@`) and validate them
  - Write `if` conditions with `[[ ]]` tests and exit codes
  - Loop over lists, files and command output with `for` and `while`
  - Make scripts fail safely and debug them with `bash -x` and ShellCheck
estimatedMinutes: 75
topics: [linux.m03]
resources:
  - { title: "GNU Bash manual", url: "https://www.gnu.org/software/bash/manual/bash.html", free: true, official: true }
  - { title: "GNU Bash manual: Conditional constructs", url: "https://www.gnu.org/software/bash/manual/html_node/Conditional-Constructs.html", free: true, official: true }
  - { title: "GNU Bash manual: Looping constructs", url: "https://www.gnu.org/software/bash/manual/html_node/Looping-Constructs.html", free: true, official: true }
  - { title: "ShellCheck (static analysis for shell scripts)", url: "https://www.shellcheck.net/", free: true, official: true }
---

## Your first script

```bash
mkdir -p ~/bin
nano ~/bin/sysinfo.sh
```

```bash
#!/usr/bin/env bash
# sysinfo.sh - print a short system summary
set -euo pipefail

echo "Host:    $(hostname)"
echo "Kernel:  $(uname -r)"
echo "Uptime: $(uptime -p)"
echo "Disk /:  $(df -h / | awk 'NR==2 {print $5}') used"
```

```bash
chmod +x ~/bin/sysinfo.sh
~/bin/sysinfo.sh
```

```text
Host:    lab01
Kernel:  7.0.0-15-generic
Uptime: up 3 hours, 12 minutes
Disk /:  31% used
```

- The **shebang** `#!/usr/bin/env bash` on line 1 says which interpreter runs the file.
- `chmod +x` makes it executable. Without it, run `bash script.sh`.
- `set -euo pipefail` makes the script **stop on errors** (`-e`), treat unset variables as errors (`-u`) and fail when any part of a pipeline fails. Use it in every script you write for work.

## Arguments

| Variable | Meaning |
|---|---|
| `$0` | the script's name |
| `$1`, `$2`, ... | the first, second... argument |
| `$#` | number of arguments |
| `"$@"` | all arguments, each kept separate (quote it) |
| `$?` | exit code of the last command |

```bash
#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 USERNAME" >&2
    exit 2
fi

user="$1"
if id "$user" &>/dev/null; then
    echo "$user exists (UID $(id -u "$user"))"
else
    echo "$user does not exist" >&2
    exit 1
fi
```

Errors go to stderr (`>&2`) and the script **exits with a non-zero code** so whoever called it can tell it failed.

## Conditions

`if` runs a command and branches on its exit code. `[[ ... ]]` is Bash's test command:

| Test | True when |
|---|---|
| `[[ -f path ]]` | a regular file exists |
| `[[ -d path ]]` | a directory exists |
| `[[ -e path ]]` | anything exists |
| `[[ -r / -w / -x path ]]` | readable / writable / executable by you |
| `[[ -z "$s" ]]` / `[[ -n "$s" ]]` | string is empty / not empty |
| `[[ "$a" == "$b" ]]`, `!=` | strings equal / different |
| `[[ $n -eq 5 ]]`, `-ne -lt -le -gt -ge` | numeric comparisons |
| `(( n > 5 ))` | arithmetic comparison |

You will also meet the older `[ ... ]` (also called `test`), required in POSIX `sh` scripts; RHCSA objectives mention `if`, `test` and `[ ]` explicitly. In `[ ]`, quote every variable.

```bash
usage=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if (( usage >= 90 )); then
    echo "CRITICAL: / is ${usage}% full"
elif (( usage >= 80 )); then
    echo "WARNING: / is ${usage}% full"
else
    echo "OK: / is ${usage}% full"
fi
```

`case` is tidier when one value is compared with several patterns:

```bash
case "$1" in
    start|begin) echo "starting" ;;
    stop)        echo "stopping" ;;
    *)           echo "usage: $0 start|stop" >&2; exit 2 ;;
esac
```

## Loops

```bash
for host in web01 db01 backup01; do
    echo "Checking $host"
done

for file in /var/log/*.log; do
    echo "$file: $(wc -l < "$file") lines"
done

for i in {1..5}; do echo "$i"; done

while read -r user; do
    echo "Creating home for $user"
done < users.txt

count=0
while (( count < 3 )); do
    count=$(( count + 1 ))
done
```

`while read -r line ... done < file` processes a file line by line; `-r` keeps backslashes as they are. `$(( ))` does integer arithmetic.

## Functions

```bash
log() {
    echo "$(date '+%F %T') $*" | tee -a "$HOME/admin.log"
}

log "Backup started"
```

## Debugging

- `bash -x script.sh` prints each command, after expansion, before running it.
- `shellcheck script.sh` (`sudo apt install shellcheck`) points out quoting bugs and common mistakes, with explanations.
- Test on your lab VM, not on a server people depend on.

## Guided lab

1. Create `~/bin/sysinfo.sh` above, make it executable and run it.
2. Write `~/bin/userinfo.sh` from the arguments example. Run it with no arguments, with `student`, and with `nobody123`. After each, `echo $?`.
3. Write `~/bin/diskcheck.sh` with the `if/elif/else` example. Test the warning branch by temporarily changing `90` and `80` to `20` and `10`.
4. Write a loop that prints each `.conf` file in `/etc` with its line count.
5. Create `users.txt` with three names and a `while read` loop that prints `Would create: NAME` for each.
6. Run `bash -x ~/bin/diskcheck.sh` and read the trace. Install ShellCheck and run it on all three scripts.

## Independent exercises

1. Extend `userinfo.sh` to accept several usernames (`"$@"` in a `for` loop) and report each.
2. Write `backup-config.sh DIR` that copies `/etc/hosts` and `/etc/ssh/sshd_config` into `DIR/config-YYYY-MM-DD/`, creating it if needed, and exits with code 1 if `DIR` is not a writable directory.
3. Explain what would go wrong in `rm -rf "$target_dir/"*` if `target_dir` were empty, and how `set -u` and a `[[ -n ... ]]` test protect you.
