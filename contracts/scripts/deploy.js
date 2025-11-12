const { ethers } = require("hardhat");
const hre = require("hardhat");

async function deploy(contractName, factory, ...args) {
  console.log(`Deploying ${contractName}...`);
  const contract = await factory.deploy(...args);
  console.log(`${contractName} deployment transaction:`, contract.deploymentTransaction().hash);
  console.log(`Waiting for ${contractName} deployment...`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${contractName} deployed to:`, address);
  return contract;
}

async function main() {
  try {
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Get current gas price
  const gasPrice = await ethers.provider.getFeeData();
  console.log("Current gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");

  // Check network and deploy MockPancakeRouter for localhost
  const network = await ethers.provider.getNetwork();
  let pancakeSwapRouter;
  
  if (network.chainId === 31337n) {
    // localhost - deploy mock router
    console.log("Deploying MockPancakeRouter for localhost...");
    const MockRouter = await ethers.getContractFactory("MockPancakeRouter");
    const mockRouter = await MockRouter.deploy();
    await mockRouter.waitForDeployment();
    pancakeSwapRouter = await mockRouter.getAddress();
    console.log("MockPancakeRouter:", pancakeSwapRouter);
  } else {
    // Testnet/Mainnet - use real router
    pancakeSwapRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet Router
  }

  // Deploy MemeToken Template
  console.log("Deploying MemeToken Template...");
  const MemeToken = await ethers.getContractFactory("MemeToken");
  const memeToken = await MemeToken.deploy();
  await memeToken.waitForDeployment();
  const memeTokenAddress = await memeToken.getAddress();
  console.log("MemeToken Template:", memeTokenAddress);

  // Deploy TokenFactory
  console.log("Deploying TokenFactory...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = await TokenFactory.deploy(
    process.env.PLATFORM_WALLET,
    process.env.DEVELOPMENT_WALLET,
    process.env.MARKETING_WALLET,
    process.env.PLATFORM_COMMISSION_WALLET,
    pancakeSwapRouter
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("TokenFactory:", factoryAddress);

  // Set template
  await factory.setMemeTokenTemplate(memeTokenAddress);
  console.log("✅ Template set");

  // Deploy LiquidityAdder
  console.log("Deploying LiquidityAdder...");
  const LiquidityAdder = await ethers.getContractFactory("LiquidityAdder");
  const liquidityAdder = await LiquidityAdder.deploy(
    pancakeSwapRouter,
    ethers.parseEther("100"), // minTokenAmount
    ethers.parseEther("0.0005"), // minEthAmount (0.0005 BNB - lower than 0.001 LP fee)
    150, // platformFee (150 = %1.5 fee)
    process.env.LIQUIDITY_FEE_WALLET
  );
  await liquidityAdder.waitForDeployment();
  const liquidityAdderAddress = await liquidityAdder.getAddress();
  console.log("LiquidityAdder:", liquidityAdderAddress);

  // IMPORTANT: Set LiquidityAdder address in TokenFactory
  console.log("\n⚙️ Setting LiquidityAdder address in TokenFactory...");
  const setLiquidityAdderTx = await factory.setLiquidityAdder(liquidityAdderAddress);
  await setLiquidityAdderTx.wait();
  console.log("✅ LiquidityAdder address set in TokenFactory");

  console.log("Deployment completed!");
  console.log("MemeToken:", memeTokenAddress);
  console.log("TokenFactory:", factoryAddress);
  console.log("LiquidityAdder:", liquidityAdderAddress);

  // Skip verification for localhost
  if (network.chainId === 31337n) {
    console.log("\n⚠️  localhost detected - skipping verification");
    return;
  }

  // Auto-verification for testnet/mainnet
  console.log("\n⏳ Waiting 30 seconds before verification...");
  console.log("(BSCScan needs time to index the contracts)");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Verify contracts
  console.log("\n🔍 Starting contract verification...");
  
  try {
    console.log("\n1️⃣ Verifying MemeToken...");
    await hre.run("verify:verify", {
      address: memeTokenAddress,
      constructorArguments: [],
    });
    console.log("✅ MemeToken verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ MemeToken already verified!");
    } else {
      console.error("❌ Error verifying MemeToken:", error.message);
    }
  }

  try {
    console.log("\n2️⃣ Verifying TokenFactory...");
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [
        process.env.PLATFORM_WALLET,
        process.env.DEVELOPMENT_WALLET,
        process.env.MARKETING_WALLET,
        process.env.PLATFORM_COMMISSION_WALLET,
        pancakeSwapRouter
      ],
    });
    console.log("✅ TokenFactory verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ TokenFactory already verified!");
    } else {
      console.error("❌ Error verifying TokenFactory:", error.message);
    }
  }

  try {
    console.log("\n3️⃣ Verifying LiquidityAdder...");
    await hre.run("verify:verify", {
      address: liquidityAdderAddress,
      constructorArguments: [
        pancakeSwapRouter,
        ethers.parseEther("100"),
        ethers.parseEther("0.01"),
        150,
        process.env.LIQUIDITY_FEE_WALLET
      ],
    });
    console.log("✅ LiquidityAdder verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ LiquidityAdder already verified!");
    } else {
      console.error("❌ Error verifying LiquidityAdder:", error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Verification process completed!");
  console.log("=".repeat(60));
  
  const explorerBase = network.chainId === 97n 
    ? "https://testnet.bscscan.com" 
    : "https://bscscan.com";
  
  console.log("\n🔗 View verified contracts on BSCScan:");
  console.log(`  MemeToken: ${explorerBase}/address/${memeTokenAddress}#code`);
  console.log(`  Factory: ${explorerBase}/address/${factoryAddress}#code`);
  console.log(`  LiquidityAdder: ${explorerBase}/address/${liquidityAdderAddress}#code`);
  
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Run main
main();