---
id: linux-fundamentals.m04.l1
title: Users and groups
summary: How Linux stores accounts and groups, and how to create, change, lock and remove them.
objectives:
  - Read `/etc/passwd`, `/etc/shadow` and `/etc/group`
  - Tell system accounts from human accounts by UID
  - Create, modify, lock and delete users with `useradd`/`adduser`, `usermod`, `passwd` and `userdel`
  - Manage groups and supplementary memberships
estimatedMinutes: 55
topics: [linux.m04]
resources:
  - { title: "Ubuntu Server: User management", url: "https://documentation.ubuntu.com/server/how-to/security/user-management/", free: true, official: true }
  - { title: "man 5 passwd", url: "https://manpages.ubuntu.com/manpages/noble/man5/passwd.5.html", free: true, official: true }
  - { title: "man 8 useradd", url: "https://manpages.ubuntu.com/manpages/noble/man8/useradd.8.html", free: true, official: true }
  - { title: "RHEL 10: Managing users and groups", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/configuring_basic_system_settings/managing-users-and-groups", free: true, official: true }
---

## Who is a user?

Every process runs as a **user**, and every file has an owning user and group. Linux identifies them by number: the **UID** (user ID) and **GID** (group ID). Names are only labels.

| UID range (Ubuntu and RHEL) | Who |
|---|---|
| 0 | `root`, the superuser: permission checks do not apply |
| 1–999 | **system accounts** for services (`www-data`, `sshd`, `systemd-network`); no login |
| 1000+ | **human accounts** |

```bash
id
id www-data
```

```text
uid=1000(student) gid=1000(student) groups=1000(student),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),101(lxd)
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

Each user has one **primary group** (normally a private group with the same name) and any number of **supplementary groups**, which grant extra access: `sudo` lets the user run commands as root on Ubuntu, `adm` lets them read many logs.

## The account files

### `/etc/passwd` (readable by everyone)

```text
student:x:1000:1000:Student,,,:/home/student:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
```

`name : x : UID : GID : comment : home : shell`. The `x` means the password hash is in `/etc/shadow`. A shell of `/usr/sbin/nologin` (or `/bin/false`) prevents interactive logins.

### `/etc/shadow` (root only)

```bash
sudo grep student /etc/shadow
```

```text
student:$y$j9T$Vb3...$Qe8...:20378:0:99999:7:::
```

Fields: name, **password hash** (`$y$` is yescrypt), date of last change (days since 1 Jan 1970), minimum and maximum days between changes, warning period. A hash starting with `!` means the account is **locked**; `*` means no password was ever set.

### `/etc/group`

```text
sudo:x:27:student
developers:x:1001:aina,farid
```

`group : x : GID : members` (the supplementary members; primary members are not listed here).

Never edit these files with a normal editor while the system is in use; use the commands below, or `vipw` and `vigr`, which lock the files.

## Creating users

Ubuntu offers two commands:

- `adduser` (Debian's friendly tool): asks questions, creates the home directory, copies `/etc/skel`, sets the password.
- `useradd` (the low-level tool, the same on every distribution): does only what you ask.

```bash
sudo adduser aina
```

```bash
sudo useradd -m -s /bin/bash -c "Farid, Accounts" farid
sudo passwd farid
```

| `useradd` option | Meaning |
|---|---|
| `-m` | create the home directory (copying `/etc/skel`) |
| `-s /bin/bash` | login shell |
| `-c "text"` | comment (full name, department) |
| `-G group1,group2` | supplementary groups |
| `-u 1500` | a specific UID |
| `-e 2026-12-31` | account expires on this date |

On RHEL, `useradd` creates the home directory by default, and `adduser` is a link to `useradd`. Write scripts with `useradd -m` so they work everywhere.

## Changing and removing users

| Task | Command |
|---|---|
| add to a supplementary group | `sudo usermod -aG developers aina` |
| change shell | `sudo usermod -s /usr/sbin/nologin farid` |
| lock / unlock password login | `sudo usermod -L farid` / `sudo usermod -U farid` (or `passwd -l` / `-u`) |
| expire the account now | `sudo usermod -e 1 farid` (or `chage -E 0`) |
| force a password change at next login | `sudo passwd -e aina` (or `chage -d 0`) |
| delete user (keep files) | `sudo userdel farid` |
| delete user and home directory | `sudo userdel -r farid` |

**`-aG`, never `-G` alone.** `usermod -G developers aina` **replaces** all of aina's supplementary groups with just `developers`; `-a` appends. Removing someone from `sudo` this way is a common accident.

Group membership changes apply at the user's **next login**; `id aina` shows the stored groups, while an existing session keeps its old ones (`newgrp` or logging out and in again fixes that).

When someone leaves an organisation, the usual first step is to **lock or expire** the account and keep the files for review, not delete everything at once.

## Groups

```bash
sudo groupadd developers
sudo usermod -aG developers aina
sudo gpasswd -d aina developers     # remove aina from the group
getent group developers
groups aina
```

`getent` reads accounts from every configured source (local files, and directory services such as LDAP or Active Directory at work), so prefer it to `grep /etc/group` in scripts.

## Guided lab

1. Run `id` and identify your primary group and the group that gives you `sudo`.
2. Create `aina` with `adduser` and `farid` with `useradd -m -s /bin/bash`; set farid's password.
3. Compare their lines in `/etc/passwd` and `sudo grep -E 'aina|farid' /etc/shadow`.
4. Create group `accounts` and add both users with `usermod -aG`. Check with `getent group accounts`.
5. Lock farid's account, check the `!` in `/etc/shadow`, try `su - farid` (it fails), then unlock it.
6. Run `sudo chage -l aina` and read the password-ageing settings.

## Independent exercises

1. Create a temporary contractor account `contractor1` that expires at the end of next month and has no supplementary groups. Show the expiry with `chage -l`.
2. Demonstrate the `-G` mistake on a test user: give them two groups, then run `usermod -G` with one group and show what was lost.
3. List all human accounts (UID ≥ 1000, excluding `nobody`) with one `awk` command.
