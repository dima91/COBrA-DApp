
const fs				= require('fs')
const Web3				= require ("web3");
const truffle			= require ('truffle-contract');
const redis				= require("redis");
const redisClient		= redis.createClient();
const HDWalletProvider	= require("truffle-hdwallet-provider");

const catalogPath	= '../build/contracts/CatalogSmartContract.json';
const mnemonic		= "shift discover random surround trade trend execute topple casino silver art cart wedding clutch bullet";
const infuraKey		= "3c51b50483cd4eec9119a4a7129bd0a4";
let addresses		= [];
var catalogInstance;

// set the provider you want from Web3.providers
//const HDWalletProvider	= require("truffle-hdwallet-provider");
//const mnemonic			= "intact letter fringe dune payment lunch cabin blossom sister bread remove nest";
//const provider			= new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/3c51b50483cd4eec9119a4a7129bd0a4");
var provider;
var web3;
var endpoint	= "http://localhost:8545";




process.on ('SIGTERM', () => {
	console.log ("Received sigterm");
	atExit ();
});




process.on ('SIGINT', () => {
	console.log ("Received sigint");
	atExit ();
});




const atExit	= async () => {
	await catalogInstance.killMe ({from: addresses[0]});
	console.log ('Catalog estroyed!');
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




const createContract	= () => {
	web3.eth.getAccounts (async (err, res) => {
		try {
			addresses	= res;
			console.log ('Accounts:');
			console.log (addresses);
			console.log ('');
			
			let catalogContract	= truffle (readContract (catalogPath));
			catalogContract.setProvider (provider);
			
			console.log ('Creating catalog ...');
			catalogInstance		= await catalogContract.new ({ from: addresses[0], data:catalogContract.bytecode, gas:4962237});
			redisClient.set ("catAddr", catalogInstance.address, redis.print);
			console.log ('Catalog created!');

		} catch (err) {
			console.log ("\n\nERROR:");
			console.log (err);
			process.exit ();
		}
	});
}






/*if (typeof web3 != 'undefined') {
	console.log ("I'm here");

	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
} else {
	provider	= new Web3.providers.HttpProvider(endpoint);
	web3		= new Web3(provider);
}*/

//provider	= new HDWalletProvider (mnemonic, "https://ropsten.infura.io/"+infuraKey);
provider	= new Web3.providers.HttpProvider(endpoint);
web3		= new Web3 (provider);


createContract ();

