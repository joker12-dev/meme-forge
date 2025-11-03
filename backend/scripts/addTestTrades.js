require('dotenv').config({ path: __dirname + '/../.env' });
const { connectDB } = require('../config/database');
const { sequelize } = require('../models');

async function addTestTrades() {
  await connectDB();
  const Trade = require('../models/Trade');
  const Token = require('../models/Token');

  const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const user = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  // Requested trade sequence: 2 BUY, 4 SELL, 3 BUY, 3 SELL
  const tradeSequence = [
    'BUY', 'BUY',
    'SELL', 'SELL', 'SELL', 'SELL',
    'BUY', 'BUY', 'BUY',
    'SELL', 'SELL', 'SELL'
  ];

  const now = Date.now();
  const minute = 60 * 1000;
  for (let i = 0; i < tradeSequence.length; i++) {
    const type = tradeSequence[i];
    const amount = (Math.random() * 10 + 1).toFixed(8);
    const value = (Math.random() * 100 + 10).toFixed(8);
    const price = (Math.random() * 100 + 1).toFixed(8);
    const txHash = '0xmocktxhash' + Math.floor(Math.random() * 1000000);
    // 12. trade en üstte gözüksün: en yeni timestamp ona ait olacak
    const timestamp = new Date(now - minute * (tradeSequence.length - i - 1));

    await Trade.create({
      tokenAddress,
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      type,
      amount,
      value,
      price,
      baseCurrency: 'BNB',
      user,
      txHash,
      blockNumber: 123456,
      gasUsed: 21000,
      gasPrice: '5000000000',
      network: 'BSC',
      chainId: 56,
      status: 'CONFIRMED',
      confirmations: 0,
      slippage: '0.00',
      fee: '0.00000000',
      router: 'PancakeSwap',
      timestamp
    });
    console.log(`Trade ${i+1} eklendi: ${type} - ${amount} - ${value} - ${timestamp.toISOString()}`);
  }
  console.log('✅ 12 adet trade başarıyla eklendi!');
  process.exit(0);
}

addTestTrades();
