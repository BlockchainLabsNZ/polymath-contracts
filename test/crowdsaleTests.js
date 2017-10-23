'use strict';
var TokenOffering = artifacts.require('./helpers/PolyMathTokenOfferingMock.sol');
var POLYToken = artifacts.require('PolyMathToken.sol');

import { latestTime, duration } from './helpers/latestTime';

const DECIMALS = 18;

contract('TokenOffering', async function ([miner, owner, investor, wallet,  presale_wallet]) {
  let tokenOfferingDeployed;
  let tokenDeployed;
  let startTime;
  beforeEach(async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    startTime = latestTime() + duration.seconds(1);
    const endTime = startTime + duration.weeks(1);
    const cap = web3.toWei(15000, 'ether');
    tokenOfferingDeployed = await TokenOffering.new(tokenDeployed.address, startTime, endTime, cap, wallet);
    await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(1));
    await tokenDeployed.setOwner(tokenOfferingDeployed.address);
  });

  it('should not be finalized', async function () {
    const isFinalized = await tokenOfferingDeployed.isFinalized();
    assert.isFalse(isFinalized, "isFinalized should be false");
  });

  it('cap should be 15000 ETH', async function () {
    const cap = await tokenOfferingDeployed.cap();
    assert.equal(cap.toString(10), '15000000000000000000000', "cap is incorrect");
  });

  describe('#whitelistAddresses', async function () {
    let investors;
    beforeEach(async function () {
      investors = [
        '0x2718C59E08Afa3F8b1EaA0fCA063c566BA4EC98B',
        '0x14ABEbe9064B73c63AEcd87942B0ED2Fef2F7B3B',
        '0x5850f06700E92eDe92cb148734b3625DCB6A14d4',
        '0xA38c9E212B46C58e05fCb678f0Ce62B5e1bc6c52',
        '0x7e2392A0DDE190457e1e8b2c7fd50d46ACb6ad4f',
        '0x0306D4C6ABC853bfDc711291032402CF8506422b',
        '0x1a91022B10DCbB60ED14584dC66B7faC081A9691'
      ];
    });
    it('should whitelist and blacklist', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses(investors, true);
      firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isTrue(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses(investors, false);
      firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);
    })

    it('allows to buy tokens', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 0);

      const value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200 * 10 ** DECIMALS, 'balanceOf is 1200 for investor who just bought tokens');
    });

    it('allows to buy tokens at bonus rate after 1 day', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 0);

      await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(1) + 1);

      const value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(10), 1100 * 10 ** DECIMALS, 'balanceOf is 1100 for investor who just bought tokens');
    });

    it('allows to buy tokens at regular rate after 2 days', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 0);

      await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(2) + 1);

      const value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(10), 1000 * 10 ** DECIMALS, 'balanceOf is 1000 for investor who just bought tokens');
    });

    it('allows to buy tokens at regular rate after 3 days', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 0);

      await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(3) + 1);

      const value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1000 * 10 ** DECIMALS, 'balanceOf is 1000 for investor who just bought tokens');
    });

    it('disallows to buy tokens at regular rate after 3 days', async function () {
      let firstInvestorStatus = await tokenOfferingDeployed.whitelist(investors[0]);
      assert.isFalse(firstInvestorStatus);

      await tokenOfferingDeployed.whitelistAddresses([investor], true);
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 0);

      await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(3) + 1);

      const value = web3.toWei(1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1000 * 10 ** DECIMALS, 'balanceOf is 1000 for investor who just bought tokens');
    });

  })
});
