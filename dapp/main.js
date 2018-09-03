
'use strict ';


const {app, BrowserWindow, ipcMain} = require('electron');
const path		= require ('path');
const Web3		= require ("web3");
const fs		= require ('fs');
const truffle	= require ('truffle-contract');



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
//FIXME !!!!!!  Parsing comman line arguments
/*if (process.argv.length !=3) {
	endpoint= "http://localhost:8545";
}
else {
	endpoint= process.argv[2];
}*/


if(typeof web3 != 'undefined') {
	console.log ("I'm here");
	console.log(web3);
	provider	= web3.currentProvider;
	web3 		= new Web3 (provider);
} else {
	provider	= new Web3.providers.HttpProvider(endpoint);
	web3		= new Web3(provider);
}




app.on('ready', () => {
	console.log (provider);
	loadAddresses ();
});





var mainWindow;


var contracts	= {
	catalog : {
		instance	:{},				// Instance of catalog
		bytecode	:{},				// Catalog's bytecode
		address		:{}					// catalog's truffle contract
	},
	
	baseContent			: {},			// Truffle contract
	extendedContents	: []			// Truffle contracts
};		


var availableAddresses	= [];		// List of available addresses

var user	= {
	balance			: {},
	address			: {},
	addressIndex	: {},
	hexName			: {},
	stringName		: {}
}

const premiumCost	= web3.toWei (44000, 'szabo');

const upperBoundGas	= 10000000;

contracts.catalog.address	= process.argv[2];


// Lists used to filter notifications, which are sent to user, about new contents
authorFilters	= [];
genreFilters	= [];















// ==============================
// ===== HELPFUL FUNCTIONS  =====


const errorAndExit	= (err) => {
	console.log ('\n\n' + '==============================\n' + err + '\n');
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
	web3.eth.getAccounts ((err, res) => {
		if (err)
			errorAndExit ('Cannot retrieve addresses. Check geth client');

		availableAddresses	= res;
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
	.catch ((err) => {
		errorAndExit ('Cannot find catalog instance!');
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




const setupEventsCallbacks = () => {
	/*
	event NewUser			(bytes32 username, address userAddress);
    event ContentPublished	(bytes32 username, bytes32 contentTitle, address contentAddress);
    event GrantedAccess		(bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);
	event GiftedAccess		(bytes32 rcvUsername, address rcvUserAddress, bytes32 sndUsername, bytes32 contentTitle, address contentAddress);
    event GrantedPremium	(bytes32 username, address userAddress);
	event GiftedPremium		(bytes32 rcvUsername, address rcvUserAddress, bytes32 sndUsername);
	event CatalogDied		();
	*/

	var initBlock	= 'latest';
	var endBlock	= 'latest';

	// It works, but i don't care about it 
	contracts.catalog.instance.NewUser ({from:user.address}, {fromBlock: initBlock, toBlock: 'latest'})
	.watch ((err, res) => {
		console.log ('Received event about registration of ' + web3.toUtf8(res.args.username));
	});

	

	// event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);
	contracts.catalog.instance.ContentPublished ({from:user.address}, {fromBlock: initBlock, toBlock: 'latest'})
	.watch ((err, res) => {
		contentPublishedCallback (err, res);
	})



	// event GrantedAccess (bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);
	contracts.catalog.instance.GrantedAccess ({from:user.address}, {fromBlock: initBlock, toBlock: 'latest'})
	.watch ((err, res) => {
		grantedAccessCallback (err, res);
	})



	// event GrantedPremium (bytes32 username, address user.address);
	contracts.catalog.instance.GrantedPremium ({from:user.address}, {fromBlock: initBlock, toBlock: 'latest'})
	.watch ((err, res) => {
		grantedPremiumCallback (err, res);
	})



	// event GiftedAccess		(bytes32 rcvUsername, address rcvUserAddress, bytes32 sndUsername, bytes32 contentTitle, address contentAddress);
	contracts.catalog.instance.GiftedAccess ({from:user.address}, {fromBlock: initBlock, toBlock: 'latest'})
	.watch ((err, res) => {
		giftedAccessCallback (err, res);
	})



	// event GiftedPremium		(bytes32 rcvUsername, address rcvUserAddress, bytes32 sndUsername);
	contracts.catalog.instance.GiftedPremium ({from:user.address}, {fromBlock: initBlock, toBlock: 'latest'})
	.watch ((err, res) => {
		giftedPremiumCallback (err, res);
	})



	// event CatalogDied		();
}




const buildCompleteContentsList	= (arg) => {
	var count			= arg['0']
	var titles			= arg['1'];
	var addresses		= arg['2'];
	var types			= arg['3'];
	var contentsList	= [];
	var i				= 0;

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




const getUserInfo	= (getContentList) => {
	const constructPayload = (conList,isPremium) => {
		return {
			'balance'		: user.balance,
			'isPremium'		: isPremium,
			'status'		: 'success',
			'contentsList'	: conList
		};
	};


	return new Promise ((resolve, reject) => {
		web3.eth.getBalance (user.address, (err, res) => {
			// Recived balance in 'wei' --> converting it into 'ether'
			user.balance	= web3.fromWei (res);
			console.log ('Balance is: ' + user.balance);
	
			contracts.catalog.instance.isPremium (user.hexName, {from:user.address})
			.then ((res) => {
				user.isPremium	= res;
				
				if (getContentList) {
					console.log ('\nQuerying content list for ' + user.hexName);
					contracts.catalog.instance.getContentsListByAuthor (user.hexName)
					.then((res) => {
						console.log (res)
						var conList	= buildCompleteContentsList (res);
						var payload	= constructPayload (conList, user.isPremium);
						resolve (payload);
					},
					(err) => {
						reject (err);
					});
				}
				else {
					resolve (constructPayload ([], res));
				}
			})
		})
	});
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




const type2TypeString	= (intType) => {
	switch (intType) {
		case 0:
			return "song";

		case 1:
			return "video";

		case 2: 
			return "photo";

		case 3:
			return "document";

		default :
			return "";
	}
}















// =====================================
// ===== CATALOG EVENTS CALLBACKS  =====

// event ContentPublished (bytes32 username, bytes32 contentTitle, address contentAddress);
// Listener for event 'content published'
const contentPublishedCallback = async (err, evt) => {
	const suitableFor	= (array, cnt) => {
		return (array.length == 0 || array.includes (cnt));
	}


	console.log ("Someone published a content!");
	/*console.log (evt);
	console.log (err);*/
		
	var tmpInstance	= contracts.baseContent.at (evt.args.contentAddress);
	var type		= await tmpInstance.getType		({from:user.address, gas:upperBoundGas});
	var title		= web3.toUtf8 (evt.args.contentTitle);
	var author		= web3.toUtf8 (evt.args.username);

	type		= Number (type);
	var strType	= type2TypeString(type);
	console.log (type);

	if (!suitableFor(genreFilters, strType) && !suitableFor(authorFilters,author)) {
		console.log ("genreFilters doesn't contain   " + strType);
		console.log ("genreFilters doesn't contain   " + author);
		return ;
	}
	
	mainWindow.webContents.send ('content-published-event', {author:author, stringTitle:title, type:type, hexTitle:evt.args.contentTitle});
		
	var userInfo	= await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
}




// event GrantedAccess (bytes32 username, address userAddress, bytes32 contentTitle, address contentAddress);
// Listener for event 'granted access' --> action already handled
const grantedAccessCallback = (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.username);

	if (rcvUser == user.stringName) {
		var stringTitle	=	web3.toUtf8 (evt.args.contentTitle);
		console.log ("You're granted to access to content  " + web3.toUtf8 (evt.args.contentTitle));
		mainWindow.webContents.send ('granted-access-event', {title:stringTitle});
		getUserInfo (false)
		.then ((userInfo) => {
			mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
			return getUserInfo (false);
		})
		.then ((userInfo) => {
			mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
		})
		.catch ((err) => {
		})
	}
}




// event GrantedPremium (bytes32 username, address user.address);
// TODO Listener for event 'granted premium'
const grantedPremiumCallback = (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.username);

	if (rcvUser == user.stringName) {
		console.log ("You bought a premium account. Enjoy yourself!");
		mainWindow.webContents.send ('granted-premium-event', {});
		getUserInfo (false)
		.then ((userInfo) => {
			mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
		})
	}
}




// event GiftedAccess (bytes32 rcvUsername, address rcvUserAddress, bytes32 sndUsername, bytes32 contentTitle, address contentAddress);
const giftedAccessCallback	= (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.rcvUsername);

	if (rcvUser == user.stringName) {
		var sender	= web3.toUtf8 (evt.args.sndUsername);
		var title	= web3.toUtf8 (evt.args.contentTitle);
		console.log ('User  ' + sender + '  gift to you this content:  ' + title);

		mainWindow.webContents.send ('gifted-content-event', {title:title, sender:sender, hexTitle:evt.args.contentTitle});
	}
}




// event GiftedPremium		(bytes32 rcvUsername, address rcvUserAddress, bytes32 sndUsername);
const giftedPremiumCallback	= (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.rcvUsername);

	//console.log ('Receiver name is  ' + rcvUser);

	if (rcvUser == user.stringName) {
		var sender	= web3.toUtf8 (evt.args.sndUsername);
		console.log ('User  ' + sender + '  gift to you premium account!');
		getUserInfo (false)
		.then ((userInfo) => {
			mainWindow.webContents.send('gifted-premium-event', {sender:sender});
			mainWindow.webContents.send('init-info', JSON.stringify(userInfo));
		})
		.catch ((err) => {
		})
	}
}




// emit FeedbackActivation (_username, _userAddr);
const feedbackActivationCallback	= (err, evt) => {
	console.log (evt.args.targetUsername + ' --> ' + evt.args.contentTitle);

	if (web3.toUtf8 (evt.args.targetUsername) == user.stringName) 
		mainWindow.webContents.send('feedback-activation-event', {
																	title: web3.toUtf8 (evt.args.contentTitle),
																	hexTitle:web3.toHex(web3.toUtf8 (evt.args.contentTitle))});
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
ipcMain.on ('init-info', async (event, arg) => {

	user.stringName				= arg['user'];
	user.hexName				= web3.fromUtf8 (user.stringName);
	user.address				= arg['addr'];
	user.addressIndex			= availableAddresses.indexOf (arg['addr']);

	setupEventsCallbacks ();
	
	var userExists	= await contracts.catalog.instance.userExists (user.hexName, {from:user.address});
	var userInfo;

	if (userExists) {
		console.log ('user exists!');
		var tmpUserAddress	= await contracts.catalog.instance.getUserAddress (user.hexName);
		
		if (tmpUserAddress == user.address) {
			userInfo	= await getUserInfo (true);
			mainWindow.webContents.send('init-info', JSON.stringify(userInfo));
		}
		else {
			console.log ("Received address from catalog differs from chosen address: it is an error!");
			mainWindow.webContents.send('init-info', JSON.stringify({result:'error', cause:'Received address differs from chosen address.'}));
		}
	}
	else {
		console.log ("User doesn't exist!");
		await contracts.catalog.instance.registerMe (user.hexName, {from:user.address, gas:upperBoundGas});
		userInfo	= await getUserInfo (false);
		mainWindow.webContents.send('init-info', JSON.stringify(userInfo));
	}
})
  



// Event to request content of deployed contracts
ipcMain.on ('create-content-request', async (event, data) => {
	console.log ('Creating content:  '+ data.type +',   '+ data.title +',   '+ data.price);

	var priceOfNextContent	= data.price;
	var thisContract		= contracts.extendedContents[data.type];
	var newInstance			= await thisContract.new (web3.fromUtf8(data.title), contracts.catalog.address, {	from: user.address,
																												data:thisContract.bytecode,
																												gas:upperBoundGas});
	var instanceAddress		= newInstance.address;
	
	try {
		await contracts.catalog.instance.publishContent ( user.hexName, web3.fromUtf8(data.title),
						  								  web3.toWei (priceOfNextContent, "milliether"), instanceAddress,
														  {from: user.address, gas:upperBoundGas});
		mainWindow.webContents.send('create-content-reply', {
			result: 'success',
			type: data.type,
			title: data.title,
			address: instanceAddress
		});
		var userInfo	= await getUserInfo (false);
		mainWindow.webContents.send('user-info', JSON.stringify(userInfo));

	} catch (err) {
		mainWindow.webContents.send('create-content-reply', {
			result	: 'failure',
			cause	: 'Content already exists'
		});
		console.log ('Error here!');
		// TODO Destroy created contract
	}
})




// TODO Require also type of contents
ipcMain.on ('contents-list-request', async (evt, arg) => {
	console.log ('Received a contents list update request');

	var contentsList	= await contracts.catalog.instance.getContentList ({from:user.address, gas:upperBoundGas})
	var toSend			= [];
	
	contentsList.forEach ((el) => {
		toSend.push (web3.toUtf8 (el))
	})
	
	mainWindow.webContents.send ('contents-list-reply', {list: toSend, time: currentTime()});
});




ipcMain.on ('more-info-request', async (evt, arg) => {
	console.log ('Received more-info-request for '+ arg.title);
	
	var infoOf	= await (contracts.catalog.instance.getInfoOf (web3.fromUtf8 (arg.title), {from:user.address, gas:upperBoundGas}));
	var toSend	= {
		title	: arg.title,
		rating	: computeFeedbacksAvg (infoOf[0]),
		price	: web3.fromWei(infoOf['1'], 'milliether').toString(),
		author	: web3.toUtf8 (infoOf['2'])
	};

	mainWindow.webContents.send ('more-info-reply', toSend);
})




ipcMain.on ('buy-content-request', async (evt, arg) => {
	console.log ('Received request to buy content  ' + arg.title);
	
	var tmpTitle	= arg.title;
	var tmpPrice	= 0;
	var success		= false;

	try {
		tmpPrice	= await (contracts.catalog.instance.getPriceOf (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas}));

		if (user.isPremium) {
			console.log ('buying by premium!');
			await contracts.catalog.instance.getContentPremium (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas});
			success	= true;
		}
		else {
			console.log ("Buying by a mortal man");
			await contracts.catalog.instance.getContent (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas, value:tmpPrice});
			success	= true;
		}
	} catch (err) {
		user.isPremium	= false;
		try {
			await contracts.catalog.instance.getContent (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas, value:tmpPrice});
			success	= true;
		} catch (err) {
			success	= false;
		}
	}

	if (success) {
		console.log ("Content buyed");
		mainWindow.webContents.send ('buy-content-reply', {result:'success', title:tmpTitle, hexTitle:web3.fromUtf8(tmpTitle)});
	}
	else {
		console.log ('Content not buyied');
		mainWindow.webContents.send ('buy-content-reply', {result:'error'});
	}

	var userInfo	= await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
})




ipcMain.on ('consume-content-request', async (evt, arg) => {
	console.log ('Received reuest to consume content ' + arg.title);

	var tmpAddr			= await (contracts.catalog.instance.getAddressOf (arg.title, {from:user.address, gas:upperBoundGas}));
	var contentInstance	= contracts.baseContent.at(tmpAddr);

	try {
		// Registering to feedback activanion contract's event
		contentInstance.FeedbackActivation ({from:user.address}, {fromBlock: 'latest', toBlock: 'latest'})
		.watch ((err, res) => {
			feedbackActivationCallback (err, res);
		});
	} catch (err) {
		console.log ('Failed to register to event!\n\n');
		console.log (err);
	}
	try {
		await (contentInstance.consumeContent (user.hexName, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send ('consume-content-reply', {result:'success', title:arg.title});
	} catch (err) {
		console.log ('fail to consume content!!');
		mainWindow.webContents.send ('consume-content-reply', {result:'failure', title:arg.title});
	}

	var userInfo	= await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
});




// function leaveFeedback (bytes32 _username, uint8 _c, uint8 _v) public isAllowedUser(_username, msg.sender) isCorrectCategory(_c) isCorrectRating(_v) notGivenFeedbackFor(_c-1, _username) notToBeConsumedBy (_username) {
ipcMain.on ('rating-request', async (evt, arg) => {
	console.log (arg);

	var tmpInstance;
	var tmpAddress;

	console.log ('new request!');

	tmpAddress	= await (contracts.catalog.instance.getAddressOf (web3.fromUtf8 (arg.title), {fom:user.address, gas:upperBoundGas}));
	tmpInstance	= await (contracts.baseContent.at(tmpAddress));
	
	try {
		await (tmpInstance.leaveFeedback (user.hexName, 1, arg['1'], {from:user.address, gas:upperBoundGas}));
		await (tmpInstance.leaveFeedback (user.hexName, 2, arg['2'], {from:user.address, gas:upperBoundGas}));
		await (tmpInstance.leaveFeedback (user.hexName, 3, arg['3'], {from:user.address, gas:upperBoundGas}));
	} catch (err) {
		console.log ('Error during feedback..	\n\n\n');
		console.log (err);
	}
	
	var userInfo = await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
});




ipcMain.on ('gift-content-request', async (evt, arg) => {
	console.log ('Gifting  ' + arg.title + '  to  ' + arg.user);

	var tmpPrice;

	try {
		tmpPrice	= await (contracts.catalog.instance.getPriceOf (web3.fromUtf8(arg.title), {from:user.address, gas:upperBoundGas}));
		await contracts.catalog.instance.giftContent (web3.fromUtf8(arg.title), web3.fromUtf8(arg.user), {from:user.address, gas:upperBoundGas, value:tmpPrice})
		mainWindow.webContents.send('gift-content-reply', {result:'success'});
	} catch (err) {
		console.log ('Gift content fails!');
		mainWindow.webContents.send('gift-content-reply', {result:'failure'});
	}

	var userInfo = await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
})




ipcMain.on ('buy-premium-request', async (evt, arg) => {
	try {
		await (contracts.catalog.instance.buyPremium ({from:user.address, gas:upperBoundGas, value:premiumCost}));
		console.log ("Premium account buyed");
		mainWindow.webContents.send('buy-premium-reply', {result:'success'});

		var userInfo	= await (getUserInfo (false));
		mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
	} catch (err) {
		console.log ('Error during buy premium')
		console.log (err);
		mainWindow.webContents.send('gift-content-reply', {result:'failure'});
	}
});




ipcMain.on ('gift-premium-request', async (evt, arg) => {
	console.log ('Performing request..');

	try {
		await (contracts.catalog.instance.giftPremium (web3.fromAscii(arg.user), {from:user.address, gas:upperBoundGas, value:premiumCost}));
		console.log ("Gifted!!!!");
		mainWindow.webContents.send('gift-premium-reply', {result:'success'});
		
		var userInfo	= await (getUserInfo (false));
		mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
	}
	catch (err) {
		mainWindow.webContents.send('gift-premium-reply', {result:'failure'});
	}
});




// ============================================================ //
// ============================================================ //




ipcMain.on ('get-views-count-request', async (evt, arg) => {
	
	var stats	= await (contracts.catalog.instance.getStatistics ({from:user.address, gas:upperBoundGas}));
	var toRet	= [];
	var i		= 0;
	
	if (stats[0].length != stats[1].length) {
		mainWindow.webContents.send('get-views-count-reply', {result:'failure'});
		return ;
	}
		
	stats[1].forEach ((el) => {
		var c	= Number (stats[0][i]);
		toRet.push ({count: c, title: web3.toUtf8 (el)});
		i++;
	})

	mainWindow.webContents.send('get-views-count-reply', {result:'success', data:toRet});
});




ipcMain.on ('get-newest-content-list-request', async (evt, arg) => {

	var list	= await (contracts.catalog.instance.getNewContentList  (arg.count, {from:user.address, gas:upperBoundGas}));
	var toRet	= [];

	list.forEach ((el) => {
		toRet.push (web3.toUtf8 (el));
	})
	mainWindow.webContents.send('get-newest-content-list-reply', {result:'success', data:toRet});
});




ipcMain.on ('get-latest-content-by-author-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getLatestByAuthor  (web3.fromUtf8(arg.author), {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-latest-content-by-author-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-latest-content-by-author-reply', {result:'failure'});
	}
})




ipcMain.on ('get-latest-content-by-genre-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getLatestByGenre  (arg.genre, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-latest-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	}
	catch (err) {
		// TODO Handle errors
		console.log (err);
		mainWindow.webContents.send('get-latest-content-by-genre-reply', {result:'failure'});
	}
});




ipcMain.on ('get-most-popular-content-by-author-request', async (evt, arg) => {
	try {
		var cont	= await contracts.catalog.instance.getMostPopularByAuthor  (web3.fromUtf8(arg.author), {from:user.address, gas:upperBoundGas})
		mainWindow.webContents.send('get-most-popular-content-by-author-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		// TODO Handle errors
		console.log (err);
		mainWindow.webContents.send('get-most-popular-content-by-author-reply', {result:'failure'});
	}
});




ipcMain.on ('get-most-popular-content-by-genre-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getMostPopularByGenre  (arg.genre, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-popular-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		// TODO Handle errors
		console.log (err);
		mainWindow.webContents.send('get-most-popular-content-by-genre-reply', {result:'failure'});
	}
});




ipcMain.on ('get-most-rated-content-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getMostRated  (arg.category, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-rated-content-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		// TODO Handle errors
		console.log (err);
		mainWindow.webContents.send('get-most-rated-content-reply', {result:'failure'});
	}
});




ipcMain.on ('get-most-rated-content-by-genre-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getMostRatedByGenre  (arg.genre, arg.category, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-rated-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		// TODO Handle errors
		console.log (err);
		mainWindow.webContents.send('get-most-rated-content-by-genre-reply', {result:'failure'});
	}
});




ipcMain.on ('get-most-rated-content-by-author-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getMostRatedByAuthor  (arg.author, arg.category, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-rated-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		// TODO Handle errors
		console.log (err);
		mainWindow.webContents.send('get-most-rated-content-by-genre-reply', {result:'failure'});
	}
});




ipcMain.on ('apply-filters', (evt, arg) => {
	var filterAndDecodeString	= (str) => {
		str= str.replace(/ /g,'');		// Removing all whitespaces
		return str.split(',');
	}
	console.log ('Authors:  ' + arg.authors);
	console.log ('Genres:   ' + arg.genres);

	authorFilters	= filterAndDecodeString(arg.authors);
	genreFilters	= filterAndDecodeString(arg.genres);

	console.log (authorFilters);
	console.log (genreFilters);
})