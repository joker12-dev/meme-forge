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
  // Profil Bilgileri
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: {
        args: [3, 50],
        msg: 'Kullanıcı adı 3-50 karakter arasında olmalıdır'
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
  
  // Sosyal Linkler
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
  
  // Token & Aktivite Bilgileri
  tokensCreated: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  totalTokensCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Rozetler & Başarılar
  badges: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Admin yönetimi
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'banned'),
    defaultValue: 'active',
    comment: 'Kullanıcı durumu: active, suspended (geçici askıya), banned (kalıcı ban)'
  },
  banReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ban sebebi'
  },
  banExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Süreli ban için bitiş tarihi'
  },
  
  // Sosyal Metrikler
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
  
  // İstatistikler
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
  
  // Zaman Bilgileri
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
    // attributes yazma - tüm field'ları getir
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

  // 🏆 Top Creator: 10+ token açan
  if (tokenCount >= 10) computedBadges.push('Top Creator');
  
  // 📅 Early Adopter: 2023'ten önce katılan
  if (this.createdAt && new Date(this.createdAt).getFullYear() <= 2023) {
    computedBadges.push('Early Adopter');
  }
  
  // 💎 Diamond Hands: 90+ trustScore
  if (trustScore >= 90) computedBadges.push('Diamond Hands');
  
  // ⭐ Verified Creator: 10+ token ve 4+ rating
  if (tokenCount >= 10 && avgRating >= 4) computedBadges.push('Verified Creator');
  
  // 🚀 Rocket Launcher: 5+ başarılı token
  if (successfulLaunches >= 5) computedBadges.push('Rocket Launcher');
  
  // 👥 Community Leader: 100+ takipçi
  if (followers >= 100) computedBadges.push('Community Leader');
  
  // ⚡ Trending Creator: 50+ oy
  if (votes >= 50) computedBadges.push('Trending Creator');
  
  // 🎯 Master Builder: 20+ token
  if (tokenCount >= 20) computedBadges.push('Master Builder');
  
  // 💯 Perfect Score: 5.0 rating ve 5+ token
  if (avgRating >= 4.9 && tokenCount >= 5) computedBadges.push('Perfect Score');
  
  // 🌟 Legendary: Multiple conditions
  if (tokenCount >= 15 && trustScore >= 85 && avgRating >= 4.5) {
    computedBadges.push('Legendary');
  }
  
  // Admin tarafından eklenen rozetleri koruyalım
  const adminBadges = this.badges || [];
  const allBadges = [...computedBadges, ...adminBadges];
  this.badges = [...new Set(allBadges)]; // Duplicates'i kaldır, hem hesaplanan hem admin rozetleri var
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
    
    // Sosyal Linkler
    twitter: this.twitter,
    telegram: this.telegram,
    website: this.website,
    discord: this.discord,
    socialLinks: this.socialLinks,
    
    // Token Bilgileri
    tokens: tokens,
    totalTokensCreated: this.totalTokensCreated,
    tokensCreated: this.tokensCreated,
    
    // Rozetler
    badges: this.badges,
    isVerified: this.isVerified,
    
    // Sosyal Metrikler
    voteCount: this.voteCount,
    trustScore: this.trustScore,
    followers: this.followers,
    following: this.following,
    followersCount: this.followersList ? this.followersList.length : 0,
    followingCount: this.followingList ? this.followingList.length : 0,
    avgRating: this.avgRating,
    successfulLaunches: this.successfulLaunches,
    
    // İstatistikler
    stats: this.stats,
    
    // Zaman Bilgileri
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