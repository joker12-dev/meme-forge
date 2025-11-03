const { ethers } = require('ethers');
require('dotenv').config({ path: '../.env' });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const token = process.env.TEST_TOKEN || '0x972511e850ad31a376dd80d02cb7ca0e499d1fab';
const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
const liquidityAdder = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not in .env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
];

async function approveToken() {
  console.log('\n🔐 Approving Token for LiquidityAdder\n');
  console.log('Token:', token);
  console.log('Platform Wallet:', platformWallet);
  console.log('LiquidityAdder:', liquidityAdder);
  console.log('Signer:', signer.address);
  
  // Kontrol: Bu private key platform wallet mı?
  if (signer.address.toLowerCase() !== platformWallet.toLowerCase()) {
    console.error(`\n❌ Error: Private key belongs to ${signer.address}`);
    console.error(`But platform wallet is ${platformWallet}`);
    console.error('\nYou need the PRIVATE KEY of the platform wallet!');
    process.exit(1);
  }
  
  const tokenContract = new ethers.Contract(token, ERC20_ABI, signer);
  
  // Mevcut bakiye ve onay kontrol et
  const balance = await tokenContract.balanceOf(platformWallet);
  const currentAllowance = await tokenContract.allowance(platformWallet, liquidityAdder);
  const decimals = await tokenContract.decimals();
  
  console.log(`\n📊 Current State:`);
  console.log(`Platform Balance: ${ethers.formatUnits(balance, decimals)} tokens`);
  console.log(`Current Allowance to LiquidityAdder: ${ethers.formatUnits(currentAllowance, decimals)}`);
  
  if (currentAllowance > 0n) {
    console.log('✅ Already approved!');
    process.exit(0);
  }
  
  // Approval yap
  console.log('\n⏳ Approving...');
  const tx = await tokenContract.approve(liquidityAdder, ethers.MaxUint256);
  console.log(`📤 TX Hash: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Approved!`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  
  // Doğrula
  const newAllowance = await tokenContract.allowance(platformWallet, liquidityAdder);
  console.log(`\n✅ New Allowance: ${ethers.formatUnits(newAllowance, decimals)}`);
}

approveToken().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
