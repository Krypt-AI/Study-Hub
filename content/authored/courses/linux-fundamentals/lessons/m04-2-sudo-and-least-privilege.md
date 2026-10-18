---
id: linux-fundamentals.m04.l2
title: sudo and least privilege
summary: Grant administrative rights deliberately with sudo, check what you are allowed, and follow the principle of least privilege.
objectives:
  - Explain the principle of least privilege
  - Use `sudo`, `sudo -i`, `sudo -u` and `su -` and know when each fits
  - Grant full or limited sudo rights with groups and `/etc/sudoers.d` files edited by `visudo`
  - Find sudo activity in the logs
estimatedMinutes: 45
topics: [linux.m04]
resources:
  - { title: "Ubuntu Server: sudo", url: "https://documentation.ubuntu.com/server/how-to/security/user-management/#where-is-root", free: true, official: true }
  - { title: "sudo manual (sudoers)", url: "https://www.sudo.ws/docs/man/sudoers.man/", free: true, official: true }
  - { title: "sudo-rs project", url: "https://github.com/trifectatechfoundation/sudo-rs", free: true, official: true }
---

## Least privilege

**Least privilege** means every person and program gets only the access it needs, for only as long as it needs it. A web server does not need to read users' mail; a helpdesk technician who restarts a service does not need to edit firewall rules. When something is compromised or a mistake is made, least privilege limits the damage.

On Linux that means: ordinary accounts for daily work, root rights granted through `sudo` for specific commands, and service accounts that cannot log in.

## Using sudo

```bash
sudo apt update             # one command as root
sudo -u www-data whoami     # one command as another user
sudo -l                     # what am I allowed to run?
sudo -i                     # a root login shell (use sparingly; exit when done)
```

```text
www-data
Matching Defaults entries for student on lab01:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User student may run the following commands on lab01:
    (ALL : ALL) ALL
```

`sudo` asks for **your** password and remembers it for a few minutes (15 by default). On Ubuntu 26.04 `sudo` is **sudo-rs**, a memory-safe rewrite: the commands and the sudoers format taught here are the same, and it shows `*` as you type the password.

`su - username` switches to another account using **that** account's password. On Ubuntu, root has no password, so `su -` fails by design; use `sudo -i` instead.

## Who may use sudo

| Distribution | Group with full sudo rights |
|---|---|
| Ubuntu, Debian | `sudo` |
| RHEL, Rocky, AlmaLinux, Fedora | `wheel` |

```bash
sudo usermod -aG sudo aina      # Ubuntu
sudo usermod -aG wheel aina     # RHEL family
```

## Limited rights with sudoers rules

Rules live in `/etc/sudoers` and, better, in separate files under `/etc/sudoers.d/`. **Always edit them with `visudo`**, which checks the syntax before saving: a broken sudoers file can stop everyone from using sudo.

```bash
sudo visudo -f /etc/sudoers.d/helpdesk
```

```text
# Helpdesk may restart and check nginx, nothing else
%helpdesk ALL=(root) /usr/bin/systemctl restart nginx, /usr/bin/systemctl status nginx
```

The format is `who  where=(as whom)  which commands`. `%helpdesk` means the group; use **full paths** for commands (`command -v systemctl` shows it). Then:

```bash
sudo groupadd helpdesk
sudo usermod -aG helpdesk farid
sudo -l -U farid
```

```text
User farid may run the following commands on lab01:
    (root) /usr/bin/systemctl restart nginx, /usr/bin/systemctl status nginx
```

Be careful what you allow. Granting an editor (`/usr/bin/nano`), a pager (`less`), a shell, or `/usr/bin/systemctl *` effectively grants full root, because those programs can start a shell or edit any file. Allow specific commands with specific arguments.

Avoid `NOPASSWD:` for people; reserve it for narrowly scoped automation accounts.

## Auditing sudo

Every sudo use is logged:

```bash
sudo grep sudo /var/log/auth.log | tail -3
journalctl _COMM=sudo --since today
```

```text
2026-10-18T10:41:12.381+08:00 lab01 sudo: student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/usr/bin/apt update
```

This is why shared root passwords are a bad idea: with sudo, each action is tied to a person.

## Guided lab

1. Run `sudo -l` to see your own rights.
2. Run `sudo -u www-data whoami` and `sudo -u www-data ls /home/student`. Explain the second result.
3. Create group `helpdesk`, add `farid`, and write `/etc/sudoers.d/helpdesk` with `visudo -f` allowing only `systemctl status ssh` and `systemctl restart ssh`.
4. Log in as farid (`su - farid`) and test: `sudo systemctl status ssh` works, `sudo apt update` is refused.
5. As student, find farid's attempts in `journalctl _COMM=sudo`.
6. Deliberately type an error in a test sudoers file with `visudo` and see it refuse to save (choose `e` to edit again or `x` to discard).

## Independent exercises

1. Explain why `farid ALL=(root) /usr/bin/less /var/log/*` is dangerous. (Hint: what does `!` do inside `less`?)
2. Write a sudoers rule letting group `webadmins` reload nginx and test its configuration (`nginx -t`), and nothing else.
3. Summarise in your lab log: when would you use `sudo`, `sudo -i`, `sudo -u` and `su -`?
