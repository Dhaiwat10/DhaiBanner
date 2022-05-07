import { expect } from "chai";
import { ethers } from "hardhat";

const setupTest = async () => {
  const [signer1, signer2] = await ethers.getSigners();

  const DhaiToken = await ethers.getContractFactory("DhaiToken");
  const dhaiToken = await DhaiToken.deploy();
  await dhaiToken.deployed();
  const tokenAddress = dhaiToken.address;

  const DhaiBanner = await ethers.getContractFactory("DhaiBanner");
  const dhaiBanner = await DhaiBanner.deploy(tokenAddress);
  await dhaiBanner.deployed();

  return { dhaiBanner, dhaiToken, signer1, signer2 };
};

describe("DhaiBanner", function () {
  it("banner update", async () => {
    const { dhaiBanner, dhaiToken, signer1 } = await setupTest();

    const allowanceTx = await dhaiToken.increaseAllowance(
      dhaiBanner.address,
      ethers.utils.parseEther("1000000")
    );
    await allowanceTx.wait();

    const setBannerTx = await dhaiBanner.setBanner(
      "wagmi",
      ethers.utils.parseEther("5000")
    );
    await setBannerTx.wait();
    expect(await dhaiBanner.currentBanner()).to.equal("wagmi");
    expect((await dhaiToken.balanceOf(signer1.address)).toString()).to.equal(
      ethers.utils
        .parseEther("1000000")
        .sub(ethers.utils.parseEther("500").toString())
    );
    expect((await dhaiToken.balanceOf(dhaiBanner.address)).toString()).to.equal(
      ethers.utils.parseEther("500").toString()
    );
  });

  it("banner update fails if bid lower than min fee", async () => {
    const { dhaiBanner, dhaiToken } = await setupTest();

    const allowanceTx = await dhaiToken.increaseAllowance(
      dhaiBanner.address,
      ethers.utils.parseEther("1000000")
    );
    await allowanceTx.wait();

    await expect(
      dhaiBanner.setBanner("wagmi", ethers.utils.parseEther("900"))
    ).to.be.revertedWith("Bid too low");
  });

  it("valid bid is successful", async () => {
    const { dhaiBanner, dhaiToken, signer1, signer2 } = await setupTest();

    const tokenTransfer = await dhaiToken.transfer(
      signer2.address,
      ethers.utils.parseEther("8000")
    );
    await tokenTransfer.wait();

    const allowanceTx = await dhaiToken.increaseAllowance(
      dhaiBanner.address,
      ethers.utils.parseEther("1000000")
    );
    await allowanceTx.wait();
    const allowance2Tx = await dhaiToken
      .connect(signer2)
      .increaseAllowance(
        dhaiBanner.address,
        ethers.utils.parseEther("1000000")
      );
    await allowance2Tx.wait();

    const setBannerTx = await dhaiBanner.setBanner(
      "wagmi",
      ethers.utils.parseEther("5000")
    );
    await setBannerTx.wait();

    const bidTx = await dhaiBanner
      .connect(signer2)
      .setBanner("wagmi2", ethers.utils.parseEther("6000"));
    await bidTx.wait();

    expect(await dhaiBanner.currentBanner()).to.equal("wagmi2");
    expect(await dhaiToken.balanceOf(signer1.address)).to.be.gte(
      ethers.utils.parseEther("9900000")
    );
    expect((await dhaiToken.balanceOf(signer2.address)).toString()).to.equal(
      ethers.utils
        .parseEther("1000000")
        .sub(ethers.utils.parseEther("6000").toString())
    );
    expect((await dhaiToken.balanceOf(dhaiBanner.address)).toString()).to.equal(
      ethers.utils.parseEther("6000").toString()
    );
  });
});
