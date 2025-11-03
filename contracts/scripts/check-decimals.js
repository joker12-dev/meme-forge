const { ethers } = require('ethers');

const tokenAddress = '0x0c521d5f3439c6f8b126cac0d99e855229e257ef';
const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

const ERC20_ABI = [
  'function decimals() view returns (uint8)'
];

async function main() {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await token.decimals();
  
  console.log(`\nToken address: ${tokenAddress}`);
  console.log(`Token decimals: ${decimals}`);
  console.log(`\nThis means the token has ${decimals} decimals.`);
  
  // If we sent parseUnits("100000", 18)
  const sentToContract = ethers.parseUnits("100000", 18);
  console.log(`\nIf we sent parseUnits("100000", 18):`);
  console.log(`Value in wei: ${sentToContract.toString()}`);
  console.log(`Value with ${decimals} decimals: ${ethers.formatUnits(sentToContract, decimals)}`);
  
  // What if decimals was supposed to be something else?
  console.log(`\n🔍 Testing other decimal values:`);
  for (let d = 0; d <= 20; d++) {
    const formatted = ethers.formatUnits(sentToContract, d);
    if (parseFloat(formatted) === 100000) {
      console.log(`✅ MATCH FOUND: decimals=${d} gives 100000`);
    }
  }
}

main().catch(e => console.error(e));
