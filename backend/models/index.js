const { sequelize } = require('../config/database');
const User = require('./User');
const Token = require('./Token');
const Trade = require('./Trade');
const PriceHistory = require('./PriceHistory');
const TokenHype = require('./TokenHype');
const Campaign = require('./Campaign');
const Vote = require('./Vote');
const { Post, Comment, PostLike, CommentLike } = require('./Post');
const ContactMessage = require('./ContactMessage');
const ActivityLog = require('./ActivityLog');
const Admin = require('./Admin');
const SiteSettings = require('./SiteSettings');

// Setup associations
TokenHype.belongsTo(Token, { foreignKey: 'tokenAddress', targetKey: 'address', as: 'token' });
Token.hasMany(TokenHype, { foreignKey: 'tokenAddress', sourceKey: 'address', as: 'hypes' });

// Campaign associations with Token
Campaign.belongsTo(Token, { foreignKey: 'tokenAddress', targetKey: 'address', as: 'token' });
Token.hasMany(Campaign, { foreignKey: 'tokenAddress', sourceKey: 'address', as: 'campaigns' });

// Post associations with User
Post.belongsTo(User, { foreignKey: 'creatorAddress', targetKey: 'walletAddress', as: 'creator' });
User.hasMany(Post, { foreignKey: 'creatorAddress', sourceKey: 'walletAddress', as: 'posts' });

// Comment associations with User
Comment.belongsTo(User, { foreignKey: 'authorAddress', targetKey: 'walletAddress', as: 'author' });

// Trade associations with User and Token
Trade.belongsTo(User, { foreignKey: 'user', targetKey: 'walletAddress', as: 'trader' });
Trade.belongsTo(Token, { foreignKey: 'tokenAddress', targetKey: 'address', as: 'token' });

// Initialize associations
const models = {
  User,
  Token,
  Trade,
  PriceHistory,
  TokenHype,
  Campaign,
  Vote,
  Post,
  Comment,
  PostLike,
  CommentLike,
  ContactMessage,
  ActivityLog,
  Admin,
  SiteSettings
};

// Call associate if it exists
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

module.exports = {
  sequelize,
  ...models
};