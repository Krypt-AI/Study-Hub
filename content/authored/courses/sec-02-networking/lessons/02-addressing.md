---
id: sec-02-networking.l02
title: Addressing and subnets
summary: IPv4 and IPv6 addresses, public versus private ranges, CIDR and subnet masks, NAT, and why subnetting is a security boundary.
objectives:
  - Read IPv4 addresses, masks and CIDR notation
  - Distinguish public and private addresses and explain NAT
  - Compute hosts in a subnet and explain segmentation as defence
estimatedMinutes: 55
topics: [sec02.addressing]
resources:
  - { title: "RFC 1918 (private address space)", url: "https://datatracker.ietf.org/doc/html/rfc1918", free: true, official: true }
  - { title: "RFC 4291 (IPv6 addressing)", url: "https://datatracker.ietf.org/doc/html/rfc4291", free: true, official: true }
  - { title: "Cloudflare Learning: what is a subnet?", url: "https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/", free: true, official: false }
---

## IP addresses

An **IPv4** address is 32 bits, written as four bytes: `192.168.1.10`. There are only ~4.3 billion, long exhausted, so
**IPv6** (128 bits, `2001:db8::1`) exists with a vastly larger space. An address identifies an interface on a network.

## Public versus private

Some IPv4 ranges are **private** (RFC 1918), reused inside countless home and office networks and never routed on the
public internet:

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

Everything else is **public**. Your home devices share one public address through **NAT** (Network Address
Translation): the router rewrites internal private addresses to its single public one and back. NAT incidentally hides
internal hosts, but it is **not** a security control — do not rely on it as a firewall.

## Subnet masks and CIDR

A mask splits an address into a **network** part and a **host** part. **CIDR** writes the network size as a suffix:
`/24` means the first 24 bits are the network, leaving 8 bits for hosts.

| CIDR | Mask | Total addresses | Usable hosts |
|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |

"Usable" excludes the **network address** (all host bits 0) and the **broadcast address** (all host bits 1). A quick
formula: hosts = 2^(32 − prefix) − 2.

```text
192.168.1.0/24  → network 192.168.1.0, hosts .1–.254, broadcast 192.168.1.255
```

## Subnets as security boundaries

Subnetting is not just tidy addressing; it is a **defensive** tool. Splitting a network into segments (VLANs/subnets)
and controlling traffic between them means a compromise in one segment does not automatically reach the others. Typical
designs separate:

- user workstations from servers,
- internet-facing systems in a **DMZ** from the internal network,
- sensitive systems (finance, control systems) behind tighter rules.

This is **network segmentation**, a core idea in Stage 7's defence work and in zero-trust designs. Knowing how to read
an address and mask tells you which segment a host is in and which boundary its traffic must cross.
