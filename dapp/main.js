
'use strict ';


const {app, BrowserWindow, ipcMain} = require('electron');
const path		= require ('path');
const Web3		= require ("web3");
const fs		= require ('fs');
const truffle	= require ('truffle-contract');


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
var endpoint	= "http://localhost:8545";

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

var user	= {
	balance : {},
	address : {},
	addressIndex : {},
	hexName : {},
	stringName : {}
}

var contentsPriceCache	= {};		// Cotains price informations (which doesn't change) about some contents

// Global variables used to share data between promises
var lastCreatedContentAddress;
var lastCatalogContentsList;
var lastInfoObject;
var priceOfNextContent;
var tmpPriceInfoTitle;















// ==============================
// ===== HELPFUL FUNCTIONS  =====


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
		loadExtendedContents ();
	})
}




const loadExtendedContents	= () => {
	contracts.baseContent			= truffle (readContract (baseContentContractPath));
	contracts.baseContent.setProvider (provider);

	contracts.extendedContents[0]	= truffle (readContract (songContractPath));
	contracts.extendedContents[1]	= truffle (readContract (videoContractPath));
	contracts.extendedContents[2]	= truffle (readContract (photoContractPath));
	contracts.extendedContents[3]	= truffle (readContract (documentContractPath));

	contracts.extendedContents.forEach ((el) => {
		el.setProvider (provider);
	});

	createWindow ();
}




const buildCompleteContentsList	= (arg) => {
	titles			= arg['0'];
	addresses		= arg['1'];
	types			= arg['2'];
	contentsList	= [];
	i				= 0;

	addresses.forEach ((el) => {
		item	= {
			title	: web3.toUtf8 (titles[i]),
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
		console.log ('Balance is: ' + user.balance);

		contracts.catalog.instance.isPremium (user.hexName, {from:user.address})
		.then ((res) => {
			user.isPremium	= res;
			
			if (getContentLst) {
				//console.log (contracts.catalog.instance.getContentsListByAuthor);
				contracts.catalog.instance.getContentsListByAuthor (user.hexName)
				.then((res) => {
					var conList	= buildCompleteContentsList (res);
					data		= constructPayload (conList, user.isPremium);
					
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
		console.log ('Received event about registration of ' + web3.toUtf8(res.args.username));
	});

	// event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);

	// event GrantedAccess (bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);

	// event GrantedPremium (bytes32 username, address user.address);
}




const computeFeedbacksAvg	= (feeds) => {
	var sum=0, div=0;

	feeds.forEach ((el) => {
		var nEl	= Number (el);
		if (nEl != 0) {
			sum += nEl;
			div++;
		}
	})
	if (div != 0)
		return (sum/div).toFixed(2);
	else
		return 'Unknown';
}















// =====================================
// ===== CATALOG EVENTS CALLBACKS  =====

// event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);
// TODO Listener for event 'content published'
const contentPublishedCallback = (err, evt) => {
	console.log (err);
	console.log (evt);
}




// event GrantedAccess (bytes32 username, address user.address, bytes32 contentTitle, address contentAddress);
// TODO Listener for event 'granted access'
const grantedAccessCallback = (err, evt) => {
	console.log (err);
	console.log (evt);
}




// event GrantedPremium (bytes32 username, address user.address);
// TODO Listener for event 'granted premium'
const grantedPremiumCallback = (err, evt) => {
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

	user.stringName				= arg['user'];
	user.hexName				= web3.fromUtf8 (user.stringName);
	user.address				= arg['addr'];
	user.addressIndex			= availableAddresses.indexOf (arg['addr']);

	console.log ('address hex: ' + user.hexName + ' --> ' + web3.toUtf8 (user.hexName));
	
	setupEventsCallbacks ();		// FIXME Move me!!!
	
	var tmpAddress;
	var callData;
	
	contracts.catalog.instance.userExists (user.hexName, {from:user.address})
	.then (async (res) => {

		console.log ("Result is: " + res);
		
		if (res == true) {
			console.log ('User already exists! Checking corrispondance with address..');
			contracts.catalog.instance.getUserAddress (user.hexName)
			.then((res) => {
				if (res == user.address) {
					console.log ("Good news. Getting balance and other info");
					return getOtherInfo (true);
				}
				else {
					// TODO Handle errors!
					console.log ("Received address from catalog differs from chosen address: it is an error!");
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
				return getOtherInfo (false);
			}).catch ((e) => {
				console.log (e);
			})
		}
	})
})
  



// Event to request content of deployed contracts
ipcMain.on ('create-content-request', (event, data) => {
	console.log ('Creating content:  '+ data.type +',   '+ data.title +',   '+ data.price);

	priceOfNextContent	= data.price;
	thisContract		= contracts.extendedContents[data.type];

	var errorOnCreation	= false;

	var newInstance	= thisContract
	.new (web3.fromUtf8(data.title), contracts.catalog.address, { from: user.address,
																	data:thisContract.bytecode,
																	gas:10000000})
	.then ((instance) => {
		console.log ("Deployed!\nRegistering to catalog..");

		return contracts.catalog.instance
		.publishContent (user.hexName, web3.fromUtf8(data.title),
						  web3.toWei (priceOfNextContent, "milliether"), instance.address,
						{from: user.address, gas:1000000});
	})
	.then ((res) => {
		mainWindow.webContents.send('create-content-reply', {
			result: 'success',
			type: data.type,
			title: data.title,
			address: lastCreatedContentAddress
		});
	})
	.catch ((err) => {
		// TODO
		console.log ('\n\nSome errors! WARNING!');
		console.log (err);
		mainWindow.webContents.send('create-content-reply', {
			result: 'failure',
			type: data.type,
			title: data.title,
			address: lastCreatedContentAddress
		});
	});
})




ipcMain.on ('contents-list-request', ((evt, arg) => {
	console.log ('Received a contents list update request');

	contracts.catalog.instance
	.getContentList ({from:user.address, gas:300000})
	.then ((res) => {
		toSend	= [];
		res.forEach ((el) => {
			toSend.push (web3.toUtf8 (el))
		})
		mainWindow.webContents.send ('contents-list-reply', {list: toSend, time: currentTime()});
	})
	.catch ((err) => {
		console.log ("Error on getting contents list!!");
		console.log (err);
	})
}));




ipcMain.on ('more-info-request', ((evt, arg) => {
	console.log ('Received more-info-request for '+ arg.title);
	
	contracts.catalog.instance
	.getInfoOf (web3.fromUtf8 (arg.title), {from:user.address, gas:300000})
	.then ((res) => {	// res	= {feedbacks, price, author}
		/*console.log (Number(res[0][0]));
		console.log ("feedbacks are: " + res[0]);
		console.log ("Feedbacks are: " + computeFeedbacksAvg (res[0]));*/

		/*console.log (web3.fromWei(res['1'], 'milliether'));
		console.log (web3.fromWei(res['1'], 'milliether').toString());*/
		toSend	= {
			title	: arg.title,
			rating	: computeFeedbacksAvg (res[0]),
			price	: web3.fromWei(res['1'], 'milliether').toString(),		// FIXME What unit of measure is this?!?!?!?!
			author	: web3.toUtf8 (res['2'])
		};
		contentsPriceCache[arg.title]	= toSend.price;
		mainWindow.webContents.send ('more-info-reply', toSend);
	})
	.catch ((err) => {
		console.log ("Error getting more info of " + arg.title);
		console.log (err);
	})
}))




ipcMain.on ('buy-content-request', (evt, arg) => {
	console.log ('Received request to buy content  ' + arg.title);
	var cachedPrice	= 0;
	var tmpTitle	= arg.title;
	

	// Sending price request to catalog
	contracts.catalog.instance
	.getPriceOf (web3.fromUtf8(tmpTitle), {from:user.address, gas:300000})
	.then ((res) => {
		cachedPrice	= res;

		if (user.isPremium) {
			console.log ('buying by premium!');
			return	contracts.catalog.instance
					.getContentPremium (web3.fromUtf8(tmpTitle), {from:user.address, gas:300000});
		}
		else {
			console.log ("Buying by a mortal man");
			user.isPremium	= false;
			return	contracts.catalog.instance
					.getContent (web3.fromUtf8(tmpTitle), {from:user.address, gas:300000, value:cachedPrice});
		}
	})
	.then ((res) => {
		// TODO Handle errors
		console.log ("Content buyed");
		mainWindow.webContents.send ('buy-content-reply', {result:'success', title:tmpTitle});
	})
	.catch ((err) => {
		console.log ("Maybe the user is no longer premium!");
		//console.log (err);
		contracts.catalog.instance
		.getContent (web3.fromUtf8(tmpTitle), {from:user.address, gas:300000, value:cachedPrice})
		.then ((res) => {
			mainWindow.webContents.send ('buy-content-reply', {result:'success', title:tmpTitle});
		})
		.catch ((err) => {
			console.log (err);
			mainWindow.webContents.send ('buy-content-reply', {result:'error'});
		})

	});
})




ipcMain.on ('consume-content-request', (evt, arg) => {
	console.log ('Received reuest to consume content ' + arg.title);
	contracts.catalog.instance.getAddressOf (web3.fromUtf8 (arg.title), {from:user.address, gas:3000000})
	.then ((res) => {
		console.log ('Address is : ' + res);
		contracts.baseContent.at(res)
		.then ((instance) => {
			return instance.consumeContent (user.hexName, {from:user.address, gas:3000000});
		})
		.then ((res) => {
			console.log ('Retrieved content ' + arg.title);
			console.log (res);
			mainWindow.webContents.send ('consume-content-reply', {result:'success', title:arg.title});
		})
		.catch ((err) => {
			console.log ("Error consuming content " + arg.title);
			console.log (err);
			mainWindow.webContents.send ('consume-content-reply', {result:'error'});
		})
	})
});




ipcMain.on ('rating-request', (evt, arg) => {
	console.log (arg);

	var tmpInstance;

	contracts.catalog.instance.getAddressOf (web3.fromUtf8 (arg.title), {fom:user.address, gas:200000})
	.then ((res) => {
		console.log (res);
		return contracts.baseContent.at(res);
	})
	.then ((instance) => {
		tmpInstance	= instance;
		console.log ('1');
		return instance.leaveFeedback (user.hexName, 1, arg['1'], {from:user.address, gas:3000000});
	})
	.then (() => {
		console.log ('2');
		return tmpInstance.leaveFeedback (user.hexName, 2, arg['2'], {from:user.address, gas:3000000});
	})
	.then (() => {
		console.log ('3');
		return tmpInstance.leaveFeedback (user.hexName, 3, arg['3'], {from:user.address, gas:3000000});
	})
	.catch ((err) => {
		console.log ('Error leaving feedbacks!');
		console.log (err);
	})
});




ipcMain.on ('gift-content-request', (evt, arg) => {
	// function giftContent (bytes32 _contentTitle, bytes32 _receivingUser)
	//console.log ('Gifting  ' + arg.title + ' ('+ web3.fromUtf8(arg.title)+')  to  ' + arg.user + ' (' + web3.fromUtf8(arg.user) +')')
	console.log ('Gifting  ' + arg.title + '  to  ' + arg.user);
	
	contracts.catalog.instance.giftContent (web3.fromUtf8(arg.title), web3.fromUtf8(arg.user))
	.then ((res) => {
		mainWindow.webContents.send('gift-content-reply', {result:'success'});
	})
	.catch ((err) => {
		mainWindow.webContents.send('gift-content-reply', {result:'failure', cause:'boh!'});
	})
})




ipcMain.on ('buy-premium-request', (evt, arg) => {
	contracts.catalog.instance.buyPremium ({from:user.address, gas:3000000, value:web3.toWei(44000, 'szabo')})
	.then ((res) => {
		console.log ("Premium accoutn buyed");
		mainWindow.webContents.send('buy-premium-reply', {result:'success'});
	})
	.catch ((err) => {
		console.log ('Error during buy premium')
		console.log (err);
		mainWindow.webContents.send('gift-content-reply', {result:'failure', cause:'boh!'});
	})
});




ipcMain.on ('gift-premium-request', (evt, arg) => {
	console.log ('Performing request..');

	contracts.catalog.instance.giftPremium (web3.fromAscii(arg.user), {from:user.address, gas:100000, value:web3.toWei(44000, 'szabo')})
	.then ((res) => {
		console.log ("Gifted!!!!");
		mainWindow.webContents.send('gift-premium-reply', {result:'success'});
	})
	.catch ((err) => {
		mainWindow.webContents.send('gift-premium-reply', {result:'failure', cause:'boh!'});
	})
});















// ==================================
// ===== OTHER ELECTRON EVENTS  =====

// FIXME !!!!!!  Parsing comman line arguments
/*if (process.argv.length !=3) {
	endpoint= "http://localhost:8545";
}
else {
	endpoint= process.argv[2];
}*/




contracts.catalog.address	= process.argv[2];


if(typeof web3 != 'undefined') {
	console.log ("I'm here");
	console.log(web3);
	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
} else {
	provider	= new Web3.providers.HttpProvider(endpoint);
	web3		= new Web3(provider);
}



//console.log ("Catalog: " + contracts.catalog.address);




app.on('ready', () => {
	console.log (provider);
	loadAddresses ();
	var tmpContract	= {};
	var tmpObject	= {abi:'', bytecode:''};
});