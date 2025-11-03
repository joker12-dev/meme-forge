const hre = require("hardhat");
require("dotenv").config({ path: __dirname + "/../../.env" });

/**
 * Automatic contract verification script
 * Usage: npx hardhat run scripts/verify.js --network bscTestnet
 */

async function verify(address, constructorArguments) {
  console.log(`Verifying contract at ${address}...`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`✅ Contract verified successfully: ${address}`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ Contract already verified: ${address}`);
      return true;
    }
    console.error(`❌ Verification failed for ${address}:`, error.message);
    return false;
  }
}

async function verifyWithRetry(address, constructorArguments, retries = 3, delay = 10000) {
  for (let i = 0; i < retries; i++) {
    if (i > 0) {
      console.log(`Retry ${i}/${retries} after ${delay/1000}s delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const success = await verify(address, constructorArguments);
    if (success) return true;
  }
  
  console.error(`❌ Failed to verify after ${retries} attempts`);
  return false;
}

async function main() {
  console.log("🔍 Starting automatic contract verification...\n");
  
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  if (network.chainId === 31337n) {
    console.log("⚠️  localhost detected - skipping verification");
    return;
  }
  
  // Get deployed contract addresses from .env
  const factoryAddress = process.env.REACT_APP_FACTORY_ADDRESS || process.env.FACTORY_ADDRESS;
  const memeTokenAddress = process.env.REACT_APP_MEME_TOKEN_ADDRESS;
  const liquidityAdderAddress = process.env.REACT_APP_LIQUIDITY_ADDER_ADDRESS;
  const pancakeRouter = process.env.REACT_APP_PANCAKE_ROUTER_ADDRESS;
  
  if (!factoryAddress || !memeTokenAddress) {
    console.error("❌ Contract addresses not found in .env file");
    console.log("Please deploy contracts first or set addresses in .env");
    return;
  }
  
  console.log("Contract addresses:");
  console.log(`  Factory: ${factoryAddress}`);
  console.log(`  MemeToken Template: ${memeTokenAddress}`);
  console.log(`  LiquidityAdder: ${liquidityAdderAddress}`);
  console.log(`  PancakeRouter: ${pancakeRouter}\n`);
  
  // Determine router address based on network
  let routerAddress = pancakeRouter;
  if (!routerAddress) {
    if (network.chainId === 97n) {
      routerAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet
    } else if (network.chainId === 56n) {
      routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // BSC Mainnet
    }
  }
  
  console.log("⏳ Waiting 30 seconds for BSCScan to index contracts...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const results = {
    memeToken: false,
    factory: false,
    liquidityAdder: false
  };
  
  // Verify MemeToken Template
  console.log("\n1️⃣ Verifying MemeToken Template...");
  results.memeToken = await verifyWithRetry(
    memeTokenAddress,
    [
      "Template",
      "TEMP",
      hre.ethers.parseEther("1000000"),
      routerAddress
    ]
  );
  
  // Verify TokenFactory
  console.log("\n2️⃣ Verifying TokenFactory...");
  results.factory = await verifyWithRetry(
    factoryAddress,
    [
      process.env.PLATFORM_WALLET,
      process.env.MARKETING_WALLET || process.env.PLATFORM_WALLET,
      process.env.DEVELOPMENT_WALLET || process.env.PLATFORM_WALLET,
      process.env.PLATFORM_COMMISSION_WALLET || process.env.PLATFORM_WALLET,
      routerAddress
    ]
  );
  
  // Verify LiquidityAdder
  if (liquidityAdderAddress) {
    console.log("\n3️⃣ Verifying LiquidityAdder...");
    results.liquidityAdder = await verifyWithRetry(
      liquidityAdderAddress,
      [
        routerAddress,
        hre.ethers.parseEther("100"),
        hre.ethers.parseEther("0.01"),
        500,
        process.env.LIQUIDITY_FEE_WALLET || process.env.PLATFORM_WALLET
      ]
    );
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(50));
  console.log(`MemeToken Template: ${results.memeToken ? '✅ Verified' : '❌ Failed'}`);
  console.log(`TokenFactory: ${results.factory ? '✅ Verified' : '❌ Failed'}`);
  if (liquidityAdderAddress) {
    console.log(`LiquidityAdder: ${results.liquidityAdder ? '✅ Verified' : '❌ Failed'}`);
  }
  console.log("=".repeat(50));
  
  // BSCScan links
  const explorerBase = network.chainId === 97n 
    ? "https://testnet.bscscan.com" 
    : "https://bscscan.com";
  
  console.log("\n🔗 View on BSCScan:");
  console.log(`  MemeToken: ${explorerBase}/address/${memeTokenAddress}#code`);
  console.log(`  Factory: ${explorerBase}/address/${factoryAddress}#code`);
  if (liquidityAdderAddress) {
    console.log(`  LiquidityAdder: ${explorerBase}/address/${liquidityAdderAddress}#code`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
