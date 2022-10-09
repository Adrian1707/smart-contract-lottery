const { deployments, ethers, getNamedAccounts } = require('hardhat')
const { assert, expect } = require('chai')


describe("Lottery", function () {
  beforeEach(async function() {
    await deployments.fixture(["all"])
    deployer = (await getNamedAccounts()).deployer
    lottery  = await ethers.getContract("Lottery", deployer)
  })

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.i_owner()).to.equal(deployer);
    });
  })

  describe("Fund", async function () {
    it("Should add funds to the contract from the sender", async function() {
      await lottery.fund({value: ethers.utils.parseEther("0.1")})
      const amountFundedForDeployer = await lottery.s_addressToAmountFunded(deployer)
      const contractBalance = await ethers.provider.getBalance(lottery.address)
      expect(amountFundedForDeployer.toString()).to.equal(ethers.utils.parseEther("0.1"))
      expect(contractBalance.toString()).to.equal(ethers.utils.parseEther("0.1"))
    })

    it("Should add funds from multiple senders", async function() {
      await lottery.fund({value: ethers.utils.parseEther("0.1")})
      const amountFundedForDeployer = await lottery.s_addressToAmountFunded(deployer)
      const player1 = (await getNamedAccounts()).player1
      player1Lottery  = await ethers.getContract("Lottery", player1)
      await player1Lottery.fund({value: ethers.utils.parseEther("0.5")})
      const amountFundedForPlayer1 = await lottery.s_addressToAmountFunded(player1)
      const contractBalance = await ethers.provider.getBalance(lottery.address)

      expect(amountFundedForDeployer.toString()).to.equal(ethers.utils.parseEther("0.1"))
      expect(amountFundedForPlayer1.toString()).to.equal(ethers.utils.parseEther("0.5"))
      expect(contractBalance.toString()).to.equal(ethers.utils.parseEther("0.6"))
    })
  })
})
