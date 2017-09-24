'use strict';
var POLYToken = artifacts.require('PolyMathToken.sol');

contract('POLYToken', function(accounts) {
  it('should have 300 million totalSupply', function() {
    POLYToken.deployed().then(function(instance) {
      return instance.totalSupply.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), 1000000000000000000000000000, "totalSupply was incorrect");
    })
  });

  it('should have correct name', function() {
    POLYToken.deployed().then(function(instance) {
      return instance.name.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), "PolyMathToken", "name was incorrect");
    })
  });

  it('should have correct symbol', function() {
    POLYToken.deployed().then(function(instance) {
      return instance.symbol.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), "POLY", "symbol was incorrect");
    })
  });

  it('should have correct number of decimals', function() {
    POLYToken.deployed().then(function(instance) {
      return instance.decimals.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), 18, "decimals was incorrect");
    })
  });


});
