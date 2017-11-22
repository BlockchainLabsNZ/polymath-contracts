"use strict";
var POLYToken = artifacts.require("PolyMathToken.sol");
var POLYVesting = artifacts.require("./helpers/PolyMathVestingMock.sol");
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");
import { latestTime, duration } from "./helpers/latestTime";

contract("PolyMathVesting", async function(
  [miner, owner, reserve, notReserve, presale_wallet]
) {
  let polyVestingDeployed;
  let tokenDeployed;
  let startTime;
  let cliffTime;
  let releaseTime;
  let period;
  describe("Reserve", async function() {
    // Reserve:
    //   - 450m POLY
    //   - vested until April 18th, 2018
    //   - with 10m POLY released every month
    //   - sent to a single address
    beforeEach(async function() {
      cliffTime = 1524009600; // 04/18/2018 @ 12:00am (UTC)
      startTime = cliffTime - duration.months(1);
      releaseTime = startTime + duration.months(45);
      period = duration.months(1);
      tokenDeployed = await POLYToken.new(presale_wallet);

      polyVestingDeployed = await POLYVesting.new(
        tokenDeployed.address,
        startTime,
        cliffTime,
        releaseTime,
        period,
        { from: owner }
      );

      await tokenDeployed.transfer(
        polyVestingDeployed.address,
        new BigNumber(450000000).mul(10 ** 18)
      );
    });

    it("Owner of the vesting contract can allocate tokens to an address", async () => {
      assert.isFalse(await polyVestingDeployed.allocationFinished());
      await polyVestingDeployed.allocate(
        reserve,
        new BigNumber(450000000).mul(10 ** 18),
        { from: owner }
      );
      let allocated = await polyVestingDeployed.allocated.call();
      assert.equal(allocated.toNumber(), 450000000 * 10 ** 18);

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          reserve,
          new BigNumber(50000000).mul(10 ** 18)
        );
      });

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          notReserve,
          new BigNumber(50000000).mul(10 ** 18),
          { from: owner }
        );
      });

      assert.equal(
        (await polyVestingDeployed.allocations(reserve)).toNumber(),
        450000000 * 10 ** 18
      );
      assert.isTrue(await polyVestingDeployed.allocationFinished());
    });

    it("Reserve will remove 10 Million POLY per month (30 days) starting in April 18th, 2018", async () => {
      await polyVestingDeployed.allocate(
        reserve,
        new BigNumber(450000000).mul(10 ** 18),
        { from: owner }
      );
      assert.equal(
        (await polyVestingDeployed.allocations(reserve)).toNumber(),
        450000000 * 10 ** 18
      );
      await polyVestingDeployed.setBlockTimestamp(
        1524009600 - duration.days(14)
      );
      await assertFail(async () => {
        await polyVestingDeployed.collect({ from: reserve });
      });
      await polyVestingDeployed.setBlockTimestamp(1524009600);
      await polyVestingDeployed.collect({ from: reserve });
      assert.equal(
        (await tokenDeployed.balanceOf(reserve)).toNumber(),
        10000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(13)
      );
      await polyVestingDeployed.collect({ from: reserve });

      assert.equal(
        (await tokenDeployed.balanceOf(reserve)).toNumber(),
        130000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(24)
      );
      await polyVestingDeployed.collect({ from: reserve });

      assert.equal(
        (await tokenDeployed.balanceOf(reserve)).toNumber(),
        240000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(40)
      );
      await polyVestingDeployed.collect({ from: reserve });

      assert.equal(
        (await tokenDeployed.balanceOf(reserve)).toNumber(),
        400000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(45)
      );
      await polyVestingDeployed.collect({ from: reserve });

      assert.equal(
        (await tokenDeployed.balanceOf(reserve)).toNumber(),
        450000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(60)
      );
      await polyVestingDeployed.collect({ from: reserve });

      assert.equal(
        (await tokenDeployed.balanceOf(reserve)).toNumber(),
        450000000 * 10 ** 18
      );
    });
  });
});
