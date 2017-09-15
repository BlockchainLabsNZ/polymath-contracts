# Polymath POLY Crowdsale

The smart contracts for the [Polymath Network][polymath] token (POLY) crowdsale.

![Polymath](Polymath.png)

POLY tokens are used to grow and interact with the Polymath Security Token network, and also to pay for new security token issuances.

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] and tested using [Truffle][truffle] and [testrpc][testrpc].

### Depenencies

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
