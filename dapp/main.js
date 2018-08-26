
'use strict ';


const {app, BrowserWindow, ipcMain} = require('electron');
const path		= require ('path');
const Web3		= require ("web3");
const fs		= require ('fs');
const truffle	= require ("truffle-contract");


// Send something -->      mainWindow.webContents.send('some-message', {})

const folderPrefix	= '../solidity/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const songContractPath			= folderPrefix + 'SongManagementContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'


var provider;
var web3;
const ipcM	= ipcMain;

var mainWindow;

/*	{
	catalog : {
		...
	}
	baseContent : {
		abi : -
		bytecode : -
	}
	extendedContents: [{
		abi : -
		bytecode : -

	}]
}*/
var contracts	= {
	catalog : {abi:{}, instance:{}, bytecode:{}, address:{}},
	baseContent : {},
	extendedContents : []
};		


var publishedContents	= [];		// Do I really need this variable?????
var availableAddresses	= [];		// List of available addresses

var endpoint;

var user	= {
	balance : {},
	address : {},
	addressIndex : {},
	hexName : {},
	stringName : {}
}

var contentsPriceCache	= {};		// Cotains price informations (which doesn't change) about some contents

// Global variables used to share data between promises
var errorOnLastCreation;
var lastCreatedContentAddress;
var lastCatalogContentsList;
var lastInfoObject;
var priceOfNextContent;
var tmpPriceInfoTitle;















// ==============================
// ===== HELPFUL FUNCTIONS  =====


const string2Hex = (str) => {
	var result = '';
	for (var i=0; i<str.length; i++) {
	  result += str.charCodeAt(i).toString(16);
	}
	return result;
}




const hex2String= (hexStr) => {
	var hex = hexStr.toString();//force conversion
	var str = '';
	for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	
	return str;
}




const errorAndExit	= (err) => {
	console.log ('\n\nIt is an error!!\n');
	console.log (err);
	process.exit ();
	
}




const createWindow= () => {
	if (availableAddresses.length == 0) {
		console.log ("No address available: VERY DANGEROUS!\nEXIT")
		process.exit ();
	}
	mainWindow = new BrowserWindow({
		icon: path.join(__dirname, 'cobra.png'),
		show:false,
	})
	
	mainWindow.loadURL(`file://${__dirname}/index.html`)

	mainWindow.once ('ready-to-show', () => {
		mainWindow.maximize ();
	})

	mainWindow.on ('closed', () => {
		mainWindow = undefined
	})
}



const loadAddresses	= () => {
	web3.eth.getAccounts (function (err, res) {
		availableAddresses= res;
		//console.log (availableAddresses);

		linkToCatalogInstance ();
	});
}




const linkToCatalogInstance	= () => {
	var jsonContract			= readContract (catalogSmartContractPath);
	contracts.catalog.contract	= truffle (jsonContract);
	
	contracts.catalog.contract.setProvider (provider);
	contracts.catalog.contract
	.at (contracts.catalog.address)
	.then ((instance) => {
		contracts.catalog.instance	= instance;
/*		console.log ("getting content list!");
		return instance.getContentList.call ();			// FIXME Delete me!
	}, (err) => {
		console.log ("Cannot connect to Catalog contract! VERY DANGEROUS");
		process.exit ();
	}).then ((res) => {
		console.log (res);*/
		createWindow ();
	})
}




const buildCompleteContentsList	= (arg) => {
	titles			= arg['0'];
	addresses		= arg['1'];
	types			= arg['2'];
	contentsList	= [];
	i				= 0;

	addresses.forEach ((el) => {
		item	= {
			title	: hex2String (titles[i]),
			address	: el,
			type	: types[i]
		};

		contentsList.push (item);
		i++;
	})

	return contentsList;
}




const getOtherInfo	= (getContentLst) => {

	const constructPayload = (conList,isPremium) => {
		return {
			'balance'		: user.balance,
			'isPremium'		: isPremium,
			'status'		: 'success',
			'contentsList'	: conList
		};
	};

	
	
	web3.eth.getBalance (user.address, (err, res) => {
		// Recived balance in 'wei' --> converting it into 'ether'
		user.balance	= web3.fromWei (res);

		var isPremium;
		var tmpContentList;
		console.log (user.balance);


		contracts.catalog.instance.isPremium (user.hexName, {from:user.address})
		.then ((res) => {
			isPremium	= res;
			console.log ('Is premium: ' + res);
			if (getContentLst) {
				//console.log (contracts.catalog.instance.getContentsListByAuthor);
				contracts.catalog.instance.getContentsListByAuthor (user.hexName)
				.then((res) => {
					var conList	= buildCompleteContentsList (res);
					data		= constructPayload (conList, isPremium);
					
					mainWindow.webContents.send('init-info', JSON.stringify(data));
				}, (err) => {
					console.log ('\n\nDo something!');
				})
			}
			else {
				data= constructPayload ([], res);
				mainWindow.webContents.send('init-info', JSON.stringify(data));
			}
		})
	})
}




const readContract	= (contractPath) => {
	content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}




const currentTime = () => {
	var currentdate	= new Date(); 
	return	"Last Sync: " + currentdate.getDate() + "/"
			+ (currentdate.getMonth()+1)  + "/" 
			+ currentdate.getFullYear() + " @ "  
			+ currentdate.getHours() + ":"  
			+ currentdate.getMinutes() + ":" 
			+ currentdate.getSeconds();
}




const setupEventsCallbacks = () => {			// TODO Write me!

	// It works!!!!
	var event	= contracts.catalog.instance.NewUser ({from:user.address},{fromBlock: 0, toBlock: 'latest'});
	event.watch ((err, res) => {
		console.log ('New User!!!!!!!\n\n');
		console.log (err);
		console.log ('\n\n');
		console.log (res);
	});

	// event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);




	/*console.log (contracts.catalog.instance.events.GrantedAccess);
	// event GrantedAccess (bytes32 username, address user.address, bytes32 contentTitle, address contentAddress);
	contracts.catalog.instance.events.GrantedAccess({}, (err, evt) => {
		console.log ("Granted access for a content! Calling callback..");
		grantedAccessCallback (err, evt);
	});*/

	// event GrantedPremium (bytes32 username, address user.address);
}















// =====================================
// ===== CATALOG EVENTS CALLBACKS  =====

//     event GrantedAccess (bytes32 username, address user.address, bytes32 contentTitle, address contentAddress);
// Listener for event 'granted access'
const grantedAccessCallback = (err, evt) => {
	console.log (err);
	console.log (evt);
}















// ============================
// ===== ELECTRON EVENTS  =====

// Event handler for quitDapp requests
ipcMain.on ('quitDapp', (event, arg) => {
	process.exit();
})




// Event handler for 'getAddresses' request
ipcMain.on ('getAddresses', (event, arg) => {
	event.sender.send ('addresses', JSON.stringify(availableAddresses));
})




/* Event handler for 'init-info' request
	If user exists, checks corrispondance with address
	If it doesn't exists, try to register it */
ipcMain.on ('init-info', (event, arg) => {
	console.log ('Received request for\n\tuser:  ' + arg['user'] + '\n\taddress:  ' + arg['addr']);

	user.stringName				= arg['user'];
	user.hexName				= string2Hex (arg['user']);
	user.address				= arg['addr'];
	user.addressIndex			= availableAddresses.indexOf (arg['addr']);
	
	setupEventsCallbacks ();		// FIXME Move me!!!
	
	var tmpAddress;
	var callData;

	console.log ('Hex user:  ' + user.hexName + '\taddress index: ' + user.addressIndex);
	
	contracts.catalog.instance.userExists ({form:user.address}, user.address)
	.then ((res) => {

		console.log ("Result is: " + res);
		
		if (res == true) {
			console.log ('User already exists! Checking corrispondance with address..');
			contracts.catalog.instance.getUserAddress (user.hexName)
			.then((res) => {
				if (res == true) {
					console.log ("Good news. Getting balance and other info");
					return getOtherInfo (true);
				}
				else {
					// TODO Handle errors!
					console.log ("Received address form catalog differs from chosen address: it is an error!");
					throw "Error!";
				}
			}, (err) => {
				errorAndExit (err);
			})
		}
		else {
			console.log ('Registering user  ' + user.hexName);
			contracts.catalog.instance.registerMe (user.hexName, {from:user.address, gas:1000000000})
			.then ((res) => {
				console.log ("Registered!");
				//console.log (res.logs);
				return getOtherInfo (false);
			});
		}
	})
})
  



// Event to request content of deployed contracts
ipcMain.on ('create-content-request', (event, data) => {
	console.log ('Creating content:  '+ data.type +',   '+ data.title +',   '+ data.price)


	priceOfNextContent	= data.price;
	abi					= contracts.extendedContents[data.type].abi;
	bytecode			= contracts.extendedContents[data.type].bytecode;
	contract			= new web3.eth.Contract (abi);

	errorOnLastCreation	= false;

	contract
	.deploy	({data: bytecode, arguments: [string2Hex(data.title), contracts.catalog.address]})
	.send	({from: user.address, gas: 10000000000000}, (err, res) => {
		if (err){
			errorOnLastCreation	= true;
			console.log (err);
		}
	}) // TODO Handle errors
	.on('error', function(error){})
	.on('transactionHash', function(transactionHash){})
	.on('receipt', function (receipt){
	   console.log("Contract address: " + receipt.contractAddress) // contains the new contract address
	   lastCreatedContentAddress	= receipt.contractAddress;
	})
	.on('confirmation', function(confirmationNumber, receipt){})
	.then ((newContractInstance) => {
		// Success! --> publishing to the catalog
		console.log ('Deployed!');
		contracts.catalog.instance
		.methods
		.publishContent (user.hexName, string2Hex(data.title),
							web3.utils.toWei (priceOfNextContent, "milliether"), lastCreatedContentAddress)
		.send ({from : user.address, gas:30000000}, (err, res) => {
			if (err) {
				// Error linking content address to catalog! Destoying it! (content contract)
				abi			= contracts.baseContent.abi;
				bytecode	= contracts.baseContent.bytecode;
				
				(new web3.eth.Contract (abi, lastCreatedContentAddress))
				.methods
				.killMe()
				.send ({from: user.address, gas: 1000000}, (err, res) => {
					if (err){
						consol.log (err);
					}
				})
				.then (() => {console.log ('Contract destroyed')});
				mainWindow.webContents.send ('create-content-reply', {result:'failure'});
			}
			else {
				mainWindow.webContents.send('create-content-reply', {
					result: 'success',
					type: data.type,
					title: data.title,
					address: lastCreatedContentAddress
				});
			}
			getOtherInfo (false);
			errorOnLastCreation	= false;
		}).then (() => {
			console.log ("Published on catalog!")
		});
	});
})




ipcMain.on ('contents-list-request', ((evt, arg) => {
	console.log ('Received a contents list update request');

	contracts.catalog.instance
	.methods
	.getContentList ()
	.call ({from:user.address, gas:300000}, (err, res) => {
		console.log (res);
		lastCatalogContentsList	= res;
	})
	.then (() => {
		toSend	= [];
		lastCatalogContentsList.forEach ((el) => {
			toSend.push (hex2String (el))
		})
		mainWindow.webContents.send ('contents-list-reply', {list: toSend, time: currentTime()});
	})
}));




ipcMain.on ('more-info-request', ((evt, arg) => {
	console.log ('Received more-info-request for '+ arg.title);
	
	contracts.catalog.instance
	.methods
	.getInfoOf (string2Hex (arg.title))
	.call ({from:user.address, gas:300000}, (err, res) => {
		lastInfoObject	= {res: res, title: arg.title};
	}).then (() => {
		console.log (lastInfoObject);
		// TODO Computation of feedback
		toSend	= {
			title	: lastInfoObject.title,
			rating	: 'Unknown',
			price	: lastInfoObject.res['1'],
			author	: hex2String (lastInfoObject.res['2'])
		};
		contentsPriceCache[lastInfoObject.title]	= toSend.price;
		console.log (contentsPriceCache);
		mainWindow.webContents.send ('more-info-reply', toSend);
	});
}))




ipcMain.on ('buy-content-request', (evt, arg) => {
	console.log ('Received request to buy content  ' + arg.title);
	cachedPrice			= contentsPriceCache[arg.title];
	tmpPriceInfoTitle	= arg.title;
	
	if (cachedPrice == undefined || cachedPrice == '') {
		// Sending pice request to catalog
		contracts.catalog.instance
		.methods
		.getPriceOf (string2Hex(tmpPriceInfoTitle))
		.call ({from:user.address, gas:300000}, (err, res) => {
			contentsPriceCache[tmpPriceInfoTitle]	= res;
		}).then (() => {
			contracts.catalog.instance
			.methods
			.getContent (string2Hex(tmpPriceInfoTitle))
			.send ({from:user.address, gas:300000, value:contentsPriceCache[tmpPriceInfoTitle]}, (err, res) => {
				// TODO Handle errors
				console.log ("Content buyed");
				console.log (err);
				console.log (res);
			})
			.then (() => {
				mainWindow.webContents.send ('buy-content-reply', {result:'success'});
			})
		});
	} else {

	}
})















// ==================================
// ===== OTHER ELECTRON EVENTS  =====

// FIXME !!!!!!  Parsing comman line arguments
/*if (process.argv.length !=3) {
	endpoint= "http://localhost:8545";
}
else {
	endpoint= process.argv[2];
}*/


endpoint					= "http://localhost:8545";
provider					=new Web3.providers.HttpProvider(endpoint);
web3						= new Web3 (provider);
contracts.catalog.address	= process.argv[2];

console.log ("Catalog address:  " + contracts.catalog.address);




app.on('ready', () => {
	loadAddresses ();
	var tmpContract	= {};
	var tmpObject	= {abi:'', bytecode:''};

	tmpContract						= readContract (baseContentContractPath);
	contracts.baseContent.abi		= tmpContract.abi;
	contracts.baseContent.bytecode	= tmpContract.bytecode;

	tmpContract						= readContract (songContractPath);
	tmpObject.abi					= tmpContract.abi;
	tmpObject.bytecode				= tmpContract.bytecode;
	contracts.extendedContents[0]	= tmpObject;

	tmpContract						= readContract (videoContractPath);
	tmpObject.abi					= tmpContract.abi;
	tmpObject.bytecode				= tmpContract.bytecode;
	contracts.extendedContents[1]	= tmpObject;

	tmpContract						= readContract (photoContractPath);
	tmpObject.abi					= tmpContract.abi;
	tmpObject.bytecode				= tmpContract.bytecode;
	contracts.extendedContents[2]	= tmpObject;

	tmpContract						= readContract (documentContractPath);
	tmpObject.abi					= tmpContract.abi;
	tmpObject.bytecode				= tmpContract.bytecode;
	contracts.extendedContents[3]	= tmpObject;
})