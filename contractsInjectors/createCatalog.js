
const fs= require('fs')
const Web3= require ("web3");

const folderPrefix	= '../solidity/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'

let web3;

let addresses= [];
let catalogAddress	= process.argv[2];
let tmpInstance		= process.argv[3];

var lucaHex	= '0x6c756361';


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
})