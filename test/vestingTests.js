'use strict';
var POLYToken = artifacts.require('PolyMathToken.sol');
var POLYVesting = artifacts.require('./helpers/PolyMathVestingMock.sol');

const assertFail = require('./helpers/assertFail');
import { latestTime, duration } from './helpers/latestTime';

let polyVestingDeployed, tokenOfferingDeployed, tokenDeployed;
let startTime, endTime;

contract('PolyMathVesting', async function ([miner, owner, investor, wallet, presale_wallet]) {
  beforeEach(async function () {
    startTime  = latestTime() + duration.seconds(1);
    endTime = startTime + duration.weeks(1);
    tokenDeployed = await POLYToken.new(presale_wallet);
    polyVestingDeployed = await POLYVesting.new(tokenDeployed.address, endTime, owner);
    await tokenDeployed.transfer(polyVestingDeployed.address, 1000000000000000000);
  });

  it('tokens cannot be released by someone other than the vesting address', async () => {
    await polyVestingDeployed.setBlockTimestamp(endTime + 10);
    await polyVestingDeployed.release.sendTransaction({'from': investor});
    assert.equal((await tokenDeployed.balanceOf.call(owner)).toNumber(), 0);
  });

  it('tokens can be released after vesting date', async () => {
    await polyVestingDeployed.setBlockTimestamp(endTime + 10);
    await polyVestingDeployed.release.sendTransaction({
      'from': owner
    });
    assert.equal((await tokenDeployed.balanceOf.call(owner)).toNumber(), 1000000000000000000);
  });

  it('tokens cannot be released before vesting date', async () => {
    await polyVestingDeployed.setBlockTimestamp(endTime - 10);
    await assertFail(async () => {
      await polyVestingDeployed.release.sendTransaction({'from': investor})
    });
  });
});
