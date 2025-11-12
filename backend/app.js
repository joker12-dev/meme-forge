// backend/app.js
require('dotenv').config({ path: __dirname + "/.env" });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

// Load routes
const tradingRoutes = require('./routes/trading');
const liquidityRoutes = require('./routes/liquidity');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const followRoutes = require('./routes/followRoutes');
const contactRoutes = require('./routes/contact');
const configRoutes = require('./routes/config');
const adminRoutes = require('./routes/admin');
const campaignsRoutes = require('./routes/campaigns');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Routes
app.use('/api/trades', tradingRoutes);
app.use('/api/liquidity', liquidityRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campaigns', campaignsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Database sync and server start
const PORT = process.env.PORT || 3001;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    logger.info(`Server started on port ${PORT}`);
  });
}).catch(error => {
  console.error('Unable to start server:', error);
  logger.error('Server start failed:', error);
});

module.exports = app;