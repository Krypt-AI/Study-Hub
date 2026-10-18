---
id: linux-fundamentals.m09.l2
title: DNS and connectivity testing
summary: Understand name resolution on Linux and test connectivity layer by layer with ping, tracepath, dig, resolvectl and curl.
objectives:
  - Explain how a Linux host resolves names (`/etc/hosts`, systemd-resolved, DNS servers)
  - Query DNS with `dig`, `host` and `resolvectl`
  - Test reachability and path with `ping`, `tracepath`/`traceroute` and `mtr`
  - Test applications with `curl` and `nc`
  - Troubleshoot "cannot reach" problems bottom-up
estimatedMinutes: 55
topics: [linux.m09]
resources:
  - { title: "systemd-resolved(8)", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd-resolved.service.html", free: true, official: true }
  - { title: "Ubuntu Server: DNS client configuration", url: "https://documentation.ubuntu.com/server/explanation/networking/configuring-networks/#name-resolution", free: true, official: true }
  - { title: "BIND 9: dig manual", url: "https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility", free: true, official: true }
  - { title: "curl documentation", url: "https://curl.se/docs/", free: true, official: true }
---

## How names are resolved

When a program needs the address of `archive.ubuntu.com`:

1. The C library reads `/etc/nsswitch.conf` (`hosts: files dns`): check **files** first, then **DNS**.
2. **Files**: `/etc/hosts`, a static list. Handy in labs (`192.168.56.20 db01`) but hard to keep consistent across many servers.
3. **DNS**: on Ubuntu, queries go to **systemd-resolved**, a local stub resolver at `127.0.0.53`, which forwards them to the DNS servers learned from DHCP or netplan and caches answers.

```bash
cat /etc/resolv.conf | grep -v '^#'
resolvectl status | head -20
getent hosts archive.ubuntu.com
```

```text
nameserver 127.0.0.53
options edns0 trust-ad
search .
Global
       Protocols: -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
...
Link 2 (enp0s3)
    Current Scopes: DNS
Current DNS Server: 10.0.2.3
       DNS Servers: 10.0.2.3
185.125.190.81  archive.ubuntu.com
```

Do not edit `/etc/resolv.conf` on Ubuntu: it is generated. Set DNS servers in netplan (`nameservers:`) instead. `getent hosts NAME` resolves the way applications do (files then DNS); `dig` asks DNS servers directly and ignores `/etc/hosts`.

## Querying DNS

```bash
dig archive.ubuntu.com +short
dig ubuntu.com MX +short
dig @1.1.1.1 example.com A
host 8.8.8.8
resolvectl query ubuntu.com
```

| Record | Holds |
|---|---|
| `A` / `AAAA` | IPv4 / IPv6 address |
| `CNAME` | an alias for another name |
| `MX` | mail servers for a domain |
| `TXT` | text: SPF, domain verification |
| `PTR` | reverse lookup: address → name |
| `NS` | the domain's name servers |

In full `dig` output, check `status: NOERROR` (found), `NXDOMAIN` (the name does not exist) or `SERVFAIL` (the server could not answer), and the `ANSWER SECTION`. `@server` asks a specific resolver, which tells you whether the problem is your resolver or the name itself.

## Testing connectivity, layer by layer

| Question | Tool |
|---|---|
| Is my interface up with an address? | `ip -br a` |
| Can I reach my gateway? | `ping -c 3 <gateway>` |
| Can I reach the internet by IP? | `ping -c 3 1.1.1.1` |
| Does DNS work? | `dig ubuntu.com +short`, `getent hosts ubuntu.com` |
| Where does the path stop? | `tracepath -n 1.1.1.1`, `traceroute`, `mtr -rw 1.1.1.1` |
| Is the service's port open? | `nc -zv host 443` |
| Does the application answer? | `curl -I https://ubuntu.com` |

```bash
ping -c 3 192.168.56.1
curl -sI https://ubuntu.com | head -3
nc -zv 192.168.56.10 22
```

```text
PING 192.168.56.1 (192.168.56.1) 56(84) bytes of data.
64 bytes from 192.168.56.1: icmp_seq=1 ttl=128 time=0.412 ms
...
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
HTTP/2 200
server: nginx
content-type: text/html; charset=utf-8
Connection to 192.168.56.10 22 port [tcp/ssh] succeeded!
```

Notes:

- Many networks and hosts **block ping** (ICMP). No ping reply does not prove a host is down; test the actual port with `nc` or `curl`.
- Windows' firewall blocks ping to your laptop by default, which can confuse the first test.
- `curl -v` shows the TLS handshake and headers; `curl -o /dev/null -s -w '%{http_code} %{time_total}\n' URL` prints just the status code and timing.

## Troubleshooting bottom-up

Ticket: "lab01 cannot download updates."

```text
1. Link and address   ip -br a                         → enp0s3 UP with 10.0.2.15? 
2. Route              ip route                         → default via 10.0.2.2?
3. Gateway            ping -c2 10.0.2.2                → reply? (VirtualBox NAT answers)
4. Internet by IP     ping -c2 1.1.1.1 / curl -I http://1.1.1.1
5. DNS                dig archive.ubuntu.com +short    → addresses? try @1.1.1.1
6. Application        curl -I http://archive.ubuntu.com/ubuntu/
```

Stop at the **first** step that fails: that layer is where the problem is. Record each result in the ticket.

## Guided lab

1. Inspect `/etc/nsswitch.conf`, `/etc/resolv.conf` and `resolvectl status`. Which DNS server does lab01 use?
2. Add `192.168.56.1 hostpc` to `/etc/hosts` and compare `getent hosts hostpc` with `dig hostpc +short`. Explain the difference.
3. Query `A`, `MX` and `NS` records for `ubuntu.com`, and a reverse lookup of one of its addresses.
4. Run `tracepath -n 1.1.1.1` and count the hops.
5. Use `curl -I` against `http://localhost` (nginx) and `nc -zv localhost 22`.
6. Walk the six-step checklist above and record each result.

## Independent exercises

1. Use `dig @1.1.1.1 nonexistent-name-xyz.com` and identify the status that tells you the name does not exist.
2. Explain why a working `ping 1.1.1.1` with a failing `ping ubuntu.com` points to DNS.
3. Measure how long `curl` takes to fetch `https://ubuntu.com` with `-w '%{time_total}'`, three times. Why might the first be slower?
