const { ethers } = require('ethers');

const token = '0x26abe3fcf26144fc33262bdedc6169ef3044f336';
const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

// v2 Factory
const factoryV2 = '0xE92b066F66C7225fa508dffD461cD62Ed4b767FC';
// v3 Factory 
const factoryV3 = '0x63a8630b51c13513629b13801A55B748f9Ab13b2';

const FACTORY_ABI = [
  'function getUserTokens(address user) external view returns (address[])',
  'function allTokens() external view returns (address[])'
];

async function checkToken() {
  try {
    // Get token creation tx
    const code = await provider.getCode(token);
    console.log('Token exists:', code.length > 2);
    
    // Check which factory has this token
    const factory2 = new ethers.Contract(factoryV2, FACTORY_ABI, provider);
    const factory3 = new ethers.Contract(factoryV3, FACTORY_ABI, provider);
    
    console.log('\n=== Checking Factories ===');
    console.log('Factory v2 (old):', factoryV2);
    console.log('Factory v3 (new):', factoryV3);
    
    try {
      const allTokensV2 = await factory2.allTokens();
      const foundInV2 = allTokensV2.some(t => t.toLowerCase() === token.toLowerCase());
      console.log('Found in v2:', foundInV2, `(${allTokensV2.length} tokens)`);
    } catch(e) {
      console.log('v2 error:', e.message);
    }
    
    try {
      const allTokensV3 = await factory3.allTokens();
      const foundInV3 = allTokensV3.some(t => t.toLowerCase() === token.toLowerCase());
      console.log('Found in v3:', foundInV3, `(${allTokensV3.length} tokens)`);
    } catch(e) {
      console.log('v3 error:', e.message);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}

checkToken();
