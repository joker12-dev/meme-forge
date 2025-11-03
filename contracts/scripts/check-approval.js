const ethers = require('ethers');

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-b.binance.org:8545');

async function checkApproval() {
  const tokenAddress = '0x5A68907c1E7A9273Dbf6dc89Fc31Aa94949C1283'; // Test token created earlier
  const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
  const liquidityAdder = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';

  const ERC20_ABI = ['function allowance(address owner, address spender) view returns (uint256)'];
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  try {
    const allowance = await tokenContract.allowance(platformWallet, liquidityAdder);
    console.log('✅ Token:', tokenAddress);
    console.log('✅ Platform Wallet:', platformWallet);
    console.log('✅ LiquidityAdder:', liquidityAdder);
    console.log('💰 Current Allowance:', ethers.formatEther(allowance), 'tokens (or', allowance.toString(), 'wei)');
    
    if (allowance > 0n) {
      console.log('✅ APPROVAL IS SET!');
    } else {
      console.log('❌ NO APPROVAL - allowance is 0');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkApproval();
