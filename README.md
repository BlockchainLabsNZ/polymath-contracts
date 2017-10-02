# Polymath POLY Crowdsale

The smart contracts for the [Polymath Network][polymath] token (POLY) crowdsale.

![Polymath](Polymath.png)

POLY tokens are used to grow and interact with the Polymath Security Token network, and also to pay for new security token issuances.

## Contracts

Please see the [contracts/](contracts) directory.

## Build

To begin, the `PolyMathToken.sol` contract will be deployed. The total supply of 1,000,000,000 POLY will be minted and stored in the msg.sender address.

The `MultisigWallet.sol` will then be deployed in order to be specified as the destination for future funds raised.

Next, the `PolyMathTokenOffering.sol` contract is deployed. Parameters will be set by admin in the constructor.

For the presale, 150,000,000 POLY will be deposited to the created contract address where they can be purchased at the set rate in ETH.

Contributors will be able to send ETH directly to the contract address to have their token balance stored by the contract.

In order for KYC checks to be applied, contributors will first need to go through submitting their ID verification in order to be allowed to send ETH to the crowdsale contract.

To achieve this, the `PolyMathWhitelist.sol` contract will be deployed so that once verified, each contributor address can be approved.

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
$ truffle test

[polymath]: https://polymath.network
[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[testrpc]: https://github.com/ethereumjs/testrpc
