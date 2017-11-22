"use strict";
var POLYToken = artifacts.require("PolyMathToken.sol");
var POLYVesting = artifacts.require("./helpers/PolyMathVestingMock.sol");
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");
import { latestTime, duration } from "./helpers/latestTime";

contract("PolyMathVesting", async function(
  [miner, owner, founder1, founder2, notFounder, presale_wallet]
) {
  let polyVestingDeployed;
  let tokenDeployed;
  let startTime;
  let cliffTime;
  let releaseTime;
  let period;
  describe("Founders", async function() {
    // Founders:
    //   - 150m POLY
    //   - 1/4th vested until 1 year cliff
    //   - with 1/48th vest every month thereafter
    //   - allocated to multiple addresses that we specify.
    beforeEach(async function() {
      startTime = latestTime() + duration.days(1);
      cliffTime = startTime + duration.months(12);
      releaseTime = startTime + duration.months(48);
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
        new BigNumber(150000000).mul(10 ** 18)
      );
    });

    it("Owner of the vesting contract can allocate tokens to multiple addresses", async () => {
      assert.isFalse(await polyVestingDeployed.allocationFinished());
      await polyVestingDeployed.allocate(
        founder1,
        new BigNumber(100000000).mul(10 ** 18),
        { from: owner }
      );
      let allocated = await polyVestingDeployed.allocated.call();
      assert.equal(allocated.toNumber(), 100000000 * 10 ** 18);

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          founder2,
          new BigNumber(50000000).mul(10 ** 18)
        );
      });

      await polyVestingDeployed.allocate(
        founder2,
        new BigNumber(50000000).mul(10 ** 18),
        { from: owner }
      );
      allocated = await polyVestingDeployed.allocated.call();
      assert.equal(allocated.toNumber(), 150000000 * 10 ** 18);

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          notFounder,
          new BigNumber(50000000).mul(10 ** 18),
          { from: owner }
        );
      });

      assert.equal(
        (await polyVestingDeployed.allocations(founder1)).toNumber(),
        100000000 * 10 ** 18
      );
      assert.equal(
        (await polyVestingDeployed.allocations(founder2)).toNumber(),
        50000000 * 10 ** 18
      );
      assert.isTrue(await polyVestingDeployed.allocationFinished());
    });

    it("Founders will remove 1/48th per month (30 days) only after the first year has passed (360 days)", async () => {
      await polyVestingDeployed.allocateArray(
        [founder1, founder2],
        [
          new BigNumber(102000000).mul(10 ** 18),
          new BigNumber(48000000).mul(10 ** 18)
        ],
        { from: owner }
      );
      assert.equal(
        (await polyVestingDeployed.allocations(founder1)).toNumber(),
        102000000 * 10 ** 18
      );
      assert.equal(
        (await polyVestingDeployed.allocations(founder2)).toNumber(),
        48000000 * 10 ** 18
      );
      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(6)
      );
      await assertFail(async () => {
        await polyVestingDeployed.collect({ from: founder1 });
      });
      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(12)
      );
      await polyVestingDeployed.collect({ from: founder1 });
      assert.equal(
        (await tokenDeployed.balanceOf(founder1)).toNumber(),
        25500000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(13)
      );
      await polyVestingDeployed.collect({ from: founder2 });

      assert.equal(
        (await tokenDeployed.balanceOf(founder2)).toNumber(),
        13000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(24)
      );
      await polyVestingDeployed.collect({ from: founder1 });
      await polyVestingDeployed.collect({ from: founder2 });

      assert.equal(
        (await tokenDeployed.balanceOf(founder1)).toNumber(),
        51000000 * 10 ** 18
      );

      assert.equal(
        (await tokenDeployed.balanceOf(founder2)).toNumber(),
        24000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(40)
      );
      await polyVestingDeployed.collect({ from: founder2 });

      assert.equal(
        (await tokenDeployed.balanceOf(founder2)).toNumber(),
        40000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(48)
      );
      await polyVestingDeployed.collect({ from: founder1 });
      await polyVestingDeployed.collect({ from: founder2 });

      assert.equal(
        (await tokenDeployed.balanceOf(founder1)).toNumber(),
        102000000 * 10 ** 18
      );

      assert.equal(
        (await tokenDeployed.balanceOf(founder2)).toNumber(),
        48000000 * 10 ** 18
      );
      await polyVestingDeployed.setBlockTimestamp(
        startTime + duration.months(60)
      );
      await polyVestingDeployed.collect({ from: founder1 });
      await polyVestingDeployed.collect({ from: founder2 });

      assert.equal(
        (await tokenDeployed.balanceOf(founder1)).toNumber(),
        102000000 * 10 ** 18
      );

      assert.equal(
        (await tokenDeployed.balanceOf(founder2)).toNumber(),
        48000000 * 10 ** 18
      );
    });
  });
});
