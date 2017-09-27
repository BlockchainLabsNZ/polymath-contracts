'use strict';
let POLYToken = artifacts.require('PolyMathToken.sol');
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");

let polyToken;

contract('polyToken', function(accounts) {
  beforeEach(async () => {
    polyToken = await POLYToken.new(
      100000000000000000,
      0,
      100,
      accounts[0],
      { from: accounts[0] }
    );
  });

  it('should have 300 million totalSupply', async () => {
    let totalSupply = await polyToken.totalSupply.call();
    assert.equal(totalSupply, 1000000000000000000000000000, "totalSupply was incorrect");
  });

  it('should have correct name', async () => {;
    assert.equal(await polyToken.name.call(), "PolyMathToken", "name was incorrect");
  });

  it('should have correct symbol', async () => {
    assert.equal(await polyToken.symbol.call(), "POLY", "symbol was incorrect");
  });

  it('should have correct number of decimals', async () => {
      assert.equal(polyToken.decimals.call(), 18, "decimals was incorrect");
  });
});
