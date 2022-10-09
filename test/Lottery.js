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
      await lottery.fund({value: ethers.utils.parseEther("1.0")})
      const amountFundedForDeployer = await lottery.s_addressToAmountFunded(deployer)
      const contractBalance = await ethers.provider.getBalance(lottery.address)
      expect(amountFundedForDeployer.toString()).to.equal(ethers.utils.parseEther("1.0"))
      expect(contractBalance.toString()).to.equal(ethers.utils.parseEther("1.0"))
    })

    it("Should add funds from multiple senders", async function() {
      await lottery.fund({value: ethers.utils.parseEther("1.0")})
      const amountFundedForDeployer = await lottery.s_addressToAmountFunded(deployer)
      const player1 = (await getNamedAccounts()).player1
      player1Lottery  = await ethers.getContract("Lottery", player1)
      await player1Lottery.fund({value: ethers.utils.parseEther("1.0")})
      const amountFundedForPlayer1 = await lottery.s_addressToAmountFunded(player1)
      const contractBalance = await ethers.provider.getBalance(lottery.address)

      expect(amountFundedForDeployer.toString()).to.equal(ethers.utils.parseEther("1.0"))
      expect(amountFundedForPlayer1.toString()).to.equal(ethers.utils.parseEther("1.0"))
      expect(contractBalance.toString()).to.equal(ethers.utils.parseEther("2.0"))
    })

    it("Should not allow the same funder to be in the funders array twice", async function() {
      await lottery.fund({value: ethers.utils.parseEther("1.0")})
      await lottery.fund({value: ethers.utils.parseEther("1.0")})
      const funder = await lottery.s_funders(0)
      expect(funder).to.equal(deployer)
      await expect(lottery.s_funders(1)).to.be.reverted
    })


    it("Should revert when users try to send more than 1 ETH", async function() {
      await expect(lottery.fund({value: ethers.utils.parseEther("1.1")})).to.be.revertedWith(
        "Lottery ticket price is fixed. You cannot send more than 1 ETH"
      )
    })
  })

  describe("voteToWithdraw", async function () {
    it("should add voter to s_votersWantingToWithdraw", async function() {
      await lottery.fund({value: ethers.utils.parseEther("1.0")})
      await lottery.voteToWithdraw();
      const voter = await lottery.s_votersWantingToWithdraw(0);
      expect(voter).to.equal(deployer)
    })

    it("should not allow a vote unless the user is a funder", async function() {
      await expect(lottery.voteToWithdraw()).to.be.revertedWith("You need to be a funder to have a vote on withdrawals")
    })
  })

  describe("processWithdrawals", async function() {
    beforeEach(async function() {
      const deployer = (await getNamedAccounts()).deployer
      deployerLottery  = await ethers.getContract("Lottery", deployer)
      await lottery.fund({value: ethers.utils.parseEther("1.0")})

      const player1 = (await getNamedAccounts()).player1
      player1Lottery  = await ethers.getContract("Lottery", player1)
      await player1Lottery.fund({value: ethers.utils.parseEther("1.0")})

      const player2 = (await getNamedAccounts()).player2
      player2Lottery  = await ethers.getContract("Lottery", player2)
      await player2Lottery.fund({value: ethers.utils.parseEther("1.0")})
    })

    it("Should not process withdrawals when < 50% of funders vote", async function() {
      await player1Lottery.voteToWithdraw()
      const contractBalance = await ethers.provider.getBalance(lottery.address)
      expect(contractBalance).to.equal(ethers.utils.parseEther("3.0"))

      const player1 = (await getNamedAccounts()).player1
      const player1Balance = await ethers.provider.getBalance(player1)
      console.log(player1Balance.toString())
      expect(player1Balance).to.be.lt(ethers.utils.parseEther("9999"))
    })

    it("Should process withdrawals when > 50% of funders vote", async function() {
      const player1 = (await getNamedAccounts()).player1
      player1Lottery  = await ethers.getContract("Lottery", player1)
      await player1Lottery.voteToWithdraw()

      const player2 = (await getNamedAccounts()).player2
      player2Lottery  = await ethers.getContract("Lottery", player2)
      await player2Lottery.voteToWithdraw()

      const deployerBalance = await ethers.provider.getBalance(deployer)
      expect(deployerBalance).to.be.gt(ethers.utils.parseEther("9999"))

      const player1Balance = await ethers.provider.getBalance(player1)
      expect(player1Balance).to.be.gt(ethers.utils.parseEther("9999"))

      const player2Balance = await ethers.provider.getBalance(player2)
      expect(player2Balance).to.be.gt(ethers.utils.parseEther("9999"))

      const contractBalance = await ethers.provider.getBalance(lottery.address)
      expect(contractBalance).to.equal(ethers.utils.parseEther("0"))
    })
  })
})
