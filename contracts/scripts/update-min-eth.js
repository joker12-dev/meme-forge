const hre = require("hardhat");

async function main() {
  const liquidityAdderAddress = "0xAAA098C78157b242E5f9E3F63aAD778c376E29eb";
  
  console.log("Connecting to LiquidityAdder at:", liquidityAdderAddress);
  const LiquidityAdder = await hre.ethers.getContractAt("LiquidityAdder", liquidityAdderAddress);
  
  // Current minEthAmount
  const currentMinEth = await LiquidityAdder.minEthAmount();
  console.log("Current minEthAmount:", hre.ethers.formatEther(currentMinEth), "BNB");
  
  // Set new minEthAmount to 0.001 BNB (1000000000000000 wei)
  const newMinEth = hre.ethers.parseEther("0.001");
  console.log("Setting new minEthAmount to:", hre.ethers.formatEther(newMinEth), "BNB");
  
  const tx = await LiquidityAdder.setMinEthAmount(newMinEth);
  console.log("Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Updated! New minEthAmount:", hre.ethers.formatEther(newMinEth), "BNB");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
