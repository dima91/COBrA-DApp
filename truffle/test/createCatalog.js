
const fs				= require('fs')
const Web3				= require ("web3");
const truffle			= require ('truffle-contract');
const redis				= require("redis");
const redisClient		= redis.createClient();
const HDWalletProvider	= require ("truffle-hdwallet-provider");

const catalogPath		= 'build/contracts/CatalogSmartContract.json';
let addresses			= [];
var catalogInstance;
var catalogOwner;

const mnemonic			= "";
const infuraKey			= "3c51b50483cd4eec9119a4a7129bd0a4";

const INFURA_DEPLOY		= true;

var provider;
var web3;




process.on ('SIGTERM', () => {
	console.log ("\nReceived sigterm");
	atExit ();
});




process.on ('SIGINT', () => {
	console.log ("\nReceived sigint");
	atExit ();
});




redisClient.on("error", (err) => {
	console.log("Error " + err);
	atExit ();
});



let readContract	= (contractPath) => {
	return JSON.parse (fs.readFileSync (contractPath));
}




const getBalance	= (address) => {
	return new Promise ((resolve, reject) => {
		web3.eth.getBalance(catalogOwner, (err, res) => {
			if (err)
				reject (err);

			resolve (res);
		});
		
	});
}




const atExit	= async () => {
	if (catalogInstance == undefined) {
		console.log ("\nCatalog is undefined!");
	}
	else {
		try {
			var res	= await catalogInstance.killMe ({from: addresses[0]});
			console.log ('Catalog estroyed!');
			console.log ('\tTransaction hash is  ' + res.receipt.transactionHash);
		} catch (err) {
			console.log ("\n\nRaised this error during 'killMe'");
			console.log (err.message);
		}
	}

	process.exit ();
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

			catalogOwner	= addresses[0];

			var balance	= await getBalance (catalogOwner);
			balance		= web3.toDecimal(balance);
			
			console.log ('Creating catalog from address  ' + catalogOwner + '  which has balance  ' + balance +  '...');
			catalogInstance		= await catalogContract.new ({ from: catalogOwner, data:catalogContract.bytecode, gas:4000000});
			redisClient.set ("catAddr", catalogInstance.address, redis.print);
			console.log ('Catalog created!');
			console.log ('\tCatalog address is   ' + catalogInstance.address);
			console.log ('\tTransaction hash is  ' + catalogInstance.transactionHash);

		} catch (err) {
			console.log ("\n\nRaised this error during 'createCatalog' :  " + err.message);
			atExit ();
		}
	});
}





console.log (web3); 
if (typeof web3 !== 'undefined') {
	console.log ("Provider already defined!");

	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
}
else {
	if (INFURA_DEPLOY) {
		console.log ("Deploying with infura provider\n");
		provider	= new HDWalletProvider (mnemonic, "https://ropsten.infura.io/v3/"+infuraKey);
	}

	else {
		console.log ("Deploying with http provider\n");
		provider	= new Web3.providers.HttpProvider ("http://localhost:8545");
	}
}

web3		= new Web3(provider);

createCatalog ();

