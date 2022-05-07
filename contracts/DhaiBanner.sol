//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DhaiBanner {
    string public currentBanner;
    IERC20 public token;
    address public contractOwner;
    address public currentBannerOwner;
    uint256 public currentBid;
    uint256 public constant MIN_BID = 1000 * 10**18;

    constructor(IERC20 _tokenContractAddress) {
        contractOwner = msg.sender;
        currentBanner = "";
        token = IERC20(_tokenContractAddress);
        currentBid = 0;
    }

    function setBanner(string memory _banner, uint256 _newBid) public {
        require(_newBid > MIN_BID, "Bid too low 1");
        require(_newBid > currentBid, "Bid too low 2");
        token.transferFrom(msg.sender, address(this), 500 * 10**18);
        if (currentBid > 0) {
            uint256 balance = token.balanceOf(address(this));
            token.transfer(currentBannerOwner, balance);
        }
        currentBannerOwner = msg.sender;
        currentBid = _newBid;
        currentBanner = _banner;
    }

    function withdrawStaked() public {
        require(msg.sender == currentBannerOwner, "Not the banner owner");
        currentBanner = "";
        currentBannerOwner = address(0);
        currentBid = 0;
        token.transfer(msg.sender, currentBid);
    }
}
