const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  bannerUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'ended', 'cancelled'),
    defaultValue: 'draft'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  externalUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ctaLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ctaText: {
    type: DataTypes.STRING(100),
    defaultValue: 'Learn More'
  },
  buttonText: {
    type: DataTypes.STRING(100),
    defaultValue: 'Learn More'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'campaigns',
  timestamps: true,
  indexes: [
    {
      fields: ['slug']
    },
    {
      fields: ['status']
    },
    {
      fields: ['startDate', 'endDate']
    },
    {
      fields: ['featured']
    }
  ]
});

module.exports = Campaign;
