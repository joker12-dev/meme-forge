const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TokenHype = sequelize.define('TokenHype', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userWalletAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    allowNull: false,
    defaultValue: 'bronze'
  },
  price: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // hours
    allowNull: false,
    defaultValue: 24
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled'),
    defaultValue: 'active'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  transactionHash: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'token_hypes',
  timestamps: true,
  indexes: [
    { fields: ['tokenAddress'] },
    { fields: ['status'] },
    { fields: ['endTime'] },
    { fields: ['tier'] }
  ]
});

module.exports = TokenHype;
