
var catalog		= artifacts.require('./CatalogSmartContract.sol');
module.exports	= (deployer) => {
  deployer.deploy (catalog);
};
