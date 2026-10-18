---
id: linux-fundamentals.m12.l4
title: "Practical assessment: backup and restore drill"
summary: Implement a backup script for the office server, verify it, and recover from a simulated loss within a target time.
objectives:
  - Implement verified backups of configuration and data
  - Restore within an agreed time and report on it
estimatedMinutes: 90
topics: [linux.m12]
---

## Requirements

Write `/usr/local/sbin/kira-backup.sh` that:

1. Uses `set -euo pipefail` and logs with timestamps to `/var/log/kira-backup.log`.
2. Archives `/etc` (gzip) and `/srv/kira` (zstd, with ACLs and xattrs) into `/srv/backup/YYYY-MM-DD/`.
3. Saves the installed-package list.
4. Writes `SHA256SUMS` in that directory and verifies it, plus `gzip -t`/`zstd -t` on the archives.
5. Deletes backup directories older than 14 days (`find /srv/backup -maxdepth 1 -type d -name '20*' -mtime +14 -exec rm -r {} +`, previewed first).
6. Exits non-zero if any step fails.

Run it twice (as root) and check the log. (Module 13 schedules it.)

## The drill

Take a snapshot, then simulate the loss:

```bash
sudo rm -rf /srv/kira/accounts
```

> **Incident** — "The accounts folder has disappeared." Agreed RTO: 30 minutes.

Restore the folder with its ownership, setgid bit and ACLs, verify as the users (aina can write, mei can read only), and time it.

## Marking

Paste the script and report the drill, then compare with the model answer.
