'use strict';
var TokenOffering = artifacts.require('./helpers/PolyMathTokenOfferingMock.sol');
var POLYToken = artifacts.require('PolyMathToken.sol');

import { latestTime, duration } from './helpers/latestTime';
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()
const expect = require('chai').expect

const DECIMALS = 18;

contract('Audit Tests', async function ([deployer, investor, crowdsale_wallet, presale_wallet]) {
  let tokenOfferingDeployed;
  let tokenDeployed;
  let startTime;
  let endTime;

  it('Initializing the PolyMathToken contract should emit a transfer event which generates the tokens', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    let event = tokenDeployed.Transfer({});
    await event.watch(function(err, res) {
        if (!err) {
          assert.equal(res['event'], 'Transfer');
        }
    });
  });

  it('Cap should not be able to exceed balance of crowdsale contract', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => { await TokenOffering.new(tokenDeployed.address, latestTime() + duration.seconds(20), latestTime() + duration.weeks(1), web3.toWei(150000001, 'ether'), crowdsale_wallet) });
  });

  it('Tokens should not be able to be sent to the null address from the token contract', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => { await tokenDeployed.issueTokens(0x0, tokenDeployed.address) });
  });

  describe('Deploy Contracts', async function () {
    beforeEach(async function () {
      startTime = latestTime() + duration.seconds(20);
      endTime = startTime + duration.weeks(1);
      const cap = web3.toWei(15000, 'ether');

      tokenDeployed = await POLYToken.new(presale_wallet);
      tokenOfferingDeployed = await TokenOffering.new(tokenDeployed.address, startTime, endTime, cap, crowdsale_wallet);
    });

    it('After deploying the Token and the Crowdsale, the balances should all be correct', async function () {
      assert.equal((await tokenDeployed.balanceOf(deployer)).toNumber(), 850000000 * 10 ** DECIMALS, "The Token deployer should hold 850mil");
      assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 0, "The Crowdsale should have no balance");
      assert.equal((await tokenDeployed.balanceOf(presale_wallet)).toNumber(), 150000000 * 10 ** DECIMALS, "The Presale should hold 150mil");

      await tokenDeployed.setOwner(tokenOfferingDeployed.address);

      assert.equal((await tokenDeployed.balanceOf(deployer)).toNumber(), 700000000 * 10 ** DECIMALS, "The Token deployer should hold 700mil");
      assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 150000000 * 10 ** DECIMALS, "The Crowdsale should hold 150mil");
      assert.equal((await tokenDeployed.balanceOf(presale_wallet)).toNumber(), 150000000 * 10 ** DECIMALS, "The Presale should hold 150mil");
    });

    describe('Initialize crowdsale', async function () {
      beforeEach(async function () {
        await tokenDeployed.setOwner(tokenOfferingDeployed.address);
        let investors = [investor];
        await tokenOfferingDeployed.whitelistAddresses(investors, true);
      });

      it('Unsold tokens should be refundable after the crowdsale is finished', async function () {
        await tokenOfferingDeployed.setBlockTimestamp(endTime + 1);
        assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 150000000 * 10 ** DECIMALS, "The Crowdsale should have 150mil");
        await tokenOfferingDeployed.refund();
        assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 0, "The Crowdsale should have no balance after a refund");
      });

      it('Tokens should not be able to be sent to the null address by the crowdsale', async function () {
        await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
        await assertFail(async () => { await tokenOfferingDeployed.buyTokens(0x0, { from: investor });
        });
      });
    });
  });
});
