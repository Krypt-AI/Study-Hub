---
id: linux-fundamentals.m09.l3
title: Ports, sockets and remote administration with SSH
summary: See which services listen on which ports, and use SSH beyond logging in, to copy files, run remote commands and tunnel.
objectives:
  - Explain ports, TCP and UDP, and listening versus established sockets
  - List listening services with `ss` and interpret the local address
  - Copy files with `scp`, `sftp` and `rsync` over SSH
  - Run remote commands and use an SSH tunnel and a jump host
estimatedMinutes: 50
topics: [linux.m09]
resources:
  - { title: "man 8 ss", url: "https://manpages.ubuntu.com/manpages/noble/man8/ss.8.html", free: true, official: true }
  - { title: "OpenSSH manual pages (ssh, scp, sftp, ssh_config)", url: "https://www.openssh.com/manual.html", free: true, official: true }
  - { title: "IANA service name and port number registry", url: "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml", free: true, official: true }
---

## Ports

An IP address finds a **host**; a **port** (0–65535) finds a **service** on it. A connection is identified by both ends' address and port.

| Port | Protocol | Service |
|---|---|---|
| 22 | TCP | SSH |
| 25, 587 | TCP | SMTP (mail) |
| 53 | UDP and TCP | DNS |
| 80 / 443 | TCP (443 also UDP for HTTP/3) | HTTP / HTTPS |
| 123 | UDP | NTP (time) |
| 3306 / 5432 | TCP | MySQL / PostgreSQL |
| 3389 | TCP | RDP (Windows remote desktop) |

`/etc/services` lists the names. Ports below 1024 need privileges to listen on (Module 7's practical).

- **TCP** is connection-based and reliable: web, SSH, databases.
- **UDP** sends independent datagrams: DNS, time, streaming, VPNs.

## What is listening? `ss`

```bash
sudo ss -tulpn
```

```text
Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
udp   UNCONN 0      0         127.0.0.54:53         0.0.0.0:*     users:(("systemd-resolve",pid=612,fd=16))
udp   UNCONN 0      0      127.0.0.53%lo:53         0.0.0.0:*     users:(("systemd-resolve",pid=612,fd=14))
tcp   LISTEN 0      511          0.0.0.0:80         0.0.0.0:*     users:(("nginx",pid=881,fd=6),("nginx",pid=880,fd=6))
tcp   LISTEN 0      4096         0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=1021,fd=3),("systemd",pid=1,fd=104))
tcp   LISTEN 0      5            0.0.0.0:8080       0.0.0.0:*     users:(("python3",pid=1340,fd=3))
tcp   LISTEN 0      511             [::]:80            [::]:*     users:(("nginx",pid=881,fd=7),("nginx",pid=880,fd=7))
```

`-t` TCP, `-u` UDP, `-l` listening, `-p` process (needs sudo), `-n` numbers instead of names. The **local address** says who can connect:

| Local address | Reachable from |
|---|---|
| `127.0.0.1:PORT` or `[::1]:PORT` | this machine only |
| `0.0.0.0:PORT` or `[::]:PORT` | every interface: the whole network (unless a firewall blocks it) |
| `192.168.56.10:PORT` | that interface only |

A database that only local applications use should listen on `127.0.0.1`. `ss -tn` (without `-l`) shows **established** connections, for example who is connected over SSH.

## SSH for administration

### Remote commands

```bash
ssh lab01 'uptime; df -h /'
ssh lab01 sudo systemctl status nginx --no-pager
```

### Copying files

```bash
scp report.txt lab01:/tmp/
scp lab01:/var/log/nginx/access.log .
scp -r ./site lab01:~/
sftp lab01
rsync -avz ./site/ lab01:~/site/
```

`rsync` sends only what changed and can resume; it is the tool of choice for anything larger than a few files (Module 12 uses it for backups).

### Tunnels and jump hosts

```bash
ssh -L 8080:localhost:8080 lab01
```

forwards your laptop's port 8080 to port 8080 **on lab01**: open `http://localhost:8080` in your browser to reach a service that listens only on lab01's loopback, without opening any firewall port.

At work, servers are often reachable only through a **bastion** (jump host):

```bash
ssh -J admin@bastion.example.com student@10.0.5.21
```

or in `~/.ssh/config`:

```text
Host web01
    HostName 10.0.5.21
    User student
    ProxyJump admin@bastion.example.com
```

## Guided lab

1. Run `sudo ss -tulpn` and list every listening service, its port and who can reach it.
2. Change the `kira-status` service from Module 7 to listen only on loopback (add `--bind 127.0.0.1` to its `ExecStart`), restart it, and check with `ss` and from your laptop (`curl http://192.168.56.10:8080` now fails).
3. From your laptop, reach it through a tunnel: `ssh -L 8080:localhost:8080 lab01`, then browse `http://localhost:8080`.
4. Copy `/etc/os-release` from lab01 to your laptop with `scp`, and a folder to lab01 with `rsync -av`; run the rsync again and notice that nothing is transferred the second time.
5. While connected, run `ss -tn` on lab01 and find your own SSH connection (laptop address and port).

## Independent exercises

1. For each listening service on lab01, decide whether it should be reachable from the network, and why.
2. Explain the difference between `0.0.0.0:5432` and `127.0.0.1:5432` to a developer who wants to connect from their laptop.
3. Write an `~/.ssh/config` block for a server reachable only through a bastion, with a non-standard port 2222.
