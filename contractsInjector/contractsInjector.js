
const fs= require('fs')
const Web3= require ("web3");

const folderPrefix	= '../solidity/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'

let web3;

let contarcts= [];  // {'code': ..., 'compiled':..., 'byteCode':..., 'abi':..., 'contract':..., 'instance':...}
let addresses= [];
let catalogAddress;
let casinoContract;

let readContract = (contractPath) => {
	content= fs.readFileSync (contractPath);
	return JSON.parse(content);
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
	let catalogAbi	= (readContract (catalogSmartContractPath))['abi'];
	var catalogContract	= new web3.eth.Contract (catalogAbi, '0xa1d83ed7e589892afbac6d9b772081ef81c0d259',{
													from : addresses[0]
												});
	/*catalogContract.methods.getContentList().send ()
		.then ((result) => {console.log ('Result of query'); console.log (result)});*/
	catalogContract.methods.registerMe('0xab').send ({from : addresses[0], gas:300000}, (err, res) => {
													console.log (err);
													console.log (res);
												})

	setTimeout (() => {
		catalogContract.methods.isPremium('0xab').call ({from : addresses[0]}).then ((res) => {
			console.log (res);
	})}, 3000)




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
})
