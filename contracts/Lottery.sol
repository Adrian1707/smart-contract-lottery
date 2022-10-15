// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import '@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Lottery is VRFConsumerBaseV2 {
  VRFCoordinatorV2Interface COORDINATOR;
  LinkTokenInterface LINKTOKEN;

  uint64 s_subscriptionId;

  // Chainlink VRF Goerli Config
  address vrfCoordinator = 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D; // Coordinator address to coordinate nodes and your contracts
  address link = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB; // Link token address for Goerli
  bytes32 keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15; // The gas lane to use, which specifies the maximum gas price to bump to
  uint16 requestConfirmations = 3;
  // This callbackGasLimit depends on the value below it, the number of requested values that you want sent to he
  // fulfillRandomWords() function. Storing each word costs around 20,000 gas, so 100,000 is a safe default for this contract.
  uint32 callbackGasLimit = 100000;
  uint32 numWords = 1; // Specify the number of random numbers that you want

  uint256[] public s_randomWords;
  uint256 public s_requestId;

  mapping(address => uint256) public s_addressToAmountFunded;
  address[] public s_funders;
  address[] public s_votersWantingToWithdraw;
  address public i_owner;
  uint256[] s_fooArray;
  uint public constant MINIMUM_VOTES_PERCENTAGE_TO_WITHDRAW = 50;
  uint public constant LOTTERY_TICKET_PRICE_ETH = 0.1 * (1 * 10**18); // 1 ETH

  constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {
    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
    LINKTOKEN = LinkTokenInterface(link);
    s_subscriptionId = subscriptionId;
    i_owner = msg.sender;
  }

  // this acts as a callback that the oracle will call when the requestRandomWords() function
  // has been called
   function fulfillRandomWords(
     uint256 requestId,
     uint256[] memory randomWords
   ) internal virtual override {
     s_randomWords = randomWords;
     runLottery();
   }

   // this is the function we can use in Chainlink Automation to call when the
   // lottery starts. This will get called and fulfillRandomWords() will get called
   // by the Oracle and our s_randomWords will be stored
   function requestRandomWords() external {
     s_requestId = COORDINATOR.requestRandomWords(
       keyHash,
       s_subscriptionId,
       requestConfirmations,
       callbackGasLimit,
       numWords
     );
   }

  function getVotersLength() public virtual view returns (uint256) {
    return s_votersWantingToWithdraw.length;
  }

  function runLottery() public {
    uint256 indexOfWinner = s_randomWords[0] % s_funders.length;
    address recentWinner = s_funders[indexOfWinner];
    // Do we also need to reset s_addressToAmountFunded here??
    s_funders = new address payable[](0);
    (bool success, ) = payable(recentWinner).call{value: address(this).balance}("");
  }

  function fund() public payable {
    if(LOTTERY_TICKET_PRICE_ETH != msg.value) {
      revert("Lottery ticket price is fixed. You cannot send more than 0.1 ETH");
    }
    s_addressToAmountFunded[msg.sender] += LOTTERY_TICKET_PRICE_ETH;
    for(uint i = 0; i < s_funders.length; i++) {
      if(s_funders[i] == msg.sender){
        revert("You can only buy one lottery ticket");
      }
    }
    s_funders.push(msg.sender);
  }

  function voteToWithdraw() public {
    bool isFunder;
    address voterAddress = msg.sender;
    for(uint i = 0; i < s_funders.length; i++) {
      if(s_funders[i] == voterAddress) {
        isFunder = true;
      }
    }

    if(isFunder == false) {
      revert("You need to be a funder to have a vote on withdrawals");
    }

    for(uint i = 0; i < s_votersWantingToWithdraw.length; i++) {
      if(s_votersWantingToWithdraw[i] == voterAddress){
        revert("This address is all ready registered as a voter!");
      }
    }

    s_votersWantingToWithdraw.push(msg.sender);
    processWithdrawals();
  }

  function payFunders() public payable {
    for(uint256 i = 0; i < s_funders.length; i++) {
      address funderAddress = s_funders[i];
      uint256 funderBalance = s_addressToAmountFunded[funderAddress];
      (bool callSuccess, ) = payable(funderAddress).call{value: funderBalance}("");
      require(callSuccess, "Call failed");
      s_addressToAmountFunded[funderAddress] = 0;
    }
    s_funders = new address[](0);
    s_votersWantingToWithdraw = new address[](0);
  }

  function processWithdrawals() public {
    uint256 numberOfVotesToWithdraw = s_votersWantingToWithdraw.length;
    uint fundersLength = s_funders.length;
    uint votingPercentage = (numberOfVotesToWithdraw  * 100) / fundersLength;
    if(votingPercentage >= MINIMUM_VOTES_PERCENTAGE_TO_WITHDRAW) {
      for(uint256 i = 0; i < s_funders.length; i++) {
        address funderAddress = s_funders[i];
        uint256 funderBalance = s_addressToAmountFunded[funderAddress];
        (bool callSuccess, ) = payable(funderAddress).call{value: funderBalance}("");
        require(callSuccess, "Call failed");
        s_addressToAmountFunded[funderAddress] = 0;
      }
      s_funders = new address[](0);
      s_votersWantingToWithdraw = new address[](0);
    }
  }
}
