---
id: linux-fundamentals.m13.l2
title: Scheduling with cron and systemd timers
summary: Run jobs on a schedule with cron and with systemd timers, capture their output, and choose between them.
objectives:
  - Write crontab entries and read the five time fields
  - Use system cron files, `/etc/cron.d` and the periodic directories
  - Create a systemd service and timer pair, including persistent timers
  - Capture output and failures of scheduled jobs; run one-off jobs with `at`
estimatedMinutes: 55
topics: [linux.m13]
resources:
  - { title: "man 5 crontab", url: "https://manpages.ubuntu.com/manpages/noble/man5/crontab.5.html", free: true, official: true }
  - { title: "systemd: systemd.timer(5)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html", free: true, official: true }
  - { title: "systemd: systemd.time(7) calendar events", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.time.html", free: true, official: true }
  - { title: "man 1 at", url: "https://manpages.ubuntu.com/manpages/noble/man1/at.1.html", free: true, official: true }
---

## cron

The **cron** daemon runs commands at set times. Each user has a **crontab**:

```bash
crontab -e      # edit yours
crontab -l      # list
sudo crontab -e # root's crontab
```

```text
# ┌──────── minute (0–59)
# │ ┌────── hour (0–23)
# │ │ ┌──── day of month (1–31)
# │ │ │ ┌── month (1–12)
# │ │ │ │ ┌ day of week (0–7, 0 and 7 = Sunday)
# │ │ │ │ │
  30 1 * * *    /usr/local/sbin/kira-backup.sh
  */15 * * * *  /home/student/bin/healthcheck.sh >> /home/student/healthcheck.cron.log 2>&1
  0 8 * * 1-5   /home/student/bin/daily-report.sh
  0 3 1 * *     /usr/local/sbin/monthly-audit.sh
```

| Expression | Meaning |
|---|---|
| `*` | every value |
| `*/15` | every 15 (minutes 0, 15, 30, 45) |
| `1-5` | Monday to Friday |
| `1,15` | the 1st and 15th |
| `@reboot`, `@daily`, `@weekly` | shortcuts |

The entries above: 01:30 every day; every 15 minutes; 08:00 on weekdays; 03:00 on the first of every month.

### Pitfalls

- cron runs with a **minimal environment**: a short `PATH`, no `~/.bashrc`. Use full paths to commands and files, or set `PATH=` at the top of the crontab.
- `%` has a special meaning in crontab lines (newline); escape it as `\%`, e.g. `date +\%F`.
- Output is mailed to the user if a mail system exists; on a typical server it is **lost**. Redirect it to a log (`>> file 2>&1`) or to the journal (`2>&1 | logger -t myjob`).
- The server's **time zone** applies (`timedatectl`).

### System cron

| Location | Use |
|---|---|
| `/etc/crontab` and `/etc/cron.d/*` | system jobs; these lines have an extra **user** field: `30 1 * * * root /usr/local/sbin/kira-backup.sh` |
| `/etc/cron.daily/`, `weekly/`, `monthly/` | scripts run by `run-parts` (no dots in file names!) |

Packages place their jobs there; on Ubuntu, many (such as logrotate, apt and man-db) have moved to systemd timers.

## systemd timers

A **timer** unit starts a **service** unit on a schedule. Two small files:

```bash
sudo tee /etc/systemd/system/kira-backup.service > /dev/null <<'EOF'
[Unit]
Description=Nightly backup of /etc and the Kedai Kira share

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/kira-backup.sh
Nice=10
IOSchedulingClass=idle
EOF

sudo tee /etc/systemd/system/kira-backup.timer > /dev/null <<'EOF'
[Unit]
Description=Run kira-backup every night

[Timer]
OnCalendar=*-*-* 01:30:00
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now kira-backup.timer
systemctl list-timers kira-backup.timer
```

```text
NEXT                         LEFT LAST PASSED UNIT              ACTIVATES
Sun 2026-10-19 01:34:52 +08 13h - -          kira-backup.timer kira-backup.service
```

| Timer option | Meaning |
|---|---|
| `OnCalendar=daily`, `Mon..Fri 08:00`, `*-*-01 03:00` | calendar schedules (check with `systemd-analyze calendar "Mon..Fri 08:00"`) |
| `OnBootSec=5min`, `OnUnitActiveSec=15min` | relative schedules |
| `Persistent=true` | if the machine was off at the scheduled time, run at the next boot |
| `RandomizedDelaySec=` | spread load when many servers share a schedule |

Run the job immediately to test it: `sudo systemctl start kira-backup.service`, then `journalctl -u kira-backup -n 20`.

## cron or timer?

| | cron | systemd timer |
|---|---|---|
| Setup | one line | two files |
| Logging | you must redirect | automatic, in the journal per unit |
| Missed runs (machine off) | skipped (anacron handles daily/weekly) | `Persistent=true` catches up |
| Status and history | none built in | `systemctl status`, `list-timers`, exit status |
| Resource limits and hardening | no | all systemd options (`Nice=`, `MemoryMax=`, `User=`) |
| Portability | everywhere, including old systems | systemd systems |

Both are expected knowledge (RHCSA and LFCS list cron and timers). Prefer timers for new system jobs; you will maintain plenty of cron jobs written by others.

## One-off jobs with `at`

```bash
sudo apt install at
echo "/usr/sbin/shutdown -r now" | sudo at 02:00 tomorrow
sudo atq
sudo atrm 3
```

## Guided lab

1. Add a user crontab entry that runs your health check every 15 minutes, logging to a file. Wait for a run and read the log.
2. Break it on purpose by calling the script without its full path and with a command that depends on your `PATH`; see what is logged, then fix it.
3. Create the `kira-backup` service and timer, test the service with `systemctl start`, and check `list-timers`.
4. Test calendar expressions with `systemd-analyze calendar "*-*-* 01:30:00"` and `"Mon..Fri 08:00"`.
5. Schedule a harmless one-off job with `at` (for example `logger "at test"` in two minutes) and confirm in the journal.

## Independent exercises

1. Write cron lines for: every weekday at 18:30; every 10 minutes during office hours (08:00–17:59) on weekdays; at 00:00 on the last day of each month (hint: cron cannot do this directly; how would you solve it?).
2. Convert your health-check cron job into a service and timer pair with `OnCalendar=*:0/15`.
3. Explain why `Persistent=true` matters for a laptop-like server that is switched off at night.
