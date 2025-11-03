const { sequelize } = require('./config/database');
const User = require('./models/User');

async function checkBadges() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Database schema'sını kontrol et
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('Users');
    
    console.log('\n📊 Users table columns:');
    Object.keys(columns).forEach(col => {
      console.log(`  - ${col}: ${columns[col].type}`);
    });

    if (columns.badges) {
      console.log('\n✅ badges column EXISTS');
      console.log('   Type:', columns.badges.type);
    } else {
      console.log('\n❌ badges column MISSING!');
      console.log('   Creating migration...');
    }

    // Bir user bul ve badges'ini kontrol et
    const user = await User.findOne({ limit: 1 });
    if (user) {
      console.log('\n📝 Sample User:');
      console.log('   ID:', user.id);
      console.log('   Username:', user.username);
      console.log('   Badges:', user.badges);
      console.log('   Badges type:', typeof user.badges);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBadges();
