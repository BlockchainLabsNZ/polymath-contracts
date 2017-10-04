pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/token/PausableToken.sol';

contract PolyMathTimelock {

  // Contract holds ERC20 POLY tokens.
  // Tokens to be deposited for team and advisors.
  // Tokens to be deposited for bounties.
  PausableToken token;

  // Date to release tokens.
  uint64 releaseTime;

  // Beneficiary mapping similar to approach used in the BAT token sale
  // https://github.com/brave-intl/basic-attention-token-crowdsale/blob/master/contracts/BATSafe.sol
  mapping (address => uint256) allocations;

  uint256 vestingAmount = 1000000000000000000;

  function PolyMathTimelock(PausableToken _token, uint64 _releaseTime) {
    require(_releaseTime > getBlockTimestamp());
    token = _token;
    releaseTime = _releaseTime;

  // Allocated token balances for vesting (18 decimals required)
    allocations[0x0] = vestingAmount;
  }

  function release() {
    require(getBlockTimestamp() >= releaseTime);

    uint256 entitled = allocations[msg.sender];
    allocations[msg.sender] = 0;

    uint256 amount = token.balanceOf(this);
    require(amount > 0);

    require(token.transfer(msg.sender, entitled));
  }

   function getBlockTimestamp() internal constant returns (uint256) {
     return block.timestamp;
   }
}
