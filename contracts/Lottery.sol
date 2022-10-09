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

  constructor() {
    i_owner = msg.sender;
  }

  function fund() public payable {
    s_addressToAmountFunded[msg.sender] += msg.value;
    for(uint i = 0; i < s_funders.length; i++) {
      if(s_funders[i] == msg.sender){
        return;
      }
    }
    s_funders.push(msg.sender);
  }

  function voteToWithdraw(address voterAddress) public {
    bool isFunder;
    for(uint i = 0; i < s_funders.length; i++) {
      if(s_funders[i] == voterAddress) {
        isFunder = true;
      }
    }
    
    if(isFunder == false) {
      revert("You need to be a funder to have a vote on withdrawels");
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
    uint256 proportionOfVotersWantingToWithdraw = (numberOfVotesToWithdraw / s_funders.length) * 100;
    if(proportionOfVotersWantingToWithdraw > MINIMUM_VOTES_PERCENTAGE_TO_WITHDRAW) {
      for(uint256 i = 0; i < s_funders.length; i++) {
        uint256 funderBalance = s_addressToAmountFunded[s_funders[i]];
        (bool callSuccess, ) = payable(s_funders[i]).call{value: funderBalance}("");
        require(callSuccess, "Call failed");
        address funder = s_votersWantingToWithdraw[i];
        s_addressToAmountFunded[funder] = 0;
      }
      s_funders = new address[](0);
    }
  }
}
