---
id: linux-fundamentals.m02.l2
title: Creating, copying, moving and removing
summary: Manage files and directories with `mkdir`, `touch`, `cp`, `mv`, `rm` and links, safely.
objectives:
  - Create files and directory trees
  - Copy, move and rename files and directories, preserving attributes when needed
  - Remove files and directories without accidents
  - Explain hard and symbolic links and create both
  - Edit a text file with nano
estimatedMinutes: 55
topics: [linux.m02]
resources:
  - { title: "GNU Coreutils: Basic operations (cp, mv, rm)", url: "https://www.gnu.org/software/coreutils/manual/html_node/Basic-operations.html", free: true, official: true }
  - { title: "GNU Coreutils: ln invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html", free: true, official: true }
  - { title: "GNU nano documentation", url: "https://www.nano-editor.org/docs.php", free: true, official: true }
---

## Creating

```bash
mkdir projects
mkdir -p projects/web/{html,logs,backup}
touch projects/web/html/index.html
ls -R projects
```

```text
projects:
web

projects/web:
backup  html  logs

projects/web/html:
index.html
```

- `mkdir -p` creates missing parent directories and does not complain if the directory exists.
- `{html,logs,backup}` is **brace expansion**: the shell turns it into three words before `mkdir` runs.
- `touch` creates an empty file, or updates the modification time of an existing one.

## Copying with `cp`

| Command | Effect |
|---|---|
| `cp a.txt b.txt` | copy a file (overwrites `b.txt` silently if it exists) |
| `cp a.txt b.txt dir/` | copy several files into a directory |
| `cp -r src/ dest/` | copy a directory and everything in it |
| `cp -i a.txt b.txt` | ask before overwriting |
| `cp -a src/ dest/` | archive mode: recursive, keeping permissions, owners, times and links (use for backups) |
| `cp -v` | say what is being copied |

Before editing configuration, keep a copy: `sudo cp -a /etc/hosts /etc/hosts.bak`.

## Moving and renaming with `mv`

`mv` both moves and renames; there is no separate rename command for single files.

```bash
mv report.txt report-2026-10.txt      # rename
mv report-2026-10.txt archive/        # move into a directory
mv -i draft.txt final.txt             # ask before overwriting
```

## Removing with `rm` and `rmdir`

There is **no recycle bin**. Deleted files are gone, except from backups.

| Command | Effect |
|---|---|
| `rm file` | remove a file |
| `rm -i file` | ask first |
| `rmdir dir` | remove an **empty** directory |
| `rm -r dir` | remove a directory and everything below it |
| `rm -rf dir` | the same, without asking or reporting missing files: **dangerous** |

Safety habits:

1. Run `ls` with the same path first and look at what it lists.
2. Use absolute paths for anything destructive, and never put a space in the wrong place: `rm -rf / tmp/old` (with a stray space) targets `/`. GNU `rm` refuses to remove `/` itself by default (`--preserve-root`), but `rm -rf /*` would still destroy the system.
3. Avoid `sudo rm -rf` with variables in scripts unless the variable is checked (Module 3).

## Links

A file's data lives in an **inode**; names in directories point to inodes.

- A **hard link** is a second name for the same inode. Both names are equal; the data stays until the last name is removed. Hard links cannot cross filesystems or point to directories.
- A **symbolic link** (symlink) is a small file containing a path. It can point anywhere, including directories and other filesystems, and it breaks if the target is removed.

```bash
echo "hello" > original.txt
ln original.txt hard.txt
ln -s original.txt soft.txt
ls -li original.txt hard.txt soft.txt
```

```text
524301 -rw-rw-r-- 2 student student  6 Oct 18 10:05 hard.txt
524301 -rw-rw-r-- 2 student student  6 Oct 18 10:05 original.txt
524305 lrwxrwxrwx 1 student student 12 Oct 18 10:05 soft.txt -> original.txt
```

`-i` shows inode numbers: the hard link shares `524301` and the link count is now `2`. Remove `original.txt`, and `hard.txt` still works while `soft.txt` is broken (shown in red by `ls --color`).

Administrators use symlinks constantly: for example, nginx enables a site by linking `/etc/nginx/sites-enabled/example` to `/etc/nginx/sites-available/example`.

## Editing text files with nano

`nano` is installed on Ubuntu and is the easiest editor to start with:

```bash
nano projects/web/html/index.html
```

The bottom two lines list the shortcuts (`^` means Ctrl): `Ctrl+O` then Enter saves, `Ctrl+X` exits, `Ctrl+W` searches, `Ctrl+K` cuts a line, `Ctrl+U` pastes it. Use `sudo nano /etc/...` for system files. You will also meet **vim** (`vi`) on every Linux system, including RHEL minimal installs and exam environments: learn at least `i` (insert), `Esc`, `:wq` (save and quit) and `:q!` (quit without saving). Run `vimtutor` for a 30-minute guided tour.

## Guided lab

1. Build the tree: `mkdir -p ~/lab02/{docs,backup,scripts}` and check with `ls -R ~/lab02`.
2. Create `~/lab02/docs/notes.txt` with nano and type two lines.
3. Copy it to `~/lab02/backup/notes-$(date +%F).txt`. `$(date +%F)` inserts today's date (Module 3 explains `$( )`).
4. Rename `notes.txt` to `readme.txt`. Try `cp -i` onto the backup and answer `n`.
5. Create a hard link and a symlink to `readme.txt` and compare `ls -li`. Delete `readme.txt` and check both links with `cat`.
6. Remove `~/lab02/scripts` with `rmdir`. Try `rmdir ~/lab02/backup`: why does it fail?

## Independent exercises

1. Copy `/etc/ssh` to `~/ssh-copy` with `cp -r` and with `cp -a`, then compare `ls -l` of both. What differs? (Hint: owners and times; some files will fail to copy without sudo: why?)
2. Create a symlink `~/logs` pointing to `/var/log`, then `cd ~/logs` and run `pwd` and `pwd -P`.
3. Write the one command that would remove `~/lab02` entirely. Run `ls -R ~/lab02` before you run it.
