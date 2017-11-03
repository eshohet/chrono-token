var BigNumber = require("bignumber.js");

class ClientLib {
  constructor (scheduler, web3, owner) {
    this.web3 = web3;
    this.scheduler = scheduler;
    this.owner = owner;
    this.transactions = {};
  }

// TODO create timeout for failing transactions.
// TODO use get events to build the initial database.
// TODO migrate functions to client lib.
// TODO use SQLite for faster db.
// TODO create CLI.

  async startup () {
    let self = this;

    let graceWindow = (await self.scheduler.graceWindow.call()).valueOf();

    this.scheduler.TransactionScheduled().watch(function (error, data) {
      self.transactions[data.args.transactionId] = data.args;

      console.log("Transaction Scheduled");
      console.log(self.transactions);
    });

    this.scheduler.TransactionCancelled().watch(function (error, data) {
      delete self.transactions[data.args.transactionId];

      console.log("Transaction cancelled");
      console.log(self.transactions);
    });

    this.scheduler.TransactionExecuted().watch(function (error, data) {
      delete self.transactions[data.args.transactionId];

      console.log("Transaction Executed");
      console.log(self.transactions);
    });

    setInterval(async function () {
      for (var id in self.transactions) {
        console.log(id);
        console.log(self.transactions[id]);
        let startTime = self.transactions[id].startDate.toNumber();
        console.log(startTime);
        console.log(self.now());
        if (startTime <= self.now()) {
          let slotNumber = (await self.scheduler.getSlotNumber
                  .call(id)).valueOf();
          let ownerAddress = (await self.scheduler.getOwner
                  .call(slotNumber)).address;
          console.log(self.owner.address);
          console.log(ownerAddress);

          if (ownerAddress == self.owner.address
              || self.now() > startTime + graceWindow) {
            try {
              console.log("Executing " + id);
                await self.scheduler.executeTransaction.call(id, self.owner);
                await self.scheduler.executeTransaction(id, self.owner);
            } catch (exception) {
              self.transactions[id].startDate =
                  new BigNumber(self.now() + 30000);
            }
          }
        }
      }
    }, 30000);
  }

  now () {
    return this.web3.eth.getBlock("latest").timestamp;
  }

}

module.exports = ClientLib;
