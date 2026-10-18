---
id: linux-fundamentals.m11.l2
title: Hardening SSH
summary: Make SSH key-only, keep root out, restrict who may log in, and add rate limiting, without locking yourself out.
objectives:
  - Change sshd settings safely with a drop-in file, a syntax test and a fallback session
  - Disable password authentication and root login
  - Restrict SSH to specific users or groups
  - Protect SSH from brute force with rate limiting and fail2ban
estimatedMinutes: 50
topics: [linux.m11]
resources:
  - { title: "Ubuntu Server: OpenSSH server", url: "https://documentation.ubuntu.com/server/how-to/security/openssh-server/", free: true, official: true }
  - { title: "man 5 sshd_config", url: "https://man.openbsd.org/sshd_config", free: true, official: true }
  - { title: "fail2ban documentation", url: "https://github.com/fail2ban/fail2ban/wiki", free: true, official: true }
---

## Before you start

You are about to change how you log in to the server, over the very connection you are using. Follow this safety routine every time:

1. **Snapshot** the VM (at work: confirm console or out-of-band access exists).
2. Confirm **key login works** for your account (Module 0) and that your account is in `sudo`.
3. Keep **a second SSH session open** while testing; do not close it until a new login works.
4. **Test the configuration** before applying it: `sudo sshd -t`.

## Use a drop-in file

Ubuntu's `/etc/ssh/sshd_config` includes `/etc/ssh/sshd_config.d/*.conf` near the top, and for most settings **the first value found wins**. Put your settings in a file that sorts early, so they take effect and survive package updates:

```bash
sudoedit /etc/ssh/sshd_config.d/10-hardening.conf
```

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowGroups sshusers
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
```

| Setting | Effect |
|---|---|
| `PermitRootLogin no` | root cannot log in over SSH (admins use sudo) |
| `PasswordAuthentication no`, `KbdInteractiveAuthentication no` | **keys only**: password guessing becomes useless |
| `AllowGroups sshusers` | only members of `sshusers` may log in over SSH |
| `MaxAuthTries 3` | fewer attempts per connection |
| `LoginGraceTime 30` | 30 seconds to authenticate |
| `X11Forwarding no` | no graphical forwarding on a server |

Cloud images often contain `50-cloud-init.conf` setting `PasswordAuthentication yes`; `10-hardening.conf` sorts first, so it wins. Check the **effective** configuration rather than trusting the files:

```bash
sudo groupadd sshusers
sudo usermod -aG sshusers student
sudo sshd -t && echo "config OK"
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|allowgroups|maxauthtries'
sudo systemctl restart ssh
```

```text
config OK
permitrootlogin no
passwordauthentication no
maxauthtries 3
allowgroups sshusers
```

(`ssh` is the service name on Ubuntu; it is `sshd` on RHEL. Settings take effect for **new** connections; your open session continues.)

## Test from outside

From your laptop, in a **new** terminal:

```bash
ssh lab01                                                         # works with your key
ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password lab01   # must be refused
ssh farid@lab01                                                   # refused: not in sshusers
```

```text
student@192.168.56.10: Permission denied (publickey).
```

Only after these tests succeed do you close the old session.

## Changing the port?

Moving SSH to another port reduces log noise from automated scans but adds no real security against a targeted attacker, and it complicates firewalls and tools. If policy requires it, remember Ubuntu's socket activation (Module 7: `daemon-reload` then `restart ssh.socket`), update the firewall **first**, and on RHEL also update SELinux (`semanage port -a -t ssh_port_t -p tcp 2222`).

## Rate limiting and fail2ban

- `sudo ufw limit 22/tcp` (Module 9) slows repeated connections.
- **fail2ban** reads authentication logs and temporarily bans addresses with too many failures:

```bash
sudo apt install fail2ban
sudoedit /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
ignoreip = 127.0.0.1/8 192.168.56.1
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

`ignoreip` keeps your own management address from being banned. With key-only authentication, fail2ban mostly reduces noise; it remains useful where passwords must stay enabled.

## Guided lab

1. Snapshot, check key login, open a second session.
2. Create `sshusers`, add yourself, write `10-hardening.conf`, test with `sshd -t` and inspect with `sshd -T`.
3. Restart SSH and run the three tests from your laptop. Record each result.
4. Look at `journalctl -u ssh -n 20` for the refused attempts.
5. Install fail2ban with the jail above, trigger a ban from a second VM or by temporarily removing your laptop's address from `ignoreip` and failing logins, then unban with `sudo fail2ban-client set sshd unbanip <IP>`.

## Independent exercises

1. Explain why the first value wins in `sshd_config`, and what that means for a setting placed at the end of the main file.
2. A colleague lost their laptop with their private key on it. List the steps to remove their access.
3. Compare `AllowUsers` and `AllowGroups`: which scales better in an office of 50 people, and why?
