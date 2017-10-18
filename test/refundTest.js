'use strict';
var TokenOffering = artifacts.require('./helpers/PolyMathTokenOfferingMock.sol');
var POLYToken = artifacts.require('PolyMathToken.sol');
const assertFail = require("./helpers/assertFail");

import { latestTime, duration } from './helpers/latestTime';

contract('TokenOfferingRefund', async function ([miner, owner, investor, wallet]) {
  let tokenOfferingDeployed;
  let tokenDeployed;
  let startTime;
  beforeEach(async function () {
    tokenDeployed = await POLYToken.new();
    startTime = latestTime() + duration.seconds(1);
    const endTime = startTime + duration.weeks(1);
    const rate = new web3.BigNumber(1000);
    const cap = web3.toWei(1, 'ether');;
    tokenOfferingDeployed = await TokenOffering.new(tokenDeployed.address, startTime, endTime, rate, cap, wallet);
    await tokenDeployed.setCrowdsaleAddress(tokenOfferingDeployed.address);
  });

    it('refund excess ETH if contribution is above cap (day 4)', async function () {
      // set to DAY4 without bounus
      await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(4));
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      let investorStatus = await tokenOfferingDeployed.whitelist(investor);
      assert.isTrue(investorStatus);

      const value = web3.toWei(1.1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' });

      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1000);
    });

    it('refund excess ETH if contribution is above cap (day 1)', async function () {
      await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      let investorStatus = await tokenOfferingDeployed.whitelist(investor);
      assert.isTrue(investorStatus);

      const value = web3.toWei(3, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' });

      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200);
    });

     it('refund excess ETH in multiple contributions if contributions are above cap (day 1)', async function () {
      await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      let investorStatus = await tokenOfferingDeployed.whitelist(investor);
      assert.isTrue(investorStatus);

      let value = web3.toWei(0.99, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' });

      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1188);

      value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' });

      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200);
    });

     it('refund excess ETH if cap has been exceeded (day 1)', async function () {
      await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      let investorStatus = await tokenOfferingDeployed.whitelist(investor);
      assert.isTrue(investorStatus);

      let value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' });

      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200);

      value = web3.toWei(10, 'ether');
      await assertFail(async () => { await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' })});

      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200);
    });

     it('refund excess ETH if cap has been exceeded (day 1)', async function () {
      await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      let investorStatus = await tokenOfferingDeployed.whitelist(investor);
      assert.isTrue(investorStatus);

      let value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' });

      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200);

      value = web3.toWei(10, 'ether');
      await assertFail(async () => { await tokenOfferingDeployed.sendTransaction({ from: investor, value: value, gas: '200000' })});

      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200);
    });
});
