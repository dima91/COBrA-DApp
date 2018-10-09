
const fs					= require ("fs")
const Web3					= require ("web3");
const truffle				= require ("truffle-contract");
const hdWalletProvider		= require ("truffle-hdwallet-provider");
const privateKeyProvider	= require ("truffle-hdwallet-provider-privkey");

const commandLineArgs		= require ("command-line-args");
var commandLineOptions		= {};

const catalogPath			= "build/contracts/CatalogSmartContract.json";
var catalogInstance;
var catalogOwner;

var privateKeys				= ["d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167"];
var mnemonic				= "";
var infuraKey				= "3c51b50483cd4eec9119a4a7129bd0a4";

var endpoint;
var provider;
var web3;




const printHelp		= () => {
	console.log(	"\nUsage :   nodejs catalogManager.js --create || --delete <address>  [options]\n"+
					"Allows you tocreate or destroy a Catalog smart contract\n\n" +
					"Options :\n" +
					"\t--testnet               \t Use the local Ethereum network (e.g. ganache) to deploy the contract\n" +
					"\t--infura                \t Use the default Infura node as ethereum provider (api key: " + infuraKey + ")\n" +
					"\t--infura-key <key>      \t Uses given string as API key for infura node\n" +
					"\t--mnemonic <words>      \t Uses given words to identify the Ethereum account\n" +
					"\t--private-key <key>     \t Uses given string to identify the Ethereum account (default private key: d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167)\n" +
					"\t--help                  \t This help message will shown\n" +
					"\n" +
					"Example : nodejs catalogManager.js --create --infura --private-key d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167");
	console.log ("\n");
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




const performAction	= () => {
	web3.eth.getAccounts (async (err, res) => {
		try {
			var catalogContract	= truffle (JSON.parse (fs.readFileSync (catalogPath)));
			catalogContract.setProvider (provider);
			catalogOwner	= res[0];

			var balance	= await getBalance (catalogOwner);
			balance		= web3.toDecimal(balance);
			
			if (commandLineOptions["create"] == true) {
				console.log ("Creating catalog from address  " + catalogOwner + "  which has balance  " + balance +  "...");
				createCatalog (catalogContract);
			}
			else {
				const address	= commandLineOptions["delete"];
				console.log ("Destroying catalog at " + address + " from address  " + catalogOwner +
							 "  which has balance  " + balance +  "...");
				destroyCatalog (address, catalogContract);
			}
		}
		catch (err) {
			console.log ("Cannot perform the requested action!");
			console.log (err.message);
		}
	});
}




const createCatalog	= async (contract) => {
	try {
		catalogInstance		= await contract.new ({ from: catalogOwner, data:contract.bytecode, gas:4000000});
		console.log ("Catalog created!");
		console.log ("\tCatalog address is   " + catalogInstance.address);
		process.exit ();
	} catch (err) {
		console.log ("\n\nRaised this error during 'createCatalog' :  " + err.message);
		process.exit ();
	}
}




const destroyCatalog	= (catalogAddress, contract) => {
	contract
	.at (catalogAddress)
	.then (async (instance) => {
		var res	= await instance.killMe ({from: catalogOwner, gas:4000000});
		console.log ("Catalog estroyed!");
		process.exit ();
	})
	.catch ((err) => {
		console.log ("\n\nRaised this error during 'deleteCatalog' :  " + err.message);
		process.exit ();
	});
}




// Function to parse comman line arguments which describe provider and account
const parseArgs		= (args) => {
	
	const optionDefinitions = [
		{ name : "create",			type : Boolean },
		{ name : "delete",			type : String },
		{ name : "infura",			type : Boolean },
		{ name : "infura-key",		type : String },
		{ name : "mnemonic",		type : String},
		{ name : "private-key",		type : String },
		{ name : "testnet",			type : Boolean },
		{ name : "help",			type : Boolean }
	]

	commandLineOptions = commandLineArgs (optionDefinitions);


	if (commandLineOptions["help"] == true) {
		printHelp ();
		process.exit ();
	}

	
	if ((commandLineOptions["delete"] == null && commandLineOptions["create"] == undefined)
		 || (commandLineOptions["delete"] != null && commandLineOptions["create"] != undefined)) {
		console.log ("\nERROR : both --delete ad --create are missing or are defined!\n");
		printHelp ();
		process.exit ();
	}


	// ==============================

	// Loading local testnet provider
	if (commandLineOptions["testnet"] == true) {
		endpoint 	= "http://127.0.0.1:8545";
		console.log ("Using local testnet");
	}
	// Using an Infura node as provider
	else if (commandLineOptions["infura"] == true) {
		// Do nothing: using default infura key
		endpoint	= "https://ropsten.infura.io/v3/"+ infuraKey;
		console.log ("---  Using  " + infuraKey + "  as infura key");
	}
	else if (commandLineOptions["infura-key"] != undefined) {
		endpoint	= "https://ropsten.infura.io/v3/"+ commandLineOptions["infura-key"];
		console.log ("---  Using  " + commandLineOptions["infura-key"] + "  as infura key");
	}
	else {
		endpoint 	= "http://127.0.0.1:8545";
		console.log ("---  Using local ethereum client");
	}

	// ==============================

	// Loading user address private key or mnemonic words
	if (commandLineOptions["mnemonic"] != undefined) {
		mnemonic	= commandLineOptions["mnemonic"];
		provider	= new hdWalletProvider (mnemonic, endpoint);
	}
	else if (commandLineOptions["private-key"] != undefined) {
		privateKeys	= [];
		privateKeys.push (commandLineOptions["private-key"]);
		provider	= new privateKeyProvider (privateKeys, endpoint);
	}

	else {
		provider	= new privateKeyProvider	(privateKeys, endpoint);
	}
}



process.chdir (__dirname + "/..");

if (typeof web3 !== "undefined") {
	console.log ("Provider already defined!");

	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
}
else {
	parseArgs ();
}
web3		= new Web3(provider);



console.log ("\n");
performAction ();
