const { sequelize } = require('../config/database');
const { User } = require('../models');

async function addUserManagementFields() {
  try {
    console.log('🔄 Starting: Adding new fields to User table...');
    
    await sequelize.query(`
      -- Status enum type ekle (eğer yoksa)
      DO $$ BEGIN
        CREATE TYPE "enum_Users_status" AS ENUM('active', 'suspended', 'banned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enum type created/exists');

    // Status column
    await sequelize.query(`
      ALTER TABLE "Users"
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS "banReason" TEXT,
      ADD COLUMN IF NOT EXISTS "banExpiresAt" TIMESTAMP;
    `);
    console.log('✅ New columns added: status, banReason, banExpiresAt');

    // Tüm mevcut kullanıcıları active olarak ayarla
    await sequelize.query(`
      UPDATE "Users" SET status = 'active' WHERE status IS NULL;
    `);
    console.log('✅ Existing users set to active');

    console.log('✅ Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addUserManagementFields();
