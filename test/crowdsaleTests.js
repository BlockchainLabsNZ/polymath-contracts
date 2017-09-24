'use strict';
var TokenOffering = artifacts.require('PolyMathTokenOffering.sol');

contract('TokenOffering', function(accounts) {
  it('should not be finalized', function() {
    TokenOffering.deployed().then(function(instance) {
      return instance.isFinalized.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), false, "isFinalized should be false");
    })
  });

  it('goal should be 3000 ETH', function() {
    TokenOffering.deployed().then(function(instance) {
      return instance.cap.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), 3000000000000000000000, "goal is incorrect");
    })
  });

  it('cap should be 15000 ETH', function() {
    TokenOffering.deployed().then(function(instance) {
      return instance.cap.call();
    }).then(function(x) {
      assert.equal(x.valueOf(), 15000000000000000000000, "cap is incorrect");
    })
  });
});
