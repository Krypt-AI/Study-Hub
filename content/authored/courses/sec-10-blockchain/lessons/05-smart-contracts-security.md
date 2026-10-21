---
id: sec-10-blockchain.l05
title: Smart contracts and security
summary: What smart contracts are, the security model of code that controls money, the common vulnerability classes, wallet and key risks, and where blockchains genuinely fit.
objectives:
  - Explain what a smart contract is and why immutability cuts both ways
  - Recognise the main smart-contract and ecosystem risk classes
  - Judge when a blockchain is the right tool
estimatedMinutes: 50
topics: [sec10.security]
resources:
  - { title: "Ethereum.org: smart contract security", url: "https://ethereum.org/en/developers/docs/smart-contracts/security/", free: true, official: false }
  - { title: "OWASP Smart Contract Top 10", url: "https://owasp.org/www-project-smart-contract-top-10/", free: true, official: true }
  - { title: "NIST IR 8202: Blockchain Technology Overview", url: "https://csrc.nist.gov/pubs/ir/8202/final", free: true, official: true }
  - { title: "CISA: Cryptocurrency / blockchain guidance", url: "https://www.cisa.gov/", free: true, official: true }
---

## Smart contracts

A **smart contract** is a program stored on the blockchain that runs exactly as written when called, with its own
balance and state. It lets strangers transact under rules no single party can override — tokens, exchanges, lending,
and more (collectively "DeFi"). Ethereum popularised them; contracts are usually written in **Solidity** and run on the
**Ethereum Virtual Machine (EVM)**.

The defining property is **immutability**: once deployed, the code cannot normally be changed. That removes the need to
trust an operator — and means a **bug is permanent** unless the author built in an upgrade mechanism. Code that holds
money, cannot be patched, and is fully public for attackers to study is an unforgiving security environment. Many of
the largest crypto losses were contract bugs, not broken cryptography.

## Common vulnerability classes

| Class | What goes wrong |
|---|---|
| **Reentrancy** | A contract calls out to another before updating its own state; the callee calls back in and drains funds (the classic "The DAO" loss). |
| **Integer / arithmetic errors** | Overflows or rounding let balances be inflated or siphoned. |
| **Access control** | A privileged function (mint, withdraw, upgrade) is left callable by anyone. |
| **Oracle / price manipulation** | A contract trusts an external price that an attacker moves, often with a flash loan. |
| **Unchecked external calls / logic errors** | Return values ignored, wrong assumptions about ordering or gas. |

The defences are software-security defences applied ruthlessly: follow checks-effects-interactions, use audited
libraries (OpenZeppelin), get independent audits, run automated analysers, and test adversarially — the same mindset
as the Web Application Security course, with money and immutability raising the stakes.

## Ecosystem and key risks

Most people lose funds not to broken math but to the edges:

- **Key management.** Lose the private key or seed phrase and funds are gone forever; leak it and they are stolen
  instantly. Hardware wallets and careful seed backup matter more than any on-chain feature.
- **Phishing and approvals.** Users are tricked into signing a malicious transaction or granting a token "approval"
  that lets a contract drain their wallet. Signing is authorising — read what you sign.
- **Scams.** Fake tokens, "rug pulls", and impersonation are rampant precisely because transactions are irreversible
  and pseudonymous.
- **Custodial risk.** Coins on an exchange are controlled by the exchange ("not your keys, not your coins"); exchange
  failures and hacks have lost user funds.

## When a blockchain is the right tool

Blockchains genuinely help when **no single party should be trusted to own the record** and participants are mutually
distrusting — permissionless digital cash, public auditability, some supply-chain and settlement cases. They are a poor
fit when one trusted party can run the system (a database is faster, cheaper, private and editable), when you need
confidentiality, or when you need to undo mistakes. For a security professional the job is usually to assess these
systems soberly: strong cryptographic integrity, but real and concentrated risk in contracts, keys and the human edges.
