/**
 * PATCH /api/tokens/:address/edit-meta
 * Update token logo and social media links (only owner)
 */
router.patch('/:address/edit-meta', async (req, res) => {
  try {
    const { address } = req.params;
    const { logoURL, website, telegram, twitter, discord } = req.body;
    const walletAddress = req.headers['wallet-address'];
    if (!address || !walletAddress) {
      return res.status(400).json({ success: false, error: 'Token address and wallet address required.' });
    }
    const Token = require('../models/Token');
    const token = await Token.findOne({ where: { address: address.toLowerCase() } });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found.' });
    }
    if (token.creator.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Only the token creator can edit metadata.' });
    }
    // Update only logo and social links
    if (logoURL !== undefined) token.logoURL = logoURL;
    if (website !== undefined) token.website = website;
    if (telegram !== undefined) token.telegram = telegram;
    if (twitter !== undefined) token.twitter = twitter;
    if (discord !== undefined) token.discord = discord;
    await token.save();
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// backend/routes/tokens.js
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Multer configuration for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Provider setup
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org");

// Factory contract ABI (minimal)
const FACTORY_ABI = [
  "function createToken(string name, string symbol, uint256 initialSupply, string metadataURI) external payable returns (address)",
  "function getTierFee(string tier) external view returns (uint256)",
  "function getUserTokens(address user) external view returns (address[])",
  "function getAllTokens() external view returns (address[])"
];

// Token ABI (minimal)
const TOKEN_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address account) external view returns (uint256)"
];

/**
 * POST /api/token/create
 * Token oluşturma isteği - Blockchain transaction hazırlar
 */
router.post('/create', async (req, res) => {
  try {
    console.log('📝 Token creation request received:', req.body);
    
    const {
      name,
      symbol,
      initialSupply,
      decimals,
      metadataURI,
      logoURL,
      website,
      telegram,
      twitter,
      description,
      userAddress,
      tier,
      creationFee,
      addLiquidity,
      liquidityInfo
    } = req.body;

    // Validation
    if (!name || !symbol || !initialSupply || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, symbol, initialSupply, userAddress'
      });
    }

    // Validate Ethereum address
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user address'
      });
    }

    // Get factory contract - HARDCODED to v3 (0x63a8630...)
    const factoryAddress = '0x63a8630b51c13513629b13801A55B748f9Ab13b2'; // v3 with setLiquidityAdder
    if (!factoryAddress) {
      return res.status(500).json({
        success: false,
        error: 'Factory address not configured'
      });
    }

    console.log('🏭 Using Factory v3:', factoryAddress);
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    // Get tier fee from contract
    let tierFee;
    try {
      tierFee = await factory.getTierFee(tier || 'standard');
    } catch (err) {
      console.warn('Could not get tier fee from contract, using provided fee');
      tierFee = ethers.parseEther(creationFee || '0.002');
    }

    // Prepare metadata URI
    const metadata = {
      name,
      symbol,
      description: description || '',
      image: logoURL || '',
      external_url: website || '',
      social: {
        telegram: telegram || '',
        twitter: twitter || ''
      },
      decimals: parseInt(decimals) || 18,
      totalSupply: initialSupply.toString()
    };

    // For now, use logoURL as metadataURI (can be enhanced with IPFS later)
    const finalMetadataURI = metadataURI || logoURL || '';

    // Prepare transaction data
    // Parse the initial supply with the correct decimals
    // initialSupply is already a whole number, so we need to apply decimals multiplication
    // IMPORTANT: Do NOT use parseUnits here!
    // The MemeToken contract's initialize() function ALREADY applies decimals multiplier:
    // _mint(mintRecipient, initialSupply * 10**decimals_)
    // So we just send the raw number and let the contract handle decimals.
    // Sending parseUnits would cause DOUBLE decimals application!
    
    const supply = BigInt(initialSupply.toString());
    
    console.log('📊 Token Supply Calculation:', {
      userInput: initialSupply,
      decimals: parseInt(decimals) || 18,
      sendingToContract: supply.toString(),
      note: 'Contract will multiply by 10^decimals automatically'
    });

    const txData = {
      to: factoryAddress,
      from: userAddress,
      value: tierFee.toString(),
      data: factory.interface.encodeFunctionData('createToken', [
        name,
        symbol,
        supply,
        finalMetadataURI
      ]),
      gasLimit: 3000000 // Estimate
    };

    console.log('✅ Transaction prepared:', {
      to: txData.to,
      value: ethers.formatEther(tierFee),
      name,
      symbol,
      supply: initialSupply
    });

    res.json({
      success: true,
      message: 'Transaction prepared successfully',
      transaction: txData,
      metadata,
      tierFee: ethers.formatEther(tierFee),
      addLiquidity,
      liquidityInfo
    });

  } catch (error) {
    console.error('❌ Token creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/token/confirm
 * Token oluşturma onayı - Transaction hash ile token kaydı
 */
router.post('/confirm', async (req, res) => {
  try {
    console.log('✅ Token confirmation request received:', req.body);
    
    const {
      txHash,
      name,
      symbol,
      initialSupply,
      decimals,
      userAddress,
      website,
      telegram,
      twitter,
      description,
      logoURL,
      tier,
      creationFee,
      liquidityAdded,
      liquidityInfo
    } = req.body;

    // Validation
    if (!txHash || !name || !symbol || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Wait for transaction receipt
    console.log('⏳ Waiting for transaction receipt:', txHash);
    const receipt = await provider.waitForTransaction(txHash, 1, 60000); // 60 second timeout
    
    if (!receipt) {
      return res.status(400).json({
        success: false,
        error: 'Transaction receipt not found'
      });
    }

    if (receipt.status === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction failed on blockchain'
      });
    }

    console.log('✅ Transaction confirmed:', {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status
    });

    // Parse logs to get token address
    const factoryAddress = '0x63a8630b51c13513629b13801A55B748f9Ab13b2'; // v3 with setLiquidityAdder
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    
    let tokenAddress = null;
    for (const log of receipt.logs) {
      try {
        // Try to parse TokenCreated event
        // Event signature: TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol)
        if (log.topics[0] === ethers.id('TokenCreated(address,address,string,string)')) {
          tokenAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
          break;
        }
      } catch (e) {
        // Continue to next log
      }
    }

    if (!tokenAddress) {
      console.warn('⚠️ Could not extract token address from logs');
      // Try to get from getUserTokens as fallback
      try {
        const userTokens = await factory.getUserTokens(userAddress);
        if (userTokens.length > 0) {
          tokenAddress = userTokens[userTokens.length - 1]; // Get latest token
        }
      } catch (err) {
        console.error('Error getting user tokens:', err);
      }
    }

    // ✅ AUTO-APPROVAL: Platform wallet approves LiquidityAdder for LP operations
    if (tokenAddress) {
      try {
        console.log('🔐 Setting up auto-approval for LiquidityAdder...');
        
        const platformPrivateKey = process.env.PRIVATE_KEY;
        const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
        
        if (platformPrivateKey && liquidityAdderAddress) {
          const platformSigner = new ethers.Wallet(platformPrivateKey, provider);
          const tokenContract = new ethers.Contract(
            tokenAddress,
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
    }

    // ✅ TOKEN DISTRIBUTION: Send user's allocated tokens
    if (liquidityAdded && liquidityInfo && tokenAddress) {
      try {
        console.log('🔄 Distributing tokens...');
        
        const decimalsMultiplier = BigInt(10) ** BigInt(parseInt(decimals) || 18);
        
        // User will receive these tokens
        const userTokenAmountRaw = liquidityInfo.userTokenAmount || liquidityInfo.tokenAmount;
        const userTokenWithDecimals = BigInt(userTokenAmountRaw.toString()) * decimalsMultiplier;
        
        console.log('📊 Token Distribution:', {
          totalSupply: initialSupply,
          userTokenAmount: userTokenAmountRaw,
          lpTokenAmount: liquidityInfo.tokenAmount,
          userTokenWithDecimals: userTokenWithDecimals.toString()
        });

        if (userTokenWithDecimals > 0) {
          const platformPrivateKey = process.env.PRIVATE_KEY;
          const platformSigner = new ethers.Wallet(platformPrivateKey, provider);
          
          const tokenABI = [
            'function transfer(address to, uint256 amount) returns (bool)'
          ];
          
          const tokenContract = new ethers.Contract(tokenAddress, tokenABI, platformSigner);
          
          console.log('📤 Sending tokens to user:', {
            to: userAddress,
            amount: userTokenWithDecimals.toString(),
            formatted: ethers.formatUnits(userTokenWithDecimals, decimals)
          });
          
          const distributionTx = await tokenContract.transfer(userAddress, userTokenWithDecimals);
          console.log('✅ Distribution tx sent:', distributionTx.hash);
          
          const distributionReceipt = await distributionTx.wait();
          console.log('✅ Distribution confirmed:', distributionReceipt.hash);
          console.log(`   ✅ ${ethers.formatUnits(userTokenWithDecimals, decimals)} ${symbol} sent to user wallet`);
          console.log(`   ✅ ${liquidityInfo.tokenAmount || liquidityInfo.lpTokenAmount} ${symbol} will go to LP pool`);
        } else {
          console.warn('⚠️ No tokens to distribute to user');
        }
      } catch (distributionError) {
        console.warn('⚠️ Token distribution failed (non-critical):', distributionError.message);
        // Don't fail token creation if distribution fails
      }
    } else {
      console.log('ℹ️ Token distribution skipped:', { liquidityAdded, liquidityInfo: !!liquidityInfo, tokenAddress });
    }

    // Prepare token data for database
    const tokenData = {
      address: tokenAddress,
      name,
      symbol,
      totalSupply: initialSupply.toString(),
      decimals: parseInt(decimals) || 18,
      owner: userAddress,
      creator: userAddress,
      logoURL: logoURL || '',
      website: website || '',
      telegram: telegram || '',
      twitter: twitter || '',
      description: description || '',
      tier: tier || 'standard',
      creationFee: creationFee || '0.002',
      createdAt: new Date(),
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      isActive: true,
      liquidityAdded: liquidityAdded || false
    };

    if (liquidityInfo) {
      tokenData.liquidityInfo = liquidityInfo;
    }

    console.log('💾 Token data prepared for database:', tokenData);

    // Here you would normally save to database
    // For now, just return success
    
    res.json({
      success: true,
      message: `Token ${name} (${symbol}) created successfully!`,
      token: tokenData,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      tokenAddress
    });

  } catch (error) {
    console.error('❌ Token confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/upload/logo
 * Logo upload to Cloudinary
 */
router.post('/upload/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log('📤 Uploading logo to Cloudinary:', req.file.originalname);

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'token-logos',
          public_id: `token_${Date.now()}`,
          resource_type: 'image',
          format: 'png',
          transformation: [
            { width: 200, height: 200, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const result = await uploadPromise;

    console.log('✅ Logo uploaded successfully:', result.secure_url);

    res.json({
      success: true,
      logoURL: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('❌ Logo upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tokens
 * Get all tokens with pagination, filtering and sorting
 */
router.get('/', async (req, res) => {
  try {
    const Token = require('../models/Token');
    const { Op } = require('sequelize');
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Filters
    const search = req.query.search || '';
    const minMarketCap = req.query.minMarketCap ? parseFloat(req.query.minMarketCap) : 0;
    const maxMarketCap = req.query.maxMarketCap ? parseFloat(req.query.maxMarketCap) : Infinity;
    const minLiquidity = req.query.minLiquidity ? parseFloat(req.query.minLiquidity) : 0;
    const maxLiquidity = req.query.maxLiquidity ? parseFloat(req.query.maxLiquidity) : Infinity;
    const minVolume = req.query.minVolume ? parseFloat(req.query.minVolume) : 0;
    const maxVolume = req.query.maxVolume ? parseFloat(req.query.maxVolume) : Infinity;
    const network = req.query.network || 'BSC';
    
    // Sorting
    let sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';
    
    // Validate sortBy field
    const validSortFields = ['createdAt', 'marketCap', 'liquidity', 'totalVolume', 'totalTrades', 'views', 'priceChange24h'];
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'createdAt';
    }
    
    // Build where clause
    const whereClause = {
      network: network.toUpperCase(),
      isActive: true
    };
    
    // Search in name, symbol, description, address
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { symbol: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { address: search.toLowerCase() }
      ];
    }
    
    // Market cap filter
    if (minMarketCap > 0 || maxMarketCap !== Infinity) {
      whereClause.marketCap = {
        [Op.gte]: minMarketCap,
        [Op.lte]: maxMarketCap === Infinity ? 999999999999 : maxMarketCap
      };
    }
    
    // Liquidity filter
    if (minLiquidity > 0 || maxLiquidity !== Infinity) {
      whereClause.liquidity = {
        [Op.gte]: minLiquidity,
        [Op.lte]: maxLiquidity === Infinity ? 999999999999 : maxLiquidity
      };
    }
    
    // Volume filter
    if (minVolume > 0 || maxVolume !== Infinity) {
      whereClause.totalVolume = {
        [Op.gte]: minVolume,
        [Op.lte]: maxVolume === Infinity ? 999999999999 : maxVolume
      };
    }
    
    // Get total count for pagination
    const total = await Token.count({ where: whereClause });
    
    // Get paginated tokens
    const tokens = await Token.findAll({
      attributes: ['address', 'name', 'symbol', 'logoURL', 'creator', 'creatorUserId', 
                   'marketCap', 'liquidity', 'totalVolume', 'price', 'priceChange24h', 
                   'totalTrades', 'views', 'createdAt', 'isActive'],
      where: whereClause,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      include: [{
        model: require('../models/User'),
        as: 'creatorUser',
        attributes: ['walletAddress', 'username', 'profileImage', 'badges', 'isVerified'],
        required: false
      }]
    });
    
    const pages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: tokens,
      pagination: {
        total,
        page,
        pages,
        limit,
        offset
      }
    });
    
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tokens/:address
 * Get token details
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token address'
      });
    }
    
    const token = new ethers.Contract(address, TOKEN_ABI, provider);
    
    const [name, symbol, totalSupply, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.totalSupply(),
      token.decimals()
    ]);
    
    res.json({
      success: true,
      token: {
        address,
        name,
        symbol,
        totalSupply: totalSupply.toString(),
        decimals: Number(decimals)
      }
    });
    
  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tiers/fees
 * Get tier fees from contract
 */
router.get('/tiers/fees', async (req, res) => {
  try {
    const factoryAddress = '0x63a8630b51c13513629b13801A55B748f9Ab13b2'; // v3 with setLiquidityAdder
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    
    const [basicFee, standardFee, premiumFee] = await Promise.all([
      factory.getTierFee('basic'),
      factory.getTierFee('standard'),
      factory.getTierFee('premium')
    ]);
    
    res.json({
      success: true,
      fees: {
        basic: ethers.formatEther(basicFee),
        standard: ethers.formatEther(standardFee),
        premium: ethers.formatEther(premiumFee)
      }
    });
    
  } catch (error) {
    console.error('Error getting tier fees:', error);
    // Return fallback fees
    res.json({
      success: true,
      fees: {
        basic: '0.001',
        standard: '0.002',
        premium: '0.003'
      }
    });
  }
});

/**
 * GET /api/tokens/owner/:userAddress
 * Get tokens created by owner
 */
router.get('/owner/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }
    // Assuming tokens are stored in DB (MongoDB, etc.)
    const Token = require('../models/Token');
    const tokens = await Token.find({ owner: userAddress });
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
