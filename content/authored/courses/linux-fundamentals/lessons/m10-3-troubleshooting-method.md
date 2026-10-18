---
id: linux-fundamentals.m10.l3
title: A systematic troubleshooting method
summary: Work through failures methodically, from the symptom to a verified fix and a written record, with a checklist for failing services.
objectives:
  - Apply a repeatable troubleshooting method
  - Diagnose a failing service from status, logs, configuration, permissions, ports and dependencies
  - Use a quick server triage routine in the first five minutes
  - Know when to escalate and what to include
estimatedMinutes: 50
topics: [linux.m10]
resources:
  - { title: "CompTIA troubleshooting methodology (Linux+ objectives)", url: "https://www.comptia.org/en-us/certifications/linux/", free: true, official: true }
  - { title: "systemd: systemd.service(5)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html", free: true, official: true }
  - { title: "Brendan Gregg: USE method", url: "https://www.brendangregg.com/usemethod.html", free: true, official: false }
---

## The method

Guessing and changing things at random wastes time and causes new problems. Professionals follow a loop like this (CompTIA's certifications teach a similar sequence):

1. **Identify the problem.** Gather the symptom precisely: what fails, for whom, since when, what changed? Reproduce it.
2. **Establish a theory** of probable cause. Start with the obvious and the recent change.
3. **Test the theory.** One test at a time; if it is wrong, form the next theory.
4. **Plan the fix** and its effect on users (and get approval if it is a change, Module 13).
5. **Implement** the fix, or escalate.
6. **Verify** full functionality, from the user's point of view, and check nothing else broke.
7. **Document** findings, actions and outcome.

Two habits make the loop faster:

- **"What changed?"** Most incidents follow a change: an update, a configuration edit, a full disk, a certificate expiry. Check `/var/log/apt/history.log`, `journalctl --since`, the change calendar, and `ls -lt /etc | head`.
- **Read the error message.** Completely, literally, and the **first** one.

## The first five minutes on a struggling server

```bash
uptime                                  # load and how long since boot (unexpected reboot?)
journalctl -p err -b --no-pager | tail  # recent errors
systemctl --failed                      # failed units
df -h; df -i                            # space and inodes
free -h                                 # memory available, swap
top -bn1 | head -15                     # busiest processes
ss -tulpn                               # what is listening
ip -br a; ip route                      # network basics
last -x | head                          # recent logins, reboots and shutdowns
```

The **USE method** is another useful lens: for each resource (CPU, memory, disk, network), check **U**tilisation, **S**aturation (queuing) and **E**rrors.

## A failing service: the checklist

When `systemctl status app` says **failed** or the service does not answer:

| Check | Command | Typical finding |
|---|---|---|
| status and last log lines | `systemctl status app` | exit code, the first error message |
| full log | `journalctl -u app -b` | configuration error, missing file, permission denied |
| configuration syntax | `nginx -t`, `sshd -t`, `apachectl configtest` | typo after an edit |
| file permissions and ownership | `namei -l /path`, `ls -l` | service user cannot read its files |
| port conflict | `sudo ss -tlnp \| grep :80` | another process already holds the port |
| dependencies | `systemctl list-dependencies app`, is the database up? | backend unavailable |
| resources | `df -h`, `free -h`, OOM in `journalctl -k` | disk full, killed by OOM |
| security layer | AppArmor (`journalctl -k -g apparmor`), SELinux on RHEL (`ausearch -m avc`) | access denied by policy |
| network path | `curl -v localhost:PORT`, firewall rules | listening only on loopback, blocked port |

Then fix **one** thing, restart, and test again.

### Example

```text
$ systemctl status nginx
× nginx.service - A high performance web server and a reverse proxy server
     Active: failed (Result: exit-code) since Sat 2026-10-18 15:02:11 +08; 8s ago
    Process: 4120 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=1/FAILURE)

Oct 18 15:02:11 lab01 nginx[4120]: 2026/10/18 15:02:11 [emerg] 4120#4120: bind() to 0.0.0.0:80 failed (98: Address already in use)
```

The first error says port 80 is taken. `sudo ss -tlnp | grep ':80 '` shows `apache2` was installed and started by someone else. The fix is a decision (which web server should run?), not a random restart.

## Escalating well

Escalate when the problem is outside your access or skills, when the risk of your next step is high, or when a time limit (SLA) is near. A good escalation contains: the symptom and its impact, when it started, what you checked (commands and results), what you changed, and what you think is happening. "It's broken, please help" wastes the next person's time.

## Guided lab

Run each fault, then troubleshoot it as if you did not know the cause, using the method and the checklist. Record each in your lab log.

1. **Config typo**: add `listen 80 ssl_typo;` inside the `server` block of `/etc/nginx/sites-available/default`, then `sudo systemctl restart nginx`.
2. **Port conflict**: `sudo python3 -m http.server 80 &` while nginx is stopped, then start nginx.
3. **Permissions**: `sudo chmod 600 /var/www/html/index.nginx-debian.html`, then `curl localhost` (403 Forbidden). Check `/var/log/nginx/error.log`.
4. **Disk full** on `/srv/web`: fill it with `fallocate` and try to save a file.

Restore everything afterwards (or revert to your snapshot).

## Independent exercises

1. Write your own one-page "first five minutes" checklist and keep it in your lab log.
2. For fault 3, explain why `chmod 644` is the right fix and `chmod 777` is not.
3. Write an escalation message for an incident you could not solve, using the five elements above.
