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
})
