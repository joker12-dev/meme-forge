const { ethers } = require('ethers');
require('dotenv').config({ path: '../.env' });

// Test approval fonksiyonu
async function testApproval() {
  const tokenAddress = '0x5a68907c1e7a9273dbf6dc89fc31aa94949c1283'; // Yeni token
  const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
  const platformPrivateKey = process.env.PRIVATE_KEY;
  
  console.log('🔐 Testing Auto-Approval\n');
  console.log('Token:', tokenAddress);
  console.log('LiquidityAdder:', liquidityAdderAddress);
  console.log('Platform Private Key exists:', !!platformPrivateKey);
  
  if (!platformPrivateKey) {
    console.error('❌ PRIVATE_KEY not in .env!');
    process.exit(1);
  }
  
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
  const platformSigner = new ethers.Wallet(platformPrivateKey, provider);
  
  console.log('Platform Wallet:', platformSigner.address);
  
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)', 'function allowance(address owner, address spender) view returns (uint256)'],
    platformSigner
  );
  
  // Check current allowance
  const currentAllowance = await tokenContract.allowance(platformSigner.address, liquidityAdderAddress);
  console.log('Current Allowance:', ethers.formatUnits(currentAllowance, 18));
  
  if (currentAllowance > 0n) {
    console.log('✅ Already approved!');
    return;
  }
  
  // Do approval
  console.log('\n⏳ Approving...');
  const tx = await tokenContract.approve(liquidityAdderAddress, ethers.MaxUint256);
  console.log('TX Hash:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('✅ Approved!');
  
  // Verify
  const newAllowance = await tokenContract.allowance(platformSigner.address, liquidityAdderAddress);
  console.log('New Allowance:', ethers.formatUnits(newAllowance, 18));
}

testApproval().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
