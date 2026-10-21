---
id: sec-10-blockchain.l03
title: Transactions and signatures
summary: How ownership works without accounts you log in to, why every transaction is signed, addresses and wallets, and how double-spending is prevented.
objectives:
  - Explain how a key pair represents ownership on a blockchain
  - Describe how a signed transaction authorises a transfer
  - Explain how the ledger prevents double-spending
estimatedMinutes: 45
topics: [sec10.tx]
resources:
  - { title: "Bitcoin developer guide: transactions", url: "https://developer.bitcoin.org/devguide/transactions.html", free: true, official: false }
  - { title: "NIST IR 8202 (digital signatures in blockchains)", url: "https://csrc.nist.gov/pubs/ir/8202/final", free: true, official: true }
  - { title: "Ethereum.org: accounts", url: "https://ethereum.org/en/developers/docs/accounts/", free: true, official: false }
---

## Ownership is a key pair

There are no usernames and passwords on a blockchain. Ownership is a **key pair** (public-key cryptography, lesson 3 of
the Cryptography course):

- your **private key** authorises spending and must stay secret;
- your **public key** (hashed into an **address**) is what others send funds to.

Controlling the private key *is* controlling the funds. This is why the phrase "not your keys, not your coins" matters,
and why a lost private key usually means permanently lost funds — there is no administrator to reset it.

## A transaction is a signed instruction

To transfer value, you build a transaction ("send 5 from my address to Bob's address"), hash it, and **sign the hash
with your private key**. The network verifies the **signature against your public key**: a valid signature proves the
instruction came from the key that owns the funds and that the transaction was not altered in transit (integrity).

```python
# Shape only; real chains use ECDSA/EdDSA via a vetted library.
transaction = {"from": sender_address, "to": recipient_address, "amount": 5, "nonce": 7}
message = canonical_bytes(transaction)
signature = sign(private_key, message)      # only the owner can produce this
assert verify(public_key, message, signature)
```

The `nonce` (a per-sender counter) stops a captured transaction being **replayed** to spend the same funds twice.

## Preventing double-spending

The hard problem digital cash always faced is **double-spending**: copying a coin and spending it twice. A blockchain
solves it by making the *order* of transactions a matter of network agreement:

- Every node holds the ledger and can check whether funds were already spent.
- Consensus (lesson 4) decides the single agreed order of blocks, so only the first spend of a given input is
  accepted; the second is rejected as invalid.

Two models track what is spendable:

| Model | Idea | Used by |
|---|---|---|
| UTXO | Funds are discrete "unspent outputs"; a transaction consumes whole outputs and creates new ones. | Bitcoin |
| Account | Each address has a running balance and a nonce. | Ethereum |

## Pseudonymity, not anonymity

Addresses are not tied to a legal identity, so blockchains are often called anonymous. They are really
**pseudonymous**: every transaction is public and permanent, so analysis of the flow of funds, plus the points where
crypto meets the regulated world (exchanges with identity checks), frequently links addresses back to people. For a
security analyst this cuts both ways — it aids investigation of illicit flows, and it means privacy is weaker than
users assume.
