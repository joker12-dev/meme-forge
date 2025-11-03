const { ethers } = require('ethers');

const testTokenAddress = '0x0c521d5f3439c6f8b126cac0d99e855229e257ef';
const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

async function main() {
  console.log('\n📋 Token Analysis\n');
  
  const token = new ethers.Contract(testTokenAddress, ERC20_ABI, provider);
  
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const platformBalance = await token.balanceOf(platformWallet);
  const liquidityAdderBalance = await token.balanceOf(liquidityAdderAddress);
  const allowance = await token.allowance(platformWallet, liquidityAdderAddress);
  
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
  console.log(`Platform Wallet Balance: ${ethers.formatUnits(platformBalance, decimals)}`);
  console.log(`LiquidityAdder Balance: ${ethers.formatUnits(liquidityAdderBalance, decimals)}`);
  console.log(`Allowance (Platform -> LiquidityAdder): ${ethers.formatUnits(allowance, decimals)}`);
  
  // Check if tokens were actually transferred
  const totalInPlatform = ethers.formatUnits(platformBalance, decimals);
  const expectedAfterLP = 100000 - 30000; // Should be 70,000
  
  console.log(`\n=== ANALYSIS ===`);
  console.log(`Expected platform balance after 30k LP: ${expectedAfterLP}`);
  console.log(`Actual platform balance: ${totalInPlatform}`);
  
  if (parseFloat(totalInPlatform) === expectedAfterLP) {
    console.log('✅ Tokens WERE transferred correctly!');
  } else if (parseFloat(totalInPlatform) === 100000) {
    console.log('❌ Tokens NOT transferred (still 100k)');
  } else {
    console.log('⚠️  Unexpected balance');
  }
}

main().catch(e => console.error(e));
