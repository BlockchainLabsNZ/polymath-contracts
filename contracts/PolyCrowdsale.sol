pragma solidity ^0.4.15;

import "./PolyToken.sol";
import "./TokenHolder.sol";
import "./Ownable.sol";
import "./SafeMath.sol";

/*
 * @title Crowdsale
 * @dev Contract to manage the Polymath crowdsale
 * @dev Using assert over assert within the contract in order to generate error opscodes (0xfe), that will properly show up in etherscan
 * @dev The assert error opscode (0xfd) will show up in etherscan after the metropolis release
 * @dev see: https://ethereum.stackexchange.com/a/24185
 */
contract PolymathCrowdsale is Ownable, TokenHolder {
    using SafeMath for uint256;

		// POLY token contract
		PolyToken public poly;

    // Same as token decimals
    uint256 public constant TOKEN_UNIT = 10 ** 18;

		// Maximum tokens offered in the sale.
    uint256 public constant MAX_TOKENS_SOLD = 250000000 * TOKEN_UNIT;

		// Sale start and end timestamps.
		uint256 public constant SALE_DURATION = 14 days;
    uint256 public startTime;
    uint256 public endTime;

		// Amount of tokens sold until now in the sale.
    uint256 public tokensSold = 0;

    // Halt the crowdsale
    bool public haltSale = false;

		// Early investor bonuses
    uint256 public currentRate;
    uint256 constant public DAY1_RATE = 1200 * TOKEN_UNIT;
    uint256 constant public DAY2_RATE = 1100 * TOKEN_UNIT;
    uint256 constant public REGULAR_RATE = 1000 * TOKEN_UNIT;

		// Beneficiary addresses
    address public multisigAddress;
    address public foundersAddress;
		address public reserveAddress;
    address public advisorsAddress;

    // Participants (completed KYC requirements)
    mapping (address => bool) public participant;

    // Participant contributions
    mapping (address => uint256) public participantContribution;

    // Pre-sale (15%) + early contributors (2.5%) allocations
    mapping (address => uint256) public tokenAllocations;
    uint256 constant MAX_TOKENS_ALLOCATED = 275000000 * TOKEN_UNIT;
    uint256 public allocatedTokens = 0;

    // Founders Allocation
    uint256 constant FOUNDER_ALLOCATION = 150000000 * TOKEN_UNIT;

    // Reserve Allocation
    uint256 constant RESERVE_ALLOCATION = 300000000 * TOKEN_UNIT;

    // Advisor Allocation
    uint256 constant ADVISOR_ALLOCATION = 25000000 * TOKEN_UNIT;

    event LogTokensMinted(address indexed recipient, uint256 tokens);

    function PolymathCrowdsale(address _multisigAddress, address _foundersAddress, address _reserveAddress, address _advisorsAddress, uint256 _startTime) {
      assert(address(_multisigAddress) != 0x0);
      assert(address(_foundersAddress) != 0x0);
      assert(address(_reserveAddress) != 0x0);
      assert(address(_advisorsAddress) != 0x0);
			require(_startTime > now);

      multisigAddress = _multisigAddress;
      foundersAddress = _foundersAddress;
			reserveAddress = _reserveAddress;
			advisorsAddress = _advisorsAddress;
			startTime = _startTime;
			endTime = _startTime + SALE_DURATION;

      poly = new PolyToken();
    }

    function() payable external {

      require( tx.gasprice <= 50000000000 wei );
      require( !haltSale );
      require( !saleEnded() );
      require( participant[msg.sender] );

      // Determine amount of tokens to transfer
      uint256 rate = 0;
      if (now <= startTime + 1 days) {
        rate = DAY1_RATE;
      } else if (now <= startTime + 2 days) {
        rate = DAY2_RATE;
      } else {
        rate = REGULAR_RATE;
      }

      // Check that the amount purchased doesn't exceed the amount left
      uint256 tokensLeftInSale = MAX_TOKENS_SOLD.sub(tokensSold);
      uint256 tokensParticipantWants = msg.value.mul(rate);
      uint256 tokens = SafeMath.min256(tokensLeftInSale, tokensParticipantWants);
      uint256 weiContributed = tokens.div(rate);

      // Update the number of tokens sold
      tokensSold = tokensSold.add(tokens);
      participantContribution[msg.sender] = participantContribution[msg.sender].add(weiContributed);

      // Send payment to beneficiary multisig wallet
      multisigAddress.transfer(weiContributed);

      // Mint Tokens
      poly.mint(msg.sender, tokens);

      // Partial Refund if full amount wasn't available
      uint256 refund = msg.value.sub(weiContributed);
      if (refund > 0) {
        msg.sender.transfer(refund);
      }

      // Log the event
      LogTokensMinted(msg.sender, tokens);
    }

    // Upload list of KYC verified participant addresses
    function addParticipants(address[] _participants) private onlyOwner {
      for (uint i = 0; i < _participants.length; i++) {
        participant[_participants[i]] = true;
      }
    }

    // Upload list of allocations for presale investors and early contributors
    function addAllocations(address[] _participants, uint256[] _amounts) private onlyOwner {
      for (uint i = 0; i < _participants.length; i++) {
        // Ensure no excess tokens are allocated
        require( allocatedTokens + _amounts[i] <= MAX_TOKENS_ALLOCATED);
        allocatedTokens = allocatedTokens.add(_amounts[i]);
        tokenAllocations[_participants[i]] = _amounts[i];
      }
      // Other Allocations
      tokenAllocations[foundersAddress] = FOUNDER_ALLOCATION;
      tokenAllocations[reserveAddress] = RESERVE_ALLOCATION;
      tokenAllocations[advisorsAddress] = ADVISOR_ALLOCATION;
    }

    // Allow early contributors to claim their allocations
    function claimAllocation() {
      require( tokenAllocations[msg.sender] > 0 );
      uint256 tokens = tokenAllocations[msg.sender];
      tokenAllocations[msg.sender] = 0;
      poly.mint(msg.sender, tokens);
      LogTokensMinted(msg.sender, tokens);
    }

    // Halt or unhalt the crowdsale during an emergency
    function setHaltState(bool halt) onlyOwner external {
      haltSale = halt;
    }

    function saleEnded() private constant returns (bool) {
      return tokensSold >= MAX_TOKENS_SOLD || now >= endTime;
    }
}
