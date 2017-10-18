pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';

contract PolyMathToken is Ownable, PausableToken, BurnableToken {

  // Token properties.
  string public constant name = 'PolyMathToken';
  string public constant symbol = 'POLY';
  // ERC20 compliant types
  // (see https://blog.zeppelin.solutions/tierion-network-token-audit-163850fd1787)
  uint8 public constant decimals = 18;
  // 1 billion POLY tokens in units divisible up to 18 decimals.
  uint256 public constant INITIAL_SUPPLY = 1000 * (10**6) * (10**uint256(decimals));
  address private crowdsale;

  modifier onlyCrowdsale() {
    require(crowdsale == msg.sender);
    _;
  }

  function PolyMathToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

  function setCrowdsaleAddr(address _crowdsale) onlyOwner {
    crowdsale = _crowdsale;
  }

  function issueTokens(address _to, uint256 _value) onlyCrowdsale public returns (bool) {
    require(_to != address(0));

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  // Don't accept calls to the contract address; must call a method.
  function () {
    revert();
  }

}
