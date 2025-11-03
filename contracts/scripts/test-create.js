const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("🔍 Testing token creation...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Get factory
    const factoryAddress = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
    const factory = await ethers.getContractAt("TokenFactory", factoryAddress);
    console.log("✅ Factory loaded");

    // Check template
    const templateAddress = await factory.memeTokenTemplate();
    console.log("📄 Template address:", templateAddress);

    // Check tier config
    const tierConfig = await factory.getTierConfig("basic");
    console.log("💰 Basic tier config:", {
      fee: ethers.formatEther(tierConfig.fee),
      defaultMarketingTax: tierConfig.defaultMarketingTax.toString(),
      defaultLiquidityTax: tierConfig.defaultLiquidityTax.toString(),
      defaultAutoBurn: tierConfig.defaultAutoBurn,
      maxTotalTax: tierConfig.maxTotalTax.toString()
    });

    // Try to create token
    console.log("\n🚀 Creating token...");
    const tx = await factory.createToken(
      "CAN",
      "CAN",
      ethers.parseEther("100000"),
      18,
      "ipfs://default",
      "basic",
      0, // marketing tax
      0, // liquidity tax
      false, // auto burn
      { value: ethers.parseEther("0.01"), gasLimit: 5000000 }
    );

    console.log("⏳ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("📊 Gas used:", receipt.gasUsed.toString());

    // Get token address from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === "TokenCreated";
      } catch (e) {
        return false;
      }
    });

    if (event) {
      const parsed = factory.interface.parseLog(event);
      console.log("🎉 Token created at:", parsed.args.tokenAddress);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.data) {
      console.error("Data:", error.data);
    }
    process.exit(1);
  }
}

main();
