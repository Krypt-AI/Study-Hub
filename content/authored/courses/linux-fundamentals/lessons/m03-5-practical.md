---
id: linux-fundamentals.m03.l5
title: "Practical assessment: a health-check script"
summary: Write a Bash script a helpdesk can run to check a server's health, with clear output and exit codes.
objectives:
  - Combine text tools, variables, conditions, loops and functions in a script
  - Report results with meaningful exit codes for monitoring
estimatedMinutes: 90
topics: [linux.m03]
---

## Requirements

Write `~/bin/healthcheck.sh` that:

1. Starts with a shebang and `set -euo pipefail`, and has a comment block saying what it does, who wrote it and when.
2. Accepts an optional threshold argument (default `80`) for disk usage, and rejects a non-numeric value with a usage message on stderr and exit code `2`.
3. Prints the hostname, the date and time, and uptime.
4. For **every mounted filesystem** of type ext4 or xfs (`df -h -t ext4 -t xfs`), prints its usage and `WARN` if above the threshold.
5. Prints the number of failed SSH password attempts in `/var/log/auth.log` today (use `sudo` or run the script with sudo; or `journalctl -u ssh --since today`).
6. Uses a `log` function to append each line of output to `~/healthcheck.log` with a timestamp.
7. Exits `0` if nothing was above the threshold, and `1` otherwise.

Test it: run it normally, with `95`, with `5` (should warn and exit 1), and with `abc`. Run ShellCheck and fix what it reports.

## Starting point

```bash
#!/usr/bin/env bash
# healthcheck.sh - quick server health summary for the helpdesk
# Author: <you>  Date: <date>
set -euo pipefail

threshold="${1:-80}"
if [[ ! "$threshold" =~ ^[0-9]+$ ]]; then
    echo "Usage: $0 [THRESHOLD_PERCENT]" >&2
    exit 2
fi
```

`${1:-80}` means "the first argument, or 80 if there is none"; `=~` matches a regular expression.

## Marking

Paste your script and the results of your four test runs, then compare with the model answer.
