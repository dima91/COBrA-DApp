
const fs= require('fs')
const Web3= require ("web3");

const folderPrefix	= '../solidity/build/contracts/'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'


let web3;

let addresses= [];

var catalogInstance;




process.on ('SIGTERM', () => {
	console.log ("Received sigterm");
	atExit ();
});


process.on ('SIGINT', () => {
	console.log ("Received sigint");
	atExit ();
});


const redis			= require("redis");
const redisClient	= redis.createClient();




const atExit	= () => {
	catalogInstance
	.methods
	.killMe ()
	.send ({from : addresses[0], gas:30000000}, (err, res) => {
		if (err) console.log (err);
	})
	.then (() => {
		console.log ('Catalog estroyed!');
		process.exit ();
	}).catch ((err) => {
		console.log ('\n\nERROR ON CATALOG DESTROY');
		console.log (err);
		process.exit ();
	});
}

redisClient.on("error", (err) => {
	console.log("Error " + err);
	process.exit ();
});



let readContract	= (contractPath) => {
	content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}


if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
	// set the provider you want from Web3.providers
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}



web3.eth.getAccounts (function (err, res) {
	addresses= res;
}).then ( () => {

	let rContract		= readContract (catalogSmartContractPath);
	let catalogAbi		= rContract.abi;
	let catalogContract	= new web3.eth.Contract (catalogAbi);
	let contractData		= rContract.bytecode;
	


	catalogContract
	.deploy ({data:contractData})
	.send ({from : addresses[0], gas:10000000}, (err, res) => {
		console.log (err);
		console.log (res);
	})
	.on('error', (error) => {
		console.log (error);
		process.exit ();
	})
	.on('receipt', (receipt) => {
	   console.log("Contract address: " + receipt.contractAddress);
	   redisClient.set("catAddr", receipt.contractAddress, redis.print);
	})
	.then ((newContractnstance) => {
		catalogInstance	= newContractnstance;
		console.log ('Deployed!');
	});
})