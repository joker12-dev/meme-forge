const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/i
    },
    set(value) {
      this.setDataValue('walletAddress', value.toLowerCase());
    }
  },
  // Profile Information
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: {
        args: [3, 50],
        msg: 'Username must be between 3-50 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    },
    set(value) {
      this.setDataValue('email', value ? value.toLowerCase() : null);
    }
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  bio: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: ''
  },
  
  // Social Links
  socialLinks: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  twitter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegram: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discord: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Token & Activity Information
  tokensCreated: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  totalTokensCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Badges & Achievements
  badges: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Admin management
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'banned'),
    defaultValue: 'active',
    comment: 'User status: active, suspended (temporary), banned (permanent)'
  },
  banReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for ban'
  },
  banExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration date for temporary ban'
  },
  
  // Social Metrics
  voteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  trustScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followersList: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Array of wallet addresses following this user'
  },
  followingList: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Array of wallet addresses this user is following'
  },
  followers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  following: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avgRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  successfulLaunches: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Statistics
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      totalTokens: 0,
      followers: 0,
      avgRating: 0,
      successfulLaunches: 0,
      totalVolume: '$0'
    }
  },
  
  // Time Information
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Users',
  timestamps: true,
  indexes: [
    { fields: ['walletAddress'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['status'] },
    { fields: ['createdAt'] },
    { fields: ['followersCount'] },
    { fields: ['isVerified'] },
    { fields: ['lastLogin'] },
    { fields: ['totalTokensCreated'] },
    { fields: ['createdAt', 'followersCount'] }
  ]
});

// Hooks
User.beforeSave(async (user) => {
  user.updatedAt = new Date();
});

// Class methods
User.findOrCreateByAddress = async function(walletAddress) {
  try {
    if (typeof walletAddress !== 'string') {
      throw new Error('Wallet address must be a string');
    }
    
    const normalizedAddress = walletAddress.toLowerCase();
    
    let user = await this.findOne({
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      user = await this.create({
        walletAddress: normalizedAddress,
        username: `user_${normalizedAddress.substring(2, 8)}`
      });
      console.log(`✅ New user created: ${normalizedAddress}`);
    } else {
      user.lastLogin = new Date();
      await user.save();
      console.log(`✅ User found: ${normalizedAddress}`);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error in findOrCreate:', error);
    throw error;
  }
};

User.findByAddress = async function(walletAddress) {
  const user = await this.findOne({
    where: { walletAddress: walletAddress.toLowerCase() }
    // Do not include attributes - return all fields
  });
  console.log('🔍 [findByAddress] User found:', user ? user.id : 'null');
  if (user) {
    console.log('   badges field:', user.badges);
  }
  return user;
};

User.getTopCreators = async function(limit = 10) {
  return await this.findAll({
    order: [['totalTokensCreated', 'DESC']],
    limit: limit,
    attributes: ['walletAddress', 'username', 'totalTokensCreated', 'profileImage']
  });
};

// Instance methods
User.prototype.addToken = async function(tokenAddress) {
  const normalizedAddress = tokenAddress.toLowerCase();
  
  if (!this.tokensCreated.includes(normalizedAddress)) {
    this.tokensCreated = [...(this.tokensCreated || []), normalizedAddress];
    this.totalTokensCreated = this.tokensCreated.length;
  }
  
  return await this.save();
};

User.prototype.calculateBadges = function() {
  const computedBadges = [];
  const tokenCount = this.tokensCreated ? this.tokensCreated.length : 0;
  const trustScore = this.trustScore || 0;
  const avgRating = this.avgRating || 0;
  const votes = this.voteCount || 0;
  const followers = this.followers || 0;
  const successfulLaunches = this.successfulLaunches || 0;

  // 🏆 Top Creator: 10+ tokens created
  if (tokenCount >= 10) computedBadges.push('Top Creator');
  
  // 📅 Early Adopter: joined before 2023
  if (this.createdAt && new Date(this.createdAt).getFullYear() <= 2023) {
    computedBadges.push('Early Adopter');
  }
  
  // 💎 Diamond Hands: 90+ trustScore
  if (trustScore >= 90) computedBadges.push('Diamond Hands');
  
  // ⭐ Verified Creator: 10+ tokens and 4+ rating
  if (tokenCount >= 10 && avgRating >= 4) computedBadges.push('Verified Creator');
  
  // 🚀 Rocket Launcher: 5+ successful tokens
  if (successfulLaunches >= 5) computedBadges.push('Rocket Launcher');
  
  // 👥 Community Leader: 100+ followers
  if (followers >= 100) computedBadges.push('Community Leader');
  
  // ⚡ Trending Creator: 50+ votes
  if (votes >= 50) computedBadges.push('Trending Creator');
  
  // 🎯 Master Builder: 20+ tokens
  if (tokenCount >= 20) computedBadges.push('Master Builder');
  
  // 💯 Perfect Score: 5.0 rating and 5+ tokens
  if (avgRating >= 4.9 && tokenCount >= 5) computedBadges.push('Perfect Score');
  
  // 🌟 Legendary: Multiple conditions
  if (tokenCount >= 15 && trustScore >= 85 && avgRating >= 4.5) {
    computedBadges.push('Legendary');
  }
  
  // Preserve admin-added badges
  const adminBadges = this.badges || [];
  const allBadges = [...computedBadges, ...adminBadges];
  this.badges = [...new Set(allBadges)]; // Remove duplicates - both computed and admin badges
  return this.badges;
};

User.prototype.updateStats = async function(tokens = []) {
  const stats = {
    totalTokens: tokens.length || 0,
    followers: this.followers || 0,
    avgRating: this.avgRating || 0,
    successfulLaunches: this.successfulLaunches || 0,
    totalVolume: '$0'
  };
  
  if (tokens.length > 0) {
    const totalVolume = tokens.reduce((acc, t) => {
      return acc + (parseFloat(t.totalVolume) || 0);
    }, 0);
    stats.totalVolume = `$${totalVolume.toLocaleString()}`;
  }
  
  this.stats = stats;
  this.totalTokensCreated = tokens.length;
  this.calculateBadges();
  
  return await this.save();
};

User.prototype.toProfileResponse = function(tokens = []) {
  // Rozetleri hesapla
  this.calculateBadges();
  
  return {
    address: this.walletAddress,
    walletAddress: this.walletAddress,
    username: this.username || `User${this.walletAddress.substring(2, 8)}`,
    email: this.email,
    profileImage: this.profileImage,
    bio: this.bio,
    description: this.description,
    
    // Social Links
    twitter: this.twitter,
    telegram: this.telegram,
    website: this.website,
    discord: this.discord,
    socialLinks: this.socialLinks,
    
    // Token Information
    tokens: tokens,
    totalTokensCreated: this.totalTokensCreated,
    tokensCreated: this.tokensCreated,
    
    // Badges
    badges: this.badges,
    isVerified: this.isVerified,
    
    // Social Metrics
    voteCount: this.voteCount,
    trustScore: this.trustScore,
    followers: this.followers,
    following: this.following,
    followersCount: this.followersList ? this.followersList.length : 0,
    followingCount: this.followingList ? this.followingList.length : 0,
    avgRating: this.avgRating,
    successfulLaunches: this.successfulLaunches,
    
    // Statistics
    stats: this.stats,
    
    // Time Information
    lastLogin: this.lastLogin,
    lastActive: this.lastActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Define associations
User.associate = (models) => {
  User.hasMany(models.Token, {
    foreignKey: 'creatorUserId',
    as: 'createdTokens'
  });
  User.hasMany(models.Trade, {
    foreignKey: 'user',
    sourceKey: 'walletAddress',
    as: 'trades'
  });
};

// Virtual fields
Object.defineProperty(User.prototype, 'displayName', {
  get() {
    return this.username || `User${this.walletAddress.substring(2, 8)}`;
  }
});

module.exports = User;