pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './PolyMathToken.sol';

/**
 * @title PolyMathTokenOffering
 * @dev Modified from OpenZeppelin's Crowdsale.sol
 * CappedCrowdsale.sol, and FinalizableCrowdsale.sol
 * Uses PausableToken rather than MintableToken.
 *
 * Requires that tokens for sale (entire supply minus team's portion) be deposited.
 */
contract PolyMathTokenOffering is Ownable {
  using SafeMath for uint256;

  // Token allocations
  mapping (address => uint256) public allocations;

  // Whitelisted investors
  mapping (address => bool) public whitelist;

  // manual early close flag
  bool public isFinalized = false;

  // cap for crowdsale in wei
  uint256 public cap;

  // The token being sold
  PolyMathToken public token;

  // start and end timestamps where contributions are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  address public wallet;

  // address to hold team / advisor tokens until vesting complete
  address public safe;

  // how many token units a buyer gets per wei
  uint256 public rate;

  // amount of raised money in wei
  uint256 public weiRaised;

  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  /**
   * event for token redemption logging
   * @param beneficiary who got the tokens
   * @param amount amount of tokens redeemed
   */
  event TokenRedeem(address indexed beneficiary, uint256 amount);

  // termination early or otherwise
  event Finalized();

  function PolyMathTokenOffering(address _token, uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _cap, address _wallet) {
    require(_startTime >= getBlockTimestamp());
    require(_endTime >= _startTime);
    require(_rate > 0);
    require(_cap > 0);
    require(_wallet != 0x0);

    token = PolyMathToken(_token);
    startTime = _startTime;
    endTime = _endTime;
    rate = _rate;
    cap = _cap;
    wallet = _wallet;
  }

  // fallback function can be used to buy tokens
  function() payable {
    buyTokens(msg.sender);
  }

  // Day 1: 1 ETH = 1,200 POLY
  // Day 2: 1 ETH = 1,100 POLY
  // Day 3: 1 ETH = 1,000 POLY
  function calculateBonusRate() internal returns (uint256) {
    uint256 DAY1 = startTime + 24 hours;
    uint256 DAY2 = DAY1 + 24 hours;
    uint256 DAY3 = DAY2 + 24 hours;
    uint256 bonusRate = 1000;

    uint256 currentTime = getBlockTimestamp();
    if (currentTime > startTime && currentTime <= DAY1) {
      bonusRate =  1200;
    } else if (currentTime <= DAY2) {
      bonusRate =  1100;
    } else if (currentTime <= DAY3) {
      bonusRate =  1000;
    }
    return bonusRate;
  }

  /// @notice interface for founders to whitelist investors
  /// @param _addresses array of investors
  /// @param _status enable or disable
  function whitelistAddresses(address[] _addresses, bool _status) public onlyOwner {
    for (uint256 i = 0; i < _addresses.length; i++) {
        address investorAddress = _addresses[i];
        if (whitelist[investorAddress] == _status) {
          continue;
        }
        whitelist[investorAddress] = _status;
    }
   }

  // low level token purchase function
  // caution: tokens must be redeemed by beneficiary address
  function buyTokens(address beneficiary) payable {
    require(whitelist[beneficiary]);
    require(beneficiary != 0x0);
    require(validPurchase());
    // calculate token amount to be purchased
    uint256 weiAmount = msg.value;
    uint256 bonusRate = calculateBonusRate();
    uint256 tokens = weiAmount.mul(bonusRate).div(1 ether);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    forwardFunds();
    // send tokens to purchaser
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    token.transfer(beneficiary, tokens);
    TokenRedeem(beneficiary, tokens);
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal constant returns (bool) {
    bool withinCap = weiRaised.add(msg.value) <= cap;
    bool withinPeriod = getBlockTimestamp() >= startTime && getBlockTimestamp() <= endTime;
    bool nonZeroPurchase = msg.value != 0;
    bool contractHasTokens = token.balanceOf(this) > 0;
    return withinPeriod && nonZeroPurchase && withinCap && contractHasTokens;
  }

  // @return true if crowdsale event has ended or cap reached
  function hasEnded() public constant returns (bool) {
    bool capReached = weiRaised >= cap;
    bool passedEndTime = getBlockTimestamp() > endTime;
    return passedEndTime || capReached;
  }

  function getBlockTimestamp() internal constant returns (uint256) {
    return block.timestamp;
  }

  // @dev does not require that crowdsale `hasEnded()` to leave safegaurd
  // in place if ETH rises in price too much during crowdsale.
  // Allows team to close early if cap is exceeded in USD in this event.
  function finalize() onlyOwner {
    require(!isFinalized);
    Finalized();
    isFinalized = true;
  }
}
