'use strict';

let TokenOffering = artifacts.require('./helpers/PolyMathTokenOfferingMock.sol');
let POLYToken = artifacts.require('PolyMathToken.sol');

const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");

import { latestTime, duration } from './helpers/latestTime';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const expect = require('chai').expect

contract('polyTokenPause', async function([miner, owner, investor, wallet]) {
  let tokenOfferingDeployed;
  let tokenDeployed;
  let startTime, endTime;
  beforeEach(async function () {
    tokenDeployed = await POLYToken.new();
    startTime = latestTime() + duration.seconds(1);
    endTime = startTime + duration.weeks(1);
    const rate = new web3.BigNumber(1200);
    const cap = web3.toWei(1, 'ether');
    tokenOfferingDeployed = await TokenOffering.new(tokenDeployed.address, startTime, endTime, rate, cap, wallet);
    await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
    await tokenDeployed.setOwner(tokenOfferingDeployed.address);
  });

  it('tokens should be paused once they are sold',
    async function () {
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      const value = web3.toWei(0.1, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 120, 'balanceOf is 120 for investor who just bought tokens');

      await assertFail(async () => { await tokenDeployed.transfer(miner, 10, { from: investor }) });
  });

  it('crowdsale should finalize when cap is reached',
    async function () {
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      const value = web3.toWei(1, 'ether');
      const { logs } = await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200, 'balanceOf is 1200 for investor who just bought tokens');

      const event = logs.find(e => e.event === 'Finalized');
      expect(event).to.exist;

  });

  it('crowdsale should finalize when time runs out',
    async function () {
      let isFinalized = await tokenOfferingDeployed.isFinalized();
      assert.isFalse(isFinalized, "isFinalized should be false");

      await tokenOfferingDeployed.setBlockTimestamp(endTime + 1);
      await tokenOfferingDeployed.checkFinalize();

      isFinalized = await tokenOfferingDeployed.isFinalized();
      assert.isTrue(isFinalized, "isFinalized should be true");
  });

  it('tokens should be unpaused once crowdsale is finalized (hit cap)',
    async function () {
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      // Buy half the tokens in the cap
      const value = web3.toWei(0.5, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 600, 'balanceOf is 600 for investor who just bought tokens');
      await assertFail(async () => { await tokenDeployed.transfer(miner, 10, { from: investor }) });

      // Buy the remaining half
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 1200, 'balanceOf is 1200 for investor who just bought tokens');
      // Token should be unpaused, can now transfer
      await tokenDeployed.transfer(miner, 600, { from: investor });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 600, 'balanceOf is 1200 for investor who just bought tokens');
      balance = await tokenDeployed.balanceOf(miner);
      assert.equal(balance.toNumber(), 600, 'balanceOf is 1200 for investor who just bought tokens');
  });

  it('tokens should be unpaused once crowdsale is finalized (time ran out)',
    async function () {
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      // Buy half the tokens in the cap
      const value = web3.toWei(0.5, 'ether');
      await tokenOfferingDeployed.sendTransaction({ from: investor, value: value });
      let balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 600, 'balanceOf is 600 for investor who just bought tokens');
      await assertFail(async () => { await tokenDeployed.transfer(miner, 10, { from: investor }) });

      await tokenOfferingDeployed.setBlockTimestamp(endTime + 1);

      await tokenOfferingDeployed.checkFinalize();
      let isFinalized = await tokenOfferingDeployed.isFinalized();
      assert.isTrue(isFinalized, "isFinalized should be true");

      // Token should be unpaused, can now transfer
      await tokenDeployed.transfer(miner, 600, { from: investor });
      balance = await tokenDeployed.balanceOf(investor);
      assert.equal(balance.toNumber(), 0, 'balanceOf is 0 for investor who just transferred tokens');
      balance = await tokenDeployed.balanceOf(miner);
      assert.equal(balance.toNumber(), 600, 'balanceOf is 600 for investor who just bought tokens');
  });

  it('can\'t buy tokens once crowdsale is finalized',
    async function () {
      await tokenOfferingDeployed.whitelistAddresses([investor], true);

      await tokenOfferingDeployed.setBlockTimestamp(endTime + 1);
      await tokenOfferingDeployed.checkFinalize();

      const value = web3.toWei(0.5, 'ether');
      await assertFail(async () => { await tokenOfferingDeployed.sendTransaction({ from: investor, value: value }) });
      let isFinalized = await tokenOfferingDeployed.isFinalized();
      assert.isTrue(isFinalized, "isFinalized should be true");
  });
});
