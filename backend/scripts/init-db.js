require('dotenv').config({ path: __dirname + "/../.env" });
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/database');
const { sequelize } = require('../models');

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Connect to database FIRST
    await connectDB();
    console.log('✅ Database connected');

    // NOW import models after connection is established
  const User = require('../models/User');
  const Token = require('../models/Token');
  const Trade = require('../models/Trade');
  const PriceHistory = require('../models/PriceHistory');
  const TokenHype = require('../models/TokenHype');
  const Campaign = require('../models/Campaign');
  const Admin = require('../models/Admin');
  const SiteSettings = require('../models/SiteSettings');
  const ActivityLog = require('../models/ActivityLog');
  const Vote = require('../models/Vote');
  const { Post, Comment, PostLike, CommentLike } = require('../models/Post');

  // Sync all models
  await User.sync({ alter: false, force: false });
  console.log('✅ User model synced');

  await Token.sync({ alter: false, force: false });
  console.log('✅ Token model synced');

  await Trade.sync({ alter: false, force: false });
  console.log('✅ Trade model synced');

  await PriceHistory.sync({ alter: false, force: false });
  console.log('✅ PriceHistory model synced');

  await TokenHype.sync({ alter: false, force: false });
  console.log('✅ TokenHype model synced');

  await Campaign.sync({ alter: false, force: false });
  console.log('✅ Campaign model synced');

  await Admin.sync({ alter: false, force: false });
  console.log('✅ Admin model synced');

  await SiteSettings.sync({ alter: false, force: false });
  console.log('✅ SiteSettings model synced');

  await ActivityLog.sync({ alter: false, force: false });
  console.log('✅ ActivityLog model synced');

  await Vote.sync({ alter: false, force: false });
  console.log('✅ Vote model synced');

  // New social models
  await Post.sync({ alter: false, force: false });
  console.log('✅ Post model synced');

  await Comment.sync({ alter: false, force: false });
  console.log('✅ Comment model synced');

  await PostLike.sync({ alter: false, force: false });
  console.log('✅ PostLike model synced');

  await CommentLike.sync({ alter: false, force: false });
  console.log('✅ CommentLike model synced');

  console.log('✅ All models synced');

    // Check if super admin exists
    const existingAdmin = await Admin.findOne({ where: { role: 'super_admin' } });

    if (existingAdmin) {
      console.log('✅ Super admin already exists:', existingAdmin.username);
      
      // Update super admin permissions
      existingAdmin.permissions = {
        manage_admins: true,
        manage_tokens: true,
        manage_users: true,
        manage_trades: true,
        manage_contact: true,
        view_analytics: true,
        manage_settings: true
      };
      await existingAdmin.save();
      console.log('✅ Super admin permissions updated');
    } else {
      // Create super admin
      const hashedPassword = await bcrypt.hash('Admin123!', 10);

      const superAdmin = await Admin.create({
        username: 'admin',
        email: 'admin@fourmeme.com',
        password: hashedPassword,
        role: 'super_admin',
        permissions: {
          manage_admins: true,
          manage_tokens: true,
          manage_users: true,
          manage_trades: true,
          manage_contact: true,
          view_analytics: true,
          manage_settings: true
        },
        status: 'active'
      });

      console.log('✅ Super admin created:', superAdmin.username);
    }

    // Create default site settings
    const defaultSettings = [
      {
        key: 'site_name',
        value: 'Meme Forge',
        type: 'string',
        category: 'general',
        description: 'Site name'
      },
      {
        key: 'site_description',
        value: 'Meme Forge - Create your own token',
        type: 'string',
        category: 'general',
        description: 'Site description'
      },
      {
        key: 'token_creation_enabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        description: 'Is token creation feature enabled?'
      },
      {
        key: 'trading_enabled',
        value: 'true',
        type: 'boolean',
        category: 'features',
        description: 'Is trading feature enabled?'
      },
      {
        key: 'min_token_supply',
        value: '1000000',
        type: 'number',
        category: 'limits',
        description: 'Minimum token supply'
      },
      {
        key: 'max_token_supply',
        value: '1000000000000',
        type: 'number',
        category: 'limits',
        description: 'Maximum token supply'
      },
      {
        key: 'contact_email',
        value: 'contact@fourmeme.com',
        type: 'string',
        category: 'contact',
        description: 'Contact email address'
      }
    ];

    for (const setting of defaultSettings) {
      const existing = await SiteSettings.findOne({ where: { key: setting.key } });
      if (!existing) {
        await SiteSettings.create(setting);
        console.log('✅ Setting created:', setting.key);
      }
    }

    console.log('✅ Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
}

initDatabase();
