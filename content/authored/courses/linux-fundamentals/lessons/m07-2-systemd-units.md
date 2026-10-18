---
id: linux-fundamentals.m07.l2
title: systemd services and units
summary: Manage services with systemctl, read unit files, override them safely, and write a small service of your own.
objectives:
  - Start, stop, restart, reload, enable and disable services, and read their status
  - Explain unit types and where unit files live
  - Override a packaged unit with a drop-in (`systemctl edit`) instead of editing it
  - Write, enable and test a simple service unit
  - Recognise socket activation (Ubuntu's `ssh.socket`)
estimatedMinutes: 60
topics: [linux.m07]
resources:
  - { title: "systemd: systemctl(1)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemctl.html", free: true, official: true }
  - { title: "systemd: systemd.service(5)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html", free: true, official: true }
  - { title: "systemd: systemd.unit(5)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html", free: true, official: true }
  - { title: "Ubuntu Server: OpenSSH server (socket activation)", url: "https://documentation.ubuntu.com/server/how-to/security/openssh-server/", free: true, official: true }
---

## Units

systemd manages **units**. The type is the suffix:

| Type | Represents | Example |
|---|---|---|
| `.service` | a program to run and supervise | `nginx.service` |
| `.socket` | a listening socket that starts a service on demand | `ssh.socket` |
| `.timer` | a schedule that starts a service (Module 13) | `apt-daily.timer` |
| `.target` | a group of units / a system state | `multi-user.target` |
| `.mount` | a mounted filesystem | `srv-data.mount` |
| `.path` | watches a file or directory | |

You can omit `.service` in commands: `systemctl status nginx`.

## Everyday systemctl

| Command | Effect |
|---|---|
| `systemctl status nginx` | state, PID, memory, the last log lines |
| `sudo systemctl start nginx` / `stop` | start / stop **now** |
| `sudo systemctl restart nginx` | stop and start (connections drop) |
| `sudo systemctl reload nginx` | reread configuration without stopping (if the service supports it) |
| `sudo systemctl enable nginx` / `disable` | start / do not start **at boot** |
| `sudo systemctl enable --now nginx` | enable and start in one step |
| `systemctl is-active nginx` / `is-enabled nginx` | one-word answers, useful in scripts |
| `systemctl --failed` | units that failed |
| `systemctl list-units --type=service --state=running` | running services |
| `systemctl list-unit-files --type=service` | installed services and whether they are enabled |
| `sudo systemctl mask nginx` / `unmask` | make it impossible to start (even manually) |

**Start/stop** is about now; **enable/disable** is about boot. A service can be running but disabled (it will not come back after a reboot), which is a classic cause of "it worked until the reboot".

```bash
systemctl status nginx --no-pager
```

```text
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-10-18 09:12:41 +08; 1h 5min ago
 Invocation: 4c1d0f3e6b8a4d2f9a7e5c3b1d0e2f4a
       Docs: man:nginx(8)
    Process: 873 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
   Main PID: 880 (nginx)
      Tasks: 3 (limit: 2275)
     Memory: 4.2M (peak: 6.1M)
        CPU: 41ms
     CGroup: /system.slice/nginx.service
             ├─880 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             ├─881 "nginx: worker process"
             └─882 "nginx: worker process"

Oct 18 09:12:41 lab01 systemd[1]: Starting nginx.service - A high performance web server...
Oct 18 09:12:41 lab01 systemd[1]: Started nginx.service - A high performance web server...
```

Read it top to bottom: **Loaded** (where the unit file is, enabled or not), **Active** (state and since when), the main PID, and the recent log lines.

Before restarting a service after a configuration change, **test the configuration** if the program can: `sudo nginx -t`, `sudo sshd -t`, `sudo apachectl configtest`. A failed restart takes the service down; a failed test does not.

## Where unit files live

| Path | Owner | Priority |
|---|---|---|
| `/usr/lib/systemd/system/` | installed by packages: **do not edit** | lowest |
| `/etc/systemd/system/` | your units and overrides | highest |
| `/run/systemd/system/` | runtime units | middle |

```bash
systemctl cat nginx
```

```ini
# /usr/lib/systemd/system/nginx.service
[Unit]
Description=A high performance web server and a reverse proxy server
Documentation=man:nginx(8)
After=network-online.target remote-fs.target nss-lookup.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'
ExecReload=/usr/sbin/nginx -g 'daemon on; master_process on;' -s reload
ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /run/nginx.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

- `[Unit]`: description and ordering (`After=`, `Wants=`, `Requires=`).
- `[Service]`: how to start, reload and stop it, and what to do on failure.
- `[Install]`: which target pulls it in when **enabled** (`enable` creates a link in `multi-user.target.wants/`).

## Overriding safely with drop-ins

To change a packaged unit, create a **drop-in**, which survives package upgrades:

```bash
sudo systemctl edit nginx
```

Type, between the comment markers:

```ini
[Service]
Restart=on-failure
RestartSec=5s
```

This writes `/etc/systemd/system/nginx.service.d/override.conf` and reloads systemd. Check with `systemctl cat nginx` (the drop-in appears at the end). If you create unit files by hand, run `sudo systemctl daemon-reload` afterwards.

## Writing your own service

A tiny service that records the server's load every minute:

```bash
sudo tee /usr/local/bin/loadlogger.sh > /dev/null <<'EOF'
#!/usr/bin/env bash
while true; do
    echo "load: $(cut -d' ' -f1-3 /proc/loadavg)"
    sleep 60
done
EOF
sudo chmod 755 /usr/local/bin/loadlogger.sh
```

```bash
sudo tee /etc/systemd/system/loadlogger.service > /dev/null <<'EOF'
[Unit]
Description=Log the load average every minute

[Service]
ExecStart=/usr/local/bin/loadlogger.sh
Restart=on-failure
User=nobody
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now loadlogger
systemctl status loadlogger --no-pager
journalctl -u loadlogger -n 3
```

The script writes to stdout, and systemd sends it to the journal. `User=nobody` and `NoNewPrivileges=yes` apply least privilege.

## Socket activation: Ubuntu's SSH

On Ubuntu 22.10 and later, OpenSSH is **socket-activated**: systemd listens on port 22 with `ssh.socket` and starts `ssh.service` when the first connection arrives.

```bash
systemctl status ssh.socket ssh.service --no-pager | grep -E '●|Active|Listen'
```

Consequences you must know:

- `ssh.service` may show `inactive` until someone connects; that is normal.
- The listening port comes from `ssh.socket`. Ubuntu generates it from `Port`/`ListenAddress` in `sshd_config` when you run `sudo systemctl daemon-reload`, followed by `sudo systemctl restart ssh.socket`.
- On RHEL, `sshd.service` listens directly; the service is called `sshd`.

## Guided lab

1. `systemctl status nginx`: identify Loaded, Active and Main PID.
2. Stop nginx, check `curl -I localhost` fails, start it again. Then `disable` it, reboot, and confirm it did not start; `enable --now` it again.
3. Break the configuration on purpose: `echo "oops" | sudo tee -a /etc/nginx/nginx.conf`, run `sudo nginx -t`, read the error, and remove the line **before** restarting.
4. Add a `Restart=on-failure` drop-in with `systemctl edit` and confirm it with `systemctl cat`. Kill nginx's master with `sudo kill -9 <PID>` and watch systemd restart it after 5 seconds.
5. Create, enable and test `loadlogger.service`. Then `systemctl stop` and `disable` it.
6. Check `ssh.socket` and `ssh.service` and explain their states.

## Independent exercises

1. List all enabled services with `systemctl list-unit-files --type=service --state=enabled` and pick three you can explain.
2. Explain the difference between `restart` and `reload`, and between `disable` and `mask`.
3. Change `loadlogger` to run every 30 seconds through an `Environment=INTERVAL=30` line and a script that reads `$INTERVAL`.
