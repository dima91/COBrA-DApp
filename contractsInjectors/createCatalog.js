
const fs				= require('fs')
const Web3				= require ("web3");
const truffle			= require ('truffle-contract');
const redis				= require("redis");
const redisClient		= redis.createClient();
const HDWalletProvider	= require ("truffle-hdwallet-provider");

const catalogPath		= '../build/contracts/CatalogSmartContract.json';
let addresses			= [];
var catalogInstance;

const mnemonic			= "";
const infuraKey			= "";

const INFURA_DEPLOY		= false;

var provider;
var web3;




process.on ('SIGTERM', () => {
	console.log ("Received sigterm");
	atExit ();
});




process.on ('SIGINT', () => {
	console.log ("Received sigint");
	atExit ();
});




const atExit	= async () => {
	try {
		await catalogInstance.killMe ({from: addresses[0]});
		console.log ('Catalog estroyed!');
	} catch (err) {
		console.log ("\n\nRaised this error during 'killMe'");
		console.log (err);
	}
	process.exit ();
}




redisClient.on("error", (err) => {
	console.log("Error " + err);
	process.exit ();
});



let readContract	= (contractPath) => {
	content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}




const createCatalog	= () => {
	web3.eth.getAccounts (async (err, res) => {
		try {
			addresses	= res;
			console.log ('Accounts:');
			console.log (addresses);
			console.log ('');
			
			let catalogContract	= truffle (readContract (catalogPath));
			catalogContract.setProvider (provider);
			
			console.log ('Creating catalog ...');
			catalogInstance		= await catalogContract.new ({ from: addresses[0], data:catalogContract.bytecode, gas:4700000});
			redisClient.set ("catAddr", catalogInstance.address, redis.print);
			console.log ('Catalog created! Address is  ' + catalogInstance.address);
		} catch (err) {
			console.log ("\n\nERROR:");
			console.log (err);
			process.exit ();
		}
	});
}






if (typeof web3 !== 'undefined') {
	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
}
else {
	if (INFURA_DEPLOY)
		provider	= new HDWalletProvider (mnemonic, "https://ropsten.infura.io/"+infuraKey);

	else
		provider	= new Web3.providers.HttpProvider ("http://localhost:8545");
}

web3		= new Web3(provider);

createCatalog ();

