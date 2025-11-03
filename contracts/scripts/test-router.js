const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing MockPancakeRouter...\n");

  const routerAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const router = await ethers.getContractAt("MockPancakeRouter", routerAddress);
  
  console.log("✅ Router loaded");
  
  // Check factory
  const factoryAddress = await router.factory();
  console.log("📄 Factory address:", factoryAddress);
  
  // Load factory
  const factory = await ethers.getContractAt("MockPancakeFactory", factoryAddress);
  console.log("✅ Factory loaded");
  
  // Try to create a pair
  console.log("\n🚀 Creating pair...");
  const token1 = "0x1111111111111111111111111111111111111111";
  const token2 = "0x2222222222222222222222222222222222222222";
  
  const tx = await factory.createPair(token1, token2);
  console.log("⏳ Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  
  // Check pair
  const pairAddress = await factory.getPair(token1, token2);
  console.log("🎉 Pair created at:", pairAddress);
  
  // Check WETH
  const weth = await router.WETH();
  console.log("💰 WETH address:", weth);
}

main().catch(console.error);
