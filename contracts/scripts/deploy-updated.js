/**
 * Deploy Script - Updated Contracts
 * Deploys:
 * 1. MemeToken template (with platform wallet mint)
 * 2. LiquidityAdder (with addLiquidityFrom function)
 * 3. Updates TokenFactory with new template
 * 
 * Usage: npx hardhat run scripts/deploy-updated.js --network bscTestnet
 */

const hre = require("hardhat");
const ethers = require("ethers");

const PLATFORM_COMMISSION_WALLET = "0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C";
const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet
const EXISTING_FACTORY = process.env.FACTORY_ADDRESS || "0xE92b066F66C7225fa508dffD461cD62Ed4b767FC"; // BSC Testnet

async function main() {
  console.log("\n🚀 Deploying Updated Contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(`🔌 Network: ${hre.network.name}`);
  console.log(`⛽ Gas Price: ${(await hre.ethers.provider.getFeeData()).gasPrice} wei\n`);

  // ==================== 1. Deploy MemeToken (Template) ====================
  console.log("═".repeat(60));
  console.log("1️⃣  DEPLOYING MemeToken Template");
  console.log("═".repeat(60));

  const MemeToken = await hre.ethers.getContractFactory("MemeToken");
  
  // Constructor: name, symbol, totalSupply, pancakeRouter
  // These will be overridden during initialize() call
  const memeTokenTemplate = await MemeToken.deploy(
    "Meme Token Template",
    "MEME",
    1000000, // dummy supply for template
    PANCAKE_ROUTER,
    { gasLimit: 5000000 }
  );

  await memeTokenTemplate.waitForDeployment();
  const memeTokenAddress = await memeTokenTemplate.getAddress();
  console.log(`✅ MemeToken Template deployed: ${memeTokenAddress}`);
  console.log(`   TX Hash: ${memeTokenTemplate.deploymentTransaction().hash}\n`);

  // ==================== 2. Deploy LiquidityAdder ====================
  console.log("═".repeat(60));
  console.log("2️⃣  DEPLOYING LiquidityAdder");
  console.log("═".repeat(60));

  const LiquidityAdder = await hre.ethers.getContractFactory("LiquidityAdder");
  
  const minTokenAmount = ethers.parseUnits("100", 18); // Min 100 tokens
  const minEthAmount = ethers.parseUnits("0.01", 18); // Min 0.01 ETH
  const platformFee = 100; // 1% fee (in basis points: 100 = 1%)
  
  const liquidityAdder = await LiquidityAdder.deploy(
    PANCAKE_ROUTER,
    minTokenAmount,
    minEthAmount,
    platformFee,
    PLATFORM_COMMISSION_WALLET,
    { gasLimit: 3000000 }
  );

  await liquidityAdder.waitForDeployment();
  const liquidityAdderAddress = await liquidityAdder.getAddress();
  console.log(`✅ LiquidityAdder deployed: ${liquidityAdderAddress}`);
  console.log(`   TX Hash: ${liquidityAdder.deploymentTransaction().hash}`);
  console.log(`   Min Token Amount: ${ethers.formatUnits(minTokenAmount, 18)}`);
  console.log(`   Min ETH Amount: ${ethers.formatUnits(minEthAmount, 18)}`);
  console.log(`   Platform Fee: ${platformFee / 100}%\n`);

  // ==================== 3. Update TokenFactory ====================
  console.log("═".repeat(60));
  console.log("3️⃣  UPDATING TokenFactory");
  console.log("═".repeat(60));

  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = TokenFactory.attach(EXISTING_FACTORY);

  console.log(`📍 TokenFactory Address: ${EXISTING_FACTORY}`);
  console.log(`🔄 Setting new MemeToken template: ${memeTokenAddress}\n`);

  try {
    const setTemplateTx = await tokenFactory.setMemeTokenTemplate(memeTokenAddress, { gasLimit: 500000 });
    const receipt = await setTemplateTx.wait();
    
    console.log(`✅ Template updated successfully`);
    console.log(`   TX Hash: ${setTemplateTx.hash}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}\n`);
  } catch (error) {
    console.error(`❌ Failed to update template: ${error.message}`);
    console.log(`   ⚠️  Make sure you're the TokenFactory owner!\n`);
  }

  // ==================== 4. Summary ====================
  console.log("═".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("═".repeat(60));
  console.log(`\n✅ MemeToken Template:   ${memeTokenAddress}`);
  console.log(`✅ LiquidityAdder:       ${liquidityAdderAddress}`);
  console.log(`✅ TokenFactory:         ${EXISTING_FACTORY}`);
  console.log(`\n⚙️  NEXT STEPS:\n`);
  console.log(`1. Verify MemeToken on BSCScan:`);
  console.log(`   npx hardhat verify --network bscTestnet ${memeTokenAddress} "Meme Token Template" "MEME" "1000000" "${PANCAKE_ROUTER}"\n`);
  
  console.log(`2. Verify LiquidityAdder on BSCScan:`);
  console.log(`   npx hardhat verify --network bscTestnet ${liquidityAdderAddress} "${PANCAKE_ROUTER}" "${ethers.formatUnits(minTokenAmount, 18)}" "${ethers.formatUnits(minEthAmount, 18)}" "${platformFee}" "${PLATFORM_COMMISSION_WALLET}"\n`);

  console.log(`3. Platform wallet MUST approve LiquidityAdder:`);
  console.log(`   - Token address (from token creation)`);
  console.log(`   - LiquidityAdder: ${liquidityAdderAddress}`);
  console.log(`   - Amount to approve (platform has all tokens initially)\n`);

  console.log(`4. When user wants to add LP:`);
  console.log(`   - Call LiquidityAdder.addLiquidityFrom(...)`);
  console.log(`   - Only owner (platform) can call this function\n`);

  // ==================== 5. Save addresses ====================
  const fs = require("fs");
  const deployment = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    memeTokenTemplate: memeTokenAddress,
    liquidityAdder: liquidityAdderAddress,
    tokenFactory: EXISTING_FACTORY,
    pancakeRouter: PANCAKE_ROUTER,
    platformWallet: PLATFORM_COMMISSION_WALLET
  };

  const deploymentPath = `${__dirname}/../deployments/${hre.network.name}-${Date.now()}.json`;
  const deploymentDir = `${__dirname}/../deployments`;
  
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`💾 Deployment saved to: ${deploymentPath}\n`);

  console.log("═".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("═".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
