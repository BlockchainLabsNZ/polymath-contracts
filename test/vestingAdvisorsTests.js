"use strict";
var POLYToken = artifacts.require("PolyMathToken.sol");
var POLYVesting = artifacts.require("./helpers/PolyMathVestingMock.sol");
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");
import { latestTime, duration } from "./helpers/latestTime";

contract("PolyMathVesting", async function(
  [miner, owner, advisor1, advisor2, notAdvisor, presale_wallet]
) {
  let polyVestingDeployed;
  let tokenDeployed;
  let startTime;
  let cliffTime;
  let releaseTime;
  let period;
  describe("Advisors", async function() {
    // Advisors:
    //   - 25m POLY
    //   - vested until August 23rd, 2018
    //   - we specify numbers/addresses
    beforeEach(async function() {
      startTime = latestTime() + duration.days(1);
      cliffTime = 1534982400; // 08/23/2018 @ 12:00am (UTC)
      releaseTime = 1534982400; // 08/23/2018 @ 12:00am (UTC)
      period = 1; // No period
      tokenDeployed = await POLYToken.new(presale_wallet);

      polyVestingDeployed = await POLYVesting.new(
        tokenDeployed.address,
        startTime,
        cliffTime,
        releaseTime,
        period,
        new BigNumber(25000000).mul(10 ** 18),
        { from: owner }
      );

      await tokenDeployed.transfer(
        polyVestingDeployed.address,
        new BigNumber(25000000).mul(10 ** 18)
      );
    });

    it("Owner of the vesting contract can allocate tokens to multiple addresses", async () => {
      assert.isFalse(await polyVestingDeployed.allocationFinished());
      await polyVestingDeployed.allocate(
        advisor1,
        new BigNumber(10000000).mul(10 ** 18),
        { from: owner }
      );
      let allocated = await polyVestingDeployed.allocated.call();
      assert.equal(allocated.toNumber(), 10000000 * 10 ** 18);

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          advisor2,
          new BigNumber(15000000).mul(10 ** 18)
        );
      });

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          "0x0",
          new BigNumber(15000000).mul(10 ** 18),
          { from: owner }
        );
      });

      await polyVestingDeployed.allocate(
        advisor2,
        new BigNumber(15000000).mul(10 ** 18),
        { from: owner }
      );
      allocated = await polyVestingDeployed.allocated.call();
      assert.equal(allocated.toNumber(), 25000000 * 10 ** 18);

      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          notAdvisor,
          new BigNumber(15000000).mul(10 ** 18),
          { from: owner }
        );
      });

      assert.equal(
        (await polyVestingDeployed.allocations(advisor1)).toNumber(),
        10000000 * 10 ** 18
      );
      assert.equal(
        (await polyVestingDeployed.allocations(advisor2)).toNumber(),
        15000000 * 10 ** 18
      );
      assert.isTrue(await polyVestingDeployed.allocationFinished());
    });

    it("Advisors will remove the entirety of their tokens by August 23rd, 2018", async () => {
      await polyVestingDeployed.allocateArray(
        [advisor1, advisor2],
        [
          new BigNumber(10000000).mul(10 ** 18),
          new BigNumber(15000000).mul(10 ** 18)
        ],
        { from: owner }
      );
      assert.equal(
        (await polyVestingDeployed.allocations(advisor1)).toNumber(),
        10000000 * 10 ** 18
      );
      assert.equal(
        (await polyVestingDeployed.allocations(advisor2)).toNumber(),
        15000000 * 10 ** 18
      );
      await polyVestingDeployed.setBlockTimestamp(
        1534983400 - duration.days(1)
      );
      await assertFail(async () => {
        await polyVestingDeployed.collect({ from: advisor1 });
      });
      await polyVestingDeployed.setBlockTimestamp(1534982400);

      await polyVestingDeployed.collect({ from: advisor1 });
      await polyVestingDeployed.collect({ from: advisor2 });

      assert.equal(
        (await tokenDeployed.balanceOf(advisor1)).toNumber(),
        10000000 * 10 ** 18
      );

      assert.equal(
        (await tokenDeployed.balanceOf(advisor2)).toNumber(),
        15000000 * 10 ** 18
      );

      await polyVestingDeployed.setBlockTimestamp(
        1534983400 + duration.months(6)
      );
      await polyVestingDeployed.collect({ from: advisor1 });
      await polyVestingDeployed.collect({ from: advisor2 });

      assert.equal(
        (await tokenDeployed.balanceOf(advisor1)).toNumber(),
        10000000 * 10 ** 18
      );

      assert.equal(
        (await tokenDeployed.balanceOf(advisor2)).toNumber(),
        15000000 * 10 ** 18
      );
    });

    it("Admin can Claim Token excess of tokens", async () => {
      assert.isFalse(await polyVestingDeployed.allocationFinished());

      await polyVestingDeployed.allocateArray(
        [advisor1, advisor2],
        [
          new BigNumber(10000000).mul(10 ** 18),
          new BigNumber(10000000).mul(10 ** 18)
        ],
        { from: owner }
      );
      assert.equal(
        (await polyVestingDeployed.allocations(advisor1)).toNumber(),
        10000000 * 10 ** 18
      );
      assert.equal(
        (await polyVestingDeployed.allocations(advisor2)).toNumber(),
        10000000 * 10 ** 18
      );
      await assertFail(async () => {
        await polyVestingDeployed.finishAllocation();
      });
      await polyVestingDeployed.finishAllocation({ from: owner });
      assert.isTrue(await polyVestingDeployed.allocationFinished());
      await assertFail(async () => {
        await polyVestingDeployed.allocate(
          notAdvisor,
          new BigNumber(5000000).mul(10 ** 18),
          { from: owner }
        );
      });

      await assertFail(async () => {
        await polyVestingDeployed.claimTokens(tokenDeployed.address);
      });

      assert.equal((await tokenDeployed.balanceOf(owner)).toNumber(), 0);
      await polyVestingDeployed.claimTokens(tokenDeployed.address, {
        from: owner
      });

      assert.equal(
        (await tokenDeployed.balanceOf(owner)).toNumber(),
        5000000 * 10 ** 18
      );

      assert.equal(
        (await tokenDeployed.balanceOf(polyVestingDeployed.address)).toNumber(),
        20000000 * 10 ** 18
      );
    });
  });
});
