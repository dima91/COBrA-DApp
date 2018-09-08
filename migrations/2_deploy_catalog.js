
var Catalog				= artifacts.require ("./CatalogSmartContract.sol");
var BaseContent			= artifacts.require ("./BaseContentManagementContract.sol")
/*var web3;

var Web3= require ("web3");

if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}*/


module.exports = async (deployer) => {
	var instance	= deployer.deploy (Catalog);
	console.log (instance);
};