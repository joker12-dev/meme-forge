const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemeToken Platform", function () {
  let factory;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    const MemeTokenFactory = await ethers.getContractFactory("MemeTokenFactory");
    factory = await MemeTokenFactory.deploy();
  });

  it("Should create a new token", async function () {
    // ethers.utils.parseEther yerine ethers.parseEther
    const tx = await factory.connect(user1).createToken(
      "Test Token",
      "TEST",
      ethers.parseEther("1000000"),  // DEĞİŞTİ
      18,
      "ipfs://QmTestMetadata"
    );

    const receipt = await tx.wait();
    
    // Event kontrolü
    const event = receipt.logs.map(log => {
      try {
        return factory.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    }).find(parsed => parsed && parsed.name === 'TokenCreated');

    expect(event).to.not.be.undefined;
    expect(event.args.name).to.equal("Test Token");
    expect(event.args.symbol).to.equal("TEST");
    expect(event.args.creator).to.equal(user1.address);
  });

  it("Should list user tokens", async function () {
    await factory.connect(user1).createToken(
      "User Token",
      "USER",
      ethers.parseEther("500000"),  // DEĞİŞTİ
      18,
      "ipfs://QmUserMetadata"
    );

    const userTokens = await factory.getUserTokens(user1.address);
    expect(userTokens.length).to.equal(1);
  });

  it("Should return token count", async function () {
    await factory.connect(user1).createToken(
      "Token 1",
      "TKN1",
      ethers.parseEther("1000000"),  // DEĞİŞTİ
      18,
      "ipfs://QmToken1"
    );

    const count = await factory.getTokenCount();
    expect(count).to.equal(1);
  });

  it("Should return all tokens", async function () {
    await factory.connect(user1).createToken(
      "Token 1",
      "TKN1",
      ethers.parseEther("1000000"),  // DEĞİŞTİ
      18,
      "ipfs://QmToken1"
    );

    await factory.connect(owner).createToken(
      "Token 2", 
      "TKN2",
      ethers.parseEther("2000000"),  // DEĞİŞTİ
      18,
      "ipfs://QmToken2"
    );

    const allTokens = await factory.getAllTokens();
    expect(allTokens.length).to.equal(2);
  });
});
