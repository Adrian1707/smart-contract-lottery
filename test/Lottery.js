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

    it("Should not allow the same funder to be in the funders array twice", async function() {
      await lottery.fund({value: ethers.utils.parseEther("0.1")})
      await lottery.fund({value: ethers.utils.parseEther("0.1")})
      const funder = await lottery.s_funders(0)
      expect(funder).to.equal(deployer)
      await expect(lottery.s_funders(1)).to.be.reverted
    })
  })

  describe("voteToWithdraw", async function () {
    it("should add voter to s_votersWantingToWithdraw", async function() {
      await lottery.fund({value: ethers.utils.parseEther("0.1")})
      await lottery.voteToWithdraw(deployer);
      const voter = await lottery.s_votersWantingToWithdraw(0);
      expect(voter).to.equal(deployer)
    })

    it("should not allow a vote unless the user is a funder", async function() {
      await expect(lottery.voteToWithdraw(deployer)).to.be.revertedWith("You need to be a funder to have a vote on withdrawels")
    })
  })
})
