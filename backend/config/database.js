const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: false
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected');
    console.log(`📊 Database: ${sequelize.config.database}`);
    
    // Tables should already be created by init-db.js
    // Don't sync here to avoid schema conflicts
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('✅ PostgreSQL connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing PostgreSQL connection:', error);
    process.exit(1);
  }
});

module.exports = { connectDB, sequelize };