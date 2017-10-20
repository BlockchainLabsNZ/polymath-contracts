pragma solidity ^0.4.15;

import '../../contracts/PolyMathTokenOffering.sol';

contract PolyMathTokenOfferingMock is PolyMathTokenOffering {
  uint256 public timeStamp = block.timestamp;

  function setBlockTimestamp(uint256 _timeStamp) public onlyOwner {
    timeStamp = _timeStamp;
  }

  function getBlockTimestamp() internal constant returns (uint256) {
    return timeStamp;
  }

  function PolyMathTokenOfferingMock(address _token, uint256 _startTime, uint256 _endTime, uint256 _cap, address _wallet)
    PolyMathTokenOffering(_token, _startTime, _endTime, _cap, _wallet)
  {
  }

}
