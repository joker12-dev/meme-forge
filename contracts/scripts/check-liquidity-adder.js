const { ethers } = require('ethers');

const factory = '0x63a8630b51c13513629b13801A55B748f9Ab13b2';
const liquidityAdder = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

const FACTORY_ABI = [
  'function liquidityAdder() external view returns (address)'
];

async function check() {
  try {
    const factoryContract = new ethers.Contract(factory, FACTORY_ABI, provider);
    const storedLiquidityAdder = await factoryContract.liquidityAdder();
    
    console.log('=== Factory Liquidity Adder Check ===');
    console.log('Factory:', factory);
    console.log('Expected LiquidityAdder:', liquidityAdder);
    console.log('Stored in Factory:', storedLiquidityAdder);
    console.log('Match:', storedLiquidityAdder.toLowerCase() === liquidityAdder.toLowerCase() ? '✅ YES' : '❌ NO');
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

check();
