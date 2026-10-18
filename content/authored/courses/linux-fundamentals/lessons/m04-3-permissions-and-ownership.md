---
id: linux-fundamentals.m04.l3
title: Permissions and ownership
summary: Read and set read, write and execute permissions for owner, group and others, change ownership, and control defaults with umask.
objectives:
  - Read a permission string and explain what each bit allows on files and on directories
  - Set permissions with `chmod` in symbolic and octal form
  - Change owners and groups with `chown` and `chgrp`
  - Explain and set `umask`
estimatedMinutes: 60
topics: [linux.m04]
resources:
  - { title: "GNU Coreutils: File permissions", url: "https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html", free: true, official: true }
  - { title: "GNU Coreutils: chmod invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html", free: true, official: true }
  - { title: "GNU Coreutils: chown invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/chown-invocation.html", free: true, official: true }
---

## Owner, group, others

Every file has an **owner** (user), a **group**, and three sets of permissions:

```text
-rwxr-x---  1  aina  accounts  2048  Oct 18 10:00  report.sh
 └┬┘└┬┘└┬┘
  │  │  └── others (everyone else): ---  nothing
  │  └───── group (accounts):       r-x  read, execute
  └──────── owner (aina):           rwx  read, write, execute
```

Linux checks the **first** set that applies: if you are the owner, only the owner bits count (even if the group bits are more generous); else if you are in the group, the group bits; else the others bits. Root bypasses these checks.

## What r, w and x mean

| | On a **file** | On a **directory** |
|---|---|---|
| `r` read | read the contents | list the names in it (`ls`) |
| `w` write | change the contents | create, delete and rename entries in it |
| `x` execute | run it as a program | enter it (`cd`) and reach files inside |

Two consequences surprise people:

- Deleting a file depends on **write permission on the directory**, not on the file.
- To read `/srv/data/report.txt`, you need `x` on `/srv` and `/srv/data` as well as `r` on the file.

## `chmod`: changing permissions

### Symbolic form

`who` (`u` owner, `g` group, `o` others, `a` all) + operator (`+`, `-`, `=`) + permissions:

```bash
chmod u+x script.sh          # owner may execute
chmod g-w report.txt         # group may no longer write
chmod o= secret.txt          # others get nothing
chmod u=rw,g=r,o= notes.txt  # set exactly
chmod -R g+rX /srv/shared    # recursively; X = execute only on directories (and already-executable files)
```

### Octal form

Each set is a digit: **r = 4, w = 2, x = 1**, added together.

| Octal | Permissions | Typical use |
|---|---|---|
| `644` | `rw-r--r--` | ordinary files: owner writes, everyone reads |
| `600` | `rw-------` | private files: SSH private keys, credentials |
| `640` | `rw-r-----` | files a group must read, such as logs |
| `755` | `rwxr-xr-x` | programs, scripts and directories everyone can enter |
| `750` | `rwxr-x---` | a directory for owner and group only |
| `700` | `rwx------` | private directories such as `~/.ssh` |
| `777` | `rwxrwxrwx` | **almost never correct**: anyone can change or replace the file |

```bash
chmod 640 /srv/kira/payroll.csv
stat -c '%A %a %U %G %n' /srv/kira/payroll.csv
```

```text
-rw-r----- 640 aina accounts /srv/kira/payroll.csv
```

`stat -c` prints the permission string, its octal value, owner, group and name: handy evidence for tickets.

"Fixing" a permission error with `chmod 777` creates a security hole. Find out **who** needs **which** access, and grant exactly that.

## `chown` and `chgrp`: changing ownership

Only root can give a file to another user.

```bash
sudo chown aina report.txt              # owner
sudo chown aina:accounts report.txt     # owner and group
sudo chgrp accounts report.txt          # group only
sudo chown -R www-data:www-data /var/www/kira
```

## umask: the default permissions

New files start from `666` (no execute) and directories from `777`; the **umask** removes bits. With Ubuntu's default umask `002` for users with private groups (`022` for root and system accounts):

| umask | new file | new directory |
|---|---|---|
| `022` | `644` | `755` |
| `002` | `664` | `775` |
| `027` | `640` | `750` |
| `077` | `600` | `700` |

```bash
umask
umask 027
touch test.txt; mkdir testdir; ls -ld test.txt testdir
```

```text
0002
-rw-r----- 1 student student    0 Oct 18 10:20 test.txt
drwxr-x--- 2 student student 4096 Oct 18 10:20 testdir
```

`umask` set at the prompt lasts for the session; put it in `~/.bashrc` (or system-wide in `/etc/login.defs` and PAM settings) to keep it.

## Diagnosing "Permission denied"

1. Who am I? `id`.
2. What are the file's owner, group and mode? `ls -l file` or `stat`.
3. What about **every directory on the path**? `namei -l /srv/kira/payroll.csv` shows them all at once.
4. Which set applies to me (owner, group, others), and does it include the bit I need?
5. Grant the minimum: usually a group membership or a group permission, not `o+` and never `777`.

```bash
namei -l /srv/kira/payroll.csv
```

```text
f: /srv/kira/payroll.csv
drwxr-xr-x root root     /
drwxr-xr-x root root     srv
drwxr-x--- root accounts kira
-rw-r----- aina accounts payroll.csv
```

## Guided lab

1. As student, create `~/perm-lab/` with a file `notes.txt`. Show its mode with `stat -c '%A %a'`.
2. Set `notes.txt` to `600`, then `640`, then `u=rw,g=r,o=` and check each with `ls -l`.
3. Create `/srv/kira` with sudo, give it group `accounts` (from Lesson 1) and mode `770`. (Lesson 4 adds the setgid bit that makes shared folders work properly.)
4. As aina (`su - aina`), create a file in `/srv/kira`. As student (not in `accounts`), try to `ls /srv/kira`. Explain the result with `namei -l`.
5. Change umask to `027` in a session and create a file and a directory. Compare their modes with your predictions.
6. Write a script `~/bin/hello.sh`, remove its execute bit, and run it: read the error, then restore it with `chmod u+x`.

## Independent exercises

1. Convert to octal: `rwxr-x---`, `rw-rw-r--`, `r--------`. Convert to symbols: `751`, `664`, `400`.
2. A user can read `/srv/web/index.html` (mode 644) but gets "Permission denied". Name two possible causes and the commands that would reveal them.
3. Why is `chmod -R 755 /srv/kira` a poor way to share a directory of documents? Propose a better command.
