pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20Basic.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract PolyMathVesting is Ownable {
  using SafeMath for uint256;

  // Contract holds ERC20 POLY tokens.
  ERC20Basic token;

  // Important dates for vesting contract.
  uint256 startTime;
  uint256 cliffTime;
  uint256 releaseTime;

  // Small caveat 1 month will be considered as 30 days and therefore
  // 1 year 360 days.
  uint256 constant period = 30 days;
  uint256 numPeriods;

  // Mappings on how much is allocated and how much has been collected
  mapping (address => uint256) allocations;
  mapping (address => uint256) collections;

  // General allocated and collected variables.
  uint256 allocated;
  uint256 collected;

  event TokensWithdrawn(address indexed _holder, uint256 _amount);

  function PolyMathVesting(
      address _token,
      uint256 _startTime,
      uint256 _cliffTime,
      uint256 _releaseTime
  ) public {
    require(_token != 0x0);
    require(_startTime > getBlockTimestamp());
    require(_cliffTime >= _startTime);
    require(_releaseTime >= _cliffTime);
    token = ERC20Basic(_token);
    startTime = _startTime;
    cliffTime = _cliffTime;
    releaseTime = _releaseTime;
    numPeriods = releaseTime.sub(startTime).div(period);
  }

  function allocateArray(
      address[] _holders,
      uint256[] _amounts
  ) public onlyOwner {
    require(_holders.length == _amounts.length);
    for (uint256 i = 0; i < _holders.length; i++) {
      allocate(_holders[i], _amounts[i]);
    }
  }

  function allocate(address _holder, uint256 _amount) public onlyOwner {
    allocated = allocated.sub(allocations[_holder]).add(_amount);
    require(allocated <= token.balanceOf(address(this)));
    allocations[_holder] = _amount;
  }

  function collect() public {
    require(getBlockTimestamp() >= cliffTime);
    uint256 balance = allocations[msg.sender];
    uint256 total = collections[msg.sender].add(balance);

    uint256 periodsPassed = getBlockTimestamp().sub(startTime).div(period);

    uint256 entitled = total.mul(periodsPassed).div(numPeriods);

    entitled = entitled.sub(collections[msg.sender]);

    if (entitled > balance) {
      entitled = balance;
    }

    allocations[msg.sender] = allocations[msg.sender].sub(entitled);
    collections[msg.sender] = collections[msg.sender].add(entitled);
    allocated = allocated.sub(entitled);
    collected = collected.add(entitled);

    require(token.transfer(msg.sender, entitled));

    TokensWithdrawn(msg.sender, entitled);
  }

  function getBlockTimestamp() internal view returns (uint256) {
    return block.timestamp;
  }
}
