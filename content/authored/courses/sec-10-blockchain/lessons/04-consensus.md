---
id: sec-10-blockchain.l04
title: Consensus
summary: "How independent nodes agree on one history without a central authority: proof-of-work, proof-of-stake, the longest/heaviest chain rule, finality, and the 51% attack."
objectives:
  - Explain what problem consensus solves and how proof-of-work uses hashing
  - Compare proof-of-work and proof-of-stake on cost and security
  - Describe a 51% attack and what it can and cannot do
estimatedMinutes: 50
topics: [sec10.consensus]
resources:
  - { title: "Bitcoin whitepaper (proof-of-work)", url: "https://bitcoin.org/bitcoin.pdf", free: true, official: true }
  - { title: "Ethereum.org: proof-of-stake", url: "https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/", free: true, official: false }
  - { title: "NIST IR 8202 (consensus models)", url: "https://csrc.nist.gov/pubs/ir/8202/final", free: true, official: true }
---

## The agreement problem

Thousands of nodes each receive transactions in slightly different orders. Without a central server, how do they all
agree on one history, and resist a participant who tries to rewrite it? That is the **consensus** problem. The answer
is to make proposing a block **costly** and to give nodes a rule for picking the one true chain.

## Proof-of-work

In **proof-of-work (PoW)**, a miner assembles a block and searches for a **nonce** such that the block's hash is below
a **difficulty target** (for example, starts with enough zero bits). Because a hash is unpredictable, the only way to
find one is to try nonces by brute force — billions of hashes per second across the network.

```python
import hashlib

def mine(header: str, difficulty: int) -> int:
    target = "0" * difficulty
    nonce = 0
    while not hashlib.sha256(f"{header}{nonce}".encode()).hexdigest().startswith(target):
        nonce += 1
    return nonce            # finding it is hard; checking it is one hash
```

The work is **hard to produce but trivial to verify**. Difficulty auto-adjusts so blocks arrive at a steady rate.
Honest miners are paid (block reward + fees) to extend the chain; rewriting an old block means redoing its work and
every block after it faster than the whole network moves forward — practically impossible for one party.

## The chain-selection rule

Nodes follow the **longest / heaviest valid chain** (the one with the most accumulated work). When two blocks appear at
once, the chain briefly forks; whichever branch the next block extends wins, and the orphaned block's transactions
return to the pool. This is why exchanges wait for several **confirmations** (blocks on top) before treating a payment
as settled: a shallow reorganisation could still displace it.

## Proof-of-stake

**Proof-of-stake (PoS)** replaces energy with economic stake: validators lock up ("stake") the chain's currency and
are chosen to propose and attest blocks in proportion to their stake. Misbehaviour is punished by **slashing** part of
the stake. PoS uses a tiny fraction of the energy of PoW (Ethereum's switch cut its energy use by ~99.9%) and can offer
quicker **finality** (a point after which a block cannot be reverted).

| | Proof-of-work | Proof-of-stake |
|---|---|---|
| Scarce resource | Computation / electricity | Locked capital |
| Attack cost | Acquire >50% hash power | Acquire (and risk slashing) a large stake |
| Energy | Very high | Very low |
| Finality | Probabilistic (wait for confirmations) | Often faster, explicit |

## The 51% attack

If one party controls a majority of the hashing power (PoW) or stake (PoS), it can out-produce the rest and rewrite
recent history: most damagingly, **double-spend** by reversing a transaction after receiving goods. It **cannot** steal
coins from addresses it does not control (that needs private keys), forge invalid transactions (nodes reject them), or
usually touch deeply buried history (the work required grows with depth). The defence is scale and decentralisation:
the more honest participants, the more expensive an attack becomes.
