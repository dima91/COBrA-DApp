
const privateKeyProvider	= require ("truffle-hdwallet-provider-privkey");
const privateKey			= ["d4f293fe249a5b025361545f253d20e723c61072453e11ccedf92d4253abf167"];
const infuraKey				= "3c51b50483cd4eec9119a4a7129bd0a4";


module.exports = {
	networks: {
		
		dev: {
			host: "127.0.0.1",
			port: 8545,
			network_id:  "*"
		},


		ropsten : {
			host: "127.0.0.1",
			port: 8545,
			network_id: 3
		},


		infura: {
			provider: new privateKeyProvider (privateKey, "https://ropsten.infura.io/"+infuraKey),
			network_id: 3
		}
	},


	solc: {
		optimizer: {
			enabled: true,
			runs: 200
		}
	}
};