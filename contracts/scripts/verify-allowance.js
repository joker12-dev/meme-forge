const { ethers } = require('ethers');

const tokenAddress = '0x0c521d5f3439c6f8b126cac0d99e855229e257ef';
const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

const TOKEN_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

async function check() {
  try {
    console.log('=== Token Allowance Status ===');
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
    
    const balance = await token.balanceOf(platformWallet);
    console.log('Platform wallet balance:', ethers.formatUnits(balance, 18), 'tokens');
    
    const allowance = await token.allowance(platformWallet, liquidityAdderAddress);
    console.log('Allowance to LiquidityAdder:', ethers.formatUnits(allowance, 18));
    
    if (allowance > 0n) {
      console.log('✅ Approval exists');
    } else {
      console.log('❌ NO APPROVAL');
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

check();
