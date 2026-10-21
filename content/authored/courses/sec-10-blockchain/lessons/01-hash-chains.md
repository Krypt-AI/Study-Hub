---
id: sec-10-blockchain.l01
title: Hash-linked ledgers
summary: What a blockchain is as a data structure, how hash links make it tamper-evident, blocks and the genesis block, and the difference between a ledger and a database.
objectives:
  - Build a hash-linked chain of blocks in Python
  - Explain why changing one block invalidates all later blocks
  - Distinguish tamper-evidence from access control
estimatedMinutes: 45
topics: [sec10.ledger]
resources:
  - { title: "Bitcoin whitepaper (Nakamoto, 2008)", url: "https://bitcoin.org/bitcoin.pdf", free: true, official: true }
  - { title: "NIST IR 8202: Blockchain Technology Overview", url: "https://csrc.nist.gov/pubs/ir/8202/final", free: true, official: true }
  - { title: "Python hashlib documentation", url: "https://docs.python.org/3/library/hashlib.html", free: true, official: true }
---

## A chain of hashes

A **blockchain** is, at heart, a list of **blocks** where each block stores the cryptographic hash of the one before
it. That single link is what makes the whole structure **tamper-evident**: because a hash depends on every bit of its
input (lesson 1 of the Cryptography course), editing an old block changes its hash, which no longer matches the
`previous_hash` stored in the next block, which breaks that block's hash, and so on down the chain.

```python
import hashlib, json

def block_hash(block: dict) -> str:
    # Hash a canonical serialisation so the same content always hashes the same way.
    body = json.dumps(block, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(body).hexdigest()
```

A block typically holds an **index**, a **timestamp**, its **data** (transactions), the **previous block's hash**, and,
on proof-of-work chains, a **nonce** (lesson 4).

## The genesis block

The first block has no predecessor, so its `previous_hash` is a fixed value (often all zeros). It is called the
**genesis block** and is hard-coded; everything else chains back to it.

## Why tampering is detectable

Suppose an attacker rewrites a payment three blocks back. The edited block's hash changes, so:

1. Block N no longer matches block N+1's stored `previous_hash` → the chain is invalid from there on.
2. To hide this, the attacker would have to recompute block N+1, N+2, … all the way to the tip — and on a
   proof-of-work chain, redo all that work faster than the rest of the network adds new blocks (lesson 4). That is what
   makes rewriting history economically infeasible, not any secrecy.

Note what this does and does **not** give you:

- It gives **integrity / tamper-evidence**: unauthorised changes are detectable.
- It does **not** give **confidentiality**: on a public chain every block is readable by everyone. Blockchains are
  transparent by design.
- Validity still depends on the **rules** each node enforces (signatures, no double-spends); hashing alone does not
  decide what a legal block is.

## Ledger versus database

A normal database can be edited or rolled back by whoever administers it. A blockchain is **append-only** and
**replicated** across many independent nodes, with no single administrator, so no one party can quietly alter the
agreed history. That decentralisation is the point — and also the source of its costs (slow, redundant, hard to
change). Use a blockchain only when no single trusted party should control the record; otherwise a database is simpler
and faster.
