const ethers = require('ethers');

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-b.binance.org:8545');

async function checkTokenBalance() {
  const tokenAddress = '0x5A68907c1E7A9273Dbf6dc89Fc31Aa94949C1283'; // Token you created
  const platformWallet = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
  const liquidityAdder = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';

  const ERC20_ABI = [
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
  ];

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  try {
    console.log('🔍 Token:', tokenAddress);
    console.log('💼 Platform Wallet:', platformWallet);
    console.log('🌊 LiquidityAdder:', liquidityAdder);
    console.log('---');

    const decimals = await tokenContract.decimals();
    const totalSupply = await tokenContract.totalSupply();
    const platformBalance = await tokenContract.balanceOf(platformWallet);
    const allowance = await tokenContract.allowance(platformWallet, liquidityAdder);

    console.log('📊 Token Decimals:', decimals);
    console.log('📊 Total Supply:', ethers.formatUnits(totalSupply, decimals), 'tokens');
    console.log('💰 Platform Wallet Balance:', ethers.formatUnits(platformBalance, decimals), 'tokens');
    console.log('✅ Platform → LiquidityAdder Allowance:', ethers.formatUnits(allowance, decimals), 'tokens');

    if (allowance > 0n) {
      console.log('✅ APPROVAL IS SET - LP can transfer tokens from platform wallet');
    } else {
      console.log('❌ NO APPROVAL - LP cannot transfer tokens from platform wallet');
    }

    if (platformBalance > 0n) {
      console.log('✅ Platform wallet HAS tokens');
    } else {
      console.log('❌ Platform wallet EMPTY - no tokens!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTokenBalance();
