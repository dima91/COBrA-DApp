
'use strict';


const fs	= require('fs')
const Web3	= require ("web3");

const folderPrefix	= '../solidity/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const songContractPath			= folderPrefix + 'SongManagementContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'

let web3;

if (process.argv.length < 3)
	throw "Invalid arguments"

let addresses	= [];
let catalogAddress	= process.argv[2];
let tmpInstance		= process.argv[3];

var lucaHex	= '0x6c756361';


let readContract	= (contractPath) => {
	var content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}



var createNewCatalog	= () => {
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
			.then (() => { process.exit (); });
}






console.log ("Hello client!");


if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
	// set the provider you want from Web3.providers
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}




web3.eth.getAccounts (function (err, res) {
	addresses= res;
}).then ( () => {

	let catalogAbi	= (readContract (catalogSmartContractPath)).abi;
	var catalogContract	= new web3.eth.Contract (catalogAbi, catalogAddress);

	//console.log (addresses);


	/****** Get content list */
	catalogContract.methods.getContentList()
						   .call ({from : addresses[0], gas:300000}, (err, res) => {
								console.log (err);
								console.log (res);
							});
	//*/




	/****** Check if a user is present
	catalogContract.methods.userExists (tmpInstance)
						   .call ({from : addresses[0], gas:300000}, (err, res) => {
								console.log (err);
								console.log (res);
							});
//*/



	/****** Create new content instance
	var rContract		= readContract (documentContractPath);
	var documentAbi		= rContract.abi;
	var documentContract	= new web3.eth.Contract (documentAbi)
	var contractData		= rContract.bytecode;
	
	documentContract
			.deploy ({data:contractData, arguments:['0xab', catalogAddress]})
			.send ({from : addresses[0], gas:10000000});
	//*/



	/****** Publish new content on catalog
	catalogContract.methods.publishContent ('0xaa', '0xab', web3.utils.toWei ("6300", "szabo"), tmpInstance)
							.send ({from : addresses[0], gas:300000}, (err, res) => {
								console.log (err);
								console.log (res);
							});

	//*/
	

	
	/****** Get content list
	catalogContract.methods.getAddressOf ("0xab")
						   .call ({from : addresses[0], gas:300000}, (err, res) => {
								console.log (err);
								console.log (res);
							});
	//*/


	
	/****** Register an user
	catalogContract.methods.registerMe(tmpInstance).send ({from : addresses[0], gas:300000}, (err, res) => {
												console.log (err);
												console.log (res);
											})
	//*/



	/****** Check existance of user
	catalogContract.methods.userExists ('0x6c756361')
							.call ({from : addresses[0], gas:300000}, (err, res) => {
								console.log (err);
								console.log (res);
							}).then (() => {
								console.log ("Resolved");
							});
	//*/

	

	/****** Buy premium account
	catalogContract.methods.buyPremium ()
	.send ({from: addresses[9], value:web3.utils.toWei ("44000", "szabo")})
	.then (() => {console.log ("Premium buyied")})
	//*/



	/****** Check whether an account is premium
	catalogContract.methods.isPremium('0x6c756361').call ({from : addresses[0]}).then ((res) => {
		console.log (res);
	})
	//*/



	/****** Check type of content */
	var contentAbi		= (readContract (baseContentContractPath)).abi;
	(new web3.eth.Contract (contentAbi, tmpInstance)
	.methods
	.getType()
	.call ({from : addresses[0], gas:300000}, (err, res) => {
		console.log (err);
		console.log (res);
	}));
	//*/


	/****** Check feedbacks
	let contentAbi		= (readContract (baseContentContractPath)).abi;
	(new web3.eth.Contract (contentAbi, tmpInstance)
	.methods
	.getFeedbacksAverages()
	.call ({from : addresses[0], gas:300000}, (err, res) => {
		console.log (err);
		console.log (res);
	}));
	//*/
})




/*	casinoContract= compileContract ('../cobra/contracts.sol', 'CatalogSmartContract')
	casinoContract['deployed'].send ({
		from: addresses[0],
		gas: 3000000,
	}, function(error, transactionHash){ })
	.on('error', function(error){ })
	.on('transactionHash', function(transactionHash){ console.log ("transaction: " + transactionHash)})
	.on('receipt', function(receipt){
	   console.log("Address: " + receipt.contractAddress) // contains the new contract address
	   casinoContract['address']= receipt.contractAddress;
	})
	.on('confirmation', function(confirmationNumber, receipt){"Confirmation number: " + confirmationNumber})
	.then(function(newContractInstance){
		console.log("New contract address: " + newContractInstance.options.address) // instance with the new contract address
		casinoContract['contract'].options.address= newContractInstance.options.address;
	});*/