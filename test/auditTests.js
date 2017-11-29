'use strict';
var TokenOffering = artifacts.require('./helpers/PolyMathTokenOfferingMock.sol');
var POLYToken = artifacts.require('./helpers/PolyMathTokenMock.sol');

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
    event.watch(function(err, res) {
        if (!err) {
          assert.equal(res['event'], 'Transfer');
          event.stopWatching();
        }
    });
  });

  it('Cannot deploy token if the presale wallet address is null', async function () {
    await assertFail(async () => {
      tokenDeployed = await POLYToken.new(0x0);
    });
  });

  it('Cannot deploy crowdsale if the cap is 0', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => {
      tokenOfferingDeployed = await TokenOffering.new(
        tokenDeployed.address,
        latestTime() + duration.seconds(17),
        latestTime() + duration.weeks(3),
        0,
        presale_wallet
      )
    });
  });

  it('Cannot deploy crowdsale if the token is null', async function () {
    await assertFail(async () => {
      tokenOfferingDeployed = await TokenOffering.new(
        0x0,
        latestTime() + duration.seconds(15),
        latestTime() + duration.weeks(6),
        12345,
        presale_wallet
      )
    });
  });

  it('Cannot deploy crowdsale if the token is null', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => {
      tokenOfferingDeployed = await TokenOffering.new(
        tokenDeployed.address,
        latestTime() + duration.seconds(19),
        latestTime() + duration.weeks(2),
        12345,
        0x0
      )
    });
  });

  it('Cannot deploy crowdsale if the start time is in the past', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => {
      tokenOfferingDeployed = await TokenOffering.new(
        tokenDeployed.address,
        latestTime() - duration.seconds(2),
        latestTime() + duration.weeks(1),
        12345,
        presale_wallet
      )
    });
  });

 it('Cannot deploy crowdsale if the end time is before the start time', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => {
      tokenOfferingDeployed = await TokenOffering.new(
        tokenDeployed.address,
        latestTime() + duration.weeks(10),
        latestTime() + duration.weeks(1),
        12345,
        presale_wallet
      )
    });
  });

  it('Cap should not be able to exceed balance of crowdsale contract', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => {
      await TokenOffering.new(
        tokenDeployed.address,
        latestTime() + duration.seconds(20),
        latestTime() + duration.weeks(1),
        web3.toWei(150000001, 'ether'),
        presale_wallet
      )
    });
  });

  it('Tokens should not be able to be sent to the null address from the token contract', async function () {
    tokenDeployed = await POLYToken.new(presale_wallet);
    await assertFail(async () => { await tokenDeployed.transfer(0x0, tokenDeployed.address) });
  });

  describe('Deploy Contracts', async function () {
    beforeEach(async function () {
      startTime = latestTime() + duration.seconds(20);
      endTime = startTime + duration.weeks(1);
      const cap = web3.toWei(15000, 'ether');

      tokenDeployed = await POLYToken.new(presale_wallet);
      tokenOfferingDeployed = await TokenOffering.new(tokenDeployed.address, startTime, endTime, cap, crowdsale_wallet);
    });

    it('Calling an invalid function on the token triggers the fallback and reverts', async function () {
      await assertFail(async () => {
        await tokenDeployed.sendTransaction({ from: investor })
      });
    });

    it('Crowdsale should only be able to be initialized once', async function () {
      await tokenDeployed.initializeCrowdsale(tokenOfferingDeployed.address);
      await assertFail(async () => { await tokenDeployed.initializeCrowdsale(tokenOfferingDeployed.address) });;
    });

    it('After deploying the Token and the Crowdsale, the balances should all be correct', async function () {
      assert.equal((await tokenDeployed.balanceOf(deployer)).toNumber(), 800000000 * 10 ** DECIMALS, "The Token deployer should hold 800mil");
      assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 0, "The Crowdsale should have no balance");
      assert.equal((await tokenDeployed.balanceOf(presale_wallet)).toNumber(), 200000000 * 10 ** DECIMALS, "The Presale should hold 200mil");

      await tokenDeployed.initializeCrowdsale(tokenOfferingDeployed.address);

      assert.equal((await tokenDeployed.balanceOf(deployer)).toNumber(), 680000000 * 10 ** DECIMALS, "The Token deployer should hold 680mil");
      assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 120000000 * 10 ** DECIMALS, "The Crowdsale should hold 120mil");
      assert.equal((await tokenDeployed.balanceOf(presale_wallet)).toNumber(), 200000000 * 10 ** DECIMALS, "The Presale should hold 200mil");
    });

    describe('Initialize crowdsale', async function () {
      beforeEach(async function () {
        await tokenDeployed.initializeCrowdsale(tokenOfferingDeployed.address);
        await tokenOfferingDeployed.whitelistAddresses([investor], true);
      });

      it('Only the owner can unpause token transfers', async function () {
        await assertFail(async () => { await tokenDeployed.unpause({ from: deployer }) });
        await assertFail(async () => { await tokenDeployed.unpause({ from: investor }) });
        await assertFail(async () => { await tokenDeployed.unpause({ from: crowdsale_wallet }) });
        await assertFail(async () => { await tokenDeployed.unpause({ from: presale_wallet }) });
      })

      it('Tokens should not be able to be refunded before the Crowdsale is finished', async function () {
        await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
        await assertFail(async () => { await tokenOfferingDeployed.refund() });
      });

      it('Tokens should be locked until 7 days after crowdsale ends', async function () {
        await tokenOfferingDeployed.setBlockTimestamp(endTime + 1);
        await tokenOfferingDeployed.checkFinalize();
        await assertFail(async () => { await tokenOfferingDeployed.refund() });
        await assertFail(async () => { await tokenDeployed.unpause() });
        await assertFail(async () => { await tokenOfferingDeployed.refund() });
        await tokenDeployed.setBlockTimestamp(endTime + duration.days(7));
        await tokenDeployed.unpause();
        await tokenOfferingDeployed.refund();
        assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 0, "The Crowdsale should have no balance after a refund");
      });

      it('Unsold tokens should be refundable after the crowdsale is finished and 7 days pass', async function () {
        await tokenOfferingDeployed.setBlockTimestamp(endTime + duration.days(7));
        await tokenDeployed.setBlockTimestamp(endTime + duration.days(7));
        await tokenOfferingDeployed.checkFinalize();
        assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 120000000 * 10 ** DECIMALS, "The Crowdsale should have 120mil");
        await tokenDeployed.unpause();
        await tokenOfferingDeployed.refund();
        assert.equal((await tokenDeployed.balanceOf(tokenOfferingDeployed.address)).toNumber(), 0, "The Crowdsale should have no balance after a refund");
      });

      it('Tokens should not be able to be sent to the null address by the crowdsale', async function () {
        await tokenOfferingDeployed.setBlockTimestamp(startTime + 1);
        await assertFail(async () => { await tokenOfferingDeployed.buyTokens(0x0, { from: investor });
        });
      });

      it('Token Ownership should be transferred when crowdsale is finalized', async function () {
        assert.equal(await tokenDeployed.owner.call(), tokenOfferingDeployed.address);
        await tokenOfferingDeployed.setBlockTimestamp(endTime + 1);
        await tokenOfferingDeployed.checkFinalize();
        assert.equal(await tokenDeployed.owner.call(), deployer);
      });
    });
  });
});
