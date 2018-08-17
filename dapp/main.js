const {app, BrowserWindow, ipcMain} = require('electron');
const path= require ('path')
const Web3= require ("web3");


var web3;
const ipcM= ipcMain;

let window;

let addresses= [];
let localAddress;
let endpoint;


const createWindow= () => {
	if (addresses.length == 0) {
		console.log ("No address available: VERY DANGEROUS!\nEXIT")
		process.exit ();
	}
	window = new BrowserWindow({
		icon: path.join(__dirname, 'cobra.png'),
		show:false
	})
	
	window.loadURL(`file://${__dirname}/index.html`)

	window.once ('ready-to-show', () => {
		window.maximize ();
	})

	window.on ('closed', () => {
		window = null
	})
}



const loadAddresses= () => {
	web3.eth.getAccounts (function (err, res) {
		addresses= res;
	}).then (createWindow)
}



// Parsing comman line arguments
if (process.argv.length !=3) {
	endpoint= "http://localhost:8545";
}
else {
	endpoint= process.argv[2];
}
web3 = new Web3(new Web3.providers.HttpProvider(endpoint));


app.on('ready', loadAddresses)










// ====================
// =====  EVENTS  =====


// Event handler for quitDapp requests
ipcMain.on ('quitDapp', (event, arg) => {
	process.exit();
})


// Event handler for 'getAddresses' request
ipcMain.on ('getAddresses', (event, arg) => {
	event.sender.send ('addresses', JSON.stringify(addresses));
})


 // Event handler for 'userInfo' message
ipcMain.on ('userInfo', (event, arg) => {
	console.log ('Received request for user informations for  ' + arg['addr']);
	web3.eth.getBalance (arg['addr'], (err, res) => {
		// Recived balance in 'wei' --> convert it into 'gigaWei'!
		var balance = (new Number(res))/(parseInt(1000000000, 10))
		event.sender.send ('userInfo', JSON.stringify({'balance':balance}))
	})
})