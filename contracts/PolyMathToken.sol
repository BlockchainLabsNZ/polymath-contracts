pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20Basic.sol';
import './PolyMathTokenOffering.sol';

contract PolyMathToken is PausableToken, BurnableToken {

  // Token properties.
  string public constant name = 'PolyMathToken';
  string public constant symbol = 'POLY';
  // ERC20 compliant types
  // (see https://blog.zeppelin.solutions/tierion-network-token-audit-163850fd1787)
  uint8 public constant decimals = 18;
  uint256 private constant token_factor = 10**uint256(decimals);
  // 1 billion POLY tokens in units divisible up to 18 decimals.
  uint256 public constant INITIAL_SUPPLY = 1000 * (10**6) * token_factor;

  uint256 public constant PRESALE_SUPPLY = 200000000 * token_factor;
  uint256 public constant PUBLICSALE_SUPPLY = 120000000 * token_factor;
  uint256 public constant FOUNDER_SUPPLY = 150000000 * token_factor;
  uint256 public constant BDMARKET_SUPPLY = 55000000 * token_factor;
  uint256 public constant ADVISOR_SUPPLY = 25000000 * token_factor;
  uint256 public constant RESERVE_SUPPLY = 450000000 * token_factor;

  address private crowdsale;

  function isCrowdsaleAddressSet() public constant returns (bool) {
    return (address(crowdsale) != address(0));
  }

  modifier crowdsaleNotInitialized() {
    require(!isCrowdsaleAddressSet());
    _;
  }

  function PolyMathToken(address _presale_wallet) public {
    require(_presale_wallet != 0x0);
    require(INITIAL_SUPPLY > 0);
    require((PRESALE_SUPPLY + PUBLICSALE_SUPPLY + FOUNDER_SUPPLY + BDMARKET_SUPPLY + ADVISOR_SUPPLY + RESERVE_SUPPLY) == INITIAL_SUPPLY);
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = totalSupply - PRESALE_SUPPLY;
    Transfer(0x0, msg.sender, totalSupply - PRESALE_SUPPLY);
    balances[_presale_wallet] = PRESALE_SUPPLY;
    Transfer(0x0, _presale_wallet, PRESALE_SUPPLY);
  }

  function initializeCrowdsale(address _crowdsale) public onlyOwner crowdsaleNotInitialized {
    transfer(_crowdsale, PUBLICSALE_SUPPLY);
    crowdsale = _crowdsale;
    pause();
    transferOwnership(_crowdsale);
  }

  function getBlockTimestamp() internal constant returns (uint256) {
    return block.timestamp;
  }

  // Override - lifecycle/Pausable.sol
  function unpause() onlyOwner whenPaused public {
    if (PolyMathTokenOffering(crowdsale).hasEnded()) {
      // Tokens should be locked until 7 days after the crowdsale
      require(getBlockTimestamp() >= (PolyMathTokenOffering(crowdsale).endTime() + 7 days));
    }
    super.unpause();
  }

  // Don't accept calls to the contract address; must call a method.
  function () public {
    revert();
  }

  function claimTokens(address _token) public onlyOwner {
        if (_token == 0x0) {
            owner.transfer(this.balance);
            return;
        }

        ERC20Basic token = ERC20Basic(_token);
        uint256 balance = token.balanceOf(this);
        token.transfer(owner, balance);
    }

}
