# ChronoToken

ChronoToken is a novel approach to scheduling transaction execution in
the Ethereum distributed network. By using an innovative technique called
"strings-attached token" (SAT) that creates a marketplace where there is a high
probability of all scheduled transactions being executed, while creating
a reasonably stable income stream for service providers, all that without requiring
a centralized third party.

## Why?

ChronoToken solves a fundamental problem with _Ethereum-Alarm-Clock_, that is,
_the lack of incentive for joining the network and not leaving_.

## How it works

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

## Development
One of the main principles we follow in this project is that of simplicity.
Small code is easier to maintain, easier to audit, cheaper to run, and
has a smaller area to protect from attacks. _A feature that does not add value is effectively a bug_.

The current version of the main contract (Scheduler.sol) is under 300 lines,
and we don't expect it to grow to more than twice that size.

The code is developed using Truffle.

## TODO

- TODO create separate beneficiary and owner. This is makes it possible
to make a client that has the beneficiary key and uses its funds to pay for new transactions without keeping the owner's key vulnerable in a hot
server. The alternative would be to have a lot of funds in a separate account
used by the client, then periodically transfer from the beneficiary to it,
but that could get tricky if transaction volume goes up. This change
requires updating the transfer method and the slot capture method, as
well as creating a new method for getting the beneficiary of a slot.

- TODO create a simple unfrozen bool, in order to decouple transferring
the slots and unfreezing them. It also prevents slots from being
forever frozen in case the default owner is compromised.

- TODO should limit the time window for capturing a slot, in order
to prevent DoS attacks.

- TODO should create a maximum "thaw" period after which all slots are
automatically unfrozen. This prevents some slots being forever frozen in case the default
owner's key is compromised.

- Most of the client software must still be coded.

- General style consistency, documentation.
