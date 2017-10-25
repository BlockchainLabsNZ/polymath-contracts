# Polymath POLY Crowdsale

[![Coverage Status](https://coveralls.io/repos/github/BlockchainLabsNZ/polymath-contracts/badge.svg?branch=master)](https://coveralls.io/github/BlockchainLabsNZ/polymath-contracts?branch=master) [![Build Status](https://travis-ci.org/BlockchainLabsNZ/polymath-contracts.svg?branch=master)](https://travis-ci.org/BlockchainLabsNZ/polymath-contracts)

The smart contracts for the [Polymath Network][polymath] token (POLY) crowdsale.

![Polymath](Polymath.png)

POLY tokens are used to grow and interact with the Polymath Security Token network, and also to pay for new security token issuances.

## Contracts

Please see the [contracts/](contracts) directory.

## Build

The `PolyMathToken.sol` contract should be deployed first with the address of the presale wallet in the contructor. The 150million presale tokens will be stored in the presale wallet and the remaining 850million tokens will be stored in the address which deployed the contract.

Next, the `PolyMathTokenOffering.sol` contract is deployed. Parameters will be set by admin in the constructor.

After deploying this contract you must call the `setOwner` function of the deployed `PolyMathToken.sol` contract and give it the address of the `PolyMathTokenOffering.sol` contract. This will allow the crowdsale to transfer tokens even though they are locked until the end of the crowdsale for contributors.
Calling this function will pause all tokens from being transferred (other than by the crowdsale) until the crowdsale has been finalized. The function will also transfer the 150million tokens allocated for the public sale to the crowdsale contract to be sold. The deployer of `PolyMathToken.sol` will still hold the tokens which are to be vested.

Contributors must be whitelisted to contribute to the crowdsale. In order for KYC checks to be applied, contributors will first need to go through submitting their ID verification in order to be allowed to send ETH to the crowdsale contract.

The contract will automatically finalize when cap is reached, and purchases will automatically be blocked once the crowdsale end time is reached. *Please note* that someone must manually call the `checkFinalize()` function if the crowdsale end time is reached without hitting the cap. Calling that function will properly finalize the sale and allow tokens to be transferred by contributors.

Lastly, in order to achieve locking up future distribution of POLY tokens to founders, developers and advisors the `PolyMathVesting.sol` will be deployed.

## Develop

Contracts are written in [Solidity][solidity] and tested using [Truffle][truffle] and [testrpc][testrpc].

### Dependencies

```bash
# Install Truffle and testrpc packages globally:
$ npm install -g truffle ethereumjs-testrpc

# Install local node dependencies:
$ npm install
```

### Test
$ npm test

[polymath]: https://polymath.network
[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[testrpc]: https://github.com/ethereumjs/testrpc
