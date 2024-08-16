// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Ink is ERC20, ERC20Permit, Ownable, ReentrancyGuard {
  event Mint(address account, uint256 ethAmount, uint256 tokenAmount);

  uint MAX_SUPPLY = 1_000_000_000 * 1 ether;
  uint256 public k = 32190005730 * 1 ether * 1 ether;
  uint256 public x = 30 * 1 ether; // initial virtual eth amount
  uint256 public y = 1073000191 * 1 ether; // initial virtual token amount

  constructor(address initialOwner) ERC20("Ink token", "INK") ERC20Permit("Ink token") Ownable(initialOwner) {}

  receive() external payable {}

  function getTokenAmount(uint256 ethAmount) public view returns (uint256) {
    return y - k / (x + ethAmount);
  }

  function mint() public payable nonReentrant {
    uint256 ethAmount = msg.value;
    require(ethAmount > 0, "ETH amount must be greater than zero");

    uint256 tokenAmount = getTokenAmount(ethAmount);
    require(tokenAmount + totalSupply() < MAX_SUPPLY, "Should not exceed total supply");
    _mint(msg.sender, tokenAmount);

    x = x + ethAmount;
    y = y - tokenAmount;
    k = x * y;

    (bool success, ) = owner().call{ value: ethAmount }(new bytes(0));
    require(success, "ETH transfer failed");

    emit Mint(msg.sender, ethAmount, tokenAmount);
  }
}
