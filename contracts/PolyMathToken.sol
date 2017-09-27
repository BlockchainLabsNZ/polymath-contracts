pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/token/PausableToken.sol';

contract PolyMathToken is PausableToken {

  // Token properties.
  string public constant name = 'PolyMathToken';
  string public constant symbol = 'POLY';
  // ERC20 compliant types
  // (see https://blog.zeppelin.solutions/tierion-network-token-audit-163850fd1787)
  uint8 public constant decimals = 18;
  // 1 billion POLY tokens in units divisible up to 18 decimals.
  uint256 public constant INITIAL_SUPPLY = 1000 * (10**6) * (10**uint256(decimals));

  function PolyMathToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

  // Don't accept calls to the contract address; must call a method.
  function () {
    revert();
  }

}
