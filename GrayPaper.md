# ChronoToken

_A wizard is never late, nor is he early. He arrives precisely when he means
to._
-- Gandalf the Gray

## Abstract

Chrono Token is a novel approach to scheduling transaction execution in
the Ethereum distributed network. By using an innovative technique called
"strings-attached token" (SAT) it creates a marketplace where there is a high
probability of all scheduled transactions being executed, while creating
a reasonably stable income stream for service providers, without requiring
a centralized third party.

## The problem

Ethereum is a decentralized computing network based on blockchain technology
that operates as a global virtual machine capable of executing operations
and transferring value in a trustless environment. This works by storing
code in the blockchain and initiating execution in the EVM by sending messages
signed by the user's private key.

One limitation of this model is that, unlike
a regular computer, the Ethereum Virtual Machine (EVM) requires an external
input (and associated cost) to start any computation. More specifically, it is
impossible to schedule an execution for a certain time in the future, and it is
up to any interested party to watch for the right time to come, and send
the appropriate message to the EVM, bearing all the costs of this process.

While in many simple situations this is hardly a limitation, as the number of
future transactions a given party is interested in, bookkeeping can become
very expensive. More importantly, as the number of participants in a given
transaction becomes significant, a _tragedy of commons_ situation may arise
if a single participant is expected to bear all the cost of initiating a
scheduled transaction.

Of course it is possible for every single application to
create its own rules and incentives to work around this limitation, but it
adds unnecessary complexity and risks to its design.

This project aims at taking away these concerns from each individual application,
 while providing a robust solution with high reliability from the perspective of the
consuming applications, and a certain level of predictability for the return over their
infrastructure costs for those initiating the scheduled transactions (service
providers).

Ultimately, _ChronoToken_ is about fulfilling the promise of the EVM: making
immutable, trustless code that can execute by itself on the world-wide
computer that is the Ethereum Network.


## Previous attempts at solving the problem.

User _pipermerriam_ created a series of contracts called _Ethereum Alarm Clock_
that aim at solving precisely the same problem stated above. The main idea is
to allow users or contracts to offer a bounty that will be paid to anyone
initiating a certain transaction in a pre-determined block or timestamp in the
future. While this initiative is highly commendable, and has inspired the
creation of our own _Chrono Token_, we identify some important limitations in their approach. The most essential one is:

-  _No incentives for service providers (the users initiating the scheduled
  transactions) to join the network and remain online._
  Since all bounties are _free for all_,
  and presumably several users will compete for each individual bounty, it is
  not possible for any user to be sure they will succeed in getting any
  bounties at any time, so the incentive to be online is limited. Also,
  there is no penalty for going off-line.

While there has been some recent interest in reviving the Alarm Clock project,
this fundamental limitation seems not to be addressed, which makes it success
unlikely.

## Project Philosophy

- _Make it Simple: a feature that doesn't add value is effectively a bug_.
  While simplicity is an important goal in every project, in the crypto world
  it is essential. Bloated software is much harder to maintain and audit. Every
  unneeded feature adds further attack surface, and might introduce new bugs.
  In Ethereum smart contracts, even the use of seemingly inoffensive libraries,
  if they are not thoroughly audited and validated, may lead to major vulnerabilities,
  as evidenced by the attack on the _Parity Multi-sig Wallet_ that lead to the
  loss of millions of dollars worth of ether.

- _Make it Trustless: if you still need to trust a third party, you don't need
  a blockchain._
  It is essential to that consumers of the API don't have to trust any third-party,
  including the ChronoToken development team, or the current holders of the tokens
  at any point in time.

- _Make it Reliable: an unreliable API can't be used as part of any significant
project._  
  While it is impossible to give absolute guarantees, this project aims to create
  a structure of incentives strong enough to make a failure to call a scheduled
  transaction extremely unlikely. We estimate that, once mature, this solution
  will be as reliable as the Ethereum network itself.

## Architecture

The ChronoToken transaction scheduler eco-system is comprised of three elements:
- _The ChronoToken Smart Contract_: this smart contract, delivered to the Ethereum
block chain, controls token ownership, maintains a database of scheduled transactions
and holds bounty funds in ether. This contract is called both by API consumers and service
providers.

- _API Consumers_: can be both ordinary users or other smart contracts that interact
with the ChronoToken smart contract in order to schedule future transactions.
They offer bounties in ether for each transaction scheduled that will be part
of the incentive for _Service Providers_ to run the specified code when the
time comes.

- _Service Providers (Token Holders):_ these users run ChronoToken client nodes,
either using the software provided in the ChronoToken open source project or a
compatible proprietary software, that watches the Ethereum network for scheduled
transactions and initiate their execution once the scheduled time arrives.
They make a profit from this endeavor by collecting the bounties associated
with each transaction.


## String-Attached Tokens

Each token (also called a slot in this context) represents a fraction of the existing
market share for scheduling transactions. For example, if the total supply
is 100 slots, each slot gives the owner the possibility to execute 1/100 of all
scheduled transactions and collect the corresponding bounties. But this only
apply _as long as the service level is maintained_. Any deviation from the
service level may lead to lost tokens.

When each transaction is scheduled a token id is associated with it (there is a
  rotation among all tokens). At the appointed time of execution, there is a time
  window during which the owner of the token is granted exclusive right for
  executing that transaction and getting the bounty. After that time window,
  anyone can execute it, get the bounty, and more: capture the token. This
  capture mechanism means that even if all the tokens are owned by a single
  party, failing to execute a scheduled transaction make that party vulnerable
  to having its market dominance ended. This is a very strong incentive
  for every token owner to keep providing the service at a high availability,
  and censorship is virtually impossible.

For example, if the time window is set to 1 hour, let's suppose that a given
transaction has been allotted to slot (or token) with id 0, and set for today at 9am.
From 9am to 10am, the owner of token 0 has an exclusive claim to executing the
transaction and collecting the bounty. From 10am onwards, any user can execute
the transaction, and if they do so, they _capture_ slot 0 from the original
owner. This creates a very large incentive for executing each transactions,
without the need to increase the bounty.

## Possible Applications

The innovative infrastructure provided by ChronoToken has a number of real world
use cases. Here we present a few ideas:
- _Scheduled Payments_: the simplest application is just to hold funds for a
certain amount of time, and let it be paid at a given time, without any further
interaction by the receiver of the funds.
- _Living Contracts_: one of the most exciting ideas made possible by ChronoToken
is to create smart contracts that are effectively alive, running code, say,
every day, and taking actions at each time, making decisions of its own, all without
any further interaction from the contract creator, and requiring no trusted third
party.
- _Autonomous Algo Trader_: in this idea, a living contract maintains balances
in several different ERC-20 tokens and, by use of a distributed exchange (there
  are many currently in development), makes trades between them until a certain
  expiration date, when all tokens are exchanged for ether and delivered back
  to the creator of the algo trader. Alternatively, the trader contract could
  never return funds and be used to fill gaps in the market for the benefit of
  all, instead of the profit of a single individual or group.

  Ultimately, the sky is the limit. A simple idea - reliably scheduling transactions
  - opens up unlimited possibilities of novel applications and opportunities.
