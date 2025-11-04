require('dotenv').config({ path: __dirname + "/.env" });
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { ethers } = require('ethers');
const path = require('path');
const { connectDB } = require('./config/database');
const { 
  User, Token, Trade, Post, Vote, Campaign, ContactMessage, ActivityLog, 
  Admin, SiteSettings, TokenHype, sequelize 
} = require('./models');
const { Op } = require('sequelize');
const upload = require('./middleware/upload');
const { validateTokenCreation, validateWalletHeader } = require('./middleware/validators');

// Import social feature routes
const postsRoutes = require('./routes/posts');
const followRoutes = require('./routes/followRoutes');

// Database connection
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for getting real IP addresses
app.set('trust proxy', true);

// Middleware
app.use(helmet({
  hsts: false
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://192.168.1.104:3000',
  'http://192.168.1.104:3001',
  'http://192.168.3.111:3000',
  'http://192.168.3.111:3001',
  'http://richrevo.com',
  'http://www.richrevo.com',
  'http://api.richrevo.com',
  'https://richrevo.com',
  'https://www.richrevo.com',
  'https://api.richrevo.com'
];

const corsOptions = {
  origin: function(origin, callback) {
    // Origin header'ı yoksa (mobile app veya server-to-server) izin ver
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'wallet-address']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Mount PUBLIC config routes BEFORE any auth middleware
const configRoutes = require('./routes/config');
app.use('/api/config', configRoutes);

// Helper function to get client IP safely (IPv6 compatible)
const getClientIP = (req) => {
  // Try to get IP from proxy first
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

// Rate limiting configurations
// Only limit POST/PUT/DELETE operations, never limit GET (read-only) requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 write requests per windowMs
  message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => getClientIP(req), // Use IP address as key
  skip: (req) => {
    // Skip rate limiting for:
    // 1. All GET requests (read operations should never be rate limited)
    // 2. Health check and static files
    return req.method === 'GET' || 
           req.path === '/health' || 
           req.path.startsWith('/uploads');
  }
});

const createTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 token creations per 15 minutes (increased for better UX)
  message: 'Çok fazla token oluşturdunuz. Lütfen 15 dakika sonra tekrar deneyin.',
  keyGenerator: (req) => req.headers['wallet-address'] || getClientIP(req), // Use wallet address if available
  skip: (req) => !req.headers['wallet-address'], // Only limit authenticated requests
});

const createPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 posts per 15 minutes (increased for better UX)
  message: 'Çok fazla gönderi oluşturdunuz. Lütfen 15 dakika sonra tekrar deneyin.',
  keyGenerator: (req) => req.headers['wallet-address'] || getClientIP(req),
  skip: (req) => !req.headers['wallet-address'], // Only limit POST requests
});

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 comments per 15 minutes (increased for better UX)
  message: 'Çok fazla yorum yaptınız. Lütfen biraz bekleyin.',
  keyGenerator: (req) => req.headers['wallet-address'] || getClientIP(req),
  skip: (req) => !req.headers['wallet-address'], // Only limit POST requests
});

// Apply general limiter to only POST/PUT/DELETE operations
app.use(generalLimiter);

// Disable HTTPS redirect - allow HTTP
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=0');
  next();
});

// Static file serving for uploaded logos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Her istekte session süresini yenile
  cookie: {
    secure: false, // true olmalı production'da (HTTPS)
    httpOnly: true,
    maxAge: 5 * 60 * 1000 // 5 dakika idle timeout
  }
}));

// Activity Log Helper Function
const logActivity = async (req, action, entity, entityId, description, metadata = {}, status = 'success') => {
  try {
    const adminData = req.session?.adminData;
    // Get real IP address (handles proxy, localhost, etc.)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     'unknown';
    const userAgent = req.get('user-agent');

    await ActivityLog.create({
      adminId: adminData?.id,
      adminUsername: adminData?.username,
      action,
      entity,
      entityId: entityId?.toString(),
      description,
      metadata,
      ipAddress,
      userAgent,
      status
    });
  } catch (error) {
    console.error('❌ Log activity error:', error);
  }
};

// Session activity tracker middleware
app.use((req, res, next) => {
  if (req.session.isAdmin) {
    req.session.lastActivity = Date.now();
  }
  next();
});

// Auth middleware - wallet address ile user bul veya oluştur
app.use(async (req, res, next) => {
  // Debug: wallet-address header log
  console.log('[AUTH] headers:', req.headers);
  if (req.headers['wallet-address']) {
    try {
      // Wallet address'i normalize et
      const walletAddress = req.headers['wallet-address'].toLowerCase();
      console.log('[AUTH] wallet-address:', walletAddress);
      // Validation - geçerli ethereum adresi mi?
      if (!/^0x[a-f0-9]{40}$/i.test(walletAddress)) {
        console.error('Invalid wallet address:', walletAddress);
        return next();
      }

      const user = await User.findOrCreateByAddress(walletAddress);
      req.user = user;
      
      console.log('✅ Auth: User loaded -', req.user.walletAddress);
    } catch (error) {
      console.error('❌ Auth error:', error);
    }
  }
  next();
});

// 🔄 BLOCKCHAIN CONFIGURATION
const BSC_RPC_URL = process.env.BSC_RPC_URL || 'http://127.0.0.1:8545';
const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC || 'http://127.0.0.1:8545';

// Provider
const networkConfig = process.env.BSC_NETWORK === 'localhost' 
  ? { name: 'localhost', chainId: 31337 }
  : process.env.BSC_NETWORK === 'testnet' 
    ? { name: 'bsc-testnet', chainId: 97 }
    : { name: 'bsc', chainId: 56 };

const provider = new ethers.providers.JsonRpcProvider(
  process.env.BSC_NETWORK === 'localhost' ? 'http://127.0.0.1:8545' : BSC_RPC_URL,
  networkConfig
);

// Wallet
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const factoryAddress = process.env.REACT_APP_FACTORY_ADDRESS;

// Factory ABI
const factoryABI = [
  "function createToken(string name, string symbol, uint256 initialSupply, uint8 decimals, string metadataURI, string tier, uint256 marketingTax, uint256 liquidityTax, bool autoBurn) payable returns (address)",
  "event TokenCreated(address indexed tokenAddress, address indexed creator, string tier, uint256 initialSupply, uint256 marketingTax, uint256 liquidityTax, bool autoBurn)",
  "function getAllTokens() view returns (address[])",
  "function getUserTokens(address) view returns (address[])",
  "function getTierFee(string) view returns (uint256)",
  "function memeTokenTemplate() view returns (address)",
  "function owner() view returns (address)",
  "function fees() view returns (uint256 basicFee, uint256 standardFee, uint256 premiumFee, address platformWallet, address developmentWallet, address marketingWallet, address platformCommissionWallet)",
  "function setMemeTokenTemplate(address) external",
  "function initializeToken(address token, uint256 marketingTax, uint256 liquidityTax, bool autoBurn) returns (bool)",
  "function createClone(address) returns (address)"
];

let factory;

// Provider bağlantı kontrolü
const initializeProvider = async () => {
  try {
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', {
      name: network.name,
      chainId: network.chainId
    });
    return true;
  } catch (error) {
    console.error('❌ Provider connection error:', error.message);
    return false;
  }
};

// Factory kontratını başlat
const initializeFactory = async () => {
  try {
    const isProviderReady = await initializeProvider();
    if (!isProviderReady) {
      throw new Error('Provider not connected');
    }

    // Check if factory contract exists at the address
    const code = await provider.getCode(factoryAddress);
    if (code === '0x') {
      throw new Error('No contract at factory address');
    }

    factory = new ethers.Contract(factoryAddress, factoryABI, wallet);
    const owner = await factory.owner();
    const walletAddress = await wallet.getAddress();
    
    // Get template address
    const templateAddress = await factory.memeTokenTemplate();
    console.log('📄 Template address:', templateAddress);
    
    if (!templateAddress || templateAddress === ethers.constants.AddressZero) {
      console.error('❌ Token template not configured');
    }

    console.log('✅ BSC Factory connected:', factoryAddress);
    console.log('✅ Factory owner:', owner);
    console.log('✅ Wallet address:', walletAddress);
    return true;
  } catch (error) {
    console.error('❌ BSC Factory connection error:', error.message);
    return false;
  }
};

// Factory'yi başlat
initializeFactory();

// ROUTES

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const tokensCount = await Token.count();
    const usersCount = await User.count();
    const tradesCount = await Trade.count();
    
    res.json({ 
      status: 'OK', 
      message: 'Meme Token Platform API - BSC',
      network: process.env.BSC_NETWORK === 'testnet' ? 'BSC Testnet' : 'BSC Mainnet',
      database: 'Connected',
      tokens: tokensCount,
      users: usersCount,
      trades: tradesCount,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform istatistikleri (Footer için)
app.get('/api/stats', async (req, res) => {
  try {
    // Token sayısı
    const tokensCount = await Token.count();
    
    // Toplam işlem hacmi (Sequelize ile)
    const { QueryTypes } = require('sequelize');
    
    // Trades tablosunun var olup olmadığını kontrol et
    let totalVolume = 0;
    try {
      const volumeResult = await sequelize.query(
        'SELECT COALESCE(SUM(CAST(value AS DECIMAL)), 0) as total_volume FROM "Trades" WHERE status = \'CONFIRMED\'',
        { type: QueryTypes.SELECT }
      );
      totalVolume = volumeResult[0]?.total_volume || 0;
    } catch (error) {
      // Tablo yoksa 0 döndür
      console.log('⚠️ Trades table not found');
      totalVolume = 0;
    }
    
    // Benzersiz token yaratıcı sayısı (Sequelize ile)
    const uniqueCreators = await Token.count({
      distinct: true,
      col: 'creator'
    });
    
    const stats = {
      tokensCreated: tokensCount,
      totalVolume: parseFloat(totalVolume) || 0,
      activeUsers: uniqueCreators
    };
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: {
        tokensCreated: 0,
        totalVolume: 0,
        activeUsers: 0
      }
    });
  }
});

// ==================== ADMIN AUTHENTICATION ====================

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Admin login required'
    });
  }

  // Idle timeout kontrolü (5 dakika)
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 dakika
  const now = Date.now();
  const lastActivity = req.session.lastActivity || now;

  if (now - lastActivity > IDLE_TIMEOUT) {
    req.session.destroy();
    return res.status(401).json({
      success: false,
      error: 'Session expired due to inactivity',
      sessionExpired: true
    });
  }

  // Activity zamanını güncelle
  req.session.lastActivity = now;

  // Admin bilgisini req'e ekle
  if (req.session.adminId) {
    try {
      const admin = await Admin.findByPk(req.session.adminId);
      if (admin) {
        req.admin = admin;
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
    }
  }

  next();
};

// Admin login with database
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı ve şifre gereklidir'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      console.log('❌ Admin not found:', username);
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      console.log('❌ Admin inactive:', username);
      return res.status(401).json({
        success: false,
        error: 'Hesabınız aktif değil'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      console.log('❌ Admin invalid password:', username);
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Update login stats
    admin.lastLogin = new Date();
    admin.loginCount = (admin.loginCount || 0) + 1;
    await admin.save();

    // Set session
    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    req.session.adminData = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    };
    req.session.lastActivity = Date.now();
    
    console.log('✅ Admin login successful:', username, '- Role:', admin.role);
    
    // Log activity
    await logActivity(req, 'login', 'admin', admin.id, `${username} giriş yaptı`, { role: admin.role });
    
    res.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş yapılırken hata oluştu'
    });
  }
});

// Admin logout
app.post('/api/admin/logout', async (req, res) => {
  const username = req.session.adminData?.username || req.session.username;
  
  // Log activity before destroying session
  if (username) {
    await logActivity(req, 'logout', 'admin', req.session.adminData?.id, `${username} çıkış yaptı`);
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Çıkış yapılırken hata oluştu'
      });
    }
    
    console.log('✅ Admin logout:', username);
    
    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });
  });
});

// Check admin session
app.get('/api/admin/check', (req, res) => {
  if (req.session.isAdmin && req.session.adminData) {
    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: req.session.adminData.id,
        username: req.session.adminData.username,
        email: req.session.adminData.email,
        role: req.session.adminData.role,
        permissions: req.session.adminData.permissions
      }
    });
  } else {
    res.json({
      success: true,
      isAuthenticated: false
    });
  }
});

// ==================== CONTACT ENDPOINTS ====================

// İletişim formu gönderimi
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validasyon
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur'
      });
    }

    // Email validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir e-posta adresi giriniz'
      });
    }

    // IP ve User Agent bilgilerini al
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Database'e kaydet
    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      ipAddress,
      userAgent,
      status: 'new'
    });

    console.log('📧 New contact message:', {
      id: contactMessage.id,
      email: contactMessage.email,
      subject: contactMessage.subject
    });

    res.json({
      success: true,
      message: 'Mesajınız başarıyla gönderildi',
      data: {
        id: contactMessage.id,
        createdAt: contactMessage.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Mesaj gönderilirken bir hata oluştu'
    });
  }
});

// Admin: Tüm mesajları getir
app.get('/api/admin/contact-messages', requireAdmin, async (req, res) => {
  try {
    // Permission check
    const { role, permissions } = req.session.adminData || {};
    if (role !== 'super_admin' && !permissions?.manage_contact) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz yok'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await ContactMessage.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Mesajlar yüklenirken hata oluştu'
    });
  }
});

// Admin: Mesaj durumu güncelle
app.patch('/api/admin/contact-messages/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz durum'
      });
    }

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Mesaj bulunamadı'
      });
    }

    const oldStatus = message.status;
    message.status = status;
    await message.save();

    // Log the status change
    await logActivity(
      req,
      'update',
      'message',
      id,
      `Mesaj durumu değiştirildi: ${oldStatus} → ${status}`,
      { 
        sender: message.name,
        email: message.email,
        subject: message.subject,
        oldStatus,
        newStatus: status
      }
    );

    res.json({
      success: true,
      message: 'Mesaj durumu güncellendi',
      data: message
    });
  } catch (error) {
    console.error('❌ Update message error:', error);
    res.status(500).json({
      success: false,
      error: 'Mesaj güncellenirken hata oluştu'
    });
  }
});

// Admin: Mesaj sil
app.delete('/api/admin/contact-messages/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Mesaj bulunamadı'
      });
    }

    const messageInfo = {
      sender: message.name,
      email: message.email,
      subject: message.subject,
      status: message.status
    };

    await message.destroy();

    // Log the deletion
    await logActivity(
      req,
      'delete',
      'message',
      id,
      `Mesaj silindi: ${messageInfo.sender} - ${messageInfo.subject}`,
      messageInfo
    );

    res.json({
      success: true,
      message: 'Mesaj silindi'
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Mesaj silinirken hata oluştu'
    });
  }
});

// Admin: İstatistikler
app.get('/api/admin/contact-stats', requireAdmin, async (req, res) => {
  try {
    const totalMessages = await ContactMessage.count();
    const newMessages = await ContactMessage.count({ where: { status: 'new' } });
    const readMessages = await ContactMessage.count({ where: { status: 'read' } });
    const repliedMessages = await ContactMessage.count({ where: { status: 'replied' } });
    const archivedMessages = await ContactMessage.count({ where: { status: 'archived' } });

    res.json({
      success: true,
      data: {
        total: totalMessages,
        new: newMessages,
        read: readMessages,
        replied: repliedMessages,
        archived: archivedMessages
      }
    });
  } catch (error) {
    console.error('❌ Contact stats error:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler yüklenirken hata oluştu'
    });
  }
});

// Token listesi
app.get('/api/tokens', async (req, res) => {
  try {
    const tokens = await Token.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({
      success: true,
      data: tokens,
      pagination: { total: tokens.length, pages: 1 }
    });
  } catch (error) {
    console.error('❌ Token list error:', error);
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
});

// Kullanıcı token'ları
app.get('/api/my-tokens', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Wallet not connected' });
    }
    const tokens = await Token.findAll({
      where: {
        creator: req.user.walletAddress
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(tokens);
  } catch (error) {
    console.error('My tokens error:', error);
    res.status(500).json([]);
  }
});

// Token detay
app.get('/api/token/:address', async (req, res) => {
  try {
    const token = await Token.findOne({
      where: {
        address: req.params.address.toLowerCase()
      }
    });
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Token'a ait son tradeleri getir
    const recentTrades = await Trade.findAll({ 
      where: {
        tokenAddress: req.params.address.toLowerCase()
      },
      order: [['timestamp', 'DESC']],
      limit: 25
    });
    
    res.json({
      token,
      recentTrades
    });
  } catch (error) {
    console.error('Token detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Token bilgisi (Hype modal için)
// Token bilgisi (Hype modal için)
app.get('/api/tokens/:address', async (req, res) => {
  try {
    const token = await Token.findOne({
      where: {
        address: req.params.address.toLowerCase()
      }
    });
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    // Token bilgisini direkt dön (frontend bunu bekliyor)
    res.json({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      logoURL: token.logoURL,
      description: token.description,
      website: token.website,
      telegram: token.telegram,
      twitter: token.twitter,
      totalSupply: token.totalSupply,
      decimals: token.decimals
    });
  } catch (error) {
    console.error('Token info error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Token meta güncelleme (logo ve sosyal medya)
app.patch('/api/tokens/:address/edit-meta', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const { logoURL, website, telegram, twitter, description } = req.body;
    const token = await Token.findOne({ where: { address } });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }
    // Sadece logo ve sosyal medya alanlarını güncelle
    if (logoURL !== undefined) token.logoURL = logoURL;
    if (website !== undefined) token.website = website;
    if (telegram !== undefined) token.telegram = telegram;
    if (twitter !== undefined) token.twitter = twitter;
    if (description !== undefined) token.description = description;
    await token.save();
    res.json({ success: true, token });
  } catch (error) {
    console.error('Token meta update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Token holders bilgisi
app.get('/api/tokens/:address/holders', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Burada gerçek blockchain'den holders bilgisini çekebilirsiniz
    // Şimdilik mock data döndürelim
    const holdersCount = Math.floor(Math.random() * 5000) + 100;
    
    res.json({
      count: holdersCount,
      tokenAddress: address
    });
  } catch (error) {
    console.error('Holders fetch error:', error);
    res.status(500).json({ 
      count: 0,
      error: error.message 
    });
  }
});

// TRADE ENDPOINTS

// Trade kaydetme
app.post('/api/trades', async (req, res) => {
  try {
    console.log('💰 Trade save request received:', req.body);
    
    const {
      tokenAddress,
      tokenSymbol,
      tokenName,
      type, // 'BUY' or 'SELL'
      amount,
      value,
      price,
      user,
      txHash,
      baseCurrency = 'BNB',
      slippage = 0,
      gasUsed = 0,
      gasPrice = '0',
      router = 'PancakeSwap'
    } = req.body;

    // Validasyon
    if (!tokenAddress || !type || !amount || !user || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tokenAddress, type, amount, user, txHash'
      });
    }

    // Token'ın var olduğunu kontrol et
    const token = await Token.findOne({
      where: { 
        address: tokenAddress.toLowerCase()
      }
    });
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found in database'
      });
    }

    // Transaction'ı blockchain'den doğrula
    let txReceipt;
    try {
      txReceipt = await provider.getTransactionReceipt(txHash);
      if (!txReceipt) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found on blockchain'
        });
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to verify transaction on blockchain'
      });
    }

    console.log('💾 Saving trade to database...');

    // Trade'i oluştur
    const trade = await Trade.create({
      tokenAddress: tokenAddress.toLowerCase(),
      tokenSymbol: tokenSymbol || token.symbol,
      tokenName: tokenName || token.name,
      type: type.toUpperCase(),
      amount: parseFloat(amount),
      value: parseFloat(value || 0),
      price: parseFloat(price || 0),
      baseCurrency: baseCurrency,
      user: user.toLowerCase(),
      txHash: txHash,
      blockNumber: txReceipt.blockNumber,
      gasUsed: parseInt(gasUsed) || 0,
      gasPrice: gasPrice,
      slippage: parseFloat(slippage) || 0,
      fee: parseFloat(value || 0) * 0.003, // %0.3 fee estimate
      router: router,
      network: token.network,
      chainId: token.chainId,
      status: txReceipt.status === 1 ? 'CONFIRMED' : 'FAILED',
      confirmations: 1, // Basic confirmation count
      timestamp: new Date()
    });
    console.log('✅ Trade saved with ID:', trade._id);

    // Token'ın trade istatistiklerini güncelle
    if (trade.status === 'CONFIRMED') {
      await updateTokenTradeStats(tokenAddress);
      
      // Token'ın trading stats'ını güncelle
      await token.updateTradingStats(
        trade.value,
        trade.price,
        token.liquidity // Mevcut liquidity'yi koru
      );
    }

    res.json({
      success: true,
      message: 'Trade saved successfully',
      trade: trade.toApiResponse()
    });

  } catch (error) {
    console.error('❌ Trade save error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Trade with this transaction hash already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rastgele test verisi ekleme endpointi
app.post('/api/test-insert', async (req, res) => {
  try {
    // User ekle (varsa tekrar eklemez)
    const userAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const [user, userCreated] = await User.findOrCreate({
      where: { walletAddress: userAddress },
      defaults: {
        walletAddress: userAddress,
        username: 'testuser',
        email: 'testuser@example.com',
        isVerified: true
      }
    });

    // Token ekle (varsa tekrar eklemez)
    const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const [token, created] = await Token.findOrCreate({
      where: { address: tokenAddress },
      defaults: {
        address: tokenAddress,
        symbol: 'TEST',
        name: 'Test Token',
        decimals: 18,
        totalSupply: '1000000',
        creator: userAddress,
        txHash: '0xmocktokenhash' + Math.floor(Math.random()*1000000),
        blockNumber: 123456,
        description: 'Test amaçlı eklenmiş token',
        network: 'BSC',
        chainId: 56,
        verified: true
      }
    });

    // Trade ekle
    const tradeData = {
      tokenAddress: tokenAddress,
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      type: 'BUY',
      amount: '1.23',
      value: '100',
      price: '81.3',
      baseCurrency: 'BNB',
      user: userAddress,
      txHash: '0xmocktxhash' + Math.floor(Math.random()*1000000),
      blockNumber: 123456,
      gasUsed: 21000,
      gasPrice: '5000000000',
      network: 'BSC',
      chainId: 56,
      status: 'CONFIRMED',
      timestamp: new Date()
    };
    const newTrade = await Trade.create(tradeData);
    res.json({ success: true, user, token, trade: newTrade });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sadece trade ekleyen test endpointi
app.post('/api/test-add-trade', async (req, res) => {
  try {
    // Token ve user adresleri
    const tokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const userAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

    // Trade ekle
    const tradeData = {
      tokenAddress: tokenAddress,
      tokenSymbol: 'TEST',
      tokenName: 'Test Token',
      type: 'BUY',
      amount: '1.23',
      value: '100',
      price: '81.3',
      baseCurrency: 'BNB',
      user: userAddress,
      txHash: '0xmocktxhash' + Math.floor(Math.random()*1000000),
      blockNumber: 123456,
      gasUsed: 21000,
      gasPrice: '5000000000',
      network: 'BSC',
      chainId: 56,
      status: 'CONFIRMED',
      timestamp: new Date()
    };
    const newTrade = await Trade.create(tradeData);
    res.json({ success: true, trade: newTrade });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/api/trades/:tokenAddress', async (req, res) => {
  try {
    const tokenAddress = req.params.tokenAddress.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    // Sadece CONFIRMED trade'ler
    const where = {
      tokenAddress: tokenAddress,
      status: 'CONFIRMED'
    };
    // Toplam trade sayısı
    const totalCount = await Trade.count({ where });
    // Sayfa için trade'leri çek
    const trades = await Trade.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit,
      offset,
      attributes: [
        'id', 'type', 'amount', 'value', 'price', 'user', 'txHash', 'timestamp', 'tokenSymbol', 'tokenName'
      ]
    });
    res.json({ success: true, trades, totalCount });
  } catch (error) {
    console.error('❌ Trades fetch error:', error);
    res.status(500).json({ success: false, error: error.message || 'Trade fetch error', trades: [], totalCount: 0 });
  }
});

// Kullanıcının tradelerini getir
app.get('/api/trades/user/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = 25 } = req.query;

    const trades = await Trade.find({ 
      user: userAddress.toLowerCase() 
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .populate('tokenAddress', 'name symbol')
    .lean();

    res.json({
      success: true,
      trades: trades
    });

  } catch (error) {
    console.error('User trades fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      trades: []
    });
  }
});

// Trade istatistikleri
app.get('/api/trades/:tokenAddress/stats', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { period = '24h' } = req.query;

    console.log(`📊 Fetching trade stats for token: ${tokenAddress}`);

    const [tokenStats, tradingStats, volumeChart] = await Promise.all([
      Trade.getTokenStats(tokenAddress),
      Trade.getTokenTradingStats(tokenAddress),
      Trade.getVolumeChart(tokenAddress, period)
    ]);

    const stats = {
      byType: tokenStats,
      overall: tradingStats[0] || {
        totalTrades: 0,
        totalVolume: 0,
        totalAmount: 0,
        avgTradeSize: 0,
        avgTradeValue: 0,
        buyCount: 0,
        sellCount: 0,
        buySellRatio: 0,
        uniqueTraders: 0,
        firstTrade: null,
        lastTrade: null
      },
      volumeChart: volumeChart
    };

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Trade stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.get('/api/trades/user/:userAddress/stats', async (req, res) => {
  try {
    const { userAddress } = req.params;

    const userStats = await Trade.getUserStats(userAddress);

    res.json({
      success: true,
      stats: userStats
    });

  } catch (error) {
    console.error('User trade stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Son tradeleri getir (tüm tokenlar)
app.get('/api/trades/recent/:network?', async (req, res) => {
  try {
    const { network = 'BSC' } = req.params;
    const { limit = 20 } = req.query;

    const recentTrades = await Trade.getRecentTrades(parseInt(limit), network);

    res.json({
      success: true,
      trades: recentTrades
    });

  } catch (error) {
    console.error('Recent trades error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logo upload endpoint with Cloudinary
app.post('/api/upload/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    console.log('📤 Uploading to Cloudinary:', req.file.filename);
    
    // Check if Cloudinary is configured
    const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_API_KEY && 
                          process.env.CLOUDINARY_API_SECRET;
    
    if (useCloudinary) {
      // Upload to Cloudinary
      const { uploadToCloudinary } = require('./config/cloudinary');
      const cloudinaryResult = await uploadToCloudinary(req.file.path, 'token-logos');
      
      // Delete local file after upload
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
      
      if (cloudinaryResult.success) {
        console.log('✅ Logo uploaded to Cloudinary:', cloudinaryResult.url);
        
        return res.json({
          success: true,
          logoURL: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          filename: req.file.filename,
          size: cloudinaryResult.bytes,
          provider: 'cloudinary'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: cloudinaryResult.error
        });
      }
    } else {
      // Use local storage (fallback)
      console.log('ℹ️ Using local storage (Cloudinary not configured)');
      const logoURL = `/uploads/logos/${req.file.filename}`;
      
      console.log('✅ Logo uploaded locally:', req.file.filename);
      
      return res.json({
        success: true,
        logoURL: logoURL,
        filename: req.file.filename,
        size: req.file.size,
        provider: 'local'
      });
    }
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    
    // Clean up local file if exists
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Token creation confirm - GELİŞMİŞ VERSİYON
app.post('/api/token/confirm', async (req, res) => {
  try {
    console.log('🔍 Token confirmation request received:', JSON.stringify(req.body, null, 2));
    
    const { 
      txHash, 
      name, 
      symbol, 
      initialSupply, 
      userAddress, 
      website, 
      telegram, 
      twitter, 
      description,
      logoURL,
      decimals 
    } = req.body;
    
    // Validasyon
    if (!txHash) {
      console.log('❌ Missing txHash');
      return res.status(400).json({ 
        success: false,
        error: 'Transaction hash is required' 
      });
    }

    console.log('🔍 Confirming token creation with txHash:', txHash);

    // Transaction receipt'i al
    console.log('⏳ Getting transaction receipt...');
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.log('❌ Transaction receipt not found');
      return res.status(400).json({ 
        success: false,
        error: 'Transaction not found on blockchain. It might still be pending.' 
      });
    }

    console.log('✅ Transaction receipt found, status:', receipt.status);
    console.log('📊 Receipt logs count:', receipt.logs.length);

    if (receipt.status === 0) {
      console.log('❌ Transaction failed on blockchain');
      return res.status(400).json({ 
        success: false,
        error: 'Transaction failed on blockchain' 
      });
    }

    // GELİŞMİŞ EVENT TESPİTİ
    let realTokenAddress = null;
    
    console.log('🔍 Advanced event detection started...');
    
    // 1. Transaction detayları
    const tx = await provider.getTransaction(txHash);
    console.log('📄 Transaction to address:', tx.to);
    
    // 2. Contract creation kontrolü
    if (receipt.contractAddress) {
      realTokenAddress = receipt.contractAddress;
      console.log('🎉 Token address from contract creation:', realTokenAddress);
    }
    
    // 3. TokenCreated event'ini ara
    if (!realTokenAddress) {
      const tokenCreatedTopic = ethers.utils.id("TokenCreated(address,address,string,string,uint256,string)");
      
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        
        if (log.topics[0] === tokenCreatedTopic) {
          console.log('✅ TokenCreated event found in log', i);
          
          if (log.topics.length >= 2) {
            realTokenAddress = ethers.utils.getAddress('0x' + log.topics[1].substring(26));
            console.log('🎉 Token address extracted from TokenCreated:', realTokenAddress);
            break;
          }
        }
      }
    }
    
    // 4. Transfer event'lerinden token address'ini bul
    if (!realTokenAddress) {
      const transferTopic = ethers.utils.id("Transfer(address,address,uint256)");
      const tokenCreatedTopic = ethers.utils.id("TokenCreated(address,address,string)");
      
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        
        // Önce TokenCreated event'ini kontrol et
        if (log.topics[0] === tokenCreatedTopic) {
          console.log('🎯 Found TokenCreated event');
          realTokenAddress = '0x' + log.topics[1].substring(26);
          console.log('🎉 Token address from TokenCreated:', realTokenAddress);
          break;
        }
        
        // Sonra Transfer event'ini kontrol et
        if (!realTokenAddress && log.topics[0] === transferTopic) {
          // Eğer from address 0x0 ise, bu bir mint işlemidir
          if (log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            realTokenAddress = log.address;
            console.log('🎉 Token address from mint Transfer event:', realTokenAddress);
            break;
          }
        }
      }
    }

    if (!realTokenAddress) {
      console.log('❌ Token address not found with any method');
      console.log('🔍 All receipt logs:', receipt.logs);
      
      return res.status(400).json({ 
        success: false,
        error: 'Token address not found. Please check: 1) Factory address is correct, 2) Transaction is a token creation, 3) Network is correct' 
      });
    }

    console.log('✅ Token address confirmed:', realTokenAddress);

    // User'ı bul veya oluştur
    console.log('👤 Finding/creating user:', userAddress);
    const user = await User.findOrCreateByAddress(userAddress);
    console.log('✅ User processed:', user.walletAddress);

    // Token'ı database'e kaydet
    console.log('💾 Saving token to database...');
    console.log('📊 initialSupply received:', initialSupply, 'type:', typeof initialSupply);
    const tokenData = {
      address: realTokenAddress.toLowerCase(),
      name: name,
      symbol: symbol, 
      totalSupply: initialSupply.toString(),
      decimals: decimals || 18,
      creator: userAddress.toLowerCase(),
      creatorUserId: user.id, // UUID olarak user id'yi kullan
      txHash: txHash,
      isReal: true,
      website: website || '',
      telegram: telegram || '', 
      twitter: twitter || '',
      description: description || '',
      logoURL: logoURL || '',
      network: process.env.BSC_NETWORK === 'testnet' ? 'BSC' : 'BSC', // Enum tipine uygun olarak BSC
      metadataURI: "ipfs://default",
      chainId: process.env.BSC_NETWORK === 'testnet' ? 97 : 56, // BSC Testnet: 97, BSC Mainnet: 56
      totalVolume: 0,
      totalTrades: 0,
      price: 0,
      marketCap: 0,
      liquidity: 0
    };

    console.log('📦 Token data to save:', tokenData);

    // Token'ı kaydetmeden önce kontrol et
    const existingToken = await Token.findOne({
      where: {
        address: realTokenAddress.toLowerCase()
      }
    });
    if (existingToken) {
      console.log('⚠️ Token already exists in database');
      return res.status(400).json({ 
        success: false,
        error: 'Token already exists in database' 
      });
    }

    const token = await Token.create(tokenData);
    console.log('✅ Token saved to database with ID:', token._id);

    // User'ın tokensCreated listesine ekle
    console.log('📝 Updating user tokens list...');
    user.tokensCreated.push(token.address);
    await user.save();
    console.log('✅ User updated with new token');

    // ✅ AUTO-APPROVAL: Platform wallet approves LiquidityAdder for LP operations
    console.log('🔐 Setting up auto-approval for LiquidityAdder...');
    try {
      const platformPrivateKey = process.env.PRIVATE_KEY;
      const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
      
      if (platformPrivateKey && liquidityAdderAddress) {
        const platformSigner = new ethers.Wallet(platformPrivateKey, provider);
        const tokenContract = new ethers.Contract(
          realTokenAddress,
          ['function approve(address spender, uint256 amount) returns (bool)'],
          platformSigner
        );
        
        // Approve max amount
        const approveTx = await tokenContract.approve(
          liquidityAdderAddress,
          ethers.MaxUint256
        );
        
        console.log('✅ Approval tx submitted:', approveTx.hash);
        const approvalReceipt = await approveTx.wait();
        console.log('✅ Auto-approval confirmed:', approvalReceipt.hash);
      } else {
        console.warn('⚠️ Auto-approval skipped: missing environment variables');
      }
    } catch (approvalError) {
      console.warn('⚠️ Auto-approval failed (non-critical):', approvalError.message);
      // Don't fail token creation if approval fails
    }

    console.log('🎉 Token creation process completed successfully!');

    res.json({ 
      success: true,
      message: 'Token created successfully!',
      tokenAddress: realTokenAddress,
      token: token,
      bscscanUrl: `https://${process.env.BSC_NETWORK === 'testnet' ? 'testnet.' : ''}bscscan.com/token/${realTokenAddress}`,
      dexscreenerUrl: `https://dexscreener.com/bsc/${realTokenAddress}`
    });

  } catch (error) {
    console.error('❌ Token confirmation error:', error);
    console.error('🔍 Error details:', error);
    
    if (error.code === 11000) {
      console.log('⚠️ Token already exists in database');
      return res.status(400).json({ 
        success: false,
        error: 'Token already exists in database' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

        // Token oluşturma
app.post('/api/token/create', createTokenLimiter, validateTokenCreation, validateWalletHeader, async (req, res) => {
  try {
    console.log('📦 Token creation request received:', req.body);
    
    const { name, symbol, initialSupply, decimals, metadataURI, userAddress, liquidityInfo } = req.body;
    
    // Validasyon
    if (!name || !symbol || !initialSupply || !userAddress) {
      console.log('❌ Missing required fields:', { name, symbol, initialSupply, userAddress });
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: name, symbol, initialSupply, userAddress' 
      });
    }

    if (symbol.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Symbol must be 10 characters or less'
      });
    }

    console.log('🎯 Creating token for user:', userAddress);
    console.log('💧 Liquidity info:', liquidityInfo);

    // Factory bağlantısını kontrol et
    if (!factory) {
      const isInitialized = await initializeFactory();
      if (!isInitialized) {
        return res.status(500).json({ 
          success: false,
          error: 'Blockchain connection failed' 
        });
      }
    }

    // Factory'nin hazır olduğundan emin ol
    try {
      const owner = await factory.owner();
      console.log('✅ Factory ready, owner:', owner);
    } catch (error) {
      console.error('❌ Factory not ready:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Factory contract not ready' 
      });
    }

    // Factory event listener'ı ekle
    factory.on("TokenCreated", (tokenAddress, creator, tier, event) => {
      console.log('🎉 New token created:', {
        tokenAddress,
        creator,
        tier,
        transactionHash: event.transactionHash
      });
    });

    // User'ı bul veya oluştur
    const user = await User.findOrCreateByAddress(userAddress.toLowerCase());
    console.log('✅ User found:', user.walletAddress);    // Transaction data ve fee hesaplama
    const {
      tier = 'standard',
      marketingTax = 3,
      liquidityTax = 2,
      autoBurn = false
    } = req.body;

    // Factory üzerinden fee'yi kontrol et
    const fee = await factory.getTierFee(tier);
    console.log(`💰 Creation fee for ${tier} tier:`, ethers.utils.formatEther(fee), 'BNB');

    // Get template address
    const templateAddress = await factory.memeTokenTemplate();
    console.log('📄 Template address:', templateAddress);
    
    if (!templateAddress || templateAddress === ethers.constants.AddressZero) {
      return res.status(500).json({
        success: false,
        error: 'Token template not configured'
      });
    }

    // Transaction data'yı hazırla
    const tokenDecimals = decimals || 18;
    // IMPORTANT: Send raw supply - the contract will apply decimals!
    const rawSupply = BigInt(initialSupply.toString());
    console.log(`💰 Total Supply: ${initialSupply} tokens = ${rawSupply.toString()} raw (contract will apply ${tokenDecimals} decimals)`);
    
    const data = factory.interface.encodeFunctionData('createToken', [
      name,
      symbol,
      rawSupply,
      tokenDecimals,
      metadataURI || "ipfs://default",
      tier || "basic",
      parseInt(marketingTax) || 0,
      parseInt(liquidityTax) || 0,
      Boolean(autoBurn) || false
    ]);

    console.log('✅ Transaction data prepared');

    // 🔥 LP BNB MIKTARINI FEE'YE EKLE!
    let totalValue = fee;
    if (liquidityInfo && liquidityInfo.bnbAmount) {
      const lpBnbAmount = ethers.utils.parseEther(liquidityInfo.bnbAmount.toString());
      totalValue = fee.add(lpBnbAmount);
      console.log('💧 LP BNB amount:', ethers.utils.formatEther(lpBnbAmount), 'BNB');
      console.log('💰 Total value (fee + LP):', ethers.utils.formatEther(totalValue), 'BNB');
    }

    // Gas limit tahmini
    const estimatedGas = await factory.estimateGas.createToken(
      name,
      symbol,
      rawSupply,
      tokenDecimals,
      metadataURI || "ipfs://default",
      tier || "basic",
      parseInt(marketingTax) || 0,
      parseInt(liquidityTax) || 0,
      Boolean(autoBurn) || false,
      {
        value: fee // Gas tahmini için sadece fee kullan
      }
    );

    // Gas limit'e %20 buffer ekle
    const gasLimit = estimatedGas.mul(120).div(100);
    
    console.log('⛽ Estimated gas limit:', gasLimit.toString());

    res.json({ 
      success: true,
      message: '✅ Confirm transaction in your wallet',
      transaction: {
        to: factoryAddress,
        data: data,
        value: totalValue.toHexString(), // 🔥 FEE + LP BNB!
        from: userAddress,
        gasLimit: gasLimit.toString()
      },
      user: {
        walletAddress: user.walletAddress,
        tokensCount: user.tokensCreated.length
      },
      liquidityInfo: liquidityInfo // LP bilgisini geri döndür
    });

  } catch (error) {
    console.error('❌ Token creation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Yardımcı fonksiyon: Token trade istatistiklerini güncelle
async function updateTokenTradeStats(tokenAddress) {
  try {
    const stats = await Trade.aggregate([
      { $match: { tokenAddress: tokenAddress.toLowerCase() } },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalVolume: { $sum: '$value' },
          buyCount: {
            $sum: { $cond: [{ $eq: ['$type', 'BUY'] }, 1, 0] }
          },
          sellCount: {
            $sum: { $cond: [{ $eq: ['$type', 'SELL'] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      await Token.findOneAndUpdate(
        { address: tokenAddress.toLowerCase() },
        {
          $set: {
            'tradeStats.totalTrades': stats[0].totalTrades,
            'tradeStats.totalVolume': stats[0].totalVolume,
            'tradeStats.buyCount': stats[0].buyCount,
            'tradeStats.sellCount': stats[0].sellCount,
            'lastTradeAt': new Date()
          }
        }
      );
      console.log(`✅ Updated trade stats for token: ${tokenAddress}`);
    }
  } catch (error) {
    console.error('❌ Trade stats update error:', error);
  }
}

// ==================== FULL ADMIN MANAGEMENT ENDPOINTS ====================
// Admin: Database verilerini temizle (yapı bozulmaz, sadece veri silinir)
app.post('/api/admin/clear-database', requireAdmin, async (req, res) => {
  try {
    // Tabloları teker teker silerek hangisinde hata olduğunu bul
    const models = [
      'Trade', 'TokenHype', 'ActivityLog', 'ContactMessage', 
      'Campaign', 'Token', 'User'
    ];

    for (const modelName of models) {
      try {
        const Model = require(`./models/${modelName}`);
        await Model.destroy({ where: {}, force: true });
      } catch (modelError) {
        return res.status(500).json({ 
          success: false, 
          error: `${modelName} temizlenemedi: ${modelError.message}` 
        });
      }
    }

    res.json({ success: true, message: 'Database verileri temizlendi.' });
  } catch (error) {
    console.error('Database temizleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all admins (Super Admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    // Permission check
    if (!req.session.adminData?.permissions?.manage_admins && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const admins = await Admin.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status', 'permissions', 'lastLogin', 'loginCount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      error: 'Adminler yüklenemedi'
    });
  }
});

// Create new admin (Super Admin only)
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    // Permission check
    if (!req.session.adminData?.permissions?.manage_admins && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { username, email, password, role, permissions } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Zorunlu alanları doldurun'
      });
    }

    // Check if username or email exists
    const existing = await Admin.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı veya email zaten kullanımda'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const newAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'admin',
      permissions: permissions || {
        manage_admins: false,
        manage_tokens: true,
        manage_users: true,
        manage_trades: true,
        manage_contact: true,
        view_analytics: true,
        manage_settings: false
      },
      status: 'active',
      createdBy: req.session.adminData?.id
    });

    // Log activity
    await logActivity(
      req, 
      'create', 
      'admin', 
      newAdmin.id, 
      `Yeni admin oluşturuldu: ${username}`,
      { role: newAdmin.role, email: newAdmin.email }
    );

    res.json({
      success: true,
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
        permissions: newAdmin.permissions
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    await logActivity(req, 'create', 'admin', null, `Admin oluşturma başarısız: ${error.message}`, {}, 'failed');
    res.status(500).json({
      success: false,
      error: 'Admin oluşturulamadı'
    });
  }
});

// Update admin
app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    // Permission check
    if (!req.session.adminData?.permissions?.manage_admins && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { id } = req.params;
    const { username, email, password, role, permissions, status } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin bulunamadı'
      });
    }

    // Super admin can't be modified by regular admins
    if (admin.role === 'super_admin' && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin düzenlenemez'
      });
    }

    // Track changes for logging
    const changes = {};
    if (username && username !== admin.username) changes.username = { old: admin.username, new: username };
    if (email && email !== admin.email) changes.email = { old: admin.email, new: email };
    if (password) changes.password = 'changed';
    if (role && role !== admin.role) changes.role = { old: admin.role, new: role };
    if (status && status !== admin.status) changes.status = { old: admin.status, new: status };

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) admin.password = await bcrypt.hash(password, 10);
    if (role && req.session.adminData?.role === 'super_admin') admin.role = role;
    if (permissions) admin.permissions = permissions;
    if (status) admin.status = status;

    await admin.save();

    // Log the update
    const changeDescription = Object.keys(changes).map(key => {
      if (key === 'password') return 'Şifre değiştirildi';
      if (typeof changes[key] === 'object') {
        return `${key}: ${changes[key].old} → ${changes[key].new}`;
      }
      return key;
    }).join(', ');

    await logActivity(
      req, 
      'update', 
      'admin', 
      admin.id, 
      `Admin güncellendi: ${admin.username} (${changeDescription})`,
      { changes }
    );

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin güncellenemedi'
    });
  }
});

// Delete admin
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    // Permission check
    if (!req.session.adminData?.permissions?.manage_admins && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { id } = req.params;

    // Can't delete yourself
    if (parseInt(id) === req.session.adminData?.id) {
      return res.status(400).json({
        success: false,
        error: 'Kendinizi silemezsiniz'
      });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin bulunamadı'
      });
    }

    // Can't delete super admin
    if (admin.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin silinemez'
      });
    }

    const deletedAdminInfo = {
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    await admin.destroy();

    // Log the deletion
    await logActivity(
      req,
      'delete',
      'admin',
      id,
      `Admin silindi: ${deletedAdminInfo.username}`,
      deletedAdminInfo
    );

    res.json({
      success: true,
      message: 'Admin silindi'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin silinemedi'
    });
  }
});

// Get all tokens with management
app.get('/api/admin/tokens', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { symbol: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tokens = await Token.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creatorUser',
        attributes: ['walletAddress']
      }]
    });

    res.json({
      success: true,
      tokens: tokens.rows,
      total: tokens.count,
      pages: Math.ceil(tokens.count / limit)
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Tokenler yüklenemedi'
    });
  }
});

// Delete token (Admin action)
app.delete('/api/admin/tokens/:address', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_tokens) {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { address } = req.params;
    const token = await Token.findOne({ where: { address: address.toLowerCase() } });

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token bulunamadı'
      });
    }

    const tokenInfo = {
      name: token.name,
      symbol: token.symbol,
      address: token.address
    };

    await token.destroy();

    // Log the deletion
    await logActivity(
      req,
      'delete',
      'token',
      address,
      `Token silindi: ${tokenInfo.name} (${tokenInfo.symbol})`,
      tokenInfo
    );

    res.json({
      success: true,
      message: 'Token silindi'
    });
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({
      success: false,
      error: 'Token silinemedi'
    });
  }
});

// Update token (Admin action)
app.patch('/api/admin/tokens/:address', requireAdmin, async (req, res) => {
  try {
    // 🚨 YETKİ KONTROLÜ
    if (!req.session.adminData?.permissions?.manage_tokens) {
      console.log('❌ Yetersiz yetki - manage_tokens permission eksik');
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    // 🚨 OTOMATİK SYNC/SYSTEM İSTEKLERİNİ TESPİT ET VE ENGELLE
    const isSystemAutoUpdate = 
      req.body.liquidityLocks !== undefined ||
      req.body.creator !== undefined || 
      req.body.txHash !== undefined ||
      req.body.totalVolume !== undefined ||
      req.body.price !== undefined ||
      req.body.marketCap !== undefined ||
      req.body.chainId !== undefined;
    
    if (isSystemAutoUpdate) {
      console.log('🛑 SİSTEM OTOMATİK GÜNCELLEME İSTEĞİ ENGELLENDİ:', {
        hasLiquidityLocks: req.body.liquidityLocks !== undefined,
        hasCreator: req.body.creator !== undefined,
        hasTxHash: req.body.txHash !== undefined,
        hasPriceData: req.body.price !== undefined
      });
      return res.json({ 
        success: true, 
        message: 'System auto-update handled separately' 
      });
    }

    // 🚨 SADECE MANUEL ADMIN GÜNCELLEMELERİNE İZİN VER
    const isManualAdminUpdate = 
      req.body.newAddress !== undefined ||
      req.body.name !== undefined ||
      req.body.symbol !== undefined ||
      req.body.tier !== undefined ||
      req.body.description !== undefined ||
      req.body.website !== undefined ||
      req.body.telegram !== undefined ||
      req.body.twitter !== undefined ||
      req.body.logoURL !== undefined ||
      req.body.isActive !== undefined;
    
    if (!isManualAdminUpdate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Admin updates require specific fields (name, symbol, tier, social links, etc.)' 
      });
    }

    const { address } = req.params;
    const { 
      name, 
      symbol, 
      description, 
      website, 
      telegram, 
      twitter, 
      tier,
      logoURL,
      totalSupply,
      decimals,
      isActive,
      newAddress
    } = req.body;
    
    // Find token
    const token = await Token.findOne({ where: { address: address.toLowerCase() } });

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // Save old data for activity log
    const oldData = {
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      website: token.website,
      telegram: token.telegram,
      twitter: token.twitter,
      tier: token.tier,
      logoURL: token.logoURL,
      totalSupply: token.totalSupply,
      decimals: token.decimals,
      isActive: token.isActive,
      address: token.address
    };

    // 🔄 TOKEN ADDRESS DEĞİŞİKLİĞİ KONTROLÜ
    let finalAddress = token.address;
    
    if (newAddress && newAddress !== address) {
      // Validate new address format
      if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token address format'
        });
      }

      // Check if address is unique
      const existingToken = await Token.findOne({ where: { address: newAddress.toLowerCase() } });
      if (existingToken) {
        return res.status(400).json({
          success: false,
          error: 'This token address is already in use'
        });
      }

      // Handle address change if provided
      token.address = newAddress.toLowerCase();
      finalAddress = newAddress.toLowerCase();
    }

    // Update all fields
    if (name !== undefined) token.name = name;
    if (symbol !== undefined) token.symbol = symbol;
    if (description !== undefined) token.description = description;
    if (website !== undefined) token.website = website;
    if (telegram !== undefined) token.telegram = telegram;
    if (twitter !== undefined) token.twitter = twitter;
    if (tier !== undefined) token.tier = tier;
    if (logoURL !== undefined) token.logoURL = logoURL;
    if (totalSupply !== undefined) token.totalSupply = totalSupply;
    if (decimals !== undefined) token.decimals = decimals;
    if (isActive !== undefined) token.isActive = isActive;

    // Save to database
    try {
      await token.save();
    } catch (saveError) {
      console.error('Token save error:', saveError.message);
      throw new Error(`Database save failed: ${saveError.message}`);
    }

    // Verify update
    const updatedToken = await Token.findOne({ 
      where: { address: finalAddress.toLowerCase() } 
    });

    if (!updatedToken) {
      return res.status(500).json({
        success: false,
        error: 'Token update verification failed'
      });
    }

    // Direct SQL update as backup
    try {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (symbol !== undefined) updateData.symbol = symbol;
      if (description !== undefined) updateData.description = description;
      if (website !== undefined) updateData.website = website;
      if (telegram !== undefined) updateData.telegram = telegram;
      if (twitter !== undefined) updateData.twitter = twitter;
      if (tier !== undefined) updateData.tier = tier;
      if (logoURL !== undefined) updateData.logoURL = logoURL;
      if (totalSupply !== undefined) updateData.totalSupply = totalSupply;
      if (decimals !== undefined) updateData.decimals = decimals;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      if (newAddress && newAddress !== address) {
        updateData.address = newAddress.toLowerCase();
      }

      if (Object.keys(updateData).length > 0) {
        await Token.update(updateData, {
          where: { address: address.toLowerCase() }
        });
      }
    } catch (directUpdateError) {
      console.error('Direct update error:', directUpdateError.message);
    }    // 📝 ACTIVITY LOG KAYDET
    await logActivity(
      req,
      'update',
      'token',
      finalAddress,
      `Token güncellendi: ${token.name} (${token.symbol})`,
      { 
        oldData, 
        newData: { 
          name, 
          symbol, 
          description, 
          website, 
          telegram, 
          twitter, 
          tier,
          logoURL,
          totalSupply,
          decimals,
          isActive,
          address: finalAddress
        } 
      }
    );

    console.log('📤 Client\'a başarılı yanıt gönderiliyor');
    console.log('=== ✅ MANUEL ADMIN GÜNCELLEME TAMAMLANDI ===');
    
    // 🚨 GÜNCELLENMİŞ TOKEN'I TEKRAR OKU VE GÖNDER
    const finalToken = await Token.findOne({ where: { address: finalAddress.toLowerCase() } });
    
    res.json({
      success: true,
      message: 'Token başarıyla güncellendi',
      token: finalToken
    });

  } catch (error) {
    console.error('❌ TOKEN GÜNCELLEME HATASI:', error);
    console.error('❌ Hata detayı:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Token güncellenemedi'
    });
  }
});
// Get all users with management
app.get('/api/admin/all-users', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_users) {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { walletAddress: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'walletAddress', 'username', 'status', 'badges', 'createdAt', 'banReason', 'banExpiresAt']
    });

    res.json({
      success: true,
      users: users.rows,
      total: users.count,
      pages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcılar yüklenemedi'
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Belirli kullanıcının detaylarını getir
 */
app.get('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get user detail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Kullanıcı durumunu değiştir (active, suspended, banned)
 */
app.put('/api/admin/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason, duration } = req.body; // duration in days

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    user.status = status;
    user.banReason = reason || null;
    
    // Süreli ban için expiry set et
    if (status === 'suspended' && duration) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
      user.banExpiresAt = expiryDate;
    } else if (status === 'active') {
      user.banExpiresAt = null;
    }
    
    await user.save();
    
    // Log activity
    await logActivity(
      req,
      'update',
      'user',
      userId,
      `Kullanıcı durumu değiştirildi: ${status}${reason ? ` - Sebep: ${reason}` : ''}`
    );

    res.json({ 
      success: true, 
      message: `Kullanıcı durumu ${status} olarak ayarlandı`,
      user 
    });
  } catch (error) {
    console.error('❌ Update user status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/badge
 * Kullanıcıya rozet ekle
 */
app.post('/api/admin/users/:userId/badge', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { badge } = req.body;

    console.log('🔵 Badge endpoint - userId:', userId, 'badge:', badge);

    if (!badge || typeof badge !== 'string') {
      console.error('❌ Badge validation failed');
      return res.status(400).json({ success: false, error: 'Rozet ismi gerekli' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }
    
    console.log('📊 User before:', user.id, 'badges:', user.badges);
    
    const badges = user.badges || [];
    if (!badges.includes(badge)) {
      badges.push(badge);
      // Sequelize'de array güncellemesi için setDataValue ve changed kullan
      user.set('badges', badges);
      user.changed('badges', true);
      const savedUser = await user.save();
      console.log('✅ Badge saved. New badges:', savedUser.badges);
    } else {
      console.log('⚠️ Badge already exists:', badge);
    }

    // Log activity
    await logActivity(req, 'create', 'badge', userId, `Rozet eklendi: ${badge}`);

    // User'ı yeniden oku database'den
    const updatedUser = await User.findByPk(userId);
    console.log('🟢 Response:', { success: true, badges: updatedUser.badges });
    res.json({ success: true, message: 'Rozet eklendi', badges: updatedUser.badges });
  } catch (error) {
    console.error('❌ Add badge error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:userId/badge/:badge
 * Kullanıcıdan rozet çıkar
 */
app.delete('/api/admin/users/:userId/badge/:badge', requireAdmin, async (req, res) => {
  try {
    const { userId, badge } = req.params;
    const decodedBadge = decodeURIComponent(badge);

    console.log('🔵 Remove badge - userId:', userId, 'badge:', decodedBadge);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    const badges = user.badges || [];
    const filtered = badges.filter(b => b !== decodedBadge);
    
    user.set('badges', filtered);
    user.changed('badges', true);
    const savedUser = await user.save();

    console.log('✅ Badge removed. New badges:', savedUser.badges);

    // Log activity
    await logActivity(req, 'delete', 'badge', userId, `Rozet çıkarıldı: ${decodedBadge}`);

    // User'ı yeniden oku
    const updatedUser = await User.findByPk(userId);
    res.json({ success: true, message: 'Rozet çıkarıldı', badges: updatedUser.badges });
  } catch (error) {
    console.error('❌ Remove badge error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/users/:userId/info
 * Kullanıcı bilgilerini düzenle
 */
app.put('/api/admin/users/:userId/info', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, description } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (description) user.description = description;

    await user.save();

    // Log activity
    await logActivity(req, 'update', 'user_info', userId, `Kullanıcı bilgileri güncellendi`);

    res.json({ success: true, message: 'Bilgiler güncellendi', user });
  } catch (error) {
    console.error('❌ Update user info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all trades with management
app.get('/api/admin/all-trades', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_trades) {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;

    const trades = await Trade.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Token,
          as: 'token',
          attributes: ['name', 'symbol', 'address']
        },
        {
          model: User,
          as: 'trader',
          attributes: ['walletAddress']
        }
      ]
    });

    res.json({
      success: true,
      trades: trades.rows,
      total: trades.count,
      pages: Math.ceil(trades.count / limit)
    });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({
      success: false,
      error: 'İşlemler yüklenemedi'
    });
  }
});

// Get site settings
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await SiteSettings.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayarlar yüklenemedi'
    });
  }
});

// Update site setting
app.patch('/api/admin/settings/:id', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_settings && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { id } = req.params;
    const { value } = req.body;

    const setting = await SiteSettings.findByPk(id);
    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Ayar bulunamadı'
      });
    }

    const oldValue = setting.value;
    setting.value = value;
    setting.updatedBy = req.session.adminData?.id;
    await setting.save();

    // Log the setting change
    await logActivity(
      req,
      'update',
      'setting',
      id,
      `Ayar güncellendi: ${setting.key}`,
      {
        key: setting.key,
        oldValue,
        newValue: value,
        category: setting.category
      }
    );

    res.json({
      success: true,
      setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayar güncellenemedi'
    });
  }
});

// Create site setting
app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_settings && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { key, value, type, category, description } = req.body;

    const setting = await SiteSettings.create({
      key,
      value,
      type: type || 'string',
      category: category || 'general',
      description,
      updatedBy: req.session.adminData?.id
    });

    // Log the creation
    await logActivity(
      req,
      'create',
      'setting',
      setting.id,
      `Yeni ayar oluşturuldu: ${setting.key}`,
      {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        type: setting.type
      }
    );

    res.json({
      success: true,
      setting
    });
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayar oluşturulamadı'
    });
  }
});

// Update site setting (Bakım modu için de kullanılır)
app.patch('/api/admin/settings/:id', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_settings && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { id } = req.params;
    const { value, type, category, description } = req.body;
    
    const setting = await SiteSettings.findByPk(id);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Ayar bulunamadı'
      });
    }

    const oldValue = setting.value;

    // Update fields
    if (value !== undefined) setting.value = value;
    if (type) setting.type = type;
    if (category) setting.category = category;
    if (description !== undefined) setting.description = description;
    setting.updatedBy = req.session.adminData?.id;

    await setting.save();

    // Log the update
    await logActivity(
      req,
      'update',
      'setting',
      id,
      `Ayar güncellendi: ${setting.key}`,
      { oldValue, newValue: setting.value }
    );

    res.json({
      success: true,
      message: 'Ayar güncellendi',
      setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayar güncellenemedi'
    });
  }
});

// Delete site setting
app.delete('/api/admin/settings/:id', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_settings && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { id } = req.params;
    const setting = await SiteSettings.findByPk(id);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Ayar bulunamadı'
      });
    }

    const settingInfo = {
      key: setting.key,
      value: setting.value,
      category: setting.category
    };

    await setting.destroy();

    // Log the deletion
    await logActivity(
      req,
      'delete',
      'setting',
      id,
      `Ayar silindi: ${settingInfo.key}`,
      settingInfo
    );

    res.json({
      success: true,
      message: 'Ayar silindi'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Ayar silinemedi'
    });
  }
});

// Get admin dashboard analytics
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    // Super admin has all permissions, regular check for others
    if (req.session.adminData?.role !== 'super_admin' && !req.session.adminData?.permissions?.view_analytics) {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const totalUsers = await User.count();
    const totalTokens = await Token.count();
    const totalTrades = await Trade.count();
    const totalPosts = await Post.count();
    const totalVotes = await Vote.count();
    const totalVolume = await Trade.sum('amount') || 0;
    const totalMessages = await ContactMessage.count();
    const newMessages = await ContactMessage.count({ where: { status: 'new' } });

    // Last 7 days stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    const newTokens = await Token.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    const newTrades = await Trade.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    const newPosts = await Post.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    res.json({
      success: true,
      analytics: {
        total: {
          users: totalUsers,
          tokens: totalTokens,
          trades: totalTrades,
          posts: totalPosts,
          votes: totalVotes,
          volume: totalVolume,
          messages: totalMessages,
          newMessages
        },
        lastWeek: {
          users: newUsers,
          tokens: newTokens,
          trades: newTrades,
          posts: newPosts
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analizler yüklenemedi'
    });
  }
});

// Get activity logs
app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity, adminId, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (adminId) where.adminId = adminId;
    if (status) where.status = status;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'adminId', 'adminUsername', 'action', 'entity', 
        'entityId', 'description', 'metadata', 'ipAddress', 
        'status', 'createdAt'
      ]
    });

    res.json({
      success: true,
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Loglar yüklenemedi'
    });
  }
});

// Bakım modu kontrolü için public endpoint
app.get('/api/settings/maintenance', async (req, res) => {
  try {
    const setting = await SiteSettings.findOne({
      where: { key: 'maintenanceMode' }
    });

    res.json({
      success: true,
      maintenanceMode: setting ? setting.value === 'true' : false
    });
  } catch (error) {
    console.error('Get maintenance mode error:', error);
    res.json({
      success: true,
      maintenanceMode: false
    });
  }
});

// ==================== HYPE SYSTEM ENDPOINTS ====================

// Get hype prices
app.get('/api/hype/prices', async (req, res) => {
  try {
    const prices = {
      bronze: { price: 0.1, duration: 24, features: ['Slider\'da gösterim', 'Bronz rozetli'] },
      silver: { price: 0.25, duration: 24, features: ['Slider\'da gösterim', 'Gümüş rozetli', 'Parlama efekti'] },
      gold: { price: 0.5, duration: 24, features: ['Slider\'da gösterim', 'Altın rozetli', 'Parlama + ateş efekti'] },
      platinum: { price: 1.0, duration: 24, features: ['Slider\'da gösterim', 'Platinum rozetli', 'Tüm efektler', 'Üst sırada'] }
    };
    
    res.json({
      success: true,
      prices
    });
  } catch (error) {
    console.error('Get hype prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Fiyatlar yüklenemedi'
    });
  }
});

// Get active hypes (public)
app.get('/api/hype/active', async (req, res) => {
  try {
    const now = new Date();
    
    const hypes = await TokenHype.findAll({
      where: {
        status: 'active',
        endTime: { [Op.gt]: now }
      },
      include: [{
        model: Token,
        as: 'token',
        attributes: ['address', 'name', 'symbol', 'description', 'logoURL', 'totalSupply']
      }],
      order: [
        ['tier', 'DESC'],
        ['position', 'ASC'],
        ['startTime', 'DESC']
      ]
    });

    res.json({
      success: true,
      hypes
    });
  } catch (error) {
    console.error('Get active hypes error:', error);
    res.status(500).json({
      success: false,
      error: 'Hypelar yüklenemedi'
    });
  }
});

// Get hype status for specific token
app.get('/api/hype/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const now = new Date();
    
    const hype = await TokenHype.findOne({
      where: {
        tokenAddress: address.toLowerCase(),
        status: 'active',
        endTime: { [Op.gt]: now }
      }
    });

    if (hype) {
      res.json({
        active: true,
        tier: hype.tier,
        title: hype.title,
        endDate: hype.endTime,
        position: hype.position
      });
    } else {
      res.json({
        active: false
      });
    }
  } catch (error) {
    console.error('Get token hype error:', error);
    res.status(500).json({
      success: false,
      error: 'Hype durumu kontrol edilemedi'
    });
  }
});

// Create hype (user payment)
app.post('/api/hype/create', async (req, res) => {
  try {
    const { tokenAddress, tier, transactionHash } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Giriş yapmalısınız'
      });
    }

    // Check if token exists
    const token = await Token.findOne({ where: { address: tokenAddress.toLowerCase() } });
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token bulunamadı'
      });
    }

    // Check if already hyped
    const existingHype = await TokenHype.findOne({
      where: {
        tokenAddress: tokenAddress.toLowerCase(),
        status: 'active',
        endTime: { [Op.gt]: new Date() }
      }
    });

    if (existingHype) {
      return res.status(400).json({
        success: false,
        error: 'Bu token zaten hypelanmış'
      });
    }

    // Get price
    const prices = {
      bronze: 0.1,
      silver: 0.25,
      gold: 0.5,
      platinum: 1.0
    };

    const price = prices[tier];
    if (!price) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz tier'
      });
    }

    // Create hype
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    const hype = await TokenHype.create({
      tokenAddress: tokenAddress.toLowerCase(),
      userId: req.user.id,
      tier,
      price,
      duration: 24,
      startTime,
      endTime,
      status: 'active',
      transactionHash
    });

    await logActivity(
      req,
      'create',
      'hype',
      hype.id,
      `Token hypelandı: ${token.name} (${tier})`,
      { tokenAddress, tier, price }
    );

    res.json({
      success: true,
      message: 'Token başarıyla hypelandı',
      hype
    });
  } catch (error) {
    console.error('Create hype error:', error);
    res.status(500).json({
      success: false,
      error: 'Hype oluşturulamadı'
    });
  }
});

// Admin: Get all hypes
app.get('/api/admin/hypes', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_tokens && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { page = 1, limit = 20, status, tier } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (tier && tier !== 'all') where.tier = tier;

    const hypes = await TokenHype.findAndCountAll({
      where,
      include: [{
        model: Token,
        as: 'token',
        attributes: ['address', 'name', 'symbol', 'logoURL']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      hypes: hypes.rows,
      total: hypes.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(hypes.count / limit)
    });
  } catch (error) {
    console.error('Get admin hypes error:', error);
    res.status(500).json({
      success: false,
      error: 'Hypelar yüklenemedi'
    });
  }
});

// Admin: Create hype (free)
app.post('/api/admin/hypes', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_tokens && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { tokenAddress, tier, duration = 24 } = req.body;

    const token = await Token.findOne({ where: { address: tokenAddress.toLowerCase() } });
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token bulunamadı'
      });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const hype = await TokenHype.create({
      tokenAddress: tokenAddress.toLowerCase(),
      adminId: req.session.adminData?.id,
      tier,
      price: 0,
      duration,
      startTime,
      endTime,
      status: 'active'
    });

    await logActivity(
      req,
      'create',
      'hype',
      hype.id,
      `Admin token hypeladı: ${token.name} (${tier})`,
      { tokenAddress, tier, duration }
    );

    res.json({
      success: true,
      message: 'Hype oluşturuldu',
      hype
    });
  } catch (error) {
    console.error('Admin create hype error:', error);
    res.status(500).json({
      success: false,
      error: 'Hype oluşturulamadı'
    });
  }
});

// Admin: Delete hype
app.delete('/api/admin/hypes/:id', requireAdmin, async (req, res) => {
  try {
    if (!req.session.adminData?.permissions?.manage_tokens && req.session.adminData?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Yetkiniz yok'
      });
    }

    const { id } = req.params;
    const hype = await TokenHype.findByPk(id);

    if (!hype) {
      return res.status(404).json({
        success: false,
        error: 'Hype bulunamadı'
      });
    }

    await hype.update({ status: 'cancelled' });

    await logActivity(
      req,
      'delete',
      'hype',
      id,
      `Hype iptal edildi: ${hype.tokenAddress}`,
      { tier: hype.tier }
    );

    res.json({
      success: true,
      message: 'Hype iptal edildi'
    });
  } catch (error) {
    console.error('Delete hype error:', error);
    res.status(500).json({
      success: false,
      error: 'Hype silinemedi'
    });
  }
});

// Track hype view
app.post('/api/hype/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    await TokenHype.increment('views', { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Track hype click
app.post('/api/hype/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    await TokenHype.increment('clicks', { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ============================================
// CAMPAIGN SYSTEM
// ============================================

// Public - Get active campaigns (for slider)
app.get('/api/campaigns/active', async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.findAll({
      where: {
        status: 'active',
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      },
      order: [
        ['featured', 'DESC'],
        ['priority', 'DESC'],
        ['startDate', 'DESC']
      ]
    });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Get active campaigns error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Public - Get all campaigns (for campaigns page)
app.get('/api/campaigns', async (req, res) => {
  try {
    const { status, category, featured } = req.query;
    const where = { status: 'active' };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const campaigns = await Campaign.findAll({
      where,
      order: [
        ['featured', 'DESC'],
        ['priority', 'DESC'],
        ['startDate', 'DESC']
      ]
    });

    res.json({
      success: true,
      campaigns,
      total: campaigns.length
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Public - Get campaign by slug or id
app.get('/api/campaigns/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by id first (if numeric), then by slug
    const isNumeric = /^\d+$/.test(identifier);
    const campaign = await Campaign.findOne({
      where: isNumeric ? { id: identifier } : { slug: identifier }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Track campaign view
app.post('/api/campaigns/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    await Campaign.increment('views', { where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false });
  }
});

// Track campaign click
app.post('/api/campaigns/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    await Campaign.increment('clicks', { where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false });
  }
});

// Admin - Get all campaigns
app.get('/api/admin/campaigns', requireAdmin, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Campaign.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      campaigns: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin - Create campaign
app.post('/api/admin/campaigns', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      content,
      imageUrl,
      bannerUrl,
      startDate,
      endDate,
      category,
      tags,
      externalUrl,
      buttonText,
      priority,
      featured
    } = req.body;

    // Validation
    if (!title || !slug || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Title, slug, start date and end date are required'
      });
    }

    // Check if slug already exists
    const existing = await Campaign.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Slug already exists'
      });
    }

    // Determine status based on dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    let status = 'draft';
    
    if (start <= now && end >= now) {
      status = 'active';
    } else if (end < now) {
      status = 'ended';
    }

    const campaign = await Campaign.create({
      title,
      slug,
      description,
      content,
      imageUrl,
      bannerUrl,
      startDate,
      endDate,
      status,
      category,
      tags: tags || [],
      externalUrl,
      buttonText: buttonText || 'Learn More',
      priority: priority || 0,
      featured: featured || false,
      adminId: req.admin.id
    });

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin - Update campaign
app.put('/api/admin/campaigns/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    await campaign.update(req.body);

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin - Delete campaign
app.delete('/api/admin/campaigns/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByPk(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    await campaign.destroy();

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Kullanıcı profilini adres ile getiren endpoint
app.get('/api/users/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log('[PROFILE] Adres:', address);
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.log('[PROFILE] Geçersiz adres!');
      return res.status(400).json({ success: false, error: 'Geçersiz adres' });
    }
    const user = await User.findOne({ where: { walletAddress: address.toLowerCase() } });
    console.log('[PROFILE] User:', user);
    if (!user) {
      console.log('[PROFILE] Kullanıcı bulunamadı!');
      return res.status(404).json({ success: false, error: 'Profil bulunamadı' });
    }
    let tokens = [];
    try {
  tokens = await Token.findAll({ where: { creator: address.toLowerCase() }, attributes: ['address', 'name', 'symbol', 'logoURL', 'price', 'totalVolume'] });
      console.log('[PROFILE] Tokens:', tokens);
    } catch (tokenErr) {
      console.error('[PROFILE] Token çekme hatası:', tokenErr);
    }
    let voteCount = 0;
    let trustScore = 0;
    try {
      voteCount = user.voteCount || 0;
      trustScore = user.trustScore || 0;
      console.log('[PROFILE] VoteCount:', voteCount, 'TrustScore:', trustScore);
    } catch (voteErr) {
      console.error('[PROFILE] Vote/TrustScore hatası:', voteErr);
    }
    let stats = {};
    try {
      stats = {
        totalTokens: tokens.length,
        followers: user.followers || 0,
        following: user.following || 0,
        avgRating: user.avgRating || 0,
        successfulLaunches: user.successfulLaunches || 0,
        totalVolume: tokens.reduce((acc, t) => {
          if (typeof t.volume === 'string' && t.volume.startsWith('$')) {
            const num = parseFloat(t.volume.replace(/[^\d.]/g, ''));
            return acc + (isNaN(num) ? 0 : num);
          }
          return acc;
        }, 0)
      };
      console.log('[PROFILE] Stats:', stats);
    } catch (statsErr) {
      console.error('[PROFILE] Stats hesaplama hatası:', statsErr);
    }
    res.json({
      success: true,
      profile: {
        ...user.toProfileResponse(),
        tokens,
        voteCount,
        trustScore,
        stats
      }
    });
  } catch (error) {
    console.error('[PROFILE] Sunucu hatası:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Kullanıcı cüzdanı ile profil oluşturma endpointi
// Kullanıcıya oylama göndermek için endpoint
app.post('/api/users/:address/vote', async (req, res) => {
  try {
    const { address } = req.params;
    const { type } = req.body; // 'up' veya 'down'
    const votingUser = req.headers['wallet-address']?.toLowerCase();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ success: false, error: 'Geçersiz adres' });
    }
    if (!votingUser || !/^0x[a-fA-F0-9]{40}$/.test(votingUser)) {
      return res.status(400).json({ success: false, error: 'Geçersiz veya eksik wallet-address header' });
    }
    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Geçersiz oy tipi' });
    }
    if (votingUser === address.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Kendi profilinize oy veremezsiniz' });
    }
    const user = await User.findOne({ where: { walletAddress: address.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }
    // Daha önce oy verilmiş mi kontrol et
    const existingVote = await Vote.findOne({ where: { votingUser, targetUser: address.toLowerCase() } });
    if (existingVote) {
      return res.status(400).json({ success: false, error: 'Bu profile zaten oy verdiniz' });
    }
    // Oy kaydını oluştur
    await Vote.create({ votingUser, targetUser: address.toLowerCase(), type });
    user.voteCount = (user.voteCount || 0) + 1;
    if (type === 'up') {
      user.trustScore = Math.min((user.trustScore || 0) + 1, 100);
    } else {
      user.trustScore = Math.max((user.trustScore || 0) - 1, 0);
    }
    await user.save();
    res.json({ success: true, voteCount: user.voteCount, trustScore: user.trustScore });
  } catch (error) {
    console.error('❌ Vote error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});
app.post('/api/users/connect', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'walletAddress zorunlu' });
    }
    const user = await User.findOrCreateByAddress(walletAddress);
    res.json({ success: true, profile: user.toProfileResponse() });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ==================== POSTS & SOCIAL ROUTES ====================

// Posts API routes
const postsRouter = require('./routes/posts');
const followRouter = require('./routes/followRoutes');
const usersRouter = require('./routes/users');

app.use('/api/posts', postsRouter);
app.use('/api/follow', followRouter);
app.use('/api/users', usersRouter);

// Başlangıçta bakım modu ayarını oluştur
const initializeSettings = async () => {
  try {
    // Eski maintenance_mode kayıtlarını sil (underscore olan)
    const oldMaintenanceSettings = await SiteSettings.findAll({
      where: { key: 'maintenance_mode' }
    });

    if (oldMaintenanceSettings.length > 0) {
      console.log(`⚠️  ${oldMaintenanceSettings.length} adet eski 'maintenance_mode' ayarı bulundu, siliniyor...`);
      for (const setting of oldMaintenanceSettings) {
        await setting.destroy();
      }
      console.log('✅ Eski maintenance_mode kayıtları silindi');
    }

    // maintenanceMode duplicate kontrolü
    const allMaintenanceSettings = await SiteSettings.findAll({
      where: { key: 'maintenanceMode' }
    });

    if (allMaintenanceSettings.length > 1) {
      console.log(`⚠️  ${allMaintenanceSettings.length} adet duplicate bakım modu ayarı bulundu, temizleniyor...`);
      // İlk kayıt hariç diğerlerini sil
      for (let i = 1; i < allMaintenanceSettings.length; i++) {
        await allMaintenanceSettings[i].destroy();
      }
      console.log('✅ Duplicate kayıtlar temizlendi');
    }

    // Ayar yoksa oluştur
    const maintenanceSetting = await SiteSettings.findOne({
      where: { key: 'maintenanceMode' }
    });

    if (!maintenanceSetting) {
      await SiteSettings.create({
        key: 'maintenanceMode',
        value: 'false',
        type: 'boolean',
        category: 'system',
        description: 'Site bakım modunu kontrol eder'
      });
      console.log('✅ Bakım modu ayarı oluşturuldu');
    } else {
      console.log('✅ Bakım modu ayarı mevcut');
    }
  } catch (error) {
    console.error('❌ Initialize settings error:', error);
  }
};

// ============================
// 📝 ADMIN POSTS ENDPOINTS
// ============================

/**
 * GET /api/admin/posts
 * Tüm postları admin paneli için getir
 */
app.get('/api/admin/posts', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    let where = {};
    if (status === 'pinned') {
      where.isPinned = true;
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      posts: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('❌ Get admin posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/posts/:postId
 * Postu sil
 */
app.delete('/api/admin/posts/:postId', requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post bulunamadı' });
    }

    await post.destroy();

    // Log activity
    await logActivity(
      req,
      'delete',
      'post',
      postId,
      `Post silindi: ${post.title}`
    );

    res.json({ success: true, message: 'Post başarıyla silindi' });
  } catch (error) {
    console.error('❌ Delete admin post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/admin/posts/:postId/pin
 * Postu pin/unpin yap
 */
app.patch('/api/admin/posts/:postId/pin', requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { pin } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post bulunamadı' });
    }

    post.isPinned = pin === true;
    await post.save();

    // Log activity
    await logActivity(
      req,
      'update',
      'post',
      postId,
      `Post ${pin ? 'pinlendi' : 'unpinlendi'}: ${post.title}`
    );

    res.json({ 
      success: true, 
      message: `Post ${pin ? 'pinlendi' : 'unpinlendi'}`,
      post 
    });
  } catch (error) {
    console.error('❌ Pin post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// 🗳️ ADMIN VOTES ENDPOINTS
// ============================

/**
 * GET /api/admin/votes
 * Tüm oyları admin paneli için getir
 */
app.get('/api/admin/votes', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Vote.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      votes: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('❌ Get admin votes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/votes/:voteId
 * Oyı sil (spam/abuse için)
 */
app.delete('/api/admin/votes/:voteId', requireAdmin, async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findByPk(voteId);
    if (!vote) {
      return res.status(404).json({ success: false, error: 'Oy bulunamadı' });
    }

    await vote.destroy();

    // Log activity
    await logActivity(
      req,
      'delete',
      'vote',
      voteId,
      `Oy silindi: ${vote.votingUser} -> ${vote.targetUser} (${vote.type})`
    );

    res.json({ success: true, message: 'Oy başarıyla silindi' });
  } catch (error) {
    console.error('❌ Delete admin vote error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/analytics
 * Analytics istatistiklerini güncelle (Posts dahil)
 */
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTokens = await Token.count();
    const totalTrades = await Trade.count();
    const totalPosts = await Post.count();
    const totalVotes = await Vote.count();
    
    const totalVolume = await Trade.sum('amount') || 0;
    const totalMessages = await ContactMessage.count();
    const newMessages = await ContactMessage.count({ where: { status: 'new' } });

    // Last week stats
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const lastWeekUsers = await User.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } });
    const lastWeekTokens = await Token.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } });
    const lastWeekTrades = await Trade.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } });
    const lastWeekPosts = await Post.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } });

    const analytics = {
      total: {
        users: totalUsers,
        tokens: totalTokens,
        trades: totalTrades,
        posts: totalPosts,
        votes: totalVotes,
        volume: parseFloat(totalVolume),
        messages: totalMessages,
        newMessages
      },
      lastWeek: {
        users: lastWeekUsers,
        tokens: lastWeekTokens,
        trades: lastWeekTrades,
        posts: lastWeekPosts
      }
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server başlatma
// IMPORTANT: Mount social routes AFTER admin endpoints to avoid conflicts
// Register social feature routes BEFORE starting server

// Config routes already mounted early (BEFORE auth middleware)

app.use('/api/posts', postsRoutes);
app.use('/api/follow', followRoutes);

// Error handler (must be AFTER all other routes)
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler (must be LAST)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Meme Token Platform API running on port ${PORT}`);
  console.log(`🌐 Local access only: http://localhost:${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🔗 Blockchain: ${process.env.BSC_NETWORK === 'testnet' ? 'BSC Testnet' : 'BSC Mainnet'}`);
  console.log(`🏭 Factory: ${factoryAddress}`);
  console.log(`💰 Trade endpoints: ENABLED`);
  console.log(`📝 Posts endpoints: ENABLED`);
  console.log(`👥 Follow endpoints: ENABLED`);
  
  // Ayarları başlat
  await initializeSettings();
});
