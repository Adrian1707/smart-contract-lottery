// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Lottery {

  mapping(address => uint256) public s_addressToAmountFunded;
  address[] public s_funders;
  address public i_owner;

  constructor() {
    i_owner = msg.sender;
  }
}
