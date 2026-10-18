---
id: linux-fundamentals.m13.l1
title: Routine administration and automation scripts
summary: Organise the daily, weekly and monthly work of a Linux administrator, and turn repeated tasks into safe, reusable scripts.
objectives:
  - Describe a realistic routine of daily, weekly and monthly checks
  - Decide when a task is worth automating
  - Write automation scripts that are idempotent, logged, safe to rerun and easy to review
  - Store scripts and configuration under version control
estimatedMinutes: 50
topics: [linux.m13]
resources:
  - { title: "GNU Bash manual", url: "https://www.gnu.org/software/bash/manual/bash.html", free: true, official: true }
  - { title: "ShellCheck", url: "https://www.shellcheck.net/", free: true, official: true }
  - { title: "Git documentation", url: "https://git-scm.com/doc", free: true, official: true }
  - { title: "Ansible documentation (next step)", url: "https://docs.ansible.com/", free: true, official: true }
---

## What a junior administrator actually does

| Frequency | Typical tasks |
|---|---|
| **Daily** | read monitoring alerts and overnight backup results; check failed units and disk space; handle tickets (access requests, password resets, "the site is slow") |
| **Weekly** | review security updates and pending reboots; review failed logins and sudo use; check certificate expiry dates; tidy temporary data |
| **Monthly** | test a restore; review user accounts and group memberships; review firewall rules and listening services; patch in a maintenance window; update documentation |
| **On demand** | onboard and offboard staff; deploy software; respond to incidents; make planned changes |

Much of this is repeated on many servers. Doing it by hand is slow and error-prone; automating it is where Bash (Module 3) pays off, and where tools like **Ansible** take over at larger scale.

## When to automate

Automate a task when it is **repeated**, **error-prone** or **needs to happen when nobody is watching** (nightly backups). Keep it manual, but documented in a runbook, when it is rare, needs judgement, or is risky enough that a human should look at each step.

## Writing scripts others can trust

A script that runs on a server unattended is production code. Apply these rules:

1. **Strict mode and clear failure**: `set -euo pipefail`, error messages to stderr, meaningful exit codes.
2. **Idempotent**: running it twice has the same effect as once. Check before acting (`id user` before `useradd`, `mkdir -p`, `grep -q` before appending a line).
3. **Dry run**: a `-n` option that prints what would be done.
4. **Logged**: what it did, when, with what result (to the journal via `logger`, or a log file that logrotate handles).
5. **Parameterised**: no hard-coded passwords or hostnames inside; read them from arguments or a configuration file with tight permissions.
6. **Documented**: a header (purpose, usage, author, date) and `--help`.
7. **Reviewed and versioned**: ShellCheck clean, stored in Git, changed through review.
8. **Least privilege**: run as an unprivileged user where possible; use sudo only for the commands that need it.

### Example: idempotent onboarding

```bash
#!/usr/bin/env bash
# add-staff.sh - create a staff account and add it to a team group (idempotent)
# Usage: add-staff.sh [-n] USERNAME GROUP
set -euo pipefail

dry_run=false
if [[ "${1:-}" == "-n" ]]; then dry_run=true; shift; fi
[[ $# -eq 2 ]] || { echo "Usage: $0 [-n] USERNAME GROUP" >&2; exit 2; }
user="$1"; group="$2"

run() { if $dry_run; then echo "DRY-RUN: $*"; else "$@"; fi; }

getent group "$group" >/dev/null || { echo "Group $group does not exist" >&2; exit 1; }

if id "$user" &>/dev/null; then
    echo "$user exists; checking group membership"
else
    run useradd -m -s /bin/bash "$user"
    run passwd -e "$user"
fi

if id -nG "$user" 2>/dev/null | grep -qw "$group"; then
    echo "$user already in $group"
else
    run usermod -aG "$group" "$user"
fi

run logger -t add-staff "ensured $user in $group"
```

```bash
sudo ./add-staff.sh -n zul accounts
sudo ./add-staff.sh zul accounts
sudo ./add-staff.sh zul accounts
journalctl -t add-staff -n 2
```

```text
DRY-RUN: useradd -m -s /bin/bash zul
DRY-RUN: passwd -e zul
DRY-RUN: usermod -aG accounts zul
DRY-RUN: logger -t add-staff ensured zul in accounts
...
zul exists; checking group membership
zul already in accounts
```

The second real run changes nothing: that is idempotence. (A new account also needs a password or an SSH key, set separately through your organisation's process.)

## Version control for administrators

Keep scripts, configuration templates and runbooks in a **Git** repository:

```bash
sudo apt install git
mkdir -p ~/admin && cd ~/admin && git init
cp /usr/local/sbin/kira-backup.sh ./scripts/ 2>/dev/null || mkdir -p scripts
git add . && git commit -m "Add backup and onboarding scripts"
```

You get history (who changed what and why), review before changes reach servers, and an easy way to roll back. **Never commit secrets** (passwords, private keys, API tokens).

`etckeeper` (`sudo apt install etckeeper`) puts `/etc` itself under Git and commits automatically when packages change, a cheap way to see what changed in configuration.

## Beyond Bash: configuration management

Scripts describe **steps**. Configuration management tools such as **Ansible** describe the **desired state** ("nginx installed, this file present, this service running") and apply it to hundreds of servers idempotently, over SSH. Ansible is the natural next step after this course (RHCE, Linux+ automation objectives).

## Guided lab

1. Write `add-staff.sh`, run ShellCheck on it, and test the dry run, a real run and a repeat run.
2. Create a Git repository in `~/admin`, commit your scripts from earlier modules with clear messages, and view the history with `git log --oneline`.
3. Install etckeeper, make a small change in `/etc` (for example `/etc/motd`), and see it with `sudo etckeeper vcs log -1` or `sudo git -C /etc log -1`.
4. Write your own daily-check list for lab01 and estimate which items could be automated.

## Independent exercises

1. Make `add-staff.sh` accept a file of `username group` lines and process each, reporting a summary at the end.
2. Write `remove-staff.sh` that **disables** an account idempotently (lock, expire, remove from groups, archive the home directory) without deleting it.
3. Explain idempotence to a classmate with an example of a non-idempotent command and its idempotent version.
