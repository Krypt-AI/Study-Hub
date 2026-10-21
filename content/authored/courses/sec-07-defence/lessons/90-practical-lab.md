---
id: sec-07-defence.lab
title: "Practical lab: harden and audit an Ubuntu server"
subtitle: Hands-on session with the real tools
summary: "On your Ubuntu lab VM, switch on a default-deny firewall with ufw, check and tighten the SSH configuration, audit the whole system with Lynis, and read the authentication logs, then compare against your Stage 1 baseline."
objectives:
  - Enable a default-deny host firewall and verify it
  - Inspect and tighten the SSH server configuration
  - Run a Lynis audit and turn its suggestions into a prioritised list
estimatedMinutes: 60
topics: [sec07.lab]
resources:
  - { title: "Ubuntu Server: firewall (ufw)", url: "https://documentation.ubuntu.com/server/how-to/security/firewalls/", free: true, official: true }
  - { title: "OpenSSH: sshd_config manual", url: "https://man.openbsd.org/sshd_config", free: true, official: true }
  - { title: "Lynis: get started", url: "https://cisofy.com/documentation/lynis/get-started/", free: true, official: true }
  - { title: "CIS Benchmarks (hardening guides)", url: "https://www.cisecurity.org/cis-benchmarks", free: true, official: true }
---

This session hardens a real server, your **Ubuntu lab VM**, using the tools administrators actually use. It is the practical
side of the hardening, firewall and logging lessons. Nothing is simulated.

> **Do this only on your own VM, and take a snapshot first.** A firewall or SSH change can lock you out; with a snapshot a
> mistake costs a minute, not an afternoon. Keep a **second terminal logged in** while you change firewall rules.

## Part 1: See where you start

You saved a baseline in the Stage 1 lab. Capture it again so you can compare after hardening:

```bash
ss -tulpn > before-ports.txt
sudo ufw status verbose
```

On a fresh Ubuntu the firewall is usually **inactive**:

```text
Status: inactive
```

## Part 2: A default-deny firewall with ufw

**ufw** ("uncomplicated firewall") is Ubuntu's front end for the kernel firewall. The order matters: **allow SSH first, then
enable**, or you cut off your own session.

```bash
sudo ufw default deny incoming        # block everything arriving, unless allowed below
sudo ufw default allow outgoing       # let the server's own connections out
sudo ufw allow OpenSSH                # keep SSH reachable (a named profile for port 22)
sudo ufw enable                       # turn the firewall on (answer y)
sudo ufw status verbose
```

The status now reads like this:

```text
Status: active
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere
22/tcp (OpenSSH (v6))      ALLOW IN    Anywhere (v6)
```

This is **default-deny** from the firewall lesson in four commands: nothing is reachable except what has a rule. Test it:
start a throwaway web server (`python3 -m http.server 8000`) and try to reach it from your host. It fails until you add
`sudo ufw allow 8000/tcp`. Remove the rule when you are done (`sudo ufw delete allow 8000/tcp`) and stop the server.

## Part 3: Check and tighten SSH

Ask the running SSH server for its **effective** settings (this prints lower-case keys):

```bash
sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin|pubkeyauthentication|maxauthtries'
```

```text
permitrootlogin without-password
pubkeyauthentication yes
passwordauthentication yes
maxauthtries 6
```

(Defaults vary by version, so yours may differ.) Reading it as a defender: **password authentication enabled** means anyone
who can reach port 22 can try to guess passwords. The hardening choices are **key-based login**, **no root login** and fewer
attempts. To apply them, create a small override file rather than editing the vendor's config, then test and reload:

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
EOF
sudo sshd -t && sudo systemctl reload ssh
```

> **Before disabling passwords you must have a working SSH key.** Create one on your host (`ssh-keygen -t ed25519`), install
> it with `ssh-copy-id`, and confirm key login works in a **second** terminal. `sshd -t` checks the configuration for errors
> before you reload; never reload without it.

Run the `sshd -T | grep` command again and confirm the new values.

## Part 4: Audit with Lynis

**Lynis** is an open-source security auditing tool that runs hundreds of tests against the local system and tells you what to
improve.

```bash
sudo apt install lynis
sudo lynis audit system
```

It pauses between sections (press **Enter**); add `--quick` to avoid that. Results are marked with colours and words such as
**OK**, **FOUND**, **NOT FOUND**, **WARNING** and **SUGGESTION**. Near the end it prints a **summary** with a **hardening
index**, a count of tests performed, and any **warnings** and **suggestions** it found. Two files are written (default
locations):

| File | Contents |
|---|---|
| `/var/log/lynis.log` | the detailed log of each test, **overwritten on every run** (copy it if you want history) |
| `/var/log/lynis-report.dat` | machine-readable findings, handy for comparing scans over time |

Now **triage** the suggestions like a defender:

1. Note the hardening index **before** your changes (rerun after Parts 2 and 3 to see it move, if you did Lynis first).
2. List the **warnings**: those first.
3. Pick **five suggestions**, and for each write what it protects against and whether it is worth doing on this server.
4. Apply one or two safe ones, rerun Lynis, and note the change.

Lynis points at the controls that **CIS Benchmarks** describe in full; the free benchmark for Ubuntu is the next step if you
want a complete checklist.

## Part 5: Read the logs of your own hardening

```bash
sudo journalctl -u ssh --since "30 minutes ago"
sudo grep -E 'Failed|Accepted' /var/log/auth.log | tail -10
sudo ufw status verbose
```

Try to log in once with a wrong key or from a host without access, then look again. A rejected attempt leaves a line you can
find, which is the detection side of hardening: **block, then watch**. Finally, capture `ss -tulpn > after-ports.txt` and compare
with `diff before-ports.txt after-ports.txt`.

## If something goes wrong

| Problem | Fix |
|---|---|
| You locked yourself out of SSH | use the VM console (VirtualBox window) to run `sudo ufw allow OpenSSH` or restore the snapshot |
| `sshd -t` prints an error | fix the line it names in `99-hardening.conf` before reloading |
| `systemctl reload ssh` says the unit is not found | on some systems the unit is `sshd`; use `sudo systemctl reload sshd` |
| Lynis finds nothing to read | run it with `sudo`; many tests need root |
