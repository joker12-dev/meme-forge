const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification...\n");

  const contracts = [
    {
      name: "MemeToken",
      address: "0x36c5970074ef5fabAd43fEF259eE2F27F360e161",
      constructorArguments: [
        "Template",
        "TEMP",
        ethers.parseEther("1000000"),
        "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // BSC Testnet Router
      ]
    },
    {
      name: "TokenFactory",
      address: "0xE92b066F66C7225fa508dffD461cD62Ed4b767FC",
      constructorArguments: [
        process.env.PLATFORM_WALLET,
        process.env.DEVELOPMENT_WALLET,
        process.env.MARKETING_WALLET,
        process.env.PLATFORM_COMMISSION_WALLET,
        "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
      ]
    },
    {
      name: "LiquidityAdder",
      address: "0x803742a13E0Ff54Dc2c50907182229743ec743aC",
      constructorArguments: [
        "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
        ethers.parseEther("100"),
        ethers.parseEther("0.001"),
        200,
        process.env.LIQUIDITY_FEE_WALLET
      ]
    }
  ];

  for (const contract of contracts) {
    try {
      console.log(`\n🔄 Verifying ${contract.name}...`);
      console.log(`   Address: ${contract.address}`);
      
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
      });
      
      console.log(`✅ ${contract.name} verified!`);
    } catch (error) {
      if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
        console.log(`✅ ${contract.name} already verified!`);
      } else {
        console.error(`❌ Error verifying ${contract.name}:`, error.message);
      }
    }
    
    // Wait between verifications
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Verification process completed!");
  console.log("=".repeat(60));
  
  console.log("\n🔗 View verified contracts on BSCScan:");
  contracts.forEach(contract => {
    console.log(`  ${contract.name}: https://testnet.bscscan.com/address/${contract.address}#code`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
