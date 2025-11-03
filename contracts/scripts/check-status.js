const { ethers } = require("hardhat");

async function main() {
  console.log("📊 BSC Testnet Kontrat Durumu Raporu\n");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n💰 Cüzdan Bilgileri:");
  console.log(`   Adres: ${deployer.address}`);
  console.log(`   Bakiye: ${ethers.formatEther(balance)} tBNB`);

  const contracts = {
    "MemeToken Template": "0x36c5970074ef5fabAd43fEF259eE2F27F360e161",
    "TokenFactory": "0xE92b066F66C7225fa508dffD461cD62Ed4b767FC",
    "LiquidityAdder": "0x803742a13E0Ff54Dc2c50907182229743ec743aC"
  };

  console.log("\n📋 Deploy Edilen Kontratlar:");
  console.log("=".repeat(60));

  for (const [name, address] of Object.entries(contracts)) {
    const code = await ethers.provider.getCode(address);
    const isDeployed = code !== "0x";
    console.log(`\n✅ ${name}`);
    console.log(`   Adres: ${address}`);
    console.log(`   Durum: ${isDeployed ? "✅ Deploy edildi" : "❌ Deploy edilmedi"}`);
    console.log(`   BSCScan: https://testnet.bscscan.com/address/${address}`);
  }

  // TokenFactory bilgileri
  console.log("\n🏭 TokenFactory Detayları:");
  console.log("=".repeat(60));
  
  try {
    const factory = await ethers.getContractAt(
      "TokenFactory", 
      contracts["TokenFactory"]
    );

    const basicConfig = await factory.getTierConfig("basic");
    const standardConfig = await factory.getTierConfig("standard");
    const premiumConfig = await factory.getTierConfig("premium");

    console.log("\n💎 Tier Ücretleri:");
    console.log(`   Basic: ${ethers.formatEther(basicConfig.fee)} tBNB`);
    console.log(`   Standard: ${ethers.formatEther(standardConfig.fee)} tBNB`);
    console.log(`   Premium: ${ethers.formatEther(premiumConfig.fee)} tBNB`);

    console.log("\n📊 Tax Oranları:");
    console.log(`   Basic: Marketing ${basicConfig.defaultMarketingTax}%, Liquidity ${basicConfig.defaultLiquidityTax}%`);
    console.log(`   Standard: Marketing ${standardConfig.defaultMarketingTax}%, Liquidity ${standardConfig.defaultLiquidityTax}%`);
    console.log(`   Premium: Marketing ${premiumConfig.defaultMarketingTax}%, Liquidity ${premiumConfig.defaultLiquidityTax}%`);

    const allTokens = await factory.getAllTokens();
    console.log(`\n🎫 Oluşturulan Token Sayısı: ${allTokens.length}`);

  } catch (error) {
    console.log("   ⚠️ Factory bilgileri alınamadı:", error.message);
  }

  // Bakiye analizi
  console.log("\n💡 Yapabilecekleriniz:");
  console.log("=".repeat(60));
  const balanceNum = parseFloat(ethers.formatEther(balance));
  console.log(`   Basic Token (0.001 tBNB): ${Math.floor(balanceNum / 0.001)} adet`);
  console.log(`   Standard Token (0.002 tBNB): ${Math.floor(balanceNum / 0.002)} adet`);
  console.log(`   Premium Token (0.003 tBNB): ${Math.floor(balanceNum / 0.003)} adet`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Rapor tamamlandı!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
