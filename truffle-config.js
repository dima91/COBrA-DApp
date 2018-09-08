
const HDWalletProvider	= require ("truffle-hdwallet-provider");
const mnemonic			= "famous dentist addict laundry puzzle giant prison domain seminar mind rough brand";
const infuraKey			= "3b11593f62194f009282296bbcaf2f78";


module.exports = {
	// See <http://truffleframework.com/docs/advanced/configuration>
	// for more about customizing your Truffle configuration!
	networks: {
		// Info for local deployment
		dev: {
			host: "127.0.0.1",
			port: 8545,
			gas: 6712388,
			network_id:  "*"
		},

		ropsten: {
			/*provider: () => {
				return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"+infuraKey);
			},*/
			host: "127.0.0.1",
			port: 8545,
			network_id: 3,
			gas: 6812388,
		}
	},

	// Directive for Solidity compiler, add optimization otherwise the Catalog is too big (gas intensive)
	solc: {
		optimizer: {
			enabled: true,
			runs: 200
		}
	}
};