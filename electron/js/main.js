
'use strict ';


const {app, BrowserWindow, ipcMain} = require('electron');
const path					= require ('path');
const Web3					= require ("web3");
const fs					= require ('fs');
const truffle				= require ('truffle-contract');
const hdWalletProvider		= require ("truffle-hdwallet-provider");
const privateKeyProvider	= require ("truffle-hdwallet-provider-privkey");

const commandLineArgs	= require ("command-line-args");


const folderPrefix	= '../truffle/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const songContractPath			= folderPrefix + 'SongManagementContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'


// Global variables
var defaultcatalogAddress	= "0x36851d5acabff5356f126615d246e7f35b36f462";
var infuraKey				= "3c51b50483cd4eec9119a4a7129bd0a4";
var mnemonic				= "";
var privateKeys				= ["d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167"];
var endpoint;
var provider;
var web3;




var mainWindow;

// Variable to store readed contracts from filesystem
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

// Variable to store information about logged user
var user	= {
	balance				: {},
	address				: {},
	addressIndex		: {},
	hexName				: {},
	stringName			: {},
	publishedContents	: []
}

const premiumCost			= 44000000000000000;	// =  (44000 szabo)  =  (44000 szabo)  ~  (8 €)
const upperBoundGas			= 4712388;


// Lists used to filter notifications, which are sent to user, about new contents
authorFilters	= [];
genreFilters	= [];















// ==============================
// ===== HELPFUL FUNCTIONS  =====


// This function prints an error message on the console and exit from the program
const errorAndExit	= (err) => {
	console.log ('\n\n' + '==============================\n[ERROR]   ' + err + '\n');
	process.exit ();
}




// This functions is used to print out on the console an help message
const printHelp		= () => {
	console.log ("\n");
	console.log(	"Usage :   npm start [-- options]\n"+
					"Runs COBrA client\n\n" +
					"Options :\n" +
					"\t--catalog-address <addr>\t Uses given address as catalog contract address (default address: "+ defaultcatalogAddress +")\n" +
					"\t--testnet               \t Run program to support local test network (e.g. ganache)\n" +
					"\t--infura                \t Uses the default Infura node as ethereum provider (default API key: " + infuraKey + ")\n" +
					"\t--infura-key <key>      \t Uses given string as API key for infura node\n" +
					"\t--mnemonic <words>      \t Uses given words to identify the Ethereum account\n" +
					"\t--private-key <key>     \t Uses given string to identify the Ethereum account (default private key: d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167)\n" +
					"\t--help                  \t This help message will shown\n" +
					"\n" +
					"Example : npm start -- --infura --private-key d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167");
	console.log ("\n");
}




// Function to parse comman line arguments which describe provider and account to use
const parseArgs		= (args) => {
	
	const optionDefinitions = [
		{ name : 'catalog-address',	type : String },
		{ name : 'testnet',			type : Boolean},
		{ name : 'infura',			type : Boolean},
		{ name : 'infura-key',		type : String },
		{ name : 'mnemonic',		type : String},
		{ name : 'private-key',		type : String },
		{ name : 'help',			type : Boolean}
	]

	const options = commandLineArgs (optionDefinitions);
	console.log ("\n\n==============================");

	// If "--help" argument is present, help message will e shown
	if (options["help"] == true) {
		printHelp ();
		process.exit ();
	}

	// Loading catalog address information
	if (options["catalog-address"] != undefined)
		contracts.catalog.address	= options["catalog-address"];
	else
		contracts.catalog.address	=defaultcatalogAddress;

	console.log ("\n---  Using  " + contracts.catalog.address + "  as catalog address");

	// ==============================

	// Loading local testnet provider
	if (options["testnet"] == true) {
		console.log ("Using local testnet");
		
		provider	= new Web3.providers.HttpProvider ("http://127.0.0.1:8545");
		return ;
	}

	// ==============================

	// Using an Infura node as provider
	if (options["infura"] == true) {
		// Do nothing: using default infura key
		endpoint	= "https://ropsten.infura.io/v3/"+ infuraKey;
		console.log ("---  Using  " + infuraKey + "  as infura key");
	}
	else if (options["infura-key"] != undefined) {
		endpoint	= "https://ropsten.infura.io/v3/"+ options["infura-key"];
		console.log ("---  Using  " + options["infura-key"] + "  as infura key");
	}
	else {
		endpoint 	= "http://127.0.0.1:8545";
		console.log ("---  Using local ethereum client");
	}

	// ==============================

	// Loading user address private key or mnemonic words
	if (options["mnemonic"] != undefined) {
		mnemonic	= options["mnemonic"];
		provider	= new hdWalletProvider (mnemonic, endpoint);
	}
	else if (options["private-key"] != undefined) {
		privateKeys	= [];
		privateKeys.push (options["private-key"]);
		provider	= new privateKeyProvider (privateKeys, endpoint);
	}

	else {
		provider	= new privateKeyProvider	(privateKeys, endpoint);
	}
}




// This function is used by Electron framework to create the program's window
const createWindow= () => {
	if (availableAddresses.length == 0) {
		console.log ("No address available: VERY DANGEROUS!\nEXIT")
		process.exit ();
	}
	mainWindow = new BrowserWindow({
		icon: path.join(__dirname, 'img/cobra.png'),
		show:false,
	})
	
	mainWindow.loadURL(`file://${__dirname}/../index.html`)


	mainWindow.once ('ready-to-show', () => {
		mainWindow.maximize ();
	})
	mainWindow.on ('closed', () => {
		mainWindow = undefined
	})
}



/* Function to load available addresses depending on type of loaded Ethereum provider
	(if --testnet option is specified to use network created by Ganache, multiple accounts are available)
*/
const loadAddresses	= () => {
	web3.eth.getAccounts (async (err, res) => {
		if (err)
			errorAndExit ('Cannot retrieve addresses. Check geth client');

		availableAddresses	= res;
		linkToCatalogInstance ();
	});
}




// Function to read content of compiled solidity catalog contract and to link to catalog on the blockchain
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
		console.log (err.message);
		errorAndExit ('Cannot find catalog instance!');
	})
}




// Function to load content of compiled solidity contracts about deployable contents
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




// Function to setup callbacks when an event is received. Events are loaded from teh latest Ethereum block
const setupEventsCallbacks = () => {

	var initBlock	= 'latest';
	var endBlock	= 'latest';

	contracts.catalog.instance.ContentPublished ({from:user.address}, {fromBlock: initBlock, toBlock: endBlock})
	.watch ((err, res) => {
		contentPublishedCallback (err, res);
	});
	
	
	contracts.catalog.instance.GrantedAccess ({from:user.address}, {fromBlock: initBlock, toBlock: endBlock})
	.watch ((err, res) => {
		grantedAccessCallback (err, res);
	});


	contracts.catalog.instance.GrantedPremium ({from:user.address}, {fromBlock: initBlock, toBlock: endBlock})
	.watch ((err, res) => {
		grantedPremiumCallback (err, res);
	})

	
	contracts.catalog.instance.GiftedAccess ({from:user.address}, {fromBlock: initBlock, toBlock: endBlock})
	.watch ((err, res) => {
		giftedAccessCallback (err, res);
	})


	contracts.catalog.instance.GiftedPremium ({from:user.address}, {fromBlock: initBlock, toBlock: endBlock})
	.watch ((err, res) => {
		giftedPremiumCallback (err, res);
	})


	contracts.catalog.instance.CatalogDied ({form:user.address}, {fromBlock: initBlock, toBlock: endBlock})
	.watch ((err, res) => {
		catalogDiedCallback (err, res);
	})
}




// Function to extract published content list from the reply given by catalog contract
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




// Function to send user information to catalog and process them
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
	
			contracts.catalog.instance.isPremium (user.hexName, {from:user.address})
			.then ((res) => {
				user.isPremium	= res;
				
				if (getContentList) {
					contracts.catalog.instance.getContentsListByAuthor (user.hexName)
					.then((res) => {
						// Saving addresses of user.publishedContents
						res[2].forEach (addr => {
							user.publishedContents.push (addr);
						});

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




// Function to read synchronously a contract placed in the filesystem
const readContract	= (contractPath) => {
	content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}




// Function which return a human readable time
const currentTime = () => {
	var currentdate	= new Date(); 
	return	"Last Sync: " + currentdate.getDate() + "/"
			+ (currentdate.getMonth()+1)  + "/" 
			+ currentdate.getFullYear() + " @ "  
			+ currentdate.getHours() + ":"  
			+ currentdate.getMinutes() + ":" 
			+ currentdate.getSeconds();
}




// Function to compute the average from feedbacks array given as argument
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




// Function used to convert a number into a string which represents a type of content
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




// Function used to convert a number into an hexadecimal string which represents a genre
const type2HexGenre	= (intType) => {
	switch (intType) {
		case 0:
			return "0x736f6e67";

		case 1:
			return "0x766964656f";

		case 2: 
			return "0x70686f746f";

		case 3:
			return "0x646f63756d656e74";

		default :
			return "";
	}
}















// =====================================
// ===== CATALOG EVENTS CALLBACKS  =====

// Listener for event 'content published'
const contentPublishedCallback = async (err, evt) => {
	const suitableFor	= (array, cnt) => {
		return (array.length == 0 || array.includes (cnt));
	}
		
	var tmpInstance	= contracts.baseContent.at (evt.args.contentAddress);
	var type		= await tmpInstance.getType		({from:user.address, gas:upperBoundGas});
	var title		= web3.toUtf8 (evt.args.contentTitle);
	var author		= web3.toUtf8 (evt.args.username);

	type		= Number (type);
	var strType	= type2TypeString(type);
	//console.log (type);

	if (!suitableFor(genreFilters, strType) && !suitableFor(authorFilters,author)) {
		//console.log ("genreFilters doesn't contain   " + strType);
		//console.log ("genreFilters doesn't contain   " + author);
		return ;
	}
	
	mainWindow.webContents.send ('content-published-event', {author:author, stringTitle:title, type:type, hexTitle:evt.args.contentTitle});
		
	var userInfo	= await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
}




// Listener for event 'granted access'
const grantedAccessCallback = (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.username);

	if (rcvUser == user.stringName) {
		var stringTitle	= web3.toUtf8 (evt.args.contentTitle);
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




// Listener for event "grantedPremiumCallback"
const grantedPremiumCallback = (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.username);

	if (rcvUser == user.stringName) {
		mainWindow.webContents.send ('granted-premium-event', {});
		getUserInfo (false)
		.then ((userInfo) => {
			mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
		})
	}
}




// Listener for event "giftedAccessCallback"
const giftedAccessCallback	= (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.rcvUsername);

	if (rcvUser == user.stringName) {
		var sender	= web3.toUtf8 (evt.args.sndUsername);
		var title	= web3.toUtf8 (evt.args.contentTitle);
		console.log ('User  ' + sender + '  gift to you this content:  ' + title);

		mainWindow.webContents.send ('gifted-content-event', {title:title, sender:sender, hexTitle:evt.args.contentTitle});
	}
}




// Listener for event "giftedPremiumCallback"
const giftedPremiumCallback	= (err, evt) => {
	var rcvUser	= web3.toUtf8 (evt.args.rcvUsername);

	if (rcvUser == user.stringName) {
		var sender	= web3.toUtf8 (evt.args.sndUsername);

		getUserInfo (false)
		.then ((userInfo) => {
			mainWindow.webContents.send('gifted-premium-event', {sender:sender});
			mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
		})
		.catch ((err) => {
		})
	}
}




// Listener for event "feedbackActivation"
const feedbackActivationCallback	= (err, evt) => {
	if (web3.toUtf8 (evt.args.targetUsername) == user.stringName) 
		mainWindow.webContents.send('feedback-activation-event', {
																	title: web3.toUtf8 (evt.args.contentTitle),
																	hexTitle:web3.fromUtf8(web3.toUtf8(evt.args.contentTitle))});
}




// Listener for event "catalogDied". When this event is received, all created contents are destroyed
const catalogDiedCallback	= (err, evt) => {
	user.publishedContents.forEach (async el => {
		console.log (el);
		try {
			await contracts.baseContent.at(el).killMe({from:user.address, gas:upperBoundGas});
		} catch (err) {
			console.log (err);
		}
	})
	mainWindow.webContents.send('catalog-died-event', {});
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
		try {
			console.log ("User doesn't exist!");
			await contracts.catalog.instance.registerMe (user.hexName, {from:user.address, gas:upperBoundGas});
			userInfo	= await getUserInfo (false);
			mainWindow.webContents.send('init-info', JSON.stringify(userInfo));
		}
		catch (err) {
			mainWindow.webContents.send('init-info', JSON.stringify({'result':'error', 'cause':'Error creating new user'}));
		}
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

		user.publishedContents.push (instanceAddress);

		var userInfo	= await getUserInfo (false);
		mainWindow.webContents.send('user-info', JSON.stringify(userInfo));

	} catch (err) {
		mainWindow.webContents.send('create-content-reply', {
			result	: 'failure',
			cause	: 'Content already exists'
		});
		
		// Destroying created content
		await contracts.baseContent.at(newInstance.address).killMe({from:user.address, gas:upperBoundGas});
	}
})




// Event to retreive list of consumable contents
ipcMain.on ('contents-list-request', async (evt, arg) => {
	console.log ('Received a contents list update request');

	var contentsList	= await contracts.catalog.instance.getContentList ({from:user.address, gas:upperBoundGas})
	var toSend			= [];
	
	contentsList.forEach ((el) => {
		toSend.push (web3.toUtf8 (el))
	})
	
	mainWindow.webContents.send ('contents-list-reply', {list: toSend, time: currentTime()});
});




// Event to retreive more information about specific content
ipcMain.on ('more-info-request', async (evt, arg) => {
	console.log ('Received more-info-request for '+ arg.title);
	
	var infoOf	= await (contracts.catalog.instance.getInfoOf (web3.fromUtf8 (arg.title), {from:user.address, gas:upperBoundGas}));
	var toSend	= {
		title	: arg.title,
		rating	: computeFeedbacksAvg (infoOf[0]),
		price	: web3.fromWei(infoOf['1'], 'milliether').toString(),
		author	: web3.toUtf8 (infoOf['2']),
		type	: Number(infoOf[3])
	};

	mainWindow.webContents.send ('more-info-reply', toSend);
})




/* Event to buy a content. If user is premium, it tries to buy as a premium and,
	if it fails, it retreies to build the content as a simple user
*/
ipcMain.on ('buy-content-request', async (evt, arg) => {
	console.log ('Received request to buy content  ' + arg.title);
	
	var tmpTitle	= arg.title;
	var tmpPrice	= 0;
	var success		= false;

	try {
		tmpPrice	= await (contracts.catalog.instance.getPriceOf (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas}));

		if (user.isPremium) {
			await contracts.catalog.instance.getContentPremium (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas});
			success	= true;
		}
		else {
			await contracts.catalog.instance.getContent (web3.fromUtf8(tmpTitle), {from:user.address, gas:upperBoundGas, value:tmpPrice});
			success	= true;
		}
	} catch (err) {
		user.isPremium	= false;
		console.log (err);
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




/* Event to consume an already buyed content. Before sending the request to catalog,
	it subscribes itself to content's "FeedcakcACtivation" event.
*/
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




// Event to leave a feedback about already consumed content
ipcMain.on ('rating-request', async (evt, arg) => {
	console.log (arg);

	var tmpInstance;
	var tmpAddress;

	tmpAddress	= await (contracts.catalog.instance.getAddressOf (arg.title, {fom:user.address, gas:upperBoundGas}));
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




// Event to gift a content to a specific user
ipcMain.on ('gift-content-request', async (evt, arg) => {
	console.log ('Gifting  ' + arg.title + '  to  ' + arg.user);

	var tmpPrice;

	try {
		tmpPrice	= await (contracts.catalog.instance.getPriceOf (web3.fromUtf8(arg.title), {from:user.address, gas:upperBoundGas}));
		await contracts.catalog.instance.giftContent (web3.fromUtf8(arg.title), web3.fromUtf8(arg.user), {from:user.address, gas:upperBoundGas, value:tmpPrice})
		mainWindow.webContents.send('gift-content-reply', {result:'success'});
	} catch (err) {
		mainWindow.webContents.send('gift-content-reply', {result:'failure'});
	}

	var userInfo = await getUserInfo (false);
	mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
})




// Event to buy a premium account
ipcMain.on ('buy-premium-request', async (evt, arg) => {
	try {
		await (contracts.catalog.instance.buyPremium ({from:user.address, gas:upperBoundGas, value:premiumCost}));
		mainWindow.webContents.send('buy-premium-reply', {result:'success'});

		var userInfo	= await (getUserInfo (false));
		mainWindow.webContents.send('user-info', JSON.stringify(userInfo));
	} catch (err) {
		console.log (err);
		mainWindow.webContents.send('gift-content-reply', {result:'failure'});
	}
});




// Event to gift premiumaccount to another user
ipcMain.on ('gift-premium-request', async (evt, arg) => {

	try {
		await (contracts.catalog.instance.giftPremium (web3.fromAscii(arg.user), {from:user.address, gas:upperBoundGas, value:premiumCost}));
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




// Event fired when user requests the content of views of all available contents
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




// Event fired when user requests newest available contents
ipcMain.on ('get-newest-content-list-request', async (evt, arg) => {

	var list	= await (contracts.catalog.instance.getNewContentList  (arg.count, {from:user.address, gas:upperBoundGas}));
	var toRet	= [];

	list.forEach ((el) => {
		toRet.push (web3.toUtf8 (el));
	})
	mainWindow.webContents.send('get-newest-content-list-reply', {result:'success', data:toRet});
});




// Event fired when user requests the latest published content by a specific author
ipcMain.on ('get-latest-content-by-author-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getLatestByAuthor  (web3.fromUtf8(arg.author), {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-latest-content-by-author-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-latest-content-by-author-reply', {result:'failure'});
	}
})




// Event fired when user requests the latest published content of a specific genre
ipcMain.on ('get-latest-content-by-genre-request', async (evt, arg) => {
	try {
		var genre	= type2HexGenre (arg.genre);

		var cont	= await (contracts.catalog.instance.getLatestByGenre  (genre, {from:user.address, gas:upperBoundGas}));
		console.log (cont);
		mainWindow.webContents.send('get-latest-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	}
	catch (err) {
		mainWindow.webContents.send('get-latest-content-by-genre-reply', {result:'failure'});
	}
});




// Event fired when user requests the most popular content published by a specific author
ipcMain.on ('get-most-popular-content-by-author-request', async (evt, arg) => {
	try {
		var cont	= await contracts.catalog.instance.getMostPopularByAuthor  (web3.fromUtf8(arg.author), {from:user.address, gas:upperBoundGas})
		mainWindow.webContents.send('get-most-popular-content-by-author-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-most-popular-content-by-author-reply', {result:'failure'});
	}
});




// Event fired when user requests the most popular content belonging to a specific genre
ipcMain.on ('get-most-popular-content-by-genre-request', async (evt, arg) => {
	try {
		var genre	= type2HexGenre (arg.genre);
		console.log ('genre       --> '+ genre);
		var cont	= await (contracts.catalog.instance.getMostPopularByGenre  (genre, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-popular-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-most-popular-content-by-genre-reply', {result:'failure'});
	}
});




// Event fired when user requests the most rated content
ipcMain.on ('get-most-rated-content-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getMostRated  (arg.category, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-rated-content-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-most-rated-content-reply', {result:'failure'});
	}
});




// Event fired when user requests the most rated content belonging to a specific genre
ipcMain.on ('get-most-rated-content-by-genre-request', async (evt, arg) => {
	try {
		var genre	= type2HexGenre (arg.genre);
		console.log ('genre--> '+ genre);
		var cont	= await (contracts.catalog.instance.getMostRatedByGenre  (genre, arg.category, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-rated-content-by-genre-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-most-rated-content-by-genre-reply', {result:'failure'});
	}
});




// Event fired when user requests the most rated content published by a specific user
ipcMain.on ('get-most-rated-content-by-author-request', async (evt, arg) => {
	try {
		var cont	= await (contracts.catalog.instance.getMostRatedByAuthor  (arg.author, arg.category, {from:user.address, gas:upperBoundGas}));
		mainWindow.webContents.send('get-most-rated-content-by-author-reply', {result:'success', data:web3.toUtf8 (cont)});
	} catch (err) {
		mainWindow.webContents.send('get-most-rated-content-by-author-reply', {result:'failure'});
	}
});




/* Event fired when the user wants to receive events about contentscreation only for some authors or some genres
*/
ipcMain.on ('apply-filters', (evt, arg) => {
	var filterAndDecodeString	= (str) => {
		str= str.replace(/ /g,'');		// Removing all whitespaces
		return str.split(',');
	}

	authorFilters	= filterAndDecodeString(arg.authors);
	genreFilters	= filterAndDecodeString(arg.genres);
})









/* Entry point of program. If another instance of web3 already exists, it is loaded.
	Otherwise command lien arguments are loaded.
*/
if (typeof web3 !== 'undefined') {
	provider	= web3.currentProvider;
}
else {
	parseArgs ();
	web3 		= new Web3 (provider);
}


// When the application will be ready to be shown, this event is fired.
app.on('ready', () => {
	loadAddresses ();
	ipcMain.setMaxListeners (50);
});