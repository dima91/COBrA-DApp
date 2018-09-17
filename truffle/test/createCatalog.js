
const fs					= require ('fs')
const Web3					= require ("web3");
const truffle				= require ('truffle-contract');
const hdWalletProvider		= require ("truffle-hdwallet-provider");
const privateKeyProvider	= require ("truffle-hdwallet-provider-privkey");

const commandLineArgs		= require ("command-line-args");

const catalogPath			= 'build/contracts/CatalogSmartContract.json';
let addresses				= [];
var catalogInstance;
var catalogOwner;

var privateKeys				= [];
var mnemonic				= "";
var infuraKey				= "3c51b50483cd4eec9119a4a7129bd0a4";

var endpoint;
var provider;
var web3;




const atExit	= async () => {
	if (catalogInstance == undefined) {
		console.log ("\nCatalog is undefined!");
	}
	else {
		try {
			var res	= await catalogInstance.killMe ({from: addresses[0], gas:4000000});
			console.log ('Catalog estroyed!');
		} catch (err) {
			console.log ("\n\nRaised this error during 'killMe'");
			console.log (err.message);
		}
	}

	process.exit ();
}




process.on ('SIGTERM', () => {
	console.log ("\nReceived sigterm");
	atExit ();
});




process.on ('SIGINT', () => {
	console.log ("\nReceived sigint");
	atExit ();
});




const getBalance	= (address) => {
	return new Promise ((resolve, reject) => {
		web3.eth.getBalance(catalogOwner, (err, res) => {
			if (err)
				reject (err);

			resolve (res);
		});
		
	});
}




const createCatalog	= () => {
	web3.eth.getAccounts (async (err, res) => {
		try {
			let catalogContract	= truffle (JSON.parse (fs.readFileSync (contractPath)));
			catalogContract.setProvider (provider);

			catalogOwner	= res[0];

			var balance	= await getBalance (catalogOwner);
			balance		= web3.toDecimal(balance);
			
			console.log ('Creating catalog from address  ' + catalogOwner + '  which has balance  ' + balance +  '...');
			catalogInstance		= await catalogContract.new ({ from: catalogOwner, data:catalogContract.bytecode, gas:4000000});
			console.log ('Catalog created!');
			console.log ('\tCatalog address is   ' + catalogInstance.address);
			
		} catch (err) {
			console.log ("\n\nRaised this error during 'createCatalog' :  " + err.message);
			atExit ();
		}
	});
}




// Function to parse comman line arguments which describe provider and account
const parseArgs		= (args) => {
	
	const optionDefinitions = [
		{ name : 'infura',			type : Boolean },
		{ name : 'infura-key',		type : String },
		{ name : 'mnemonic',		type : String},
		{ name : 'private-key',		type : String }
	]

	const options = commandLineArgs (optionDefinitions);
	console.log ("\n\n==============================");

	if (options["infura"] == true) {
		// Do nothing: using default infura key
		endpoint	= "https://ropsten.infura.io/v3/"+ infuraKey;
		console.log ("---  Using  " + infuraKey + "  as infura key");
	}
	else if (options["infura-key"] != undefined) {
		endpoint	= "https://ropsten.infura.io/v3/"+ options["infura-key"];
		console.log ("---  Using  " + options["infura-key"] + "  as infura key");
	}
	else {
		endpoint	= "http://127.0.0.1:8545";
		console.log ("---  Using local ethereum client");
	}

	// ==============================

	if (options["mnemonic"] != undefined) {
		mnemonic	= options["mnemonic"];
		provider	= new hdWalletProvider (mnemonic, endpoint);
	}
	else if (options["private-key"] != undefined) {
		privateKeys.push (options["private-key"]);
		provider	= new privateKeyProvider (privateKeys, endpoint);
	}

	else {
		console.log ("[WARNING] No private key or mnemonic words given!");
		provider	= new hdWalletProvider	("", endpoint);
	}
}




console.log (web3); 
if (typeof web3 !== 'undefined') {
	console.log ("Provider already defined!");

	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
}
else {
	parseArgs ();
}
web3		= new Web3(provider);

createCatalog ();

