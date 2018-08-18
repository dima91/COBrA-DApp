// FIXME Integrate with truffle compilation!!!


const fs= require('fs')
const Web3= require ("web3");

var contarcts= [];  // {'code': ..., 'compiled':..., 'byteCode':..., 'abi':..., 'contract':..., 'instance':...}
var addresses= [];
var catalogAddress;
var casinoContract;



				// (contract.sol, Casino)
let compileContract = (path, name) => {
	var cCode =		fs.readFileSync (path).toString();
	var compCode = 	solc.compile (cCode, 1);
	var bCode = 	compCode.contracts[':'+name].bytecode;
	var abi = 		JSON.parse (compCode.contracts[':'+name].interface);
	var contract = 	new web3.eth.Contract (abi);
	var deployed = 	contract.deploy ({ data : bCode });

	return {code:cCode, compiled:compCode, byteCode:bCode, abi:abi, contract:contract, deployed:deployed, address:""};
}



let publishContents = () => {

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
	casinoContract= compileContract ('../cobra/contracts.sol', 'CatalogSmartContract')
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
	});
})
