/**
 * Input Validation & Sanitization Middleware
 * Validates and sanitizes user inputs for security and data consistency
 */

const { Op } = require('sequelize');

// Validation rules
const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/, // Alphanumeric, underscore, hyphen only
    message: 'Kullanıcı adı 3-50 karakter arasında olmalı, sadece harf, rakam, _ ve - içerebilir'
  },
  bio: {
    maxLength: 200,
    message: 'Bio maksimum 200 karakter olmalı'
  },
  description: {
    maxLength: 500,
    message: 'Açıklama maksimum 500 karakter olmalı'
  },
  tokenSymbol: {
    minLength: 1,
    maxLength: 10,
    pattern: /^[A-Z0-9]+$/, // Uppercase alphanumeric only
    message: 'Token sembolü 1-10 karakter, sadece büyük harfler ve rakamlar içerebilir'
  },
  tokenName: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-]+$/,
    message: 'Token ismi 1-50 karakter, harf, rakam, boşluk ve tire içerebilir'
  },
  url: {
    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    message: 'Geçerli bir URL giriniz'
  },
  walletAddress: {
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Geçerli bir Ethereum cüzdan adresi giriniz'
  }
};

/**
 * Validate string length and pattern
 */
function validateString(value, rules) {
  if (!value || typeof value !== 'string') {
    return null; // Optional field not provided
  }

  const trimmed = value.trim();

  if (rules.minLength && trimmed.length < rules.minLength) {
    return `Minimum ${rules.minLength} karakter olmalı`;
  }

  if (rules.maxLength && trimmed.length > rules.maxLength) {
    return `Maksimum ${rules.maxLength} karakter olmalı`;
  }

  if (rules.pattern && !rules.pattern.test(trimmed)) {
    return rules.message || 'Geçersiz format';
  }

  return null;
}

/**
 * Sanitize string input (trim, remove dangerous chars)
 */
function sanitizeString(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  // Trim whitespace
  let sanitized = value.trim();
  // Remove any HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  // Remove common SQL injection attempts
  sanitized = sanitized.replace(/['"`;\\]/g, '');
  return sanitized;
}

/**
 * Validate URL
 */
function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    new URL(url);
    return null;
  } catch (e) {
    return 'Geçerli bir URL giriniz';
  }
}

/**
 * Validate wallet address
 */
function validateWalletAddress(address) {
  if (!address) return 'Cüzdan adresi zorunlu';
  const error = validateString(address, VALIDATION_RULES.walletAddress);
  return error;
}

/**
 * Middleware: Validate username
 */
const validateUsername = (req, res, next) => {
  const { username } = req.body;
  
  if (!username) {
    return next(); // Optional field
  }

  const error = validateString(username, VALIDATION_RULES.username);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  req.body.username = sanitizeString(username);
  next();
};

/**
 * Middleware: Validate bio and description
 */
const validateBioDescription = (req, res, next) => {
  if (req.body.bio) {
    const bioError = validateString(req.body.bio, VALIDATION_RULES.bio);
    if (bioError) {
      return res.status(400).json({ success: false, error: bioError });
    }
    req.body.bio = sanitizeString(req.body.bio);
  }

  if (req.body.description) {
    const descError = validateString(req.body.description, VALIDATION_RULES.description);
    if (descError) {
      return res.status(400).json({ success: false, error: descError });
    }
    req.body.description = sanitizeString(req.body.description);
  }

  next();
};

/**
 * Middleware: Validate social links (twitter, telegram, website, discord)
 */
const validateSocialLinks = (req, res, next) => {
  const socialFields = ['twitter', 'telegram', 'website', 'discord'];

  for (const field of socialFields) {
    if (req.body[field]) {
      const value = req.body[field].trim();
      
      // For URLs (twitter, website)
      if ((field === 'twitter' || field === 'website') && value) {
        const urlError = validateURL(value);
        if (urlError) {
          return res.status(400).json({ 
            success: false, 
            error: `${field} için: ${urlError}` 
          });
        }
      }

      req.body[field] = sanitizeString(value);
    }
  }

  next();
};

/**
 * Middleware: Validate token creation data
 */
const validateTokenCreation = (req, res, next) => {
  const { name, symbol, initialSupply, decimals } = req.body;

  // Validate name
  if (name) {
    const nameError = validateString(name, VALIDATION_RULES.tokenName);
    if (nameError) {
      return res.status(400).json({ success: false, error: 'Token ismi: ' + nameError });
    }
    req.body.name = sanitizeString(name);
  }

  // Validate symbol
  if (symbol) {
    const symbolError = validateString(symbol, VALIDATION_RULES.tokenSymbol);
    if (symbolError) {
      return res.status(400).json({ success: false, error: 'Token sembolü: ' + symbolError });
    }
    req.body.symbol = sanitizeString(symbol).toUpperCase();
  }

  // Validate initialSupply (numeric, positive)
  if (initialSupply) {
    const supply = parseFloat(initialSupply);
    if (isNaN(supply) || supply <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'İlk arz pozitif bir sayı olmalı' 
      });
    }
    req.body.initialSupply = supply;
  }

  // Validate decimals (numeric, 0-18)
  if (decimals) {
    const dec = parseInt(decimals, 10);
    if (isNaN(dec) || dec < 0 || dec > 18) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ondalık basamaklar 0-18 arasında olmalı' 
      });
    }
    req.body.decimals = dec;
  }

  next();
};

/**
 * Middleware: Validate post content
 */
const validatePostContent = (req, res, next) => {
  const { content, title } = req.body;

  if (title) {
    if (title.length < 1 || title.length > 200) {
      return res.status(400).json({ 
        success: false, 
        error: 'Başlık 1-200 karakter arasında olmalı' 
      });
    }
    req.body.title = sanitizeString(title);
  }

  if (content) {
    if (content.length < 1 || content.length > 5000) {
      return res.status(400).json({ 
        success: false, 
        error: 'İçerik 1-5000 karakter arasında olmalı' 
      });
    }
    req.body.content = sanitizeString(content);
  }

  next();
};

/**
 * Middleware: Validate comment content
 */
const validateComment = (req, res, next) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Yorum içeriği zorunlu' 
    });
  }

  if (content.length < 1 || content.length > 1000) {
    return res.status(400).json({ 
      success: false, 
      error: 'Yorum 1-1000 karakter arasında olmalı' 
    });
  }

  req.body.content = sanitizeString(content);
  next();
};

/**
 * Middleware: Validate wallet address in header
 */
const validateWalletHeader = (req, res, next) => {
  const wallet = req.headers['wallet-address'];
  
  if (!wallet) {
    return res.status(400).json({ 
      success: false, 
      error: 'Wallet-Address header gerekli' 
    });
  }

  const error = validateWalletAddress(wallet);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  req.walletAddress = wallet.toLowerCase();
  next();
};

module.exports = {
  // Validators
  validateString,
  sanitizeString,
  validateURL,
  validateWalletAddress,
  
  // Middleware
  validateUsername,
  validateBioDescription,
  validateSocialLinks,
  validateTokenCreation,
  validatePostContent,
  validateComment,
  validateWalletHeader,
  
  // Rules export for testing
  VALIDATION_RULES
};
