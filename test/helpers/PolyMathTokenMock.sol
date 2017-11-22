pragma solidity ^0.4.13;

import '../../contracts/PolyMathToken.sol';

contract PolyMathTokenMock is PolyMathToken {
  uint256 public timeStamp = block.timestamp;

  function setBlockTimestamp(uint256 _timeStamp) public {
    timeStamp = _timeStamp;
  }

  function getBlockTimestamp() internal constant returns (uint256) {
    return timeStamp;
  }

  function PolyMathTokenMock(address _presale_wallet) PolyMathToken(_presale_wallet)
  {
  }

}
