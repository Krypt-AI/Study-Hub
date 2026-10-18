---
id: linux-fundamentals.m01.l2
title: Paths and navigation
summary: Move around the filesystem with `pwd`, `cd` and `ls`, using absolute and relative paths.
objectives:
  - Tell absolute from relative paths and write both
  - Use `.`, `..`, `~` and `-` in paths
  - Navigate with `pwd` and `cd`, and list directories with `ls` and its common options
  - Recognise hidden files and file types in `ls -l` output
estimatedMinutes: 45
topics: [linux.m01]
resources:
  - { title: "GNU Coreutils: ls invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/ls-invocation.html", free: true, official: true }
  - { title: "GNU Bash manual: Bourne shell builtins (cd, pwd)", url: "https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html", free: true, official: true }
---

## One tree, starting at `/`

Linux has a single directory tree. Its top is the **root directory**, written `/`. Disks, USB drives and network shares are attached (mounted) somewhere inside this tree rather than getting letters like `C:`. Directories are separated by `/` (forward slash), never `\`.

```text
/
├── etc/
│   └── ssh/
│       └── sshd_config
├── home/
│   └── student/        ← your home directory, also called ~
│       └── notes.txt
└── var/
    └── log/
```

## Absolute and relative paths

- An **absolute path** starts with `/` and works from anywhere: `/home/student/notes.txt`.
- A **relative path** does not start with `/` and is resolved from the current directory: if you are in `/home/student`, then `notes.txt` means `/home/student/notes.txt`.

Special names:

| Name | Means |
|---|---|
| `.` | this directory |
| `..` | the parent directory |
| `~` | your home directory (`/home/student`) |
| `~aina` | aina's home directory |
| `-` (with `cd`) | the directory you were in before |

## `pwd` and `cd`

```bash
pwd
cd /var/log
pwd
cd ..
pwd
cd
pwd
cd -
```

```text
/home/student
/var/log
/var
/home/student
/var
```

`cd` with no argument returns home. `cd -` jumps back to the previous directory and prints it.

## `ls`: listing directories

| Command | Shows |
|---|---|
| `ls` | names in the current directory |
| `ls -a` | also hidden entries (names starting with `.`) |
| `ls -l` | long format: type, permissions, owner, size, date |
| `ls -lh` | sizes as `4.0K`, `12M` |
| `ls -lt` | newest first |
| `ls -ld /etc` | the directory itself, not its contents |
| `ls -R` | recursively, into subdirectories |

```bash
ls -la ~
```

```text
total 32
drwxr-x--- 4 student student 4096 Oct 18 09:30 .
drwxr-xr-x 3 root    root    4096 Oct 17 21:12 ..
-rw------- 1 student student  412 Oct 18 09:41 .bash_history
-rw-r--r-- 1 student student  220 Mar 31  2024 .bash_logout
-rw-r--r-- 1 student student 3771 Mar 31  2024 .bashrc
drwx------ 2 student student 4096 Oct 17 21:20 .cache
-rw-r--r-- 1 student student  807 Mar 31  2024 .profile
drwx------ 2 student student 4096 Oct 17 21:35 .ssh
```

Reading one long-format line:

```text
-rw-r--r-- 1 student student 3771 Mar 31  2024 .bashrc
│└──┬────┘ │ └──┬──┘ └──┬──┘ └┬─┘ └─────┬────┘ └──┬──┘
│   │      │    │       │     │        │         └ name
│   │      │    │       │     │        └ last modified
│   │      │    │       │     └ size in bytes
│   │      │    │       └ group owner
│   │      │    └ user owner
│   │      └ number of hard links
│   └ permissions (Module 4)
└ type: - file, d directory, l symbolic link
```

Hidden files are ordinary files whose names start with a dot; many are per-user settings (`.bashrc`, `.ssh`).

### Names with spaces

The shell splits words at spaces, so quote names that contain them: `cd "Lab Notes"` or `cd Lab\ Notes`. On servers, avoid spaces in names you create: use `lab-notes` or `lab_notes`.

## Guided lab

1. Run `pwd`. You should be in `/home/<your user>`.
2. `cd /etc/ssh` and `ls -l`. Find `sshd_config` and the `sshd_config.d` directory (type `d`).
3. From `/etc/ssh`, go to `/etc/apt` with a **relative** path: `cd ../apt`. Check with `pwd`.
4. Return home with `cd`, then go back with `cd -`.
5. Run `ls -la ~` and count the hidden entries.
6. Run `ls -ld /tmp` and note that its permissions end in `t` (Module 4 explains the sticky bit).

## Independent exercises

1. Write the absolute path of your `.bashrc` file, and a relative path to it from `/home`.
2. From `/var/log`, what single `cd` command takes you to `/etc/ssh` using a relative path? Check it.
3. Use `ls -lt /var/log | head` to find the most recently modified log.
4. Explain why `cd Lab Notes` fails when the directory is called `Lab Notes`.
