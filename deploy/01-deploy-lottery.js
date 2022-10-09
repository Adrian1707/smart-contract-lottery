const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({getNamedAccounts, deployements}) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const { networkConfig } = require("../helper-hardhat-config")
  console.log("deploying.....")
  const lottery = await deploy("Lottery", {
    from: deployer,
    log: true
  })
}

module.exports.tags = ['all', 'lottery']
