
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

var catalogContract	= {};
let addresses		= [];
let catalogAddress	= process.argv[2];


let readContract	= (contractPath) => {
	var content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}

/*
 *	1. Registration of 0xaa, 0xbb, 0xcc and 0xdd
 *	2. Publishing contents 0xa1, 0xa2, 0xa3, 0xb1, 0xb2, 0xc1, 0xc2, 0xc3, 0cxc4, 0xd1, 0xd2
 */


const baseContract	= readContract (baseContentContractPath);
const contr 		= [
	readContract (songContractPath),
	readContract (videoContractPath),
	readContract (photoContractPath),
	readContract (documentContractPath)
]




const createAndLink	= (u, cnt) => {
	return new Promise ((resolve, reject) => {
		var newAddr= '';

		(new web3.eth.Contract (contr[cnt.type].abi))
		.deploy ({data:contr[cnt.type].bytecode, arguments:[cnt.name, catalogAddress]})
		.send ({from : u.address, gas:1000000000}, (err, res) => {if (err) console.log (err);})
		.on('receipt', (receipt) => {
			cnt.addr	= receipt.contractAddress

			catalogContract.methods
			.publishContent (u.name, cnt.name, web3.utils.toWei ("6300", "szabo"), cnt.addr)
			.send ({from : u.address, gas:30000000}, (err, res) => {
				if (err) console.log (err);
				resolve (newAddr);
			});
		})
})
}




const buyAndConsume	= (u, c) => {
	return new Promise ((resolve, reject) => {
		catalogContract.methods
		.getContent (c.name)
		.send ({from:u.address, gas:30000000, value:web3.utils.toWei ("6300", "szabo")}, (err, res) => {
			if (err) console.log (err);
			//console.log (res);*/
			new web3.eth.Contract (contr[c.type].abi, c.addr, (err, res) => {
				if (err) console.log (err);
				//console.log (res);*/
			})
			.methods
			.consumeContent (u.name)
			.send ({from:u.address, gas:300000000}, (err, res) => {
				resolve (true);
			})
		});
	})
}




const leaveFeedback	=	(u, c, fs) => {
	return new Promise ((resolve, reject) => {
		// function leaveFeedback (bytes32 _username, uint8 _c, uint8 _v)
		var tmpContract	= new web3.eth.Contract (baseContract.abi, c.addr);
		console.log ('leaving feed  ' + fs[0] + '  for category  1');
		tmpContract.methods
		.leaveFeedback (u.name, 1, fs[0])
		.send ({from:u.address, gas:30000000}, (err, res) => {
			if (err) console.log (err);

			console.log ('leaving feed  ' + fs[1] + '  for category  2');
			tmpContract.methods
			.leaveFeedback (u.name, 2, fs[1])
			.send ({from:u.address, gas:30000000}, (err, res) => {
				if (err) console.log (err);

				console.log ('leaving feed  ' + fs[2] + '  for category  3');
				tmpContract.methods
				.leaveFeedback (u.name, 3, fs[2])
				.send ({from:u.address, gas:30000000}, (err, res) => {
					if (err) console.log (err);

					resolve (true);
				})
			})
		})
	})
}






if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
	// set the provider you want from Web3.providers
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}




web3.eth.getAccounts (function (err, res) {
	addresses= res;
}).then ( async () => {

	let catalogAbi	= (readContract (catalogSmartContractPath)).abi;
	catalogContract	= await new web3.eth.Contract (catalogAbi, catalogAddress);

	console.log (addresses);

	const usr = {
		a : {
			address	: addresses[0],
			name	: '0x61'
		},
		b : {
			address	: addresses[1],
			name	: '0x62'
		},
		c : {
			address	: addresses[2],
			name	: '0x63'
		},
		d : {
			address	: addresses[3],
			name	: '0x64'
		},
	}

	
	const a0 = {name:'0x6130', type:0, addr:''}
	const a1 = {name:'0x6131', type:0, addr:''}
	const a2 = {name:'0x6132', type:1, addr:''}
	const a3 = {name:'0x6133', type:2, addr:''}

	const b0 = {name:'0x6230', type:2, addr:''}
	const b1 = {name:'0x6231', type:3, addr:''}
	const b2 = {name:'0x6232', type:1, addr:''}
	const b3 = {name:'0x6233', type:3, addr:''}

	const c0 = {name:'0x6330', type:1, addr:''}
	const c1 = {name:'0x6331', type:2, addr:''}
	const c2 = {name:'0x6332', type:3, addr:''}
	const c3 = {name:'0x6333', type:3, addr:''}

	const d0 = {name:'0x6430', type:3, addr:''}
	const d1 = {name:'0x6431', type:2, addr:''}
	const d2 = {name:'0x6432', type:2, addr:''}
	const d3 = {name:'0x6433', type:0, addr:''}





	/* a: a2[1]  a1[0]
	 * b: b3[3]  b0[2]
	 * c: c2[3]  c3[3]  c1[2]
	 * d: d0[3]
	 */
	await createAndLink (usr.d, d0)
	await createAndLink (usr.a, a2)
	await createAndLink (usr.c, c2)
	await createAndLink (usr.b, b3)
	await createAndLink (usr.c, c3)
	await createAndLink (usr.c, c1)
	await createAndLink (usr.b, b0)
	await createAndLink (usr.a, a1)
	//*/


	//	a2:2	c1:1	b3:2	c3:3	c2:1
	await buyAndConsume (usr.d, a2);
	await buyAndConsume (usr.b, c1);
	await buyAndConsume (usr.d, b3);
	await buyAndConsume (usr.a, c3);
	await buyAndConsume (usr.a, c2);
	await buyAndConsume (usr.c, a2);
	await buyAndConsume (usr.d, c3);
	await buyAndConsume (usr.a, b3);
	await buyAndConsume (usr.b, c3);
	await buyAndConsume (usr.d, a1);
	//*/
	
	
	
	
	await leaveFeedback (usr.d, a2, [3,2,5]);
	await leaveFeedback (usr.b, c1, [4,4,5]);
	await leaveFeedback (usr.d, b3, [1,3,2]);
	await leaveFeedback (usr.a, c2, [2,2,5]);
	await leaveFeedback (usr.d, c3, [5,2,1]);
	await leaveFeedback (usr.a, b3, [4,3,3]);
	//*/
	
	
	
	
	
	
	
	
	catalogContract.methods.getContentList ().call ({from : usr.a.address, gas:300000}, (err, res) => {
		console.log (res);
	});
})
.catch ((err) => {
	console.log ("\n\n============================\nERROR DURING CATALOG FILLING\n============================");
	console.log (err);
});