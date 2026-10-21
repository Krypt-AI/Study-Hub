---
id: sec-08-incident-response.lab
title: "Practical lab: triage a log and handle evidence"
subtitle: Hands-on session with the real tools
summary: "Triage a sample SSH authentication log with grep, awk and sort, preserve and hash a piece of evidence with a chain-of-custody record, and tour Autopsy on the NPS public test disk images."
objectives:
  - Triage a log with command-line tools and decide what to escalate
  - Hash evidence and keep a chain-of-custody record
  - Open a public forensic test image in Autopsy and find your way around
estimatedMinutes: 60
topics: [sec08.lab]
resources:
  - { title: "NIST SP 800-86: integrating forensic techniques into incident response", url: "https://csrc.nist.gov/pubs/sp/800/86/final", free: true, official: true }
  - { title: "Autopsy and The Sleuth Kit", url: "https://www.sleuthkit.org/autopsy/", free: true, official: false }
  - { title: "Digital Corpora: NPS test disk images (for forensic practice)", url: "https://digitalcorpora.org/corpora/disk-images/", free: true, official: false }
  - { title: "Volatility Foundation (memory forensics)", url: "https://www.volatilityfoundation.org/", free: true, official: false }
---

Responding to an incident is learned by doing it. In this session you use the **real command-line tools** every responder
has, then the **real forensic suite Autopsy** on a **public practice image**. You do not build an environment: you use your
Linux VM from Stage 1 and the published samples below.

> **Only examine data you are authorised to examine.** Here that is a log file you create from the sample below and a test
> image published for exactly this purpose, never real systems or other people's data.

## Part 1: Triage a log

Create `auth.log` in your Linux VM with these lines. They are an **illustrative sample** in the real format an Ubuntu server
writes (the addresses are from ranges reserved for documentation, so they belong to nobody):

```text
Oct 21 02:14:01 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.50 port 51234 ssh2
Oct 21 02:14:03 web01 sshd[2211]: Failed password for invalid user admin from 203.0.113.50 port 51234 ssh2
Oct 21 02:14:05 web01 sshd[2213]: Failed password for invalid user test from 203.0.113.50 port 51240 ssh2
Oct 21 02:14:09 web01 sshd[2215]: Failed password for root from 203.0.113.50 port 51251 ssh2
Oct 21 02:15:41 web01 sshd[2230]: Failed password for aina from 198.51.100.7 port 40122 ssh2
Oct 21 02:16:02 web01 sshd[2236]: Accepted password for aina from 198.51.100.7 port 40130 ssh2
Oct 21 02:16:02 web01 sshd[2236]: pam_unix(sshd:session): session opened for user aina(uid=1000) by (uid=0)
Oct 21 02:31:44 web01 sudo:     aina : TTY=pts/0 ; PWD=/home/aina ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
```

### Step 1. Count failures by source

```bash
grep 'Failed password' auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn
```

Read the pipeline left to right: **`grep`** keeps the failure lines, **`awk '{print $(NF-3)}'`** prints the field three from
the end (the source address), **`sort | uniq -c`** counts each distinct value, and **`sort -rn`** puts the biggest first. The
output is:

```text
      4 203.0.113.50
      1 198.51.100.7
```

### Step 2. Which accounts were tried?

```bash
grep 'Failed password' auth.log | sed -E 's/.*for (invalid user )?([^ ]+) from.*/\2/' | sort | uniq -c | sort -rn
```

```text
      2 admin
      1 test
      1 root
      1 aina
```

### Step 3. Did anything succeed?

```bash
grep Accepted auth.log
```

### Step 4. Decide

Use the triage questions from lesson 2 on what you found:

| Observation | Reading |
|---|---|
| Four failures from **203.0.113.50** against `admin`, `test` and `root` in about eight seconds, none accepted | automated **password guessing** that **failed**; worth blocking and rate-limiting, but no access was gained |
| One failure then a success for `aina` from **198.51.100.7** | could be a user mistyping, but note the source and time |
| At 02:31 that session ran `sudo cat /etc/shadow` | **reading the password hashes** is not what an ordinary session does; this is the line to **escalate** |

The lesson of the exercise: the loud, repetitive failures are the easy ones to see, but the **quiet privileged action after a
successful login** is the incident. Triage means reading the whole timeline, not just counting the noisy part. Declare the
incident, contain (lock the account, isolate the host), and **preserve evidence** before cleaning up.

## Part 2: Preserve and hash evidence

```bash
mkdir evidence && cp auth.log evidence/auth.log
sha256sum evidence/auth.log > evidence/auth.log.sha256
sha256sum -c evidence/auth.log.sha256
```

```text
evidence/auth.log: OK
```

You copied the original (never work on the only copy), recorded its **SHA-256**, and proved the copy still matches. If the
file changed even by a character the check would print `FAILED`. Now write the **chain-of-custody record** that goes with it,
in a notes file:

| Item | Description | SHA-256 (first 16) | Collected by | Date and time (UTC) | From where | Handed to | Reason |
|---|---|---|---|---|---|---|---|
| E-001 | `auth.log` copy | (yours) | you | now | web01 `/var/log` | (nobody) | incident triage |

Every transfer adds a row. A gap in this record is a gap in the evidence.

## Part 3: A forensic tool on a practice image

Real disk images contain real people's data, so use the **NPS test disk images**, which Digital Corpora publishes free of
non-public personal information for practice. Do not use anyone's real image.

1. Download and install **Autopsy** from sleuthkit.org (it is free and open source).
2. From the Digital Corpora **Disk Images** page, download one of the **NPS Test Disk Images**.
3. In Autopsy choose **New Case**, name it, then **Add Data Source → Disk Image**, and select the file.
4. Accept the default ingest modules and let it process.

In the tree on the left, explore each area and note what it shows:

| Area | What you learn |
|---|---|
| **File Views → By Type** | files grouped by kind (documents, images, archives) |
| **Deleted Files** | files removed from the file system that still exist on disk |
| **Data Artifacts** | recovered items such as web history, recently opened files, installed programs |
| **Timeline** | events from file timestamps in order, the forensic timeline |

Pick **one file**, look at its **metadata** (created, modified, accessed times) and its **hash**. This is the work that
Stage 8's lesson on forensics describes, done in the real tool: the image was acquired once, hashed, and is analysed without
changing the original.

**Memory forensics** is the other half. The Volatility Foundation publishes the **Volatility** framework and links public
sample memory images on its site; the same discipline applies (hash the image, work on a copy, document each step).

## If something goes wrong

| Problem | Fix |
|---|---|
| `awk` prints the wrong column | count from the end: the address is `$(NF-3)` because every line ends `... from IP port N ssh2` |
| Autopsy is slow on ingest | untick heavy modules in the ingest settings, or use a smaller image |
| `sha256sum -c` says `No such file` | run it from the folder that holds the path written in the `.sha256` file |
