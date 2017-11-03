var Scheduler = artifacts.require("Scheduler");
var ExampleTransaction = artifacts.require("ExampleTransaction");
var ExampleReentrancyAttack = artifacts.require("ExampleReentrancyAttack");
var BigNumber = require("bignumber.js");

contract('Scheduler', function(accounts) {

  it("should schedule transaction", async function () {
    // Given
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = await scheduler.getOwner.call(0);

    // When
    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, 10, 100000, {value: '1e17'});

    // Then
    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;
    assert.equal(transactionId.toNumber(), 0, "Wrong transaction id.");
  });

  it("should execute transaction", async function () {
    // Given
    let bounty = "1e17";
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = (await scheduler.getOwner.call(0)).valueOf();

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, 10, 100000, {value: bounty});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;

    let initialBalance = new BigNumber(await web3.eth.getBalance(owner));

    // When
    let executeResult = await
        scheduler.executeTransaction(transactionId, owner);

    // Then
    let result = await testTransaction.called.call();
    assert.isTrue(result.valueOf(), "Transaction should have been executed.");

    let eventLog = executeResult.logs[0];

    assert.equal(eventLog.event, "TransactionExecuted",
        "Unexpected event type.");
    assert.equal(eventLog.args.transactionId.toNumber(),
        transactionId.toNumber(),
        "Unexpected transaction id.");
    assert.isTrue(eventLog.args.executionSuccessful,
        "Expected execution to succeed.");


    let transactionCost =  web3.eth.getTransaction(executeResult.tx).gasPrice
        .times(executeResult.receipt.gasUsed);
    let finalBalance = new BigNumber(await web3.eth.getBalance(owner));

    assert.equal(initialBalance.plus(bounty).minus(transactionCost).toNumber(),
        finalBalance.toNumber(),
        "Should have received bounty.");
  });

  it("should not execute transaction if too little gas sent",
    async function () {
    // Given
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = await scheduler.getOwner.call(0);

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, 10, 100000, {value: '1e17'});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;

    // When
    var exceptionThrown = false;
    await scheduler.executeTransaction(transactionId, owner.valueOf(),
          {gas: 100000}).catch(error => {exceptionThrown = true});

    // Then
    assert.isTrue(exceptionThrown, "Expected exception to be thrown.");
  });

  it("should not execute transaction if it's too soon",
    async function () {
    // Given
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = await scheduler.getOwner.call(0);

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() + 1000000, 100000, {value: '1e17'});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;

    // When
    var exceptionThrown = false;
    await scheduler.executeTransaction(transactionId, owner.valueOf())
        .catch(error => {exceptionThrown = true});

    // Then
    assert.isTrue(exceptionThrown, "Expected exception to be thrown.");
  });

  it("should not execute transaction if the beneficiary is wrong",
    async function () {
    // Given
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = await scheduler.getOwner.call(0);

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() - 10, 100000, {value: '1e17'});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;

    // When
    var exceptionThrown = false;
    await scheduler.executeTransaction(transactionId, "0x0")
        .catch(error => {exceptionThrown = true});

    // Then
    assert.isTrue(exceptionThrown, "Expected exception to be thrown.");
  });


  it("should execute transaction and capture the slot", async function () {
    // Given
    let bounty = "1e17";
    let scheduler = await Scheduler.new(100, 100);
    let testTransaction = await ExampleTransaction.new();
    let owner = accounts[1];

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() - 101, 100000, {value: bounty});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;
    let slotId = (await scheduler.getSlotNumber(transactionId)).valueOf();
    // Defreezes the slot.
    await scheduler.transfer(slotId, accounts[0]);
    let initialBalance = new BigNumber(await web3.eth.getBalance(owner));

    // When
    let executeResult = await
        scheduler.executeTransaction(transactionId, owner);

    // Then
    let result = await testTransaction.called.call();
    assert.isTrue(result.valueOf(), "Transaction should have been executed.");

    let executionEventLog = executeResult.logs[1];
    assert.equal(executionEventLog.event, "TransactionExecuted",
        "Unexpected event type.");
    assert.equal(executionEventLog.args.transactionId.toNumber(),
        transactionId.toNumber(),
        "Unexpected transaction id.");
    assert.isTrue(executionEventLog.args.executionSuccessful,
        "Expected execution to succeed.");

    let transferEventLog = executeResult.logs[0];
    assert.equal(transferEventLog.event, "SlotTransfered",
        "Unexpected event type.");
    assert.equal(transferEventLog.args.slotNumber.toNumber(),
        slotId,
        "Unexpected transaction id.");
    assert.equal(transferEventLog.args.newOwner,
        owner,
        "Expected execution to succeed.");

    let finalBalance = new BigNumber(await web3.eth.getBalance(owner));
    assert.equal(initialBalance.plus(bounty).toNumber(),
        finalBalance.toNumber(),
        "Should have received bounty.");

    let newOwner = await scheduler.getOwner.call(slotId);
    assert.equal(newOwner.valueOf(), owner,
        "Slot should have been captured.");
  });

  it("should execute transaction but not capture the slot if it is still frozen",
      async function () {
    // Given
    let bounty = "1e17";
    let scheduler = await Scheduler.new(100, 100);
    let testTransaction = await ExampleTransaction.new();
    let owner = accounts[1];

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() - 101, 100000, {value: bounty});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;
    let slotId = (await scheduler.getSlotNumber(transactionId)).valueOf();
    let initialBalance = new BigNumber(await web3.eth.getBalance(owner));

    // When
    let executeResult = await
        scheduler.executeTransaction(transactionId, owner);

    // Then
    let result = await testTransaction.called.call();
    assert.isTrue(result.valueOf(), "Transaction should have been executed.");

    let executionEventLog = executeResult.logs[0];

    assert.equal(executionEventLog.event, "TransactionExecuted",
        "Unexpected event type.");
    assert.equal(executionEventLog.args.transactionId.toNumber(),
        transactionId.toNumber(),
        "Unexpected transaction id.");
    assert.isTrue(executionEventLog.args.executionSuccessful,
        "Expected execution to succeed.");


    let finalBalance = new BigNumber(await web3.eth.getBalance(owner));
    assert.equal(initialBalance.plus(bounty).toNumber(),
        finalBalance.toNumber(),
        "Should have received bounty.");

    let newOwner = await scheduler.getOwner.call(slotId);
    assert.equal(newOwner.valueOf(), accounts[0],
        "Slot should have been captured.");
  });

  it("should not capture the slot if it is too soon", async function () {
    // Given
    let bounty = "1e17";
    let scheduler = await Scheduler.new(100, 100);
    let testTransaction = await ExampleTransaction.new();
    let owner = accounts[1];

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() - 10, 100000, {value: bounty});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;
    let slotId = (await scheduler.getSlotNumber(transactionId)).valueOf();
    // Defreezes the slot.
    await scheduler.transfer(slotId, accounts[0]);
    let initialBalance = new BigNumber(await web3.eth.getBalance(owner));

    // When
    var exceptionThrown = false;
    await scheduler.executeTransaction(transactionId, owner)
        .catch(error => {exceptionThrown = true});

    // Then
    assert.isTrue(exceptionThrown, "Expected exception to be thrown.");
  });


  it("should execute transaction even if gas provided can't execute target",
      async function () {
    // Given
    let bounty = "1e17";
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = (await scheduler.getOwner.call(0)).valueOf();

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, 10, 0, {value: bounty});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;
    let initialBalance = new BigNumber(await web3.eth.getBalance(owner));

    // When
    let executeResult = await
        scheduler.executeTransaction(transactionId, owner);

    // Then
    let result = await testTransaction.called.call();
    assert.isFalse(result.valueOf(), "Target should not have executed.");

    let eventLog = executeResult.logs[0];
    assert.equal(eventLog.event, "TransactionExecuted",
        "Unexpected event type.");
    assert.equal(eventLog.args.transactionId.toNumber(),
        transactionId.toNumber(),
        "Unexpected transaction id.");
    assert.isFalse(eventLog.args.executionSuccessful,
        "Expected execution to fail.");

    let transactionCost =  web3.eth.getTransaction(executeResult.tx).gasPrice
        .times(executeResult.receipt.gasUsed);
    let finalBalance = new BigNumber(await web3.eth.getBalance(owner));
    assert.equal(initialBalance.plus(bounty).minus(transactionCost).toNumber(),
        finalBalance.toNumber(),
        "Should have received bounty.");
  });


  it("should fail to run target if it tries to cancel the transaction",
      async function () {
    // Given
    let bounty = "1e17";
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleReentrancyAttack.new(scheduler.address);
    await testTransaction.schedule({value: bounty});
    let transactionId = (await testTransaction.transactionId.call()).valueOf();
    let owner = (await scheduler.getOwner.call(0)).valueOf();

    let initialBalance = new BigNumber(await web3.eth.getBalance(owner));

    // When
    let executeResult = await
        scheduler.executeTransaction(transactionId, owner);

    // Then
    let result = await testTransaction.called.call();
    assert.isFalse(result.valueOf(), "Target should not have executed.");

    let eventLog = executeResult.logs[0];
    assert.equal(eventLog.event, "TransactionExecuted",
        "Unexpected event type.");
    assert.equal(eventLog.args.transactionId.toNumber(),
        transactionId,
        "Unexpected transaction id.");
    assert.isFalse(eventLog.args.executionSuccessful,
        "Expected execution to fail.");

    let transactionCost =  web3.eth.getTransaction(executeResult.tx).gasPrice
        .times(executeResult.receipt.gasUsed);
    let finalBalance = new BigNumber(await web3.eth.getBalance(owner));
    assert.equal(initialBalance.plus(bounty).minus(transactionCost).toNumber(),
        finalBalance.toNumber(),
        "Should have received bounty.");

    let attackerBalance =
        new BigNumber(await web3.eth.getBalance(testTransaction.address));
    assert.equal(attackerBalance.toNumber(), 0,
        "Attacker should have zero balance.");
  });

  it("should not execute transaction if the bounty is too small.",
      async function () {
    // Given
    let scheduler = await Scheduler.new(100, 1800);
    let testTransaction = await ExampleTransaction.new();
    let owner = await scheduler.getOwner.call(0);

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() - 1, 100000, {value: 1});

    let transactionId = scheduleTransactionResult.logs[0].args.transactionId;

    // When
    var exceptionThrown = false;
    await scheduler.executeTransaction(transactionId, owner.valueOf())
        .catch(error => {exceptionThrown = true});

    // Then
    assert.isTrue(exceptionThrown, "Expected exception to be thrown.");
  });

  it("should not be able to call function for capturing slot directly.",
    async function () {
    // Given
    let scheduler = await Scheduler.new(100, 1800);

    // Then
    assert.equal(scheduler.stealSlotIfPossible, undefined,
        "Expected exception to be thrown.");
  });

  function now () {
    return web3.eth.getBlock("latest").timestamp;
  }
});
