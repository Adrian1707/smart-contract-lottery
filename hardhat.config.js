require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy")
require("hardhat-gas-reporter");
require("dotenv").config()
const GOERLI_RPC_URL =
    process.env.GOERLI_URL ||
    "https://eth-mainnet.alchemyapi.io/v2/your-api-key"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  namedAccounts: {
      deployer: {
          default: 0, // here this will by default take the first account as deployer
          1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another,
      },
      player1: {
        default: 1,
        1: 1
      },
      player2: {
        default: 2,
        1: 2
      },
  },
  defaultNetwork: 'hardhat',
  networks: {
      goerli: {
          url: GOERLI_RPC_URL,
          accounts: [PRIVATE_KEY],
          chainId: 5,
          blockConfirmations: 6,
      },
  },
  gasReporter: {
   currency: 'USD',
   enabled: true,
   coinmarketcap: COINMARKETCAP_API_KEY,
   token: 'ETH'
  },
};
