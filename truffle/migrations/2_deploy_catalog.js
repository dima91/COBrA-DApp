
var Catalog				= artifacts.require ("./CatalogSmartContract.sol");


module.exports = async (deployer) => {
	console.log ('Deploying catalog...');
	await deployer.deploy (Catalog, {gas: 4700000});
};