pragma solidity ^0.4.15;

contract Scheduler {

  address constant NULL_ADDRESS = 0x0;
  uint constant GAS_BUFFER = 40000;

  event SlotTransfered (
    uint slotNumber,
    address newOwner
  );

  event TransactionScheduled (
    uint transactionId,
    uint slot,
    uint startDate
  );

  event TransactionExecuted (
    uint transactionId,
    bool executionSuccessful
  );

  event TransactionCancelled (
    uint transactionId
  );

  struct Slot {
    // TODO create separate beneficiary and owner. This is makes it possible
    // to make a client that has the beneficiary key and uses its funds to pay
    // for new transactions without keeping the owner's key vulnerable in a hot
    // server. The alternative would be to have a lot of funds in a separate account
    // used by the client, then periodically transfer from the beneficiary to it,
    // but that could get tricky if transaction volume goes up. This change
    // requires updating the transfer method and the slot capture method, as
    // well as creating a new method for getting the beneficiary of a slot.
    // TODO create a simple defrozen bool here, in order to decouple transfering
    // the slots and defreezing them. It also prevents slots from being
    // forever frozen in case the default owner is compromised.
    address owner;

  }

  mapping(uint => Slot) public slots;
  uint public maxSlots;
  uint public graceWindow;
  uint public totalCreatedTransactions;
  uint public lastTimeStolen;
  address public owner;

  struct ScheduledTransactionEntry {
    uint startTime;
    address target;
    uint32 targetGas;
    address owner;
    uint balance;
  }

  mapping(uint => ScheduledTransactionEntry) public scheduledTransactions;

  function Scheduler(uint numberOfSlots, uint initialGraceWindow) {
    maxSlots = numberOfSlots;
    graceWindow = initialGraceWindow;
    owner = msg.sender;
  }

  function getOwner(uint slotNumber)
      public constant
      returns (address) {
    if (slots[slotNumber].owner == 0x0) {
      return owner;
    }

    return slots[slotNumber].owner;
  }

  function transfer(uint slotNumber, address newOwner)
    external {
    require(msg.sender == getOwner(slotNumber));
    require(slotNumber < maxSlots);

    slots[slotNumber].owner = newOwner;

    SlotTransfered(slotNumber, newOwner);
  }

  function getSlotNumber(uint transactionId)
      constant
      returns (uint) {
    return transactionId % maxSlots;
  }


  function scheduleTransaction(address target,
      uint startTime,
      uint32 targetGas)
      payable
      returns (uint) {

    uint transactionId = totalCreatedTransactions;

    totalCreatedTransactions++;

    scheduledTransactions[transactionId].startTime = startTime;
    scheduledTransactions[transactionId].target = target;
    scheduledTransactions[transactionId].targetGas = targetGas;
    scheduledTransactions[transactionId].owner = msg.sender;
    scheduledTransactions[transactionId].balance = msg.value;

    TransactionScheduled(
        transactionId,
        getSlotNumber(transactionId),
        scheduledTransactions[transactionId].startTime);

    return transactionId;
  }

  function cancelScheduledTransaction(uint transactionId)
    external {
    require(scheduledTransactions[transactionId].owner == msg.sender);

    var balance = scheduledTransactions[transactionId].balance;

    delete scheduledTransactions[transactionId];

    TransactionCancelled(transactionId);

    msg.sender.transfer(balance);
  }

  function getBounty(uint transactionId) constant
      returns (uint) {

    return scheduledTransactions[transactionId].balance;
  }

// TODO should limit the time window for capturing a slot, in order
// to prevent DoS attacks.
// TODO should create a maximum "thaw" period after which all slots are
// defrozen. This prevents some slots being forever frozen in case the default
// owner's key is compromised.
  function stealSlotIfPossible(uint transactionId, address newBeneficiary)
    private
    returns (address) {

    require(scheduledTransactions[transactionId].target != NULL_ADDRESS);

    Slot storage transactionSlot =
        slots[getSlotNumber(transactionId)];

    address transactionBeneficiary = getOwner(getSlotNumber(transactionId));

    if (now > scheduledTransactions[transactionId].startTime + graceWindow) {

      if (lastTimeStolen + graceWindow < now
          && transactionSlot.owner != NULL_ADDRESS) {
        transactionSlot.owner = newBeneficiary;
        lastTimeStolen = now;
        SlotTransfered(getSlotNumber(transactionId), newBeneficiary);
      }

      transactionBeneficiary = newBeneficiary;
    }

    return transactionBeneficiary;
  }


  function executeTransaction(uint transactionId, address beneficiary) external
      returns (bool) {

    uint initialGas = msg.gas;

    /*
      Prevents reentrancy, stack depth attacks.
      This is cheaper than a mutex or stack check (note that the stack limit is
      poised to die, but seems to be still enforced as per
      https://github.com/ethereum/go-ethereum/blob/0cc492f81595c28caa24964a105446e362164539/core/vm/stack_table.go).
      It makes it impossible to call this function from within another
      contract though, which is not a problem for this specific protocol, since
      the owner of the slot (or receiver of the funds) need nod sign the TX.
      Another practical effect of it is that it won't be possible to test
      this function from Solidity.
      A stack depth attack could prevent the scheduled transaction from being
      executed, while the caller could still get the bounty, effectively
      stealing the ether.
    */
    require(msg.sender == tx.origin);

    ScheduledTransactionEntry storage transaction =
        scheduledTransactions[transactionId];

    require(now >= transaction.startTime);
    require(stealSlotIfPossible(transactionId, beneficiary) == beneficiary);

    // prevents transactions with insufficient bounty to pay for its gas.
    require(transaction.balance >
        (GAS_BUFFER + transaction.targetGas + initialGas - msg.gas)
            * tx.gasprice);

    require(msg.gas > transaction.targetGas + GAS_BUFFER);

    // We erase the transaction before calling outside code in order to prevent
    // the transaction from being cancelled (and the ether taken back)
    // by the target contract (reentrancy into another funcion of this contract).
    var balance = transaction.balance;
    var targetGas = transaction.targetGas;
    var target = transaction.target;

    delete scheduledTransactions[transactionId];

    // TODO pass the scheduled transaction id on, that can be used for
    // filtering behaviour.
    var callResult = target.call.gas(targetGas)
        (bytes4(sha3("schedulerCallBack()")));

    TransactionExecuted(transactionId, callResult);

    beneficiary.transfer(balance);

    return callResult;
  }
}
