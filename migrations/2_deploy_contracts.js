var PolyCrowdsale = artifacts.require("./PolyCrowdsale.sol");

module.exports = function(deployer) {
  deployer.deploy(PolyCrowdsale);
};
