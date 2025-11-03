const { ethers } = require("hardhat");

async function main() {
  try {
    console.log("Starting LiquidityAdder deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "BNB");

    // Deploy LiquidityAdder
    console.log("\nDeploying LiquidityAdder...");
    const LiquidityAdder = await ethers.getContractFactory("LiquidityAdder");
    
    const liquidityAdder = await LiquidityAdder.deploy(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1", // BSC Testnet Router
      ethers.parseEther("100"), // minTokenAmount
      ethers.parseEther("0.001"), // minEthAmount - DÜŞÜRÜLDÜ
      200, // platformFee (200 = %2)
      process.env.LIQUIDITY_FEE_WALLET,
      {
        gasPrice: ethers.parseUnits("1.5", "gwei"),
        gasLimit: 3000000
      }
    );
    
    console.log("Waiting for deployment...");
    await liquidityAdder.waitForDeployment();
    const liquidityAdderAddress = await liquidityAdder.getAddress();
    
    console.log("\n✅ LiquidityAdder deployed:", liquidityAdderAddress);
    console.log("\n📋 Update your .env file:");
    console.log(`REACT_APP_LIQUIDITY_ADDER_ADDRESS=${liquidityAdderAddress}`);

    // Verification
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 31337n) {
      console.log("\n⏳ Waiting 30 seconds before verification...");
      await new Promise(resolve => setTimeout(resolve, 30000));

      try {
        console.log("\n🔍 Verifying LiquidityAdder...");
        await hre.run("verify:verify", {
          address: liquidityAdderAddress,
          constructorArguments: [
            "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
            ethers.parseEther("100"),
            ethers.parseEther("0.001"),
            200,
            process.env.LIQUIDITY_FEE_WALLET
          ],
        });
        console.log("✅ LiquidityAdder verified!");
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log("✅ LiquidityAdder already verified!");
        } else {
          console.error("❌ Error verifying:", error.message);
        }
      }

      const explorerBase = network.chainId === 97n 
        ? "https://testnet.bscscan.com" 
        : "https://bscscan.com";
      
      console.log(`\n🔗 View on BSCScan: ${explorerBase}/address/${liquidityAdderAddress}#code`);
    }

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main();
