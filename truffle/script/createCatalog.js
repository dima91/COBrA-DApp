
const fs					= require ('fs')
const Web3					= require ("web3");
const truffle				= require ('truffle-contract');
const hdWalletProvider		= require ("truffle-hdwallet-provider");
const privateKeyProvider	= require ("truffle-hdwallet-provider-privkey");

const commandLineArgs		= require ("command-line-args");

const catalogPath			= 'build/contracts/CatalogSmartContract.json';
var catalogInstance;
var catalogOwner;

var privateKeys				= ["d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167"];
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
			var res	= await catalogInstance.killMe ({from: catalogOwner, gas:4000000});
			console.log ('Catalog estroyed!');
		} catch (err) {
			console.log ("\n\nRaised this error during 'killMe'");
			console.log (err.message);
		}
	}

	process.exit ();
}




const printHelp		= () => {
	console.log(	"\nUsage :   nodejs createCatalog.js [options]\n"+
					"Runs COBrA client\n\n" +
					"Options :\n" +
					"\t--testnet               \t Use the local Ethereum network (e.g. ganache) to deploy the contract\n" +
					"\t--infura                \t Use the default Infura node as ethereum provider (api key: " + infuraKey + ")\n" +
					"\t--infura-key <key>      \t Uses given string as API key for infura node\n" +
					"\t--mnemonic <words>      \t Uses given words to identify the Ethereum account\n" +
					"\t--private-key <key>     \t Uses given string to identify the Ethereum account (default private key: d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167)\n" +
					"\t--help                  \t This help message will shown\n" +
					"\n" +
					"Example : nodejs createCatalog.js --infura --private-key d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167");
	console.log ("\n");
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




const createCatalog	= async () => {
	web3.eth.getAccounts (async (err, res) => {
		try {
			let catalogContract	= truffle (JSON.parse (fs.readFileSync (catalogPath)));
			catalogContract.setProvider (provider);

			catalogOwner	= res[0];

			var balance	= await getBalance (catalogOwner);
			balance		= web3.toDecimal(balance);
			
			console.log ('Creating catalog from address  ' + catalogOwner + '  which has balance  ' + balance +  '...');
			catalogInstance		= await catalogContract.new ({ from: catalogOwner, data:catalogContract.bytecode, gas:4000000});
			console.log ('Catalog created!');
			console.log ('\tCatalog address is   ' + catalogInstance.address);

			console.log ("\nType CTRL-C to delete catalog and exit");
			
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
		{ name : 'private-key',		type : String },
		{ name : "testnet",			type : Boolean },
		{ name : "help",			type : Boolean }
	]

	const options = commandLineArgs (optionDefinitions);

	if (options["help"] == true) {
		printHelp ();
		process.exit ();
	}

	console.log ("\n\n==============================");

	// ==============================

	if (options["testnet"] == true) {
		console.log ("Using local testnet");
		
		provider	= new Web3.providers.HttpProvider ("http://127.0.0.1:8545");
		return ;
	}
	
	// ==============================
	
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




process.chdir (__dirname + "/..");

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

setInterval (() => {/*Do nothing*/}, 100);