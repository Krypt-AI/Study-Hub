---
id: linux-fundamentals.m04.l4
title: Special bits and ACLs
summary: Build shared directories with setgid and the sticky bit, recognise setuid, and grant individual access with ACLs.
objectives:
  - Explain setuid, setgid and the sticky bit and recognise them in `ls -l`
  - Build a collaborative group directory with setgid
  - Read, set and remove ACL entries with `getfacl` and `setfacl`, including default ACLs
estimatedMinutes: 50
topics: [linux.m04]
resources:
  - { title: "man 5 acl", url: "https://manpages.ubuntu.com/manpages/noble/man5/acl.5.html", free: true, official: true }
  - { title: "man 1 setfacl", url: "https://manpages.ubuntu.com/manpages/noble/man1/setfacl.1.html", free: true, official: true }
  - { title: "RHEL: Managing file system permissions", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/configuring_basic_system_settings/managing-file-system-permissions", free: true, official: true }
---

## The three special bits

| Bit | Octal | On a file | On a directory | Shown as |
|---|---|---|---|---|
| **setuid** | `4000` | runs with the **owner's** privileges | (no effect on Linux) | `s` in the owner's `x` place |
| **setgid** | `2000` | runs with the **group's** privileges | new files **inherit the directory's group** | `s` in the group's `x` place |
| **sticky** | `1000` | (no effect) | only a file's owner (or root) can delete or rename it | `t` in the others' `x` place |

```bash
ls -l /usr/bin/passwd
ls -ld /tmp
```

```text
-rwsr-xr-x 1 root root 64152 Apr  5  2026 /usr/bin/passwd
drwxrwxrwt 18 root root 4096 Oct 18 10:31 /tmp
```

- `passwd` is **setuid root**: an ordinary user runs it, and it can still write `/etc/shadow`. Setuid programs are a security risk if they have bugs, so administrators audit them: `sudo find / -perm -4000 -type f 2>/dev/null`.
- `/tmp` is world-writable **with the sticky bit**, so users cannot delete each other's files.

A capital `S` or `T` means the special bit is set but the matching `x` is not, which is usually a mistake.

## A shared team directory

The accounts team needs a folder where everyone in `accounts` can create and edit files, files stay in the `accounts` group, and nobody else can look in.

```bash
sudo mkdir -p /srv/kira/shared
sudo chgrp accounts /srv/kira/shared
sudo chmod 2770 /srv/kira/shared
ls -ld /srv/kira/shared
```

```text
drwxrws--- 2 root accounts 4096 Oct 18 10:40 /srv/kira/shared
```

- `2` (setgid): files created inside get group `accounts`, not the creator's private group.
- `770`: owner and group full access, others nothing.
- With a umask of `002` (Ubuntu's default for users), new files are group-writable (`664`), so colleagues can edit them.
- Add the sticky bit (`3770`) if team members should not delete each other's files.

## Access control lists (ACLs)

Owner, group and others are not always enough. **ACLs** add permissions for **specific** users and groups. Ubuntu's ext4 and RHEL's XFS support them by default; install the tools on Ubuntu with `sudo apt install acl` if `setfacl` is missing.

The auditor `farid` must **read** the accounts share without joining the group:

```bash
sudo setfacl -m u:farid:rx /srv/kira/shared
sudo setfacl -m d:u:farid:rx /srv/kira/shared
getfacl /srv/kira/shared
```

```text
# file: srv/kira/shared
# owner: root
# group: accounts
# flags: -s-
user::rwx
user:farid:r-x
group::rwx
mask::rwx
other::---
default:user::rwx
default:user:farid:r-x
default:group::rwx
default:mask::rwx
default:other::---
```

- `-m` modifies (adds) an entry; `u:` user, `g:` group.
- `d:` sets a **default** ACL on a directory: new files and subdirectories created inside inherit it. The first command covers the directory; existing files need `setfacl -R -m u:farid:rX /srv/kira/shared`.
- The **mask** is the maximum permission any named user or group (and the owning group) can have; `chmod g=` on a file with an ACL changes the mask.
- `ls -l` shows a `+` after the mode when a file has an ACL: `drwxrws---+`.
- Remove one entry with `setfacl -x u:farid DIR`, or all with `setfacl -b DIR`.

Copying with `cp` drops ACLs unless you use `cp -a`; `tar` needs `--acls`. Remember this in Module 12.

## Choosing the right tool

| Need | Use |
|---|---|
| a team shares files | group + setgid directory (`2770`) |
| everyone may write, nobody may delete others' files | sticky bit (`1777`, like `/tmp`) |
| one extra person or group needs access | ACL |
| a program must do one privileged thing | sudo rule (not setuid on your own scripts; Linux ignores setuid on scripts anyway) |

## Guided lab

1. Find setuid programs: `sudo find /usr/bin -perm -4000 -type f`. Pick two and explain why they need it.
2. Build `/srv/kira/shared` as above. As aina, create `budget.txt`; check that its group is `accounts`.
3. Remove the setgid bit (`chmod g-s`), create another file as aina, and compare its group.
4. Give farid read access with an ACL and a default ACL. As farid, read `budget.txt`; try to change it (fails).
5. Create a new file as aina and check with `getfacl` that farid's default entry was inherited.
6. Remove farid's ACL entries with `setfacl -x` and `setfacl -x d:u:farid`.

## Independent exercises

1. Set up `/srv/dropbox` where everyone can create files but only the owner can delete them. Give the command and prove it works with two users.
2. Explain the `mask::r-x` line in a `getfacl` output where farid was given `rwx`. What can farid actually do?
3. List every file under `/srv` with an ACL: `getfacl -R -s -p /srv | grep '# file'`.
