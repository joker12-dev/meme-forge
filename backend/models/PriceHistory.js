// backend/models/PriceHistory.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PriceHistory = sequelize.define('PriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tokenAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/i
    }
  },
  price: {
    type: DataTypes.DECIMAL(30, 18),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'price_histories',
  timestamps: false,
  indexes: [
    { fields: ['tokenAddress'] },
    { fields: ['timestamp'] },
    { fields: ['tokenAddress', 'timestamp'] }
  ]
});

module.exports = PriceHistory;