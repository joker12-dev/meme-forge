const { ethers } = require('ethers');

// Function selector: 0x166adf37
// This is addLiquidityFrom

const data = "0x166adf37000000000000000000000000972511e850ad31a376dd80d02cb7ca0e499d1fab0000000000000000000000004169b7b19fb2228a5eaae84a43e42afdce15741c00000000000000000000000000000000000000000000065a4da25d3016c000000000000000000000000000008e4ccfc3429d77524470351f4cfe20ef0950eee8";

const ABI = [
  "function addLiquidityFrom(address token, address from, uint256 tokenAmount, address recipient) payable"
];

const iface = new ethers.Interface(ABI);

// Parse the data
try {
  // Remove 0x prefix and get just the params (after function selector)
  const params = data.slice(10); // Skip 0x + 8 char selector
  
  console.log('Decoding addLiquidityFrom call:');
  console.log('Function selector: 0x166adf37');
  console.log('\nParameters:');
  
  // Each parameter is 32 bytes (64 hex chars)
  const token = '0x' + params.slice(0, 64).slice(-40);
  const from = '0x' + params.slice(64, 128).slice(-40);
  const tokenAmount = BigInt('0x' + params.slice(128, 192));
  const recipient = '0x' + params.slice(192, 256).slice(-40);
  
  console.log('token:', token);
  console.log('from:', from);
  console.log('tokenAmount (raw):', tokenAmount.toString());
  console.log('tokenAmount (formatted 18 decimals):', ethers.formatUnits(tokenAmount, 18));
  console.log('recipient:', recipient);
  
  console.log('\n🔍 Analysis:');
  console.log('- Token: 0x972511e8... (NEW test token ✅)');
  console.log('- From: 0x4169B7B1... (Platform wallet ✅)');
  console.log('- TokenAmount:', ethers.formatUnits(tokenAmount, 18), 'tokens (30,000 ✅)');
  console.log('- Recipient: 0x8e4cCfC3... (User wallet ✅)');
  
  console.log('\n❓ Why is it failing?');
  console.log('Possible reasons:');
  console.log('1. Platform wallet balance < 30,000 tokens?');
  console.log('2. Platform wallet allowance to LiquidityAdder < 30,000?');
  console.log('3. LiquidityAdder contract has a require() that fails?');
  console.log('4. Router.addLiquidityETH() fails?');
  
} catch(e) {
  console.error('Error:', e.message);
}
