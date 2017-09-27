var POLYToken = artifacts.require("./PolyMathToken.sol");
var POLYTokenOffering = artifacts.require("./PolyMathTokenOffering.sol");

module.exports = function(deployer) {
  const startTime = Date.now() + 3000;
  const endTime = startTime + 50000;
  const rate = new web3.BigNumber(1000);
  const wallet = web3.eth.accounts[0];
  const goal = new web3.BigNumber(3000 * Math.pow(10, 18));
  const cap = new web3.BigNumber(15000 * Math.pow(10, 18));

  deployer.deploy(POLYToken).then(function() {
    deployer.deploy(POLYTokenOffering, POLYToken.address, startTime, endTime, rate, cap, goal, wallet);
});;
};
