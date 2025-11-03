/**
 * Approve LiquidityAdder Script
 * 
 * Platform wallet must approve LiquidityAdder to pull tokens
 * This is necessary before addLiquidityFrom() can be called
 * 
 * Usage: npx hardhat run scripts/approve-liquidity-adder.js --network bscTestnet
 *        Set TOKEN_ADDRESS in .env or pass as argument
 */

const hre = require("hardhat");
const ethers = require("ethers");
require("dotenv").config();

async function main() {
  console.log("\n🔐 Platform Wallet Approval for LiquidityAdder\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`📍 Signer: ${signer.address}`);
  console.log(`🔌 Network: ${hre.network.name}\n`);

  // Get addresses from environment
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || process.argv[2];
  const LIQUIDITY_ADDER = process.env.LIQUIDITY_ADDER || "0xE647B02b4456bB26B55F87F001b9a96D4d48eBf1";
  const AMOUNT_TO_APPROVE = ethers.parseUnits("999999999", 18); // Approve large amount

  if (!TOKEN_ADDRESS) {
    console.error("❌ TOKEN_ADDRESS not provided!");
    console.log("   Usage: npx hardhat run scripts/approve-liquidity-adder.js --network bscTestnet");
    console.log("   Set TOKEN_ADDRESS in .env or pass as argument\n");
    process.exit(1);
  }

  console.log(`📋 Configuration:`);
  console.log(`   Token Address: ${TOKEN_ADDRESS}`);
  console.log(`   LiquidityAdder: ${LIQUIDITY_ADDER}`);
  console.log(`   Amount to Approve: ${ethers.formatUnits(AMOUNT_TO_APPROVE, 18)}\n`);

  // ==================== Approve ====================
  console.log("═".repeat(60));
  console.log("🔄 APPROVING LiquidityAdder");
  console.log("═".repeat(60) + "\n");

  try {
    // Get token contract
    const tokenABI = [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function allowance(address owner, address spender) public view returns (uint256)",
      "function balanceOf(address account) public view returns (uint256)",
      "function name() public view returns (string)"
    ];

    const token = new ethers.Contract(TOKEN_ADDRESS, tokenABI, signer);

    // Get token info
    const tokenName = await token.name().catch(() => "Token");
    const balance = await token.balanceOf(signer.address);
    const currentAllowance = await token.allowance(signer.address, LIQUIDITY_ADDER);

    console.log(`📊 Token Info:`);
    console.log(`   Name: ${tokenName}`);
    console.log(`   Platform Balance: ${ethers.formatUnits(balance, 18)}`);
    console.log(`   Current Allowance: ${ethers.formatUnits(currentAllowance, 18)}\n`);

    if (balance === 0n) {
      console.warn("⚠️  WARNING: Platform wallet has 0 tokens!");
      console.warn("   Token supply should have been minted to platform wallet.\n");
    }

    // Approve
    console.log(`⏳ Sending approval transaction...`);
    const approveTx = await token.approve(LIQUIDITY_ADDER, AMOUNT_TO_APPROVE, { gasLimit: 100000 });
    console.log(`   TX Hash: ${approveTx.hash}`);

    console.log(`⏳ Waiting for confirmation...`);
    const receipt = await approveTx.wait();
    
    console.log(`✅ Approval successful!`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}\n`);

    // Verify
    const newAllowance = await token.allowance(signer.address, LIQUIDITY_ADDER);
    console.log(`✅ Verified Allowance: ${ethers.formatUnits(newAllowance, 18)}\n`);

  } catch (error) {
    console.error(`❌ Approval failed: ${error.message}\n`);
    process.exit(1);
  }

  // ==================== Documentation ====================
  console.log("═".repeat(60));
  console.log("📚 LP FLOW DOCUMENTATION");
  console.log("═".repeat(60) + "\n");

  console.log("🔄 NEW TOKEN CREATION FLOW:\n");
  console.log("1️⃣  User creates token via frontend");
  console.log("   → TokenFactory.createToken() called");
  console.log("   → MemeToken deployed with initial supply minted to PLATFORM WALLET\n");

  console.log("2️⃣  Platform wallet must approve LiquidityAdder (THIS STEP)");
  console.log("   → token.approve(liquidityAdderAddress, totalSupply)");
  console.log("   → Can be done once or for each token\n");

  console.log("3️⃣  User or admin calls addLiquidityFrom()");
  console.log("   → LiquidityAdder.addLiquidityFrom(token, from, amount, recipient)");
  console.log("   → Pulls approved tokens from platform wallet");
  console.log("   → Adds liquidity to PancakeSwap");
  console.log("   → Sends LP tokens to creator (recipient)\n");

  console.log("4️⃣  Creator receives LP tokens");
  console.log("   → LP tokens locked in LPLocker contract");
  console.log("   → Creator can view/manage LP position\n");

  console.log("═".repeat(60));
  console.log("💡 ENDPOINT OPTION (Optional Backend)");
  console.log("═".repeat(60) + "\n");

  console.log("POST /api/liquidity/add-from");
  console.log("{");
  console.log('  "tokenAddress": "0x...",');
  console.log('  "tokenAmount": "1000000000000000000",  // 1 token with 18 decimals');
  console.log('  "ethAmount": "1000000000000000000",    // 1 ETH');
  console.log('  "creatorAddress": "0x..."');
  console.log("}");
  console.log("\nBackend would:");
  console.log("  1. Validate inputs");
  console.log("  2. Sign transaction with PLATFORM_PRIVATE_KEY");
  console.log("  3. Call LiquidityAdder.addLiquidityFrom()");
  console.log("  4. Return TX hash to frontend\n");

  console.log("═".repeat(60));
  console.log("🎉 Setup Complete!");
  console.log("═".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
