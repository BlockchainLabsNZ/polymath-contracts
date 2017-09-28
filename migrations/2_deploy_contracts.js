
const POLYToken = artifacts.require("PolyMathToken.sol");
const POLYTokenOffering = artifacts.require("PolyMathTokenOffering.sol");

function latestTime() {
  return web3.eth.getBlock('latest').timestamp;
}
const duration = {
  seconds: function (val) { return val },
  minutes: function (val) { return val * this.seconds(60) },
  hours: function (val) { return val * this.minutes(60) },
  days: function (val) { return val * this.hours(24) },
  weeks: function (val) { return val * this.days(7) },
  years: function (val) { return val * this.days(365) }
};

module.exports = function(deployer, network) {
  
  const startTime = latestTime() + duration.seconds(1);
  const endTime = startTime + duration.weeks(1);
  const rate = new web3.BigNumber(1000);
  const wallet = web3.eth.accounts[0];
  const goal = new web3.BigNumber(3000 * Math.pow(10, 18));
  const cap = new web3.BigNumber(15000 * Math.pow(10, 18));

  if(network !== 'development'){
    deployer.deploy(POLYToken).then(async function() {
      await deployer.deploy(POLYTokenOffering, POLYToken.address, startTime, endTime, rate, cap, goal, wallet);
    });
  }
};
