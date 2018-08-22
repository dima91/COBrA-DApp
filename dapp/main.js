const {app, BrowserWindow, ipcMain} = require('electron');
const path	= require ('path');
const Web3	= require ("web3");
const fs	= require('fs');


// Send something -->      mainWindow.webContents.send('some-message', {})

const folderPrefix	= '../solidity/build/contracts/'
const baseContentContractPath	= folderPrefix + 'BaseContentManagementContract.json'
const catalogSmartContractPath	= folderPrefix + 'CatalogSmartContract.json'
const documentContractPath		= folderPrefix + 'DocumentManagementContract.json'
const photoContractPath			= folderPrefix + 'PhotoManagementContract.json'
const videoContractPath			= folderPrefix + 'VideoManagementContract.json'


var web3;
const ipcM	= ipcMain;

var mainWindow;


var contracts	= {};
var addresses	= [];

var userBalance;
var userAddress;
var addressIndex;
var hexUser;
var stringUser;

var catalogContract;
var catalogInstance;
var catalogAddress;
var endpoint;


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




const readContract	= (contractPath) => {
	content= fs.readFileSync (contractPath);
	return JSON.parse(content);
}




const getOtherInfo	= () => {
	var tmpPreium;
	web3.eth.getBalance (userAddress, (err, res) => {
		// Recived balance in 'wei' --> converting it into 'ether'
		userBalance	= web3.utils.fromWei (res);
	}).then (() => {
		catalogInstance
		.methods
		.isPremium (hexUser).call ({from:userAddress, gas:300000}, (err, res) => {
										tmpPreium	= res;
									}).then (() => {
										data	= {
											'balance'	: userBalance,
											'isPremium'	: tmpPreium,
											'status'	: 'success'
										}
										mainWindow.webContents.send('userInfo', JSON.stringify(data))
									})
	})
}






// =============================
// =====  ELECTRON EVENTS  =====


// Event handler for quitDapp requests
ipcMain.on ('quitDapp', (event, arg) => {
	process.exit();
})


// Event handler for 'getAddresses' request
ipcMain.on ('getAddresses', (event, arg) => {
	event.sender.send ('addresses', JSON.stringify(addresses));
})


/* Event handler for 'userInfo' request
	If user exists, checks corrispondance with address
	If it doesn't exists, try to register it */
ipcMain.on ('userInfo', (event, arg) => {
	console.log ('Received request for\n\tuser:  ' + arg['user'] + '\n\taddress:  ' + arg['addr']);

	stringUser		= arg['user'];
	hexUser			= web3.utils.stringToHex (arg['user']);
	userAddress			= arg['addr'];
	addressIndex	= addresses.indexOf (arg['addr']);
	catalogContract	= (readContract (catalogSmartContractPath));
	catalogInstance	= new web3.eth.Contract (catalogContract.abi, catalogAddress);
	
	var userExists	= false;
	var tmpAddress;

	console.log ('Hex user:  ' + hexUser + '\taddress index: ' + addressIndex);

	catalogInstance
	.methods
	.userExists (hexUser).call ({from:userAddress, gas:300000}, (err, res) => {
									// FIXME Handle errors
									userExists	= res;
								}).then (() => {
									if (userExists) {
										console.log ('User exists! Checking corrispondance with address..');
										catalogInstance
										.methods
										.getUserAddress (hexUser).call ({from:userAddress, gas:300000}, (err, res) => {
											if (err) {
												// TODO Handle errors!
												throw "Cannot get user address!"
											}
											tmpAddress	= res;
										}).then (() => {
											if (tmpAddress == userAddress) {
												console.log ("Good news. Getting balance and other info");
												getOtherInfo ()
											}
											else
												console.log ("Received address form catalog differs from chosen address: it is an error!");
												throw "Error!"
										})
									}
									else {
										catalogInstance
										.methods.registerMe (hexUser).send ({from:userAddress, gas:300000}, (err, res) => {
											if (err) {
												// TODO Handle errors!
												console.log ("It is an error!");
												throw "Error!"
											}
										}).then (() => {
											getOtherInfo ()
										});
									}
								})
})












// FIXME !!!!!!  Parsing comman line arguments
/*if (process.argv.length !=3) {
	endpoint= "http://localhost:8545";
}
else {
	endpoint= process.argv[2];
}*/
endpoint		= "http://localhost:8545";
web3			= new Web3(new Web3.providers.HttpProvider(endpoint));
catalogAddress	= process.argv[2]
console.log ("Catalog address:  " + catalogAddress)



app.on('ready', loadAddresses)