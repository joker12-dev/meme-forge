const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Token = sequelize.define('Token', {
  // Basic Token Information
  address: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/i
    },
    set(value) {
      this.setDataValue('address', value.toLowerCase());
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true
    },
    set(value) {
      this.setDataValue('symbol', value.toUpperCase());
    }
  },
  totalSupply: {
    type: DataTypes.STRING,
    allowNull: false
  },
  decimals: {
    type: DataTypes.INTEGER,
    defaultValue: 18,
    validate: {
      min: 0,
      max: 36
    }
  },

  // Creator Information
  creator: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('creator', value.toLowerCase());
    }
  },
  creatorUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  // Transaction Information
  txHash: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('txHash', value.toLowerCase());
    }
  },
  blockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Token Metadata
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  metadataURI: {
    type: DataTypes.STRING,
    defaultValue: 'ipfs://default'
  },
  logoURL: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Social Links
  website: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  telegram: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  twitter: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  discord: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  socialLinks: {
    type: DataTypes.JSON,
    defaultValue: {}
  },

  // Blockchain Information
  network: {
    type: DataTypes.ENUM('BSC', 'ETHEREUM', 'POLYGON', 'ARBITRUM', 'OPTIMISM'),
    defaultValue: 'BSC'
  },
  chainId: {
    type: DataTypes.INTEGER,
    defaultValue: 56,
    validate: {
      isIn: [[1, 56, 97, 137, 42161, 10]]
    }
  },
  isReal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // Trading Metrics
  totalVolume: {
    type: DataTypes.DECIMAL(24, 8),
    defaultValue: 0
  },
  totalTrades: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(24, 8),
    defaultValue: 0
  },
  priceChange24h: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  marketCap: {
    type: DataTypes.DECIMAL(24, 8),
    defaultValue: 0
  },
  liquidity: {
    type: DataTypes.DECIMAL(24, 8),
    defaultValue: 0
  },

  // Activity Tracking
  lastTrade: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPriceUpdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // LP Lock Information
  lpToken: {
    type: DataTypes.STRING,
    allowNull: true,
    set(value) {
      this.setDataValue('lpToken', value ? value.toLowerCase() : null);
    }
  },
  liquidityLocks: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const locks = this.getDataValue('liquidityLocks');
      return Array.isArray(locks) ? locks : [];
    }
  },
  totalLockedLiquidity: {
    type: DataTypes.DECIMAL(24, 8),
    defaultValue: 0,
    get() {
      const locks = this.getDataValue('liquidityLocks');
      if (!Array.isArray(locks)) return 0;
      
      return locks.reduce((total, lock) => {
        if (!lock.isUnlocked) {
          return total + parseFloat(lock.amount);
        }
        return total;
      }, 0);
    }
  },

  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Hooks
Token.beforeSave(async (token) => {
  token.updatedAt = new Date();
  
  // Auto-generate socialLinks if individual fields are set
  if (token.website || token.telegram || token.twitter || token.discord) {
    token.socialLinks = {
      website: token.website,
      telegram: token.telegram,
      twitter: token.twitter,
      discord: token.discord
    };
  }
});

// Class methods
Token.findByAddress = async function(address) {
  return await this.findOne({
    where: { address: address.toLowerCase() },
    include: [{
      model: sequelize.models.User,
      as: 'creatorUser',
      attributes: ['walletAddress', 'username', 'profileImage']
    }]
  });
};

Token.findByNetwork = async function(network, limit = 50, page = 1) {
  const offset = (page - 1) * limit;
  
  return await this.findAll({
    where: { network: network.toUpperCase() },
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset,
    include: [{
      model: sequelize.models.User,
      as: 'creatorUser',
      attributes: ['walletAddress', 'username', 'profileImage']
    }]
  });
};

Token.findUserTokens = async function(walletAddress, network = 'BSC') {
  return await this.findAll({
    where: {
      creator: walletAddress.toLowerCase(),
      network: network.toUpperCase()
    },
    order: [['createdAt', 'DESC']],
    include: [{
      model: sequelize.models.User,
      as: 'creatorUser',
      attributes: ['walletAddress', 'username', 'profileImage']
    }]
  });
};

Token.getTrending = async function(limit = 10, network = 'BSC') {
  return await this.findAll({
    where: {
      network: network.toUpperCase(),
      isActive: true
    },
    order: [
      ['totalVolume', 'DESC'],
      ['totalTrades', 'DESC'],
      ['views', 'DESC']
    ],
    limit,
    include: [{
      model: sequelize.models.User,
      as: 'creatorUser',
      attributes: ['walletAddress', 'username', 'profileImage']
    }]
  });
};

Token.searchTokens = async function(query, network = 'BSC', limit = 20) {
  const { Op } = require('sequelize');
  
  return await this.findAll({
    where: {
      network: network.toUpperCase(),
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { symbol: { [Op.iLike]: `%${query}%` } },
        { address: query.toLowerCase() },
        { description: { [Op.iLike]: `%${query}%` } }
      ]
    },
    order: [
      ['totalVolume', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    include: [{
      model: sequelize.models.User,
      as: 'creatorUser',
      attributes: ['walletAddress', 'username', 'profileImage']
    }]
  });
};

Token.getNetworkStats = async function() {
  const { QueryTypes } = require('sequelize');
  
  return await sequelize.query(`
    SELECT 
      network,
      COUNT(*) as count,
      SUM(total_volume) as total_volume,
      SUM(total_trades) as total_trades,
      SUM(market_cap) as total_market_cap
    FROM tokens
    GROUP BY network
  `, {
    type: QueryTypes.SELECT
  });
};

// Instance methods
Token.prototype.updateTradingStats = async function(volume, price, liquidity = null) {
  this.totalVolume = (parseFloat(this.totalVolume) || 0) + (parseFloat(volume) || 0);
  this.totalTrades = (this.totalTrades || 0) + 1;
  this.price = parseFloat(price) || 0;
  this.lastTrade = new Date();
  this.lastPriceUpdate = new Date();
  
  if (liquidity !== null) {
    this.liquidity = parseFloat(liquidity) || 0;
  }
  
  // Calculate market cap if totalSupply and price are available
  if (this.totalSupply && this.price) {
    try {
      const supply = parseFloat(this.totalSupply);
      this.marketCap = supply * this.price;
    } catch (error) {
      console.error('Error calculating market cap:', error);
    }
  }
  
  return await this.save();
};

Token.prototype.incrementViews = async function() {
  this.views = (this.views || 0) + 1;
  return await this.save();
};

Token.prototype.addLiquidityLock = async function(lock) {
  const locks = this.liquidityLocks || [];
  locks.push({
    ...lock,
    isUnlocked: false,
    createdAt: new Date()
  });
  this.liquidityLocks = locks;
  return await this.save();
};

Token.prototype.updateLiquidityLock = async function(lockId, duration, txHash) {
  const locks = this.liquidityLocks || [];
  const lockIndex = locks.findIndex(l => l.id === lockId);
  
  if (lockIndex === -1) {
    throw new Error('Lock not found');
  }
  
  locks[lockIndex] = {
    ...locks[lockIndex],
    duration,
    txHash,
    updatedAt: new Date()
  };
  
  this.liquidityLocks = locks;
  return await this.save();
};

Token.prototype.unlockLiquidity = async function(lockId, txHash) {
  const locks = this.liquidityLocks || [];
  const lockIndex = locks.findIndex(l => l.id === lockId);
  
  if (lockIndex === -1) {
    throw new Error('Lock not found');
  }
  
  locks[lockIndex] = {
    ...locks[lockIndex],
    isUnlocked: true,
    unlockedAt: new Date(),
    unlockTxHash: txHash
  };
  
  this.liquidityLocks = locks;
  return await this.save();
};

Token.prototype.getLiquidityLocks = function(userAddress) {
  const locks = this.liquidityLocks || [];
  if (!userAddress) return locks;
  return locks.filter(lock => lock.userAddress.toLowerCase() === userAddress.toLowerCase());
};

Token.prototype.toApiResponse = function() {
  const token = this.get({ plain: true });
  
  // Calculate formatted values
  const supply = parseFloat(this.totalSupply) || 0;
  
  // Add formatted fields
  token.totalSupplyFormatted = supply.toLocaleString();
  token.marketCapFormatted = this.marketCap.toLocaleString();
  token.totalVolumeFormatted = this.totalVolume.toLocaleString();
  token.priceFormatted = parseFloat(this.price).toFixed(8);
  
  // Add explorer URLs
  const explorers = {
    'BSC': 'https://bscscan.com/token',
    'ETHEREUM': 'https://etherscan.io/token',
    'POLYGON': 'https://polygonscan.com/token',
    'ARBITRUM': 'https://arbiscan.io/token',
    'OPTIMISM': 'https://optimistic.etherscan.io/token'
  };
  
  const explorerBase = explorers[this.network] || explorers['BSC'];
  token.explorerUrl = `${explorerBase}/${this.address}`;
  
  // Add dexscreener URL
  const chains = {
    'BSC': 'bsc',
    'ETHEREUM': 'ethereum',
    'POLYGON': 'polygon',
    'ARBITRUM': 'arbitrum',
    'OPTIMISM': 'optimism'
  };
  
  const chain = chains[this.network] || 'bsc';
  token.dexscreenerUrl = `https://dexscreener.com/${chain}/${this.address}`;
  
  return token;
};

// Define associations
Token.associate = (models) => {
  Token.belongsTo(models.User, {
    foreignKey: 'creatorUserId',
    as: 'creatorUser'
  });
  Token.hasMany(models.Trade, {
    foreignKey: 'tokenAddress',
    sourceKey: 'address',
    as: 'trades'
  });
};

// Model options including indexes
Token.init(Token.rawAttributes, {
  sequelize,
  modelName: 'Token',
  tableName: 'tokens',
  timestamps: true,
  indexes: [
    { fields: ['address'] },
    { fields: ['creator'] },
    { fields: ['creatorUserId'] },
    { fields: ['network'] },
    { fields: ['createdAt'] },
    { fields: ['totalVolume'] },
    { fields: ['marketCap'] },
    { fields: ['network', 'createdAt'] },
    { fields: ['network', 'totalVolume'] },
    { fields: ['network', 'marketCap'] },
    { fields: ['creator', 'createdAt'] }
  ]
});

module.exports = Token;