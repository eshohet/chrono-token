
var ClientLib = require('../lib/client_lib.js');

var Scheduler = artifacts.require("Scheduler");
var ExampleTransaction = artifacts.require("ExampleTransaction");
var BigNumber = require("bignumber.js");


contract('Scheduler', function(accounts) {

  it("should be able to track transactions.",
      async function () {

    // TODO actually test (assertions) instead of just running the client.
    // Given
    let scheduler = await Scheduler.new(100, 60);
    let owner = await scheduler.getOwner.call(0);

    let clientLib = new ClientLib(scheduler,web3, owner);
    clientLib.startup();


    // Continuously mine blocks
    setInterval(function () {
      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_mine",
        id: 12345
      }, function(err, result) {
        // NO-OP
      });
      console.log("Block mined: " + now());
    }, 10000);



    let testTransaction = await ExampleTransaction.new();

    // When
    console.log("Scheduling transactions...");


    await scheduler.scheduleTransaction(
        testTransaction.address, now() - 1, 100000, {value: "1e16"});

    await scheduler.cancelScheduledTransaction(0);

    let scheduleTransactionResult = await scheduler.scheduleTransaction(
        testTransaction.address, now() - 1, 100000, {value: "1e9"});

        await scheduler.scheduleTransaction(
            testTransaction.address, now() + 30, 100000, {value: "1e17"});

    await scheduler.transfer(2, "0x123");

    await scheduler.scheduleTransaction(
        testTransaction.address, now() + 10, 100000, {value: "1e17"});


  });

  function now () {
    return web3.eth.getBlock("latest").timestamp;
  }
});
