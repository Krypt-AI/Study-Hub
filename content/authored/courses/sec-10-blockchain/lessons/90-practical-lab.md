---
id: sec-10-blockchain.lab
title: "Practical lab: verify the real Bitcoin genesis block"
subtitle: Hands-on session with real data and real tools
summary: "Reproduce the hash of the first Bitcoin block from its raw 80-byte header with Python, read real blocks and transactions in a public block explorer, and compare what you see with the structures from the lessons."
objectives:
  - Recompute a real block's hash from its header with double SHA-256
  - Read a block, its Merkle root and a transaction in a public block explorer
  - Connect each field of the header to the hash-chain and proof-of-work lessons
estimatedMinutes: 45
topics: [sec10.lab]
resources:
  - { title: "Bitcoin whitepaper (Nakamoto, 2008)", url: "https://bitcoin.org/bitcoin.pdf", free: true, official: true }
  - { title: "Bitcoin developer guide: block chain", url: "https://developer.bitcoin.org/devguide/block_chain.html", free: true, official: false }
  - { title: "mempool.space (open-source block explorer)", url: "https://mempool.space/", free: true, official: false }
  - { title: "Python hashlib and struct documentation", url: "https://docs.python.org/3/library/hashlib.html", free: true, official: true }
---

Blockchains are public, so you can check the real thing yourself with **ordinary tools**. You use Python (set up in Stage 1)
and a **public block explorer** in your browser. No wallet, no coins and no accounts are needed, and nothing here touches
anyone's money.

## The real sample: block 0

The very first Bitcoin block, the **genesis block**, mined by Satoshi Nakamoto in January 2009, has a header of exactly
**80 bytes** made of six fields, all public:

| Field | Size | Value in the genesis block |
|---|---|---|
| version | 4 bytes | `1` |
| previous block hash | 32 bytes | all zeros (there is no previous block) |
| Merkle root | 32 bytes | `4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b` |
| time | 4 bytes | `1231006505` (a Unix timestamp, 3 January 2009) |
| bits | 4 bytes | `0x1d00ffff` (the difficulty target in compact form) |
| nonce | 4 bytes | `2083236893` |

Its **block hash**, the number everyone calls the block's id, is famous for its leading zeros:

```text
000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f
```

The block hash is not stored in the block. It is **computed from the header** with **SHA-256 applied twice**. That is why it
is verifiable: anyone can redo the calculation.

## Part 1: Recompute the hash in Python

Create `genesis.py` in VS Code and run it:

```python
import hashlib
import struct

version = 1
previous = bytes(32)                                   # 32 zero bytes
merkle_root = bytes.fromhex("4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b")[::-1]
timestamp = 1231006505
bits = 0x1D00FFFF
nonce = 2083236893

header = struct.pack("<L", version) + previous + merkle_root + struct.pack("<LLL", timestamp, bits, nonce)
assert len(header) == 80

digest = hashlib.sha256(hashlib.sha256(header).digest()).digest()
print(digest[::-1].hex())
```

It prints:

```text
000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f
```

Two details are worth understanding, because they trip everyone up the first time:

- **`<L` means little-endian.** Bitcoin stores its integers least-significant byte first, so `struct.pack("<L", ...)` is
  needed to build the header bytes exactly as the network does.
- **The bytes are reversed** (`[::-1]`) for the Merkle root going in and the hash coming out. Bitcoin's internal byte order
  is the reverse of how hashes are conventionally displayed.

If your output matches, you have just verified a 17-year-old block without trusting anybody. Note that you needed **no**
network access, no node, and no permission: the proof is in the arithmetic.

### Make it fail on purpose

Change the nonce by one (`nonce = 2083236894`) and run it again. The hash becomes unrecognisable and no longer starts with
zeros: **a single changed bit invalidates the block**, which is the avalanche effect (Cryptography, lesson 1) that makes a
chain tamper-evident.

## Part 2: See it in a block explorer

A **block explorer** is a website that shows the blockchain in a readable form. Open **mempool.space** (or another
well-known explorer) in your browser and search for **block height `0`**. Compare:

| Explorer shows | Lesson it matches |
|---|---|
| **Hash** and **Previous block** | the hash chain: each block names its parent (lesson 1) |
| **Merkle root** | the single hash summarising every transaction (lesson 2) |
| **Nonce** and **Bits / Difficulty** | the proof-of-work search and its target (lesson 4) |
| the **Transactions** list | what the Merkle root commits to (lessons 2 and 3) |

Now search for a **recent** block and answer, from what the page shows:

- How many transactions does it contain, and what is its **height** compared with block 0?
- Does its **Previous block hash** equal the **Hash** of the block just before it? (Open that block and check.)
- Do you see a long run of **leading zeros** in the hash? How does the difficulty compare with the genesis block's?

Open one transaction. Read its **inputs** (where the coins came from) and **outputs** (where they went), and its **size**
and **fee**. Notice that you can see amounts and addresses but **no names**: pseudonymous, not anonymous (lesson 3).

## Part 3: Think like a verifier

A lightweight wallet does not download the whole chain. Using what you just did, explain in your own words:

1. Why can a verifier trust a block header without trusting whoever sent it?
2. Which header field would have to be recomputed if one transaction were altered? And what would that do to the block hash?
3. Why is it cheap to **verify** the genesis hash (you just did) but expensive to **find** a nonce that gives such a hash?

Write your answers in your notes, then check them against lessons 2 and 4.

## If something goes wrong

| Problem | Fix |
|---|---|
| The hash differs from the one printed | check the byte reversals (`[::-1]`) and that you used `"<L"` and `"<LLL"` |
| `assert len(header) == 80` fails | a field has the wrong size; previous hash and Merkle root are 32 bytes each |
| The explorer is slow or down | try another well-known explorer; the data is the same on every one |
