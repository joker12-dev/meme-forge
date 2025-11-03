const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  adminUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'create, update, delete, login, logout'
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'admin, token, user, trade, message, setting'
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the affected entity'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional data about the action'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'warning'),
    defaultValue: 'success'
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['adminId'] },
    { fields: ['action'] },
    { fields: ['entity'] },
    { fields: ['createdAt'] },
    { fields: ['status'] },
    { fields: ['adminId', 'createdAt'] }, // Common query: admin logs sorted by date
    { fields: ['entity', 'entityId'] }, // Common query: logs for specific entity
    { fields: ['action', 'status', 'createdAt'] } // Common query: action history with status
  ]
});

// Helper methods
ActivityLog.createLog = async (adminId, action, entity, entityId, description, metadata = {}, ipAddress = null, userAgent = null, status = 'success') => {
  try {
    return await ActivityLog.create({
      adminId,
      adminUsername: metadata.adminUsername || null,
      action,
      entity,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent,
      status
    });
  } catch (err) {
    console.error('Error creating activity log:', err);
    return null;
  }
};

// Get logs for an admin with filtering
ActivityLog.getAdminLogs = async (adminId, options = {}) => {
  const { limit = 50, offset = 0, action = null, status = null } = options;
  const where = { adminId };
  
  if (action) where.action = action;
  if (status) where.status = status;
  
  return await ActivityLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    attributes: ['id', 'action', 'entity', 'entityId', 'description', 'status', 'createdAt']
  });
};

// Get logs for a specific entity
ActivityLog.getEntityLogs = async (entity, entityId, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  
  return await ActivityLog.findAndCountAll({
    where: { entity, entityId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    attributes: ['id', 'action', 'adminUsername', 'description', 'status', 'createdAt']
  });
};

// Get recent failed actions
ActivityLog.getRecentFailures = async (options = {}) => {
  const { limit = 20 } = options;
  
  return await ActivityLog.findAll({
    where: { status: 'failed' },
    order: [['createdAt', 'DESC']],
    limit,
    attributes: ['id', 'adminUsername', 'action', 'entity', 'description', 'createdAt']
  });
};

module.exports = ActivityLog;
