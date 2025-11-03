const { ethers } = require('ethers');

const tokenAddress = '0x0c521d5f3439c6f8b126cac0d99e855229e257ef';
const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function analyzeToken() {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const platformBalance = await token.balanceOf(platformWallet);
  
  console.log('\n📋 Token Analysis:\n');
  console.log(`Address: ${tokenAddress}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply (raw): ${totalSupply.toString()}`);
  console.log(`Total Supply (formatted): ${ethers.formatUnits(totalSupply, decimals)}`);
  console.log(`Platform Balance (raw): ${platformBalance.toString()}`);
  console.log(`Platform Balance (formatted): ${ethers.formatUnits(platformBalance, decimals)}`);
  
  // Reverse calculation
  console.log('\n🔍 Reverse Calculation:');
  console.log(`If decimals=18 and supply raw is: ${totalSupply.toString()}`);
  console.log(`Then formatted would be: ${ethers.formatUnits(totalSupply, 18)}`);
  
  console.log('\nHypothesis check:');
  const supplyStr = totalSupply.toString();
  if (supplyStr.length === 24) {
    console.log('Supply length: 24 chars (100 quintillion range - matches!');
    // Try to see if 100000 was input
    if (supplyStr === '100000000000000000000000') {
      console.log('Exact match: 100000 * 10^18 - means 100000 was input ✅');
    }
  }
}

analyzeToken().catch(e => console.error(e));
