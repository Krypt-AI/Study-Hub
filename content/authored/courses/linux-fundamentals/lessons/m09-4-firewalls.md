---
id: linux-fundamentals.m09.l4
title: Firewall fundamentals
summary: Control which traffic reaches your server with ufw on Ubuntu and firewalld on RHEL, without locking yourself out.
objectives:
  - Explain default-deny for incoming traffic and why services should be exposed deliberately
  - "Configure ufw: defaults, allow rules by port, service and source, status, deletion"
  - Translate the same policy to firewalld with `firewall-cmd`
  - Distinguish host firewalls from cloud security groups
estimatedMinutes: 50
topics: [linux.m09]
resources:
  - { title: "Ubuntu Server: Firewall (ufw)", url: "https://documentation.ubuntu.com/server/how-to/security/firewalls/", free: true, official: true }
  - { title: "man 8 ufw", url: "https://manpages.ubuntu.com/manpages/noble/man8/ufw.8.html", free: true, official: true }
  - { title: "firewalld documentation", url: "https://firewalld.org/documentation/", free: true, official: true }
  - { title: "nftables wiki", url: "https://wiki.nftables.org/", free: true, official: true }
---

## What a host firewall does

The kernel's packet filter (**nftables**; older systems used iptables) decides, packet by packet, whether traffic is allowed. Tools make it manageable:

| Distribution | Front end |
|---|---|
| Ubuntu | **ufw** (Uncomplicated Firewall), inactive after installation |
| RHEL family | **firewalld** (`firewall-cmd`), active after installation |

A sensible server policy:

- **Deny incoming** by default, **allow outgoing**.
- Allow only the services this server exists to provide, from the sources that need them.
- Keep management access (SSH) restricted, ideally to an admin network or a VPN.

A firewall complements, but does not replace, binding services to the right address (previous lesson) and keeping them patched.

## ufw on Ubuntu

**Allow SSH before enabling**, or you will cut off your own session.

```bash
sudo ufw status verbose
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status numbered
```

```text
Status: inactive
Default incoming policy changed to 'deny'
(be sure to update your rules accordingly)
Default outgoing policy changed to 'allow'
(be sure to update your rules accordingly)
Rules updated
Rules updated
Rules updated (v6)
Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
Firewall is active and enabled on system startup
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    192.168.56.0/24
[ 2] 80/tcp                     ALLOW IN    Anywhere
[ 3] 80/tcp (v6)                ALLOW IN    Anywhere (v6)
```

| Command | Effect |
|---|---|
| `ufw allow 443/tcp` | allow a port |
| `ufw allow "Nginx Full"` | allow an application profile (`ufw app list`) |
| `ufw allow from 10.0.0.5` | allow everything from one host |
| `ufw deny 8080/tcp` | explicitly deny |
| `ufw limit 22/tcp` | allow but rate-limit (6 connections in 30 s per source) |
| `ufw delete 2` | delete rule number 2 (from `status numbered`) |
| `ufw logging on` | log blocked packets (`journalctl -k -g UFW`) |
| `ufw disable` / `ufw reset` | turn off / remove all rules |

Rules are evaluated **in order**; the first match wins. `ufw insert 1 ...` adds a rule at the top.

## firewalld on RHEL

firewalld groups rules into **zones**; interfaces belong to a zone (usually `public`). Changes are **runtime only** unless you add `--permanent` and reload.

```bash
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --remove-service=cockpit
sudo firewall-cmd --reload
sudo firewall-cmd --list-services
```

| ufw | firewalld |
|---|---|
| `ufw allow 80/tcp` | `firewall-cmd --permanent --add-port=80/tcp` (or `--add-service=http`) |
| `ufw status` | `firewall-cmd --list-all` |
| `ufw delete ...` | `firewall-cmd --permanent --remove-port=...` |
| source restriction | a rich rule, or the source in a dedicated zone (`--zone=internal --add-source=192.168.56.0/24`) |

A frequent RHEL mistake: a rule added without `--permanent` works until the next reload or reboot, then disappears. RHCSA tests firewalld configuration that persists.

## Cloud security groups

In AWS, Azure and Google Cloud, a **security group** or **network firewall rule** filters traffic **before** it reaches the VM. Both layers must allow a service for it to work. When "the port is open on the server but nobody can connect", check the cloud rules too. Cloud networking itself is provider-specific and belongs to cloud certification courses; the host-level skills here apply everywhere.

## Guided lab

1. From your laptop, check that ports 22, 80 and 8080 respond (`curl`, `ssh`) before enabling the firewall.
2. Configure ufw: deny incoming, allow outgoing, SSH from `192.168.56.0/24`, HTTP from anywhere. Enable it **while keeping a second session open**.
3. Test from your laptop: SSH and HTTP work; port 8080 (if bound to all interfaces) does not.
4. Turn on logging, try port 8080 again, and find the `[UFW BLOCK]` line with `journalctl -k -g UFW -n 5`.
5. Delete the HTTP rule by number, test, then add it back with the `Nginx HTTP` application profile.
6. Write the equivalent firewalld commands in your lab log.

## Independent exercises

1. Write the ufw rules for a database server that must accept PostgreSQL (5432/tcp) only from the web server `192.168.56.20`, and SSH only from the admin network.
2. Explain why you add the SSH rule **before** `ufw enable` on a remote server.
3. A colleague added `firewall-cmd --add-service=https` on RHEL and it stopped working after a reboot. Explain and fix.
