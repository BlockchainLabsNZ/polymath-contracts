'use strict';
var POLYToken = artifacts.require('PolyMathToken.sol');
var POLYVesting = artifacts.require('./helpers/PolyMathVestingMock.sol');

const assertFail = require('./helpers/assertFail');
import { latestTime, duration } from './helpers/latestTime';

let polyVestingDeployed, tokenOfferingDeployed, tokenDeployed;
const startTime = latestTime() + duration.seconds(1);
const endTime = startTime + duration.weeks(1);

contract('PolyMathVesting', async function ([miner, owner, investor, wallet]) {
  beforeEach(async function () {
    tokenDeployed = await POLYToken.new();
    polyVestingDeployed = await POLYVesting.new(tokenDeployed.address, endTime, owner);
    await tokenDeployed.transfer(polyVestingDeployed.address, 1000000000000000000);
    // await tokenOfferingDeployed.setBlockTimestamp(startTime + duration.days(1));
  });

  it('tokens cannot be released by someone other than the vesting address', async () => {
    await polyVestingDeployed.setBlockTimestamp(endTime + 10);
    assertFail(await polyVestingDeployed.release.sendTransaction({'from': investor}));
  });

  it('tokens can be released after vesting date', async () => {
    await polyVestingDeployed.setBlockTimestamp(endTime + 10);
    await polyVestingDeployed.release.sendTransaction({
      'from': owner
    });
    assert.equal((await tokenDeployed.balanceOf.call(owner)).toNumber(), 10);
  });

  it('tokens cannot be released before vesting date', async () => {
    assertFail(await polyVestingDeployed.release.sendTransaction({'from': owner}));
  });
});
