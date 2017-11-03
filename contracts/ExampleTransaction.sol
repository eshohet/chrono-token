pragma solidity ^0.4.15;

import "contracts/Scheduler.sol";

contract ExampleTransaction {

  bool public called;
  uint public calledTime;
  address public caller;

  function schedulerCallBack() payable public {
    called  = true;
    calledTime = now;
    caller = msg.sender;
  }
}

contract ExampleReentrancyAttack {

  Scheduler public scheduler;
  uint public transactionId;
  bool public called;

  function () payable public {

  }

  function ExampleReentrancyAttack(Scheduler _scheduler) public {
    scheduler = _scheduler;
  }

  function schedule() payable public {
    transactionId = scheduler
        .scheduleTransaction.value(msg.value)(this, now, 50000);
  }

  function schedulerCallBack() payable public {
    called = true;
    scheduler.cancelScheduledTransaction(transactionId);
  }
}
