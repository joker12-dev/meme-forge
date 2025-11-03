const { ethers } = require('ethers');

const tokenAddress = '0x0c521d5f3439c6f8b126cac0d99e855229e257ef';
const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';

const privateKey = '0x5f3adc0f01d760d43f75d11cb22dbe99acd8242c140eae3437fb6636f75fd780';
const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
const signer = new ethers.Wallet(privateKey, provider);

const TOKEN_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

async function approveToken() {
  try {
    console.log('=== Manual Token Approval ===');
    console.log('Token:', tokenAddress);
    console.log('Platform Wallet:', platformWallet);
    console.log('LiquidityAdder:', liquidityAdderAddress);
    console.log('Signer:', signer.address);
    
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
    
    // Check balance
    const balance = await token.balanceOf(platformWallet);
    console.log('\n📊 Platform wallet balance:', ethers.formatUnits(balance, 18), 'tokens');
    
    // Check current allowance
    const currentAllowance = await token.allowance(platformWallet, liquidityAdderAddress);
    console.log('📌 Current allowance:', ethers.formatUnits(currentAllowance, 18));
    
    if (currentAllowance > 0n) {
      console.log('✅ Already approved!');
      return;
    }
    
    // Approve max uint256
    console.log('\n⏳ Approving LiquidityAdder for max amount...');
    const approveTx = await token.approve(liquidityAdderAddress, ethers.MaxUint256);
    console.log('📤 Transaction sent:', approveTx.hash);
    
    const receipt = await approveTx.wait();
    console.log('✅ Approved! Receipt:', receipt?.hash);
    
    // Verify approval
    const newAllowance = await token.allowance(platformWallet, liquidityAdderAddress);
    console.log('✅ New allowance:', ethers.formatUnits(newAllowance, 18));
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
}

approveToken();
