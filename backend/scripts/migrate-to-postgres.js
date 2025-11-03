const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const oldMongoUri = process.env.MONGODB_URI;
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || localhost,
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'meme_token'
});

async function migrateData() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(oldMongoUri);
    console.log('✅ Connected to MongoDB');

    // PostgreSQL bağlantısı
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Token verilerini taşı
    const tokens = await mongoose.model('Token').find();
    for (const token of tokens) {
      await sequelize.models.Token.create(token.toObject());
    }
    console.log(`✅ Migrated ${tokens.length} tokens`);

    // Trade verilerini taşı
    const trades = await mongoose.model('Trade').find();
    for (const trade of trades) {
      await sequelize.models.Trade.create(trade.toObject());
    }
    console.log(`✅ Migrated ${trades.length} trades`);

    // User verilerini taşı
    const users = await mongoose.model('User').find();
    for (const user of users) {
      await sequelize.models.User.create(user.toObject());
    }
    console.log(`✅ Migrated ${users.length} users`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateData();