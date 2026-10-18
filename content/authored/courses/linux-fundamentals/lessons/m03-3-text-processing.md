---
id: linux-fundamentals.m03.l3
title: Text processing tools
summary: Search with `grep`, cut columns, sort and count, translate characters, and make simple edits with `sed` and `awk`.
objectives:
  - Search files and output with `grep`, including basic regular expressions
  - Extract fields with `cut` and `awk`
  - Summarise data with `sort`, `uniq -c` and `wc`
  - Make a search-and-replace with `sed`, safely
estimatedMinutes: 60
topics: [linux.m03]
resources:
  - { title: "GNU grep manual", url: "https://www.gnu.org/software/grep/manual/grep.html", free: true, official: true }
  - { title: "GNU sed manual", url: "https://www.gnu.org/software/sed/manual/sed.html", free: true, official: true }
  - { title: "GNU awk (gawk) user's guide", url: "https://www.gnu.org/software/gawk/manual/gawk.html", free: true, official: true }
  - { title: "GNU Coreutils: Operating on sorted files (sort, uniq)", url: "https://www.gnu.org/software/coreutils/manual/html_node/Operating-on-sorted-files.html", free: true, official: true }
---

## Why text tools matter

Configuration files, logs and command output are text. A few tools, combined with pipes, answer most "how many / which / when" questions without writing a program.

## `grep`: find lines

```bash
grep student /etc/passwd
grep -i "failed password" /var/log/auth.log
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
grep -rn "PermitRootLogin" /etc/ssh/
grep -c sshd /var/log/auth.log
```

| Option | Meaning |
|---|---|
| `-i` | ignore case |
| `-v` | invert: lines that do **not** match |
| `-n` | show line numbers |
| `-c` | count matching lines |
| `-r` | search directories recursively (`-l` lists only file names) |
| `-w` | match whole words only |
| `-E` | extended regular expressions (`+`, `?`, `\|`, `()`) |
| `-q` | quiet: no output, just the exit code (for scripts) |

### Regular expressions, the essentials

| Pattern | Matches |
|---|---|
| `^root` | `root` at the start of a line |
| `bash$` | `bash` at the end of a line |
| `^$` | an empty line |
| `.` | any one character |
| `[0-9]` | one digit |
| `a*` | zero or more `a` |
| `-E '[0-9]+'` | one or more digits |
| `-E 'error\|fail'` | either word |

Put patterns in **single quotes** so the shell leaves `*`, `$` and `|` alone.

The second example above is worth remembering: `grep -v '^#' file | grep -v '^$'` shows only the active settings of a configuration file, without comments and blank lines.

## `cut`: columns from delimited text

```bash
cut -d: -f1 /etc/passwd | head -3
cut -d: -f1,7 /etc/passwd | tail -3
```

```text
root
daemon
bin
student:/bin/bash
sshd:/usr/sbin/nologin
aina:/bin/bash
```

`-d` sets the delimiter (one character) and `-f` the field numbers.

## `sort`, `uniq` and counting

| Command | Effect |
|---|---|
| `sort` | alphabetical order |
| `sort -n` | numeric order (`-h` for sizes like `4K`, `2M`) |
| `sort -r` | reverse |
| `sort -k 3 -t:` | sort by field 3, fields separated by `:` |
| `uniq` | remove **adjacent** duplicates (so sort first) |
| `uniq -c` | count each distinct line |

The classic "top N" pipeline:

```bash
sudo grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -5
```

```text
     42 203.0.113.17
      9 198.51.100.4
      3 192.168.56.1
```

That reads: find failed logins, take the IP address field, sort, count each, sort by count descending, keep the top five. (`203.0.113.x` and `198.51.100.x` are documentation addresses.)

## `tr`: translate characters

```bash
echo "lab01.example.com" | tr '.' '\n'
echo "Hello" | tr 'a-z' 'A-Z'
```

## `awk`: fields separated by spaces

`awk` splits each line into fields `$1`, `$2`, ... (by runs of spaces by default); `$NF` is the last field.

```bash
df -h | awk '{print $1, $5}'
awk -F: '$3 >= 1000 {print $1}' /etc/passwd
ps aux | awk '$3 > 10 {print $2, $3, $11}'
```

The second prints the names of normal user accounts (UID 1000 and above on Ubuntu and RHEL). `awk` is a whole language; for this course, `print` and simple conditions are enough.

## `sed`: edit a stream

```bash
sed 's/old/new/' file          # replace the first match on each line, print result
sed 's/old/new/g' file         # every match on each line
sed -n '10,20p' file           # print lines 10 to 20 only
sed '/^#/d' file               # delete comment lines from the output
sudo sed -i.bak 's/^#Port 22/Port 2222/' /etc/ssh/sshd_config
```

Without `-i`, `sed` prints the result and leaves the file alone: **always run it without `-i` first** to see the change. `-i.bak` edits in place and keeps a backup copy with the `.bak` suffix. (The last line is only an example: do not change your SSH port yet.)

## Guided lab

1. Show only active settings of `/etc/ssh/sshd_config` with `grep -v '^#' ... | grep -v '^$'`.
2. List all usernames with `cut -d: -f1 /etc/passwd`, then only those whose shell is `/bin/bash`: `grep '/bin/bash$' /etc/passwd | cut -d: -f1`.
3. Count login shells in use: `cut -d: -f7 /etc/passwd | sort | uniq -c | sort -rn`.
4. Print usernames with UID ≥ 1000 using `awk -F:`.
5. Copy `/etc/hosts` to `~/hosts.test` and use `sed` to replace `localhost` with `localhost.localdomain`, first without `-i`, then with `-i.bak`. Compare with `diff ~/hosts.test.bak ~/hosts.test`.
6. Find which files under `/etc` mention `lab01`: `sudo grep -rl lab01 /etc`.

## Independent exercises

1. From `ls -l /usr/bin`, print the five largest files' sizes and names using `sort` and `awk`.
2. Write a `grep -E` pattern that matches lines containing `error`, `fail` or `denied`, ignoring case, in `/var/log/syslog`.
3. Explain why `uniq` needs sorted input, with a three-line example.
