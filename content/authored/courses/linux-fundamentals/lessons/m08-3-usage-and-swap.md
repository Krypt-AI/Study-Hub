---
id: linux-fundamentals.m08.l3
title: Disk usage and swap
summary: Find out what is filling a disk, free space safely, and add swap space.
objectives:
  - Read `df` output for space and inodes
  - Find large directories and files with `du`, `ncdu` and `find`
  - Explain why deleted files can still use space
  - Explain swap and add a swap file
estimatedMinutes: 45
topics: [linux.m08]
resources:
  - { title: "GNU Coreutils: df invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html", free: true, official: true }
  - { title: "GNU Coreutils: du invocation", url: "https://www.gnu.org/software/coreutils/manual/html_node/du-invocation.html", free: true, official: true }
  - { title: "Ubuntu Server: Swap", url: "https://documentation.ubuntu.com/server/explanation/storage/about-swap/", free: true, official: true }
  - { title: "man 8 mkswap", url: "https://manpages.ubuntu.com/manpages/noble/man8/mkswap.8.html", free: true, official: true }
---

## `df`: space per filesystem

```bash
df -h
df -hT -x tmpfs -x devtmpfs
df -i
```

```text
Filesystem                        Size  Used Avail Use% Mounted on
/dev/mapper/ubuntu--vg-ubuntu--lv  12G  4.1G  7.0G  37% /
/dev/sda2                         2.0G  198M  1.6G  11% /boot
/dev/sdb1                         2.0G   24K  1.8G   1% /srv/data
```

- `-h` human-readable, `-T` shows the type, `-x` excludes types.
- `-i` shows **inodes**: every file uses one, so millions of tiny files can fill a filesystem that still has free gigabytes ("No space left on device" with `df -h` showing space).
- ext4 reserves about 5 % for root by default, so `Used + Avail` is less than `Size`.

## `du`: what is using it

```bash
sudo du -sh /var/*  2>/dev/null | sort -h | tail -5
sudo du -h --max-depth=1 /var | sort -h
sudo find / -xdev -type f -size +100M -exec ls -lh {} \; 2>/dev/null
```

```text
45M	/var/cache
96M	/var/log
310M	/var/lib
```

- `du -s` summarises a directory; `sort -h` orders human-readable sizes.
- `-xdev` (find) and `-x` (du) stay on one filesystem, so you do not wander into other mounts.
- `ncdu` (install it) is an interactive version: navigate with arrow keys, see the biggest items first.

### Freeing space safely

| Usual suspect | Safe action |
|---|---|
| old logs in `/var/log` | rely on logrotate; compress or delete **rotated** files (`*.gz`, `*.1`); never delete the active log of a running service |
| the journal | `sudo journalctl --vacuum-size=200M` |
| APT cache | `sudo apt clean` |
| old kernels | `sudo apt autoremove` |
| core dumps, temporary uploads | check with the owner first |
| Docker images (if installed) | `docker system df`, then prune deliberately |

### Deleted but still using space

If you delete a large file that a process still has open (for example a log being written), the space is **not** freed until the process closes it. `df` stays full while `du` shows less.

```bash
sudo lsof +L1
```

lists open files that have been deleted. Restarting (or reloading) that service releases the space. To empty an active log without deleting it: `sudo truncate -s 0 /var/log/app/big.log`.

## Swap

**Swap** is disk space the kernel uses for memory pages that have not been used recently, when RAM is under pressure. It prevents crashes when memory runs short but is much slower than RAM; constant swapping means the server needs more memory or fewer processes (Module 10).

```bash
swapon --show
free -h
```

```text
NAME      TYPE  SIZE USED PRIO
/swap.img file    2G   0B   -2
               total        used        free      shared  buff/cache   available
Mem:           1.9Gi       412Mi       958Mi       1.1Mi       753Mi       1.5Gi
Swap:          2.0Gi          0B       2.0Gi
```

Ubuntu Server's installer creates a swap **file** (`/swap.img`). Swap can also be a partition or an LVM volume.

### Adding a swap file

```bash
sudo fallocate -l 1G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2
swapon --show
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
```

`chmod 600` matters: swap can contain passwords and keys from memory. For a swap **partition**, use `mkswap /dev/sdXN` and an fstab line with `UUID=... none swap defaults 0 0`.

`vm.swappiness` (default 60) tunes how eagerly the kernel swaps; leave it unless you have measured a problem.

## Guided lab

1. Run `df -hT` and `df -i` and record the use of `/` and `/srv/data`.
2. Find the five largest directories under `/var` with `du` and `sort -h`.
3. Fill `/srv/data` partly: `sudo fallocate -l 500M /srv/data/big.bin`, check `df -h /srv/data`, then delete it.
4. Simulate a deleted-but-open file: `sudo bash -c 'exec 3>/srv/data/held.log; fallocate -l 300M /srv/data/held.log; rm /srv/data/held.log; sleep 600' &`. Compare `df -h` and `du -sh /srv/data`, find it with `sudo lsof +L1`, then kill the process and compare again.
5. Add a 1 GB swap file as above, make it permanent, and confirm with `swapon --show` after `sudo swapoff /swapfile2 && sudo swapon -a`.
6. Remove it again: `swapoff`, delete the fstab line, delete the file.

## Independent exercises

1. Write a one-line command for a ticket that reports the five largest files under `/home`.
2. A server reports "No space left on device" but `df -h` shows 40 % used. What do you check next, and why?
3. Explain why swap is not a substitute for enough RAM.
