---
id: linux-fundamentals.m02.l3
title: Wildcards, finding files and viewing text
summary: Select files with wildcards, find them with `find`, and read them with `cat`, `less`, `head`, `tail`, `file` and `wc`.
objectives:
  - Use `*`, `?` and `[ ]` wildcards and predict what they match
  - Search by name, type, size, time and owner with `find`, and act on the results
  - Choose the right tool to view a file of any size
  - Follow a growing log with `tail -f`
estimatedMinutes: 55
topics: [linux.m02]
resources:
  - { title: "GNU findutils manual", url: "https://www.gnu.org/software/findutils/manual/html_mono/find.html", free: true, official: true }
  - { title: "GNU Bash manual: Filename expansion", url: "https://www.gnu.org/software/bash/manual/html_node/Filename-Expansion.html", free: true, official: true }
  - { title: "less documentation", url: "https://www.greenwoodsoftware.com/less/", free: true, official: true }
---

## Wildcards (globbing)

The **shell** expands wildcards into matching names before the command runs.

| Pattern | Matches | Example |
|---|---|---|
| `*` | any characters, including none | `*.log` → `syslog.log`, `a.log` |
| `?` | exactly one character | `file?.txt` → `file1.txt`, not `file10.txt` |
| `[abc]` | one of the listed characters | `report[12].pdf` |
| `[0-9]` | one character in the range | `log[0-9]` |
| `[!0-9]` | one character **not** in the range | `[!.]*` |

```bash
ls /var/log/*.log
ls /var/log/syslog*
echo /etc/*.conf | wc -w
```

Wildcards do not match hidden files (names starting with `.`) unless the pattern starts with `.`. If nothing matches, Bash passes the pattern unchanged, which is why you sometimes see errors like `ls: cannot access '*.bak'`.

**Preview before destroying**: run `ls *.tmp` (or `echo rm *.tmp`) before `rm *.tmp`.

## `find`: search the tree

`find` walks a directory tree and tests each entry: `find WHERE TESTS ACTIONS`.

```bash
find ~ -name "*.txt"
find /etc -type f -name "*.conf" | head -5
sudo find /var/log -type f -size +1M
find ~ -type f -mtime -1
sudo find /home -user aina
find /tmp -type f -name "*.tmp" -mtime +7 -delete
```

| Test | Meaning |
|---|---|
| `-name "*.log"` | name matches (quote the pattern so the shell does not expand it); `-iname` ignores case |
| `-type f` / `-type d` / `-type l` | file / directory / symlink |
| `-size +100M` / `-size -1k` | larger than 100 MiB / smaller than 1 KiB |
| `-mtime -1` / `-mtime +30` | modified within the last day / more than 30 days ago |
| `-user aina` / `-group web` | owned by |
| `-perm -o+w` | writable by others (Module 4 and Module 11) |
| `-maxdepth 1` | do not go deeper than one level |

Actions: `-print` (default), `-ls`, `-delete`, and `-exec CMD {} \;` which runs a command for each result (`{}` is replaced by the path):

```bash
find ~/lab02 -name "*.txt" -exec wc -l {} \;
```

Searching from `/` as an ordinary user prints many `Permission denied` lines; add `2>/dev/null` to hide them (Module 3) or use `sudo`.

`locate` (package `plocate`) is faster because it searches a prebuilt database, but it misses files created since the last database update (`sudo updatedb`).

## Viewing text

| Command | Use for |
|---|---|
| `cat file` | short files: prints everything |
| `less file` | long files: scroll, search with `/`, quit with `q` |
| `head -n 20 file` | the first 20 lines |
| `tail -n 50 file` | the last 50 lines |
| `tail -f file` | follow a file as it grows (stop with `Ctrl+C`) |
| `wc -l file` | count lines (`-w` words, `-c` bytes) |
| `file name` | what kind of data a file contains |

```bash
head -n 3 /etc/passwd
wc -l /etc/passwd
file /etc/passwd /usr/bin/ls /var/log/journal
```

```text
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
33 /etc/passwd
/etc/passwd:      ASCII text
/usr/bin/ls:      ELF 64-bit LSB pie executable, x86-64, dynamically linked, ...
/var/log/journal: directory
```

Never `cat` a binary file: it fills the terminal with garbage (run `reset` if that happens). Check with `file` first.

### Watching a log live

```bash
sudo tail -f /var/log/auth.log
```

In a second SSH session, log in again or run `sudo true`, and watch new lines appear in the first. This is how you watch a service while you test it.

## Guided lab

1. List every `.conf` file directly in `/etc` with a wildcard, then count them with `ls /etc/*.conf | wc -l`.
2. Find every directory named `ssh` under `/etc`: `find /etc -type d -name ssh`.
3. Find files over 1 MB in `/var` with `sudo find /var -type f -size +1M -exec ls -lh {} \;`. Which directory holds most of them?
4. Create `touch ~/old.tmp ~/new.tmp`, set the first to an old date with `touch -d "10 days ago" ~/old.tmp`, then `find ~ -name "*.tmp" -mtime +7`. Only `old.tmp` should appear.
5. Open `/etc/ssh/sshd_config` with `less`, search for `Port`, and quit.
6. Run `sudo tail -f /var/log/auth.log` and generate an entry from another session.

## Independent exercises

1. Which of `data1.csv`, `data10.csv`, `data_a.csv`, `.data2.csv` does `data?.csv` match? Check with `touch` and `ls`.
2. Write a `find` command for files in your home directory changed in the last 60 minutes (`-mmin`).
3. Find which file in `/etc` mentions your hostname: `sudo grep -rl lab01 /etc` (Module 3 explains `grep`).
4. Explain the difference between `find` and `locate` in two sentences.
