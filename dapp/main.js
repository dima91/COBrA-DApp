const {app, BrowserWindow, ipcMain} = require('electron');
const path	= require ('path');
const Web3	= require ("web3");
const fs	= require('fs');


// Send something -->      mainWindow.webContents.send('some-message', {})

const folderPrefix	= '../solidity/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const songContractPath			= folderPrefix + 'SongManagementContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'


var web3;
const ipcM	= ipcMain;

var mainWindow;


var baseContentContract	= {};
var deployedContracts	= [];		// Array of deployed contracts to create contents
var publishedContents	= [];		// Do I really need this variable?????
var addresses			= [];		// List of available addresses

var userBalance;
var userAddress;
var addressIndex;
var hexUser;
var stringUser;

var catalogContract;
var catalogInstance;
var catalogAddress;
var endpoint;

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


const createWindow= () => {
	if (addresses.length == 0) {
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



const loadAddresses= () => {
	web3.eth.getAccounts (function (err, res) {
		addresses= res;
	}).then (createWindow)
}




const buildCompleteContentsList	= (arg) => {
	titles			= arg['0'];
	addresses		= arg['1'];
	types			= arg['2'];
	contentsList	= [];
	i				= 0;

	addresses.forEach ((el) => {
		item	= {
			title	: web3.utils.hexToString (titles[i]),
			address	: el,
			type	: types[i]
		};

		contentsList.push (item);
		i++;
	})

	return contentsList;
}




const getOtherInfo	= (getContentLst) => {

	const constructPayload = (conList) => {
		return {
			'balance'		: userBalance,
			'isPremium'		: tmpPreium,
			'status'		: 'success',
			'contentsList'	: conList
		};
	};

	var tmpPreium;
	var tmpContents;
	web3.eth.getBalance (userAddress, (err, res) => {
		// Recived balance in 'wei' --> converting it into 'ether'
		userBalance	= web3.utils.fromWei (res);
	}).then (() => {
		catalogInstance
		.methods
		.isPremium (hexUser)
		.call ({from:userAddress, gas:300000}, (err, res) => {
					tmpPreium	= res;
				}).then (() => {
					if (getContentLst) {
						catalogInstance
						.methods
						.getContentsListByAuthor (hexUser)
						.call ({from:userAddress, gas:300000}, (err, res) => {
							tmpContents	= res;
						}).then (() => {
							conList	= buildCompleteContentsList (tmpContents);
							data	= constructPayload (conList);
							mainWindow.webContents.send('init-info', JSON.stringify(data));
						})
					}
					else {
						data= constructPayload ([]);
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




const setupEventsCallbacks = () => {

	// event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);


	console.log (catalogInstance.events.GrantedAccess);
	// event GrantedAccess (bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);
	catalogInstance.events.GrantedAccess({}, (err, evt) => {
		console.log ("Granted access for a content! Calling callback..");
		grantedAccessCallback (err, evt);
	});

	// event GrantedPremium (bytes32 username, address userAddress);
}















// =====================================
// ===== CATALOG EVENTS CALLBACKS  =====

//     event GrantedAccess (bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);
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
	event.sender.send ('addresses', JSON.stringify(addresses));
})




/* Event handler for 'init-info' request
	If user exists, checks corrispondance with address
	If it doesn't exists, try to register it */
ipcMain.on ('init-info', (event, arg) => {
	console.log ('Received request for\n\tuser:  ' + arg['user'] + '\n\taddress:  ' + arg['addr']);

	stringUser		= arg['user'];
	hexUser			= web3.utils.stringToHex (arg['user']);
	userAddress			= arg['addr'];
	addressIndex	= addresses.indexOf (arg['addr']);
	catalogContract	= (readContract (catalogSmartContractPath));
	catalogInstance	= new web3.eth.Contract (catalogContract.abi, catalogAddress);
	setupEventsCallbacks ();
	
	var userExists	= false;
	var tmpAddress;

	console.log ('Hex user:  ' + hexUser + '\taddress index: ' + addressIndex);

	catalogInstance
	.methods
	.userExists (hexUser).call ({from:userAddress, gas:300000}, (err, res) => {
									// TODO Handle errors
									userExists	= res;
								}).then (() => {
									if (userExists) {
										console.log ('User exists! Checking corrispondance with address..');
										catalogInstance
										.methods
										.getUserAddress (hexUser).call ({from:userAddress, gas:300000}, (err, res) => {
											if (err) {
												// TODO Handle errors!
												throw "Cannot get user address!";
											}
											tmpAddress	= res;
										}).then (() => {
											if (tmpAddress == userAddress) {
												console.log ("Good news. Getting balance and other info");
												getOtherInfo (true);
											}
											else {
												// TODO Handle errors!
												console.log ("Received address form catalog differs from chosen address: it is an error!");
												throw "Error!";
											}
										})
									}
									else {
										catalogInstance
										.methods.registerMe (hexUser).send ({from:userAddress, gas:300000}, (err, res) => {
											if (err) {
												// TODO Handle errors!
												console.log ("It is an error!");
												throw "Error!";
											}
										}).then (() => {
											getOtherInfo (false);
										});
									}
								})
})
  



// Event to request content of deployed contracts
ipcMain.on ('create-content-request', (event, data) => {
	console.log ('Creating content:  '+ data.type +',   '+ data.title +',   '+ data.price)


	priceOfNextContent	= data.price;
	abi					= deployedContracts[data.type].abi;
	bytecode			= deployedContracts[data.type].bytecode;
	contract			= new web3.eth.Contract (abi);

	errorOnLastCreation	= false;

	contract
	.deploy	({data: bytecode, arguments: [web3.utils.stringToHex(data.title), catalogAddress]})
	.send	({from: userAddress, gas: 10000000000000}, (err, res) => {
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
		catalogInstance
		.methods
		.publishContent (hexUser, web3.utils.stringToHex(data.title),
							web3.utils.toWei (priceOfNextContent, "milliether"), lastCreatedContentAddress)
		.send ({from : userAddress, gas:30000000}, (err, res) => {
			if (err) {
				// Error linking content address to catalog! Destoying it! (content contract)
				abi			= baseContentContract.abi;
				bytecode	= baseContentContract.bytecode;
				
				(new web3.eth.Contract (abi, lastCreatedContentAddress))
				.methods
				.killMe()
				.send ({from: userAddress, gas: 1000000}, (err, res) => {
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

	catalogInstance
	.methods
	.getContentList ()
	.call ({from:userAddress, gas:300000}, (err, res) => {
		console.log (res);
		lastCatalogContentsList	= res;
	})
	.then (() => {
		toSend	= [];
		lastCatalogContentsList.forEach ((el) => {
			toSend.push (web3.utils.hexToString (el))
		})
		mainWindow.webContents.send ('contents-list-reply', {list: toSend, time: currentTime()});
	})
}));




ipcMain.on ('more-info-request', ((evt, arg) => {
	console.log ('Received more-info-request for '+ arg.title);
	
	catalogInstance
	.methods
	.getInfoOf (web3.utils.stringToHex (arg.title))
	.call ({from:userAddress, gas:300000}, (err, res) => {
		lastInfoObject	= {res: res, title: arg.title};
	}).then (() => {
		console.log (lastInfoObject);
		// TODO Computation of feedback
		toSend	= {
			title	: lastInfoObject.title,
			rating	: 'Unknown',
			price	: lastInfoObject.res['1'],
			author	: web3.utils.hexToString (lastInfoObject.res['2'])
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
		catalogInstance
		.methods
		.getPriceOf (web3.utils.stringToHex(tmpPriceInfoTitle))
		.call ({from:userAddress, gas:300000}, (err, res) => {
			contentsPriceCache[tmpPriceInfoTitle]	= res;
		}).then (() => {
			catalogInstance
			.methods
			.getContent (web3.utils.stringToHex(tmpPriceInfoTitle))
			.send ({from:userAddress, gas:300000, value:contentsPriceCache[tmpPriceInfoTitle]}, (err, res) => {
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


endpoint		= "http://localhost:8545";
web3			= new Web3(new Web3.providers.HttpProvider(endpoint));
catalogAddress	= process.argv[2];
console.log ("Catalog address:  " + catalogAddress);




app.on('ready', () => {
	loadAddresses ();

	baseContentContract		= readContract (baseContentContractPath);

	deployedContracts[0]	= readContract (songContractPath);
	deployedContracts[1]	= readContract (videoContractPath);
	deployedContracts[2]	= readContract (photoContractPath);
	deployedContracts[3]	= readContract (documentContractPath);
})