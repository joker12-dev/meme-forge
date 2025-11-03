/**
 * config.js - Configuration endpoints
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

/**
 * GET /api/config/platform-wallet
 * Get platform wallet address (used for LP liquidity)
 */
router.get('/platform-wallet', async (req, res) => {
  try {
    const platformWallet = process.env.PLATFORM_WALLET;
    
    if (!platformWallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Platform wallet not configured in environment' 
      });
    }
    
    if (!ethers.isAddress(platformWallet)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid platform wallet address' 
      });
    }
    
    res.json({ 
      success: true, 
      platformWallet 
    });
  } catch (error) {
    console.error('Error getting platform wallet:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
