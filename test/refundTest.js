'use strict';
var TokenOffering = artifacts.require('./helpers/PolyMathTokenOfferingMock.sol');
var POLYToken = artifacts.require('PolyMathToken.sol');

import { latestTime, duration } from './helpers/latestTime';

contract('TokenOffering', async function ([miner, owner, investor, wallet]) {
  let tokenOfferingDeployed;
  let tokenDeployed;
  beforeEach(async function () {
    tokenDeployed = await POLYToken.new();
    const startTime = latestTime() + duration.seconds(1);
    const endTime = startTime + duration.weeks(1);
    const rate = new web3.BigNumber(1000);
    const cap = new web3.BigNumber(1 * Math.pow(10, 18));
    console.log(startTime, endTime);
    tokenOfferingDeployed = await TokenOffering.new(tokenDeployed.address, startTime, endTime, rate, cap, wallet);

    // set to DAY4 without bounus
    await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(4));
  });

    it('refund excess ETH if contribution is above cap', async function () {
      let cap = await tokenOfferingDeployed.cap();
      console.log (cap)

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      console.log (investor)

      let investorStatus = await tokenOfferingDeployed.whitelist(investor);
      assert.isTrue(investorStatus);
      console.log ("whitelistedAddresses")

      const value = web3.toWei(1.1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value, gas: '200000' });

      let balance = await tokenOfferingDeployed.allocations(investor);
      console.log (balance.toNumber());
      assert.equal(balance.toNumber(), 1000* Math.pow(10, 18));
    });
});
