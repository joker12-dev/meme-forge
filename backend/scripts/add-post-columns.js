#!/usr/bin/env node
/**
 * Script to add missing columns to Posts table
 */

require('dotenv').config({ path: __dirname + '/../../.env' });
const { sequelize } = require('../config/database');

const addColumns = async () => {
  try {
    console.log('🔧 Adding missing columns to Posts table...');
    
    // Add columns one by one
    await sequelize.query(`ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "website" VARCHAR(255)`);
    console.log('✅ Added website column');
    
    await sequelize.query(`ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "twitter" VARCHAR(255)`);
    console.log('✅ Added twitter column');
    
    await sequelize.query(`ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "telegram" VARCHAR(255)`);
    console.log('✅ Added telegram column');
    
    await sequelize.query(`ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "discord" VARCHAR(255)`);
    console.log('✅ Added discord column');
    
    console.log('✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    process.exit(1);
  }
};

addColumns();
