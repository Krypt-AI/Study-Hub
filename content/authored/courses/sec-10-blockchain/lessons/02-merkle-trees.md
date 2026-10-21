---
id: sec-10-blockchain.l02
title: Merkle trees
summary: How a tree of hashes summarises all transactions in a block into one root, why that enables compact membership proofs, and where Merkle trees appear beyond blockchains.
objectives:
  - Build a Merkle root from a list of transaction hashes
  - Produce and verify a Merkle membership proof
  - Explain why light clients rely on Merkle roots
estimatedMinutes: 45
topics: [sec10.merkle]
resources:
  - { title: "NIST IR 8202 (Merkle trees in blockchains)", url: "https://csrc.nist.gov/pubs/ir/8202/final", free: true, official: true }
  - { title: "Bitcoin developer guide: block chain", url: "https://developer.bitcoin.org/devguide/block_chain.html", free: true, official: false }
  - { title: "Python hashlib documentation", url: "https://docs.python.org/3/library/hashlib.html", free: true, official: true }
---

## Summarising a block in one hash

A block may hold thousands of transactions. Hashing them one after another would mean that to prove a single
transaction is included, you would have to download them all. A **Merkle tree** (hash tree) solves this: pair up the
transaction hashes, hash each pair, then pair up those, and so on, until a single **Merkle root** remains. The block
header stores only that root.

```text
            root = H(H12 + H34)
           /                   \
     H12 = H(H1+H2)       H34 = H(H3+H4)
       /      \             /      \
     H1        H2         H3        H4      ← hashes of tx1..tx4
```

If the number of nodes at a level is odd, the last one is usually duplicated so it can be paired.

## Membership proofs

Because every transaction hash feeds into the root, you can prove a transaction is in the block by supplying just the
**sibling hashes along the path** from that transaction up to the root — about log₂(n) hashes, not all n. The verifier
recomputes the root from the transaction plus the path and checks it against the known root.

For tx3 in the tree above, the proof is `[H4, H12]`: recompute H34 = H(H3 + H4), then root = H(H12 + H34), and compare
with the trusted root.

## Why this matters: light clients

A phone wallet (a **simplified payment verification** or "light" client) does not store the whole chain. It keeps only
the block **headers** (which contain the Merkle roots) and asks a full node for a Merkle proof that its transaction is
in a block. A few dozen hashes confirm inclusion without trusting the full node's word and without the gigabytes of
full block data. Any tampering with the transaction would change the recomputed root and fail the check.

## Beyond blockchains

Merkle trees are a general tool for verifying large data sets efficiently:

- **Git** stores trees of file hashes; a commit hash summarises the whole repository state.
- **Certificate Transparency** logs use Merkle trees so anyone can audit that a certificate was publicly logged.
- **BitTorrent**, backup systems and distributed databases use them to detect and locate corrupted or changed chunks.

The pattern is always the same: one small root hash stands in for a large collection, and a short proof ties any one
item to that root.
