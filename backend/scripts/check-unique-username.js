require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const User = require('../models/User');

const checkAndApply = async () => {
  try {
    console.log('🔍 Checking for duplicate usernames...\n');
    
    await sequelize.authenticate();
    
    // Check for duplicates
    const [duplicates] = await sequelize.query(
      `SELECT username, COUNT(*) as count 
       FROM "Users" 
       WHERE username IS NOT NULL 
       GROUP BY username 
       HAVING COUNT(*) > 1`
    );
    
    if (duplicates && duplicates.length > 0) {
      console.log('⚠️  Found duplicate usernames:');
      duplicates.forEach(row => {
        console.log(`   - "${row.username}": ${row.count} users`);
      });
      console.log('\n❌ Cannot add unique constraint while duplicates exist.');
      console.log('💡 Please manually clean up duplicate usernames first.\n');
    } else {
      console.log('✅ No duplicate usernames found.\n');
      console.log('🔄 Syncing User model to apply unique constraint...\n');
      
      await User.sync({ alter: true });
      console.log('✅ Username field now has UNIQUE constraint!\n');
      
      // Verify the constraint
      const [constraints] = await sequelize.query(
        `SELECT constraint_name 
         FROM information_schema.key_column_usage 
         WHERE table_name = 'Users' 
         AND column_name = 'username' 
         AND constraint_name LIKE '%unique%' 
         OR constraint_name LIKE '%unique%' 
         AND table_name = 'Users'`
      );
      
      if (constraints && constraints.length > 0) {
        console.log('✅ Unique constraint verified on "username" column!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

checkAndApply();
