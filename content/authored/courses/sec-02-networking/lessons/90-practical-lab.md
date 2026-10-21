---
id: sec-02-networking.lab
title: "Practical lab: Wireshark and Nmap"
subtitle: Hands-on session with the real tools
summary: "A guided session in Wireshark, using the project's official sample captures, and Nmap, using the Nmap Project's own test host and your lab VM, with the commands, what the output looks like, and how to read it."
objectives:
  - Open an official sample capture in Wireshark and answer questions with display filters
  - Follow a TCP stream and spot cleartext versus encrypted protocols
  - Run Nmap against an authorised target and read its port table
estimatedMinutes: 60
topics: [sec02.lab]
resources:
  - { title: "Wireshark sample captures (official wiki)", url: "https://wiki.wireshark.org/SampleCaptures", free: true, official: true }
  - { title: "Wireshark User's Guide", url: "https://www.wireshark.org/docs/wsug_html_chunked/", free: true, official: true }
  - { title: "Wireshark display filter reference", url: "https://www.wireshark.org/docs/dfref/", free: true, official: true }
  - { title: "Nmap reference guide", url: "https://nmap.org/book/man.html", free: true, official: true }
  - { title: "Nmap legal issues (read before scanning)", url: "https://nmap.org/book/legal-issues.html", free: true, official: true }
---

You installed both tools in this course's setup lesson. This session uses them for real. There is **no custom
environment** here: you work in the actual Wireshark and Nmap programs on **samples published by their own projects**.

## Tools and samples

| Tool | Real sample you will use | Where it comes from |
|---|---|---|
| **Wireshark** | `http.cap` (a simple HTTP request and response) and `dns.cap` (various DNS lookups) | the Wireshark wiki's **Sample Captures** page |
| **Nmap** | `scanme.nmap.org` | a public test host **run by the Nmap Project** for exactly this purpose |
| **Nmap** | your own lab VM | the host-only network from Stage 1 |

> **Scope, before anything else.** The Nmap Project authorises scanning **`scanme.nmap.org` with Nmap only**: not
> exploit attempts and not denial of service. Keep it light (their guidance is no more than about a dozen scans a day),
> and know the host may occasionally be offline. Never scan any other address you do not own or have permission to test.

## Part 1: Wireshark on a sample capture

### Step 1. Get and open the capture

1. Open the **Sample Captures** page on the Wireshark wiki, find **`http.cap`**, and download it. (Do the same for
   **`dns.cap`** later.) These files are packets someone already recorded, so you capture nothing on your own network.
2. In Wireshark choose **File → Open** and pick the file.

You will see three panes: the **packet list** (top, one row per packet), the **packet details** (middle, a tree of
protocol layers) and the **packet bytes** (bottom, the raw data). Click a packet and expand its details: you should see
the layers from the lesson on the TCP/IP model, **Frame → Ethernet → Internet Protocol → Transmission Control Protocol →
Hypertext Transfer Protocol**.

### Step 2. Use display filters

Type in the **display filter bar** (it turns green when valid) and press Enter:

| Filter | Shows |
|---|---|
| `http` | only HTTP packets |
| `http.request.method == "GET"` | only GET requests |
| `tcp.flags.syn == 1 && tcp.flags.ack == 0` | the first packet of each TCP handshake (SYN, not SYN-ACK) |
| `ip.addr == 192.0.2.1` | traffic to or from one address (replace with an address from your capture) |
| `dns` | only DNS (use this on `dns.cap`) |

Clear the filter to see everything again.

### Step 3. Follow a stream

Right-click an HTTP packet and choose **Follow → TCP Stream** (shortcut **Ctrl+Alt+Shift+T**). Wireshark reassembles the
whole conversation: the request text in one colour and the response in another. This is the cleartext demonstration from
the protocols lesson: **anything sent over HTTP, including a password in a form, is readable here.** The same step on an
HTTPS capture would show only unreadable bytes.

### Step 4. Answer questions with the tools

Work through these on `http.cap`, then `dns.cap`:

- How many packets are there, and how many are HTTP? (the status bar shows **Displayed** versus **Packets**)
- What is the HTTP request method and the requested path? What status code did the server return?
- In `dns.cap`, what are the **query names**, and what **record types** (A, AAAA, …) were asked for? Did each query get a
  response? (look at the **Flags** and **Answers** in the details pane)
- Open **Statistics → Conversations** and read which two addresses talked the most.

## Part 2: Nmap against an authorised target

### Step 5. Run the simplest scan

In a terminal (on Kali, Linux, or Windows with Nmap installed):

```bash
nmap scanme.nmap.org
```

The Nmap book prints this scan as its first worked example. The **port table** it gives looks like this:

```text
Not shown: 994 filtered ports
PORT    STATE  SERVICE
22/tcp  open   ssh
25/tcp  closed smtp
53/tcp  open   domain
70/tcp  closed gopher
80/tcp  open   http
113/tcp closed auth
```

That is the book's historic sample. **Your own result will differ**, because the Nmap Project changes what the host runs,
so do not expect these exact ports. What matters is how to read the shape:

| Column | Meaning |
|---|---|
| **PORT** | the port number and protocol |
| **STATE** | **open** (a service accepted the connection), **closed** (reachable, nothing listening), **filtered** (a firewall dropped it, so Nmap cannot tell) |
| **SERVICE** | Nmap's guess of the service from the port number |
| **Not shown: N filtered ports** | the many ports that gave no answer at all |

### Step 6. Ask for more, on your own VM

Point these at **your lab VM's** host-only address (find it with `ip addr` on the VM), not at anyone else's machine:

| Command | What it adds |
|---|---|
| `nmap -sn 192.168.56.0/24` | **host discovery only** across a /24 (the usual VirtualBox host-only range): which hosts are up, with no port scan |
| `nmap -sV 192.168.56.101` | **service and version detection**: which software and version is behind each open port |
| `nmap -p 22,80 192.168.56.101` | scan only the ports you name |
| `nmap -oN scan.txt 192.168.56.101` | also save a normal-format report to `scan.txt` to keep in your notes |

Nmap's own manual explains each option; the **Options Summary** page lists them all. After `-sV`, the SERVICE column also
shows a **VERSION** column, for example an SSH or web-server version, which is what a defender checks against known
vulnerabilities (Stage 7's patch management).

### Step 7. Close the loop as a defender

For each **open** port on your VM, write down: *Do I need this service? Is it patched? Should it be reachable from where it
is?* Close or firewall anything you cannot justify (Stage 7). That list is the real output of a scan.

## If something goes wrong

| Problem | Fix |
|---|---|
| Wireshark lists no interfaces on Windows | reinstall using the installer from wireshark.org, which includes **Npcap** |
| The filter bar stays red | a typo in the filter; the status bar says what it did not understand |
| `nmap: command not found` | install Nmap (setup lesson); on Windows open a new terminal after installing |
| `scanme.nmap.org` does not answer | the host can be offline or rate-limited; try later, and do not substitute another target |
| Nmap says the host seems down | the VM may block ping; add `-Pn` to skip host discovery (only on your own VM) |
