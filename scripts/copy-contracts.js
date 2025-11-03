const fs = require('fs');
const path = require('path');

// Paths
const contractsDir = path.join(__dirname, '../contracts/artifacts/contracts');
const frontendDir = path.join(__dirname, '../frontend/src/contracts');

// Contract files to copy
const contracts = [
  'TokenFactory.sol/TokenFactory.json',
  'MemeToken.sol/MemeToken.json',
  'LiquidityAdder.sol/LiquidityAdder.json'
];

// Create frontend contracts directory if it doesn't exist
if (!fs.existsSync(frontendDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
  console.log('✅ Created frontend contracts directory');
}

// Copy contract ABIs
contracts.forEach(contractPath => {
  const sourcePath = path.join(contractsDir, contractPath);
  const contractName = path.basename(contractPath);
  const destPath = path.join(frontendDir, contractName);
  
  try {
    if (fs.existsSync(sourcePath)) {
      const contractJson = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      
      // Only keep ABI and contract name (reduce file size)
      const minimalJson = {
        contractName: contractJson.contractName,
        abi: contractJson.abi,
        bytecode: contractJson.bytecode // Include for deployment if needed
      };
      
      fs.writeFileSync(destPath, JSON.stringify(minimalJson, null, 2));
      console.log(`✅ Copied ${contractName}`);
    } else {
      console.warn(`⚠️  Contract not found: ${sourcePath}`);
      console.log('   Run: cd contracts && npx hardhat compile');
    }
  } catch (error) {
    console.error(`❌ Error copying ${contractName}:`, error.message);
  }
});

console.log('\n🎉 Contract ABIs copied successfully!');
console.log('📁 Location:', frontendDir);
