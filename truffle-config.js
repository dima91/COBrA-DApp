
const HDWalletProvider	= require ("truffle-hdwallet-provider");
const mnemonic			= "virus pig security rabbit census judge boost exhibit desert try eyebrow hard";
const infuraKey			= "3c51b50483cd4eec9119a4a7129bd0a4";
const accountIndex		= 0;


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
			provider: () => {
				return new HDWalletProvider (mnemonic, "https://ropsten.infura.io/"+infuraKey, accountIndex);
			},
			network_id: 3,
			host: "127.0.0.1",
			port:  8545
			//,gas:   6721975
			//,gasPrice: 30000000000
		}
	},


	solc: {
		optimizer: {
			enabled: true,
			runs: 200
		}
	}
};