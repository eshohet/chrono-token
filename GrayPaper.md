# Chrono Token

_A wizard is never late, nor is he early. He arrives precisely when he means
to._
-- Gandalf the Gray

# Abstract

Chrono Token is a novel approach to scheduling transaction execution in
the Ethereum distributed network. By using an innovative technique called
"strings-attached token" (SAT) it creates a marketplace where there is a high
probability of all scheduled transactions being executed, while creating
a reasonably stable income stream for service providers, without requiring
a centralized third party.

# The problem

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

Of course it is possible for every single distributed application (Dapp) to
create its own rules and incentives to work around this limitation, but it
adds unnecessary complexity and risks to its design.

This project aims at taking away these concerns from each individual Dapp, while
providing a robust solution with high reliability from the perspective of the
consuming Dapps, and a certain level of predictability for the return over their
infrastructure costs for those initiating the scheduled transactions (service
providers).

# _Status Quaestionis_

## Ethereum Alarm Clock

User _pipermerriam_ created a series of contracts called _Ethereum Alarm Clock_
that aim at solving precisely the same problem stated above. The main idea is
to allow users or contracts to offer a bounty that will be paid to anyone
initiating a certain transaction in a pre-determined block or timestamp in the
future. While this initiative is highly commendable, and has inspired the
creation of our own _Chrono Token_, we identify several limitations and
weaknesses in their approach:

-  _No incentives for service providers (the users initiating the scheduled
  transactions) to remain online._ Since all bounties are _free for all_,
  and presumably several users will compete for each individual bounty, it is
  not possible for any user to be sure they will succeed in getting any
  bounties at any time, so the incentive to be online is limited. Also,
  there is no penalty for going off-line.
-

### Brief description

### Limitations

### Misconceptions


# Chrono Token: general overview

## Project Goals and Principles

- decentralization
- simplicity
- reliability

## General Architecture

## String-Attached Tokens

## Possible Applications
