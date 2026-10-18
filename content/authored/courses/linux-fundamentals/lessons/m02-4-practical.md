---
id: linux-fundamentals.m02.l4
title: "Practical assessment: organise and clean up a project area"
summary: Build a project directory structure, collect configuration copies, and find and archive old files.
objectives:
  - Create and organise a directory tree to a specification
  - Use `find` to locate files by name, size and age, and act on them safely
estimatedMinutes: 50
topics: [linux.m02]
---

## Scenario

A small accounting firm, **Kedai Kira Sdn Bhd**, wants a shared project area on its server. Set it up in your lab under `~/kira` (later modules move it to `/srv`).

## Requirements

1. Create this structure with as few commands as possible:

   ```text
   ~/kira/
   ├── clients/
   ├── templates/
   ├── archive/
   └── config-copies/
   ```

2. Copy `/etc/hosts`, `/etc/hostname` and `/etc/ssh/sshd_config` into `config-copies/`, keeping their timestamps.
3. Generate test files: run

   ```bash
   cd ~/kira/clients
   for i in $(seq 1 12); do echo "client $i" > client$i.txt; done
   touch -d "45 days ago" client1.txt client2.txt client3.txt
   ```

4. With **one** `find` command, move the files older than 30 days into `archive/`.
5. Create a symlink `~/kira/latest-config` pointing to `config-copies/sshd_config`.
6. Produce evidence: `ls -lR ~/kira` and the `find` command you used.

## Marking

Describe what you did, then tick the points in the model answer you covered.
