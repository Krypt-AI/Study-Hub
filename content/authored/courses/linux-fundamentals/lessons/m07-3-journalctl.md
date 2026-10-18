---
id: linux-fundamentals.m07.l3
title: Reading logs with journalctl
summary: Filter the systemd journal by unit, time, boot and priority, keep it across reboots, and relate it to the classic log files.
objectives:
  - Filter journal entries by unit, time range, boot and priority
  - Follow logs live and output them for a ticket
  - Check that the journal persists across reboots and how much space it uses
  - Know where rsyslog's text files fit in
estimatedMinutes: 40
topics: [linux.m07]
resources:
  - { title: "systemd: journalctl(1)", url: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html", free: true, official: true }
  - { title: "systemd: journald.conf(5)", url: "https://www.freedesktop.org/software/systemd/man/latest/journald.conf.html", free: true, official: true }
  - { title: "rsyslog documentation", url: "https://www.rsyslog.com/doc/", free: true, official: true }
---

## The journal

systemd's **journald** collects messages from the kernel, from services' stdout and stderr, and from programs using syslog, into one indexed **journal**. `journalctl` reads it. On Ubuntu the journal is **persistent** (stored in `/var/log/journal`), so it survives reboots.

## Filtering

| Command | Shows |
|---|---|
| `journalctl` | everything, oldest first, in a pager |
| `journalctl -e` | jump to the end |
| `journalctl -n 20` | the last 20 entries |
| `journalctl -f` | follow new entries live |
| `journalctl -u nginx` | one unit (repeat `-u` for several) |
| `journalctl -b` / `-b -1` | this boot / the previous boot |
| `journalctl --list-boots` | all recorded boots |
| `journalctl --since "2026-10-18 09:00" --until "10:00"` | a time range |
| `journalctl --since "1 hour ago"` / `--since today` | relative ranges |
| `journalctl -p err` | priority `err` and worse (`emerg alert crit err warning notice info debug`) |
| `journalctl -k` | kernel messages (like `dmesg`) |
| `journalctl _UID=1000` / `_COMM=sudo` | by user or by command name |
| `journalctl -g "Failed password"` | entries matching a pattern (grep) |
| `--no-pager` | print without the pager, for copying into tickets |
| `-o short-iso` / `-o json-pretty` / `-o cat` | output formats |

Combine them:

```bash
journalctl -u ssh --since today -g "Failed password" --no-pager | tail -5
journalctl -b -p warning --no-pager | head
journalctl -u nginx -f
```

```text
Oct 18 10:52:13 lab01 sshd-session[2290]: Failed password for invalid user admin from 192.168.56.1 port 50122 ssh2
Oct 18 10:52:16 lab01 sshd-session[2290]: Failed password for invalid user admin from 192.168.56.1 port 50122 ssh2
```

(Recent OpenSSH versions log per-connection work under the name `sshd-session`; older ones log as `sshd`. Filtering by unit with `-u ssh` catches both.)

## Investigating a failed service

```bash
systemctl status loadlogger --no-pager
journalctl -u loadlogger -b --no-pager | tail -20
```

`status` shows the last ~10 lines; `journalctl -u` shows the full story, including earlier failed starts. Look for the **first** error, not the last: later errors are often consequences.

## Persistence and size

```bash
ls /var/log/journal
journalctl --disk-usage
sudo journalctl --vacuum-time=4weeks
```

```text
Archived and active journals take 96.0M in the file system.
```

Limits are set in `/etc/systemd/journald.conf` (or a drop-in in `/etc/systemd/journald.conf.d/`), for example `SystemMaxUse=500M`. If `/var/log/journal` does not exist (some RHEL installations keep the journal only in memory under `/run/log/journal`), create it and restart journald to keep logs across reboots: `sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald` (or set `Storage=persistent`).

## rsyslog and the classic files

Ubuntu also runs **rsyslog**, which writes plain-text copies of messages to files in `/var/log` that many tools and colleagues expect:

| File (Ubuntu) | RHEL equivalent | Contains |
|---|---|---|
| `/var/log/syslog` | `/var/log/messages` | general system messages |
| `/var/log/auth.log` | `/var/log/secure` | logins, sudo, SSH |
| `/var/log/kern.log` | (in messages) | kernel |
| `/var/log/dpkg.log`, `/var/log/apt/` | `/var/log/dnf.log` | package changes |
| `/var/log/nginx/` | `/var/log/nginx/` | an application's own logs |

Services such as nginx and databases often write their **own** log files too; check both the journal and the application's directory. **logrotate** (`/etc/logrotate.d/`) compresses and removes old text logs on a schedule (Module 10).

## Guided lab

1. `journalctl -b --no-pager | head -20`: read the first messages of this boot.
2. `journalctl --list-boots` and look at the previous boot's last lines with `journalctl -b -1 -n 20`.
3. Generate failed logins from your laptop (`ssh nobody@192.168.56.101`, wrong password three times), then find them with `journalctl -u ssh -g "Failed password" --since "10 minutes ago"`.
4. Run `journalctl -p err -b` and explain one of the entries (or note that there are none).
5. Follow nginx's journal in one session (`journalctl -u nginx -f`) while you reload it in another.
6. Check `journalctl --disk-usage` and the `SystemMaxUse` setting.

## Independent exercises

1. Write a journalctl command that shows sudo usage by user `farid` yesterday.
2. Export the last hour of the `ssh` unit's log in ISO time format to a file for a ticket.
3. Explain why you might see an event in the journal but not in `/var/log/syslog`, or the opposite.
