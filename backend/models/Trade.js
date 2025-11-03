const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Token = require('./Token');

const Trade = sequelize.define('Trade', {
  // Trade Identification
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/i
    },
    set(value) {
      this.setDataValue('tokenAddress', value.toLowerCase());
    }
  },
  tokenSymbol: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('tokenSymbol', value.toUpperCase());
    }
  },
  tokenName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Trade Details
  type: {
    type: DataTypes.ENUM('BUY', 'SELL'),
    allowNull: false,
    set(value) {
      this.setDataValue('type', value.toUpperCase());
    }
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  value: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  price: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  baseCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'BNB',
    set(value) {
      this.setDataValue('baseCurrency', value.toUpperCase());
    }
  },

  // User Information
  user: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/i
    },
    set(value) {
      this.setDataValue('user', value.toLowerCase());
    }
  },

  // Transaction Information
  txHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('txHash', value.toLowerCase());
    }
  },
  blockNumber: {
    type: DataTypes.INTEGER
  },
  gasUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gasPrice: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },

  // Network Information
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

  // Trade Status
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REVERTED'),
    defaultValue: 'CONFIRMED'
  },
  confirmations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // Additional Metadata
  slippage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  fee: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0
  },
  router: {
    type: DataTypes.STRING,
    defaultValue: 'PancakeSwap'
  },

  // Timestamps
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
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
Trade.beforeSave(async (trade) => {
  trade.updatedAt = new Date();
});

// Class methods
Trade.findByToken = async function(tokenAddress, options = {}) {
  const {
    limit = 50,
    page = 1,
    type = null,
    sortBy = 'timestamp',
    sortOrder = 'DESC'
  } = options;

  const offset = (page - 1) * limit;
  const where = { tokenAddress: tokenAddress.toLowerCase() };
  
  if (type) {
    where.type = type.toUpperCase();
  }

  const order = [[sortBy, sortOrder]];

  return await this.findAll({
    where,
    order,
    limit,
    offset
  });
};

// Static method to find trades by user
Trade.findByUser = async function(userAddress, options = {}) {
  const {
    limit = 25,
    page = 1,
    tokenAddress = null,
    type = null
  } = options;

  const offset = (page - 1) * limit;
  const where = { user: userAddress.toLowerCase() };
  
  if (tokenAddress) {
    where.tokenAddress = tokenAddress.toLowerCase();
  }
  
  if (type) {
    where.type = type.toUpperCase();
  }

  return await this.findAll({
    where,
    order: [['timestamp', 'DESC']],
    limit,
    offset
  });
};

Trade.getTokenStats = async function(tokenAddress) {
  const { QueryTypes } = require('sequelize');

  return await sequelize.query(`
    SELECT 
      type,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      SUM(value) as total_value,
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price,
      SUM(gas_used) as total_gas_used
    FROM trades
    WHERE 
      token_address = :tokenAddress 
      AND status = 'CONFIRMED'
    GROUP BY type
  `, {
    replacements: { tokenAddress: tokenAddress.toLowerCase() },
    type: QueryTypes.SELECT
  });
};

Trade.getTokenTradingStats = async function(tokenAddress) {
  const { QueryTypes } = require('sequelize');

  return await sequelize.query(`
    WITH stats AS (
      SELECT 
        COUNT(*) as total_trades,
        SUM(value) as total_volume,
        SUM(amount) as total_amount,
        AVG(amount) as avg_trade_size,
        AVG(value) as avg_trade_value,
        SUM(CASE WHEN type = 'BUY' THEN 1 ELSE 0 END) as buy_count,
        SUM(CASE WHEN type = 'SELL' THEN 1 ELSE 0 END) as sell_count,
        MIN(timestamp) as first_trade,
        MAX(timestamp) as last_trade,
        COUNT(DISTINCT user) as unique_traders
      FROM trades
      WHERE 
        token_address = :tokenAddress 
        AND status = 'CONFIRMED'
    )
    SELECT 
      total_trades,
      total_volume,
      total_amount,
      avg_trade_size,
      avg_trade_value,
      buy_count,
      sell_count,
      CASE 
        WHEN sell_count = 0 THEN 0
        ELSE CAST(buy_count AS FLOAT) / CAST(sell_count AS FLOAT)
      END as buy_sell_ratio,
      first_trade,
      last_trade,
      unique_traders
    FROM stats
  `, {
    replacements: { tokenAddress: tokenAddress.toLowerCase() },
    type: QueryTypes.SELECT
  });
};

Trade.getRecentTrades = async function(limit = 20, network = 'BSC') {
  return await this.findAll({
    where: {
      network: network.toUpperCase(),
      status: 'CONFIRMED'
    },
    order: [['timestamp', 'DESC']],
    limit,
    include: [{
      model: Token,
      as: 'token',
      attributes: ['name', 'symbol', 'logoURL']
    }]
  });
};

Trade.getUserStats = async function(userAddress) {
  const { QueryTypes } = require('sequelize');

  return await sequelize.query(`
    SELECT 
      token_address,
      token_symbol,
      COUNT(*) as trade_count,
      SUM(value) as total_volume,
      SUM(amount) as total_amount,
      AVG(price) as avg_price,
      SUM(CASE WHEN type = 'BUY' THEN 1 ELSE 0 END) as buy_count,
      SUM(CASE WHEN type = 'SELL' THEN 1 ELSE 0 END) as sell_count,
      MIN(timestamp) as first_trade,
      MAX(timestamp) as last_trade
    FROM trades
    WHERE 
      user = :userAddress
      AND status = 'CONFIRMED'
    GROUP BY token_address, token_symbol
    ORDER BY total_volume DESC
  `, {
    replacements: { userAddress: userAddress.toLowerCase() },
    type: QueryTypes.SELECT
  });
};

Trade.getVolumeChart = async function(tokenAddress, period = '24h') {
  const { QueryTypes } = require('sequelize');
  const now = new Date();
  let startTime;

  switch (period) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const format = period === '1h' ? 'HH24:MI' : 'YYYY-MM-DD HH24:00';

  return await sequelize.query(`
    SELECT 
      TO_CHAR(timestamp, :format) as time_group,
      SUM(value) as volume,
      COUNT(*) as trades,
      SUM(CASE WHEN type = 'BUY' THEN 1 ELSE 0 END) as buys,
      SUM(CASE WHEN type = 'SELL' THEN 1 ELSE 0 END) as sells,
      AVG(price) as avg_price
    FROM trades
    WHERE 
      token_address = :tokenAddress 
      AND status = 'CONFIRMED'
      AND timestamp >= :startTime
    GROUP BY time_group
    ORDER BY time_group ASC
  `, {
    replacements: { 
      format,
      tokenAddress: tokenAddress.toLowerCase(),
      startTime
    },
    type: QueryTypes.SELECT
  });
};

// Instance Methods
Trade.prototype.toApiResponse = function() {
  const trade = this.get({ plain: true });
  
  // Add formatted values
  trade.amountFormatted = parseFloat(this.amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
  
  trade.valueFormatted = parseFloat(this.value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  trade.priceFormatted = parseFloat(this.price).toFixed(8);
  
  // Add explorer URL
  const explorers = {
    'BSC': 'https://bscscan.com/tx',
    'ETHEREUM': 'https://etherscan.io/tx',
    'POLYGON': 'https://polygonscan.com/tx',
    'ARBITRUM': 'https://arbiscan.io/tx',
    'OPTIMISM': 'https://optimistic.etherscan.io/tx'
  };
  
  const explorerBase = explorers[this.network] || explorers['BSC'];
  trade.explorerUrl = `${explorerBase}/${this.txHash}`;
  
  // Add user display
  trade.userDisplay = `${this.user.substring(0, 6)}...${this.user.substring(this.user.length - 4)}`;
  
  // Add timestamp display
  trade.timeDisplay = this.timestamp ? new Date(this.timestamp).toLocaleTimeString() : '';
  trade.dateDisplay = this.timestamp ? new Date(this.timestamp).toLocaleDateString() : '';
  
  return trade;
};

// Define associations
Trade.associate = (models) => {
  Trade.belongsTo(models.Token, {
    foreignKey: 'tokenAddress',
    targetKey: 'address',
    as: 'token'
  });
  Trade.belongsTo(models.User, {
    foreignKey: 'user',
    targetKey: 'walletAddress',
    as: 'trader'
  });
};

// Model options including indexes
Trade.init(Trade.rawAttributes, {
  sequelize,
  modelName: 'Trade',
  tableName: 'trades',
  timestamps: true,
  indexes: [
    { fields: ['tokenAddress', 'timestamp'] },
    { fields: ['user', 'timestamp'] },
    { fields: ['txHash'], unique: true },
    { fields: ['timestamp'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['network'] },
    { fields: ['tokenAddress', 'type', 'timestamp'] },
    { fields: ['user', 'tokenAddress', 'timestamp'] },
    { fields: ['network', 'timestamp'] },
    { fields: ['tokenAddress', 'status', 'timestamp'] }
  ]
});

module.exports = Trade;