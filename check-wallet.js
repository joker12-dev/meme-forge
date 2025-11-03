const { ethers } = require('ethers');

const privateKey = '0x5f3adc0f01d760d43f75d11cb22dbe99acd8242c140eae3437fb6636f75fd780';
const wallet = new ethers.Wallet(privateKey);

console.log('Private Key belongs to:', wallet.address);
console.log('\nExpected Platform Wallet: 0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C');

if (wallet.address.toLowerCase() === '0x4169b7b19fb2228a5eaae84a43e42afdce15741c') {
  console.log('\n✅ MATCH! This PRIVATE_KEY belongs to platform wallet!');
} else {
  console.log('\n❌ Different wallet');
}
