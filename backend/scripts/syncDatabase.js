require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Token = require('../models/Token');
const Trade = require('../models/Trade');
const PriceHistory = require('../models/PriceHistory');
const ContactMessage = require('../models/ContactMessage');
const Admin = require('../models/Admin');
const SiteSettings = require('../models/SiteSettings');
const ActivityLog = require('../models/ActivityLog');
const TokenHype = require('../models/TokenHype');
const Campaign = require('../models/Campaign');

const syncDatabase = async () => {
  console.log('🔄 Starting database synchronization...\n');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    // Sync all models with force: false (won't drop existing tables)
    console.log('📋 Models to sync:');
    console.log('  - Users');
    console.log('  - Tokens');
    console.log('  - Trades');
    console.log('  - PriceHistory');
    console.log('  - ContactMessages');
    console.log('  - Admins');
    console.log('  - SiteSettings');
    console.log('  - ActivityLogs');
    console.log('  - TokenHypes');
    console.log('  - Campaigns\n');
    
    // Sync in order (dependencies first)
    await User.sync({ alter: true });
    console.log('✅ Users table synced');
    
    await Token.sync({ alter: true });
    console.log('✅ Tokens table synced');
    
    await Trade.sync({ alter: true });
    console.log('✅ Trades table synced');
    
    await PriceHistory.sync({ alter: true });
    console.log('✅ PriceHistory table synced');
    
    await ContactMessage.sync({ alter: true });
    console.log('✅ ContactMessages table synced');
    
    await Admin.sync({ alter: true });
    console.log('✅ Admins table synced');
    
    await SiteSettings.sync({ alter: true });
    console.log('✅ SiteSettings table synced');
    
    await ActivityLog.sync({ alter: true });
    console.log('✅ ActivityLogs table synced');
    
    await TokenHype.sync({ alter: true });
    console.log('✅ TokenHypes table synced');
    
    await Campaign.sync({ alter: true });
    console.log('✅ Campaigns table synced');
    
    console.log('\n✅ All tables synchronized successfully!');
    console.log('\n📊 Database structure is ready.');
    
    // Show table counts
    console.log('\n📈 Current data:');
    const userCount = await User.count();
    const tokenCount = await Token.count();
    const tradeCount = await Trade.count();
    const campaignCount = await Campaign.count();
    
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Tokens: ${tokenCount}`);
    console.log(`  - Trades: ${tradeCount}`);
    console.log(`  - Campaigns: ${campaignCount}`);
    
    console.log('\n✨ Database sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  syncDatabase();
}

module.exports = syncDatabase;
