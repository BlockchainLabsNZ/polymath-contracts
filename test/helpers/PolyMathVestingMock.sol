pragma solidity ^0.4.15;

import '../../contracts/PolyMathVesting.sol';

contract PolyMathVestingMock is PolyMathVesting {
  uint256 public timeStamp = now;
  function setBlockTimestamp(uint256 _timeStamp) public {
    timeStamp = _timeStamp;
  }

  function getBlockTimestamp() internal constant returns (uint256) {
    return timeStamp;
  }

  function PolyMathVestingMock(PausableToken _token, uint64 _releaseTime, address _vestingAddress)
    PolyMathVesting(_token, _releaseTime, _vestingAddress)
  {
  }

}
