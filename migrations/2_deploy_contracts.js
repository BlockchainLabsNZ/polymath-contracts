
const POLYToken = artifacts.require("PolyMathToken.sol");
const POLYTokenOffering = artifacts.require("PolyMathTokenOffering.sol");
const abiEncoder = require('ethereumjs-abi');

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

  const startTime = latestTime() + duration.minutes(5);
  const endTime = startTime + duration.weeks(1);
  const rate = new web3.BigNumber(1000);
  const wallet = web3.eth.accounts[0];
  const presale_wallet = web3.eth.accounts[1];
  const goal = new web3.BigNumber(3000 * Math.pow(10, 18));
  const cap = new web3.BigNumber(15000 * Math.pow(10, 18));

  if(network !== 'development'){
    deployer.deploy(POLYToken, wallet).then(async function() {
      let tokenDeployed = await POLYToken.deployed(presale_wallet);
      const encodedPoly = abiEncoder.rawEncode(['address'], [ wallet]);
      console.log('encodedPoly ENCODED: \n', encodedPoly.toString('hex'));
      // function PolyMathTokenOffering(address _token, uint256 _startTime, uint256 _endTime, uint256 _cap, address _wallet) {
      await deployer.deploy(POLYTokenOffering, POLYToken.address, startTime, endTime, cap, wallet);
      const encodedPOLYTokenOffering = abiEncoder.rawEncode(['address', 'uint256', 'uint256', 'uint256', 'address'], [POLYToken.address, startTime.toString(10), endTime.toString(10), cap.toString(10), wallet]);
      console.log('encodedPOLYTokenOffering ENCODED: \n', encodedPOLYTokenOffering.toString('hex'));
      await tokenDeployed.initializeCrowdsale(POLYTokenOffering.address);

    });
  }
};
