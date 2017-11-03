pragma solidity ^0.4.15;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "contracts/Scheduler.sol";

contract OwnerContract {

    uint numberOfSlots = 100000;
    uint graceWindow = 30;
    Scheduler public scheduler;
    address target;
    uint slot;

    function OwnerContract(address targetArg,
      uint slotArg) {
      scheduler = new Scheduler(numberOfSlots, graceWindow);
      target = targetArg;
      slot = slotArg;
    }

    function doTransfer() {
      scheduler.transfer(slot, target);
    }
}

contract TestScheduler {

  address constant ADDRESS_NULL = 0x0;
  uint public initialBalance = 1 ether;

  function testConstructor() {
    // Given
    uint numberOfSlots = 300000;
    uint graceWindow = 30;

    // When
    Scheduler scheduler = new Scheduler(numberOfSlots, graceWindow);

    // Then
    Assert.equal(scheduler.maxSlots(), numberOfSlots,
        "Unexpected number of slots.");
    Assert.equal(scheduler.graceWindow(), graceWindow,
        "Unexpected grace window.");
    Assert.equal(scheduler.owner(), address(this),
        "Unexpected owner.");
    Assert.equal(scheduler.totalCreatedTransactions(), 0,
        "Unexpected totalCreatedTransactions.");
  }

  function testTransfer() {
    // Given
    uint numberOfSlots = 300000;
    uint graceWindow = 30;

    Scheduler scheduler = new Scheduler(numberOfSlots, graceWindow);
    address newOwner = 0x1;

    // When
    scheduler.transfer(100, newOwner);

    // Then
    Assert.equal(scheduler.getOwner(100), newOwner, "Unexpected owner");
  }

  function testDoubleSpendTransfer() {
    // Given
    address newOwner = new OwnerContract(address(this), 0);

    doTransfer(newOwner);

    // When
    bool transferSuccessful = doTransfer(newOwner);

    // Then
    Assert.isFalse(transferSuccessful, "Transfer should not work.");
  }

  function testSuccessfulTransfer() {
    // Given
    uint numberOfSlots = 300000;
    uint graceWindow = 30;
    uint slotToTransfer = 1;

    Scheduler scheduler = new Scheduler(numberOfSlots, graceWindow);
    address newOwner = 0x1;

    // When
    scheduler.transfer(slotToTransfer, newOwner);

    // Then
    Assert.equal(scheduler.getOwner(slotToTransfer), newOwner,
        "Wrong new owner.");
  }

  function testFullRoundTransfer() {
    // Given
    uint numberOfSlots = 300;
    uint graceWindow = 30;
    uint slotToTransfer = 0;

    OwnerContract newOwner = new OwnerContract(address(this), slotToTransfer);
    doTransfer(newOwner);

    // When
    newOwner.scheduler().transfer(slotToTransfer, newOwner);

    // Then

    Assert.equal(newOwner.scheduler().getOwner(slotToTransfer), newOwner,
        "Wrong new owner.");
  }

  function doTransfer(address ownerContract) internal returns(bool) {
    return ownerContract.call(bytes4(bytes32(sha3("doTransfer()"))));
  }


  function testTransferOfNonExistingSlotShouldFail() {
    // Given
    address newOwner = new OwnerContract(address(this), 100000);

    // When
    bool transferSuccessful = doTransfer(newOwner);

    // Then
    Assert.isFalse(transferSuccessful, "Transfer should not work.");
  }

  function testScheduleTransaction() {
    // Given
    Scheduler scheduler = new Scheduler(300, 1000);

    // When
    uint transactionId = scheduler.scheduleTransaction.value(1000000 wei)
      (address(this), //target
      now, // startTime
      1000000); // targetGas

    // Then
    Assert.equal(scheduler.getBounty(transactionId), 1000000 wei,
        "Unexpected bounty.");
  }

  function () payable {}

  function testCancelTransaction() {
    // Given
    Scheduler scheduler = new Scheduler(300, 1000);

    uint transactionId = scheduler.scheduleTransaction.value(1000000 wei)
      (address(this), //target
      now, // startTime
      1000000); // targetGas

    var balance = this.balance;

    // When
    scheduler.cancelScheduledTransaction(transactionId);

    // Then
    Assert.equal(scheduler.getBounty(transactionId), 0 wei, "Unexpected bounty.");
    Assert.equal(this.balance, balance + 1000000 wei, "Wrong balance");
  }

  function testCantExecuteTransactionFromWithinSolidity() {
    // Given
    Scheduler scheduler = new Scheduler(300, 1000);

    uint transactionId = scheduler.scheduleTransaction.value(100 finney)
      (address(this), //target
      123, // startTime
      500000); // targetGas

    // When
    bool result = scheduler.call(
        bytes4(sha3("executeTransaction(uint256,address)")),
        transactionId, address(this));

    // Then
    Assert.isFalse(result,
        "Should not be able to execute transaction.");
  }
}
