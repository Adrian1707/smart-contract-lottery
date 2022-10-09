// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Lottery {

  mapping(address => uint256) public s_addressToAmountFunded;
  address[] public s_funders;
  address[] public s_votersWantingToWithdraw;
  address public i_owner;
  uint public constant MINIMUM_VOTES_PERCENTAGE_TO_WITHDRAW = 50;
  uint public constant LOTTERY_TICKET_PRICE_ETH = 1 * (1 * 10**18); // 1 ETH

  constructor() {
    i_owner = msg.sender;
  }

  function fund() public payable {
    if(LOTTERY_TICKET_PRICE_ETH != msg.value) {
      revert("Lottery ticket price is fixed. You cannot send more than 1 ETH");
    }
    s_addressToAmountFunded[msg.sender] += LOTTERY_TICKET_PRICE_ETH;
    for(uint i = 0; i < s_funders.length; i++) {
      if(s_funders[i] == msg.sender){
        return;
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

  function processWithdrawals() public payable {
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
    }
  }
}
