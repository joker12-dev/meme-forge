// backend/routes/tokens.js
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { TokenHype } = require('../models');

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
const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org");

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

// Helper functions for ethers v5 compatibility
const isValidAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch (e) {
    return false;
  }
};

const parseEther = (value) => {
  try {
    return ethers.utils.parseEther(value);
  } catch (e) {
    console.error('parseEther error:', e);
    return ethers.utils.parseEther('0');
  }
};

const formatEther = (value) => {
  try {
    return ethers.utils.formatEther(value);
  } catch (e) {
    console.error('formatEther error:', e);
    return '0';
  }
};

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
    if (!isValidAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user address'
      });
    }

    // Get factory contract - USING ENVIRONMENT VARIABLE FOR NEW FACTORY
    const factoryAddress = process.env.FACTORY_ADDRESS || '0x7544A09C9872F4312E2Ac8087eB2c3553A4C783A';
    if (!factoryAddress) {
      return res.status(500).json({
        success: false,
        error: 'Factory address not configured'
      });
    }

    console.log('🏭 Using Factory Address:', factoryAddress);
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    // Get tier fee from contract
    let tierFee;
    try {
      tierFee = await factory.getTierFee(tier || 'standard');
    } catch (err) {
      console.warn('Could not get tier fee from contract, using provided fee');
      tierFee = parseEther(creationFee || '0.002');
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
      value: formatEther(tierFee),
      name,
      symbol,
      supply: initialSupply
    });

    res.json({
      success: true,
      message: 'Transaction prepared successfully',
      transaction: txData,
      metadata,
      tierFee: formatEther(tierFee),
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
    console.log('🔍 Validating required fields:');
    console.log('  txHash:', !!txHash, txHash);
    console.log('  name:', !!name, name);
    console.log('  symbol:', !!symbol, symbol);
    console.log('  userAddress:', !!userAddress, userAddress);
    console.log('  liquidityAdded:', liquidityAdded, typeof liquidityAdded);
    console.log('  liquidityInfo:', !!liquidityInfo, JSON.stringify(liquidityInfo, null, 2));
    console.log('  tier:', !!tier, tier);
    console.log('  creationFee:', !!creationFee, creationFee);
    
    if (!txHash || !name || !symbol || !userAddress) {
      console.error('❌ Validation failed - Missing required fields');
      console.error('  Body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, name, symbol, userAddress are required',
        received: {
          txHash: !!txHash,
          name: !!name,
          symbol: !!symbol,
          userAddress: !!userAddress
        }
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

    // Check transaction status - 1 = success, 0 = failure, null = pending
    console.log('📋 Transaction Status Details:');
    console.log('  status:', receipt.status);
    console.log('  blockNumber:', receipt.blockNumber);
    console.log('  gasUsed:', receipt.gasUsed?.toString());
    console.log('  logs:', receipt.logs?.length || 0);
    
    if (receipt.status === 0) {
      console.error('❌ Transaction REVERTED on blockchain');
      console.error('📋 Full receipt:', JSON.stringify({
        hash: receipt.hash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        logsLength: receipt.logs?.length || 0,
        to: receipt.to,
        from: receipt.from
      }, null, 2));
      
      // Try to get revert reason - avoid using provider.call() which causes gas parameter issues
      let revertReason = 'Unknown error';
      try {
        const txData = await provider.getTransaction(txHash);
        if (txData) {
          console.log('Transaction data:', {
            input: txData.data.substring(0, 100),
            value: txData.value.toString(),
            gasLimit: txData.gasLimit.toString()
          });
          
          // ⚠️ Don't use provider.call() - it mixes gas parameters
          // Instead, check the transaction data and logs for clues
          console.log('📝 Checking receipt logs for revert reason...');
          if (!receipt.logs || receipt.logs.length === 0) {
            console.log('No logs in receipt - likely a require/revert at contract level');
          }
        }
      } catch (e) {
        console.log('Could not get additional tx details:', e.message);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Transaction failed on blockchain (reverted)',
        details: {
          txHash: receipt.hash,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          message: 'Check contract execution - likely invalid parameters or contract issue'
        }
      });
    }

    // If status is null, transaction is still pending (should not happen as we waited)
    if (receipt.status === null) {
      console.warn('⚠️ Transaction status is null (still pending), but we got a receipt');
    }

    console.log('✅ Transaction confirmed:', {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      logsLength: receipt.logs?.length || 0
    });

    // Parse logs to get token address
    const factoryAddress = process.env.FACTORY_ADDRESS || '0x805976c21C4e08B314Da32D1D7Ed26A393389504';
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    
    let tokenAddress = null;
    console.log('🔍 Parsing receipt logs, total logs:', receipt.logs?.length || 0);
    
    if (receipt.logs && receipt.logs.length > 0) {
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        try {
          console.log(`  Log ${i}: topics[0] = ${log.topics[0]}`);
          
          // Try to parse TokenCreatedWithLP event (new LP-based creation)
          // Event signature: TokenCreatedWithLP(address indexed tokenAddress, address indexed creator, string tier, uint256 initialSupply, uint256 lpTokenAmount, uint256 lpBnbAmount, uint256 userTokenAmount)
          if (log.topics[0] === ethers.id('TokenCreatedWithLP(address,address,string,uint256,uint256,uint256,uint256)')) {
            tokenAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
            console.log('✅ Token address extracted from TokenCreatedWithLP event:', tokenAddress);
            break;
          }
          // Also try old TokenCreated event for backward compatibility
          if (log.topics[0] === ethers.id('TokenCreated(address,address,string,string)')) {
            tokenAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
            console.log('✅ Token address extracted from TokenCreated event (legacy):', tokenAddress);
            break;
          }
        } catch (e) {
          console.log(`  Log ${i} parse error:`, e.message);
          // Continue to next log
        }
      }
    } else {
      console.warn('⚠️ No logs in receipt');
    }

    if (!tokenAddress) {
      console.warn('⚠️ Could not extract token address from logs');
      // Try to get from getUserTokens as fallback
      try {
        const userTokens = await factory.getUserTokens(userAddress);
        if (userTokens.length > 0) {
          tokenAddress = userTokens[userTokens.length - 1]; // Get latest token
          console.log('✅ Token address retrieved from getUserTokens fallback:', tokenAddress);
        }
      } catch (err) {
        console.error('Error getting user tokens from factory:', err);
      }
    }

    // If still no token address, return error
    if (!tokenAddress) {
      console.error('❌ CRITICAL: Could not determine token address');
      return res.status(400).json({
        success: false,
        error: 'Could not determine token address. Transaction may have failed or contract state is inconsistent.',
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
    }

    console.log('✅ Token address determined:', tokenAddress);

    // 🔍 Parse transaction logs to find LP events
    let lpAdditionConfirmed = false;
    let lpDetails = null;
    
    if (liquidityAdded) {
      try {
        console.log('🔍 Checking transaction logs for LP addition...');
        
        // Look for LiquidityAddedFrom event from LiquidityAdder contract
        for (const log of receipt.logs) {
          // LiquidityAddedFrom(address indexed token, address indexed from, address indexed recipient, uint256 tokenAmount, uint256 ethAmount, uint256 liquidity)
          if (log.topics.length === 4) {
            // Check if this looks like a LiquidityAddedFrom event
            const topic = log.topics[0];
            // LiquidityAddedFrom signature: keccak256('LiquidityAddedFrom(address,address,address,uint256,uint256,uint256)')
            // = 0x8c86f1f5e42fd0ad61eb7c24a96f2cc1b7cf93f5e42f6c6bb6c2e6e84dc7d5a1
            if (topic === '0x8c86f1f5e42fd0ad61eb7c24a96f2cc1b7cf93f5e42f6c6bb6c2e6e84dc7d5a1' || 
                topic === ethers.id('LiquidityAddedFrom(address,address,address,uint256,uint256,uint256)')) {
              lpAdditionConfirmed = true;
              console.log('✅ LP Addition event found in logs!');
              
              // Parse the event data
              try {
                const interface = new ethers.Interface([
                  'event LiquidityAddedFrom(address indexed token, address indexed from, address indexed recipient, uint256 tokenAmount, uint256 ethAmount, uint256 liquidity)'
                ]);
                const parsed = interface.parseLog(log);
                lpDetails = {
                  token: parsed.args.token,
                  tokenAmount: parsed.args.tokenAmount.toString(),
                  ethAmount: parsed.args.ethAmount.toString(),
                  liquidity: parsed.args.liquidity.toString()
                };
                console.log('  Token:', lpDetails.token);
                console.log('  Token Amount:', lpDetails.tokenAmount);
                console.log('  ETH Amount:', lpDetails.ethAmount);
                console.log('  LP Liquidity:', lpDetails.liquidity);
              } catch (parseErr) {
                console.warn('⚠️ Could not parse LP event:', parseErr.message);
              }
              break;
            }
          }
        }
        
        if (!lpAdditionConfirmed) {
          console.warn('⚠️ LiquidityAddedFrom event NOT found in logs');
        }
      } catch (lpLogError) {
        console.warn('⚠️ Error parsing LP logs:', lpLogError.message);
      }
    }

    // 🔍 Extract LP Pair Address if liquidity was added
    let lpPairAddress = null;
    // Convert liquidityAdded to boolean if it's a string
    const liquidityAddedBool = liquidityAdded === true || liquidityAdded === 'true';
    console.log('📊 Liquidity flag check:', {
      originalValue: liquidityAdded,
      originalType: typeof liquidityAdded,
      booleanValue: liquidityAddedBool
    });
    
    if (liquidityAddedBool) {
      try {
        console.log('🔍 Extracting LP pair address from PancakeSwap...');
        
        // Get factory from router to ensure we have the correct address
        const routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'; // BSC Testnet Router
        const routerAbi = [
          'function factory() external pure returns (address)',
          'function WETH() external pure returns (address)'
        ];
        const router = new ethers.Contract(routerAddress, routerAbi, provider);
        
        const factoryAddress = await router.factory();
        const wbnbAddress = await router.WETH();
        
        console.log('📋 Query details:', {
          router: routerAddress,
          factory: factoryAddress,
          token: tokenAddress,
          wbnb: wbnbAddress
        });
        
        // Query factory for pair
        const factoryAbi = ['function getPair(address tokenA, address tokenB) external view returns (address pair)'];
        const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, provider);
        const pairAddress = await factoryContract.getPair(tokenAddress, wbnbAddress);
        
        console.log('📊 getPair result:', pairAddress);
        
        // Check if it's a valid address (not zero address)
        if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
          lpPairAddress = pairAddress;
          console.log('✅ LP Pair Address found:', lpPairAddress);
        } else {
          console.warn('⚠️ getPair returned zero address - pair may not exist yet');
        }
      } catch (lpError) {
        console.warn('⚠️ LP extraction error:', lpError.message);
        // Don't fail token creation if LP extraction fails
      }
    }

    // ✅ AUTO-APPROVAL: Platform wallet approves LiquidityAdder for LP operations
    if (tokenAddress) {
      try {
        console.log('🔐 Setting up auto-approval for LiquidityAdder...');
        
        const platformPrivateKey = process.env.PRIVATE_KEY;
        const liquidityAdderAddress = process.env.REACT_APP_LIQUIDITY_ADDER_ADDRESS || '0x959D1413816A4985d7bDCd431183EF92D1490D0C';
        
        if (platformPrivateKey && liquidityAdderAddress) {
          const platformSigner = new ethers.Wallet(platformPrivateKey, provider);
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function approve(address spender, uint256 amount) returns (bool)'],
            platformSigner
          );
          
          // Approve max amount using BigNumber
          const maxApproval = ethers.BigNumber.from('2').pow('256').sub('1');
          const approveTx = await tokenContract.approve(
            liquidityAdderAddress,
            maxApproval
          );
          
          console.log('✅ Approval tx submitted:', approveTx.hash);
          const approvalReceipt = await approveTx.wait();
          console.log('✅ Auto-approval confirmed:', approvalReceipt.transactionHash || approvalReceipt.hash);
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
      liquidityAdded: liquidityAddedBool,
      // Store LP pair address if found, or mark that LP should exist
      lpToken: lpPairAddress || (liquidityAddedBool ? 'PENDING_QUERY' : null)
    };

    if (liquidityInfo) {
      tokenData.liquidityInfo = liquidityInfo;
    }

    console.log('💾 Token data prepared for database:', {
      address: tokenData.address,
      name: tokenData.name,
      liquidityAdded: tokenData.liquidityAdded,
      lpToken: tokenData.lpToken
    });

    // Save token to database
    try {
      const savedToken = await Token.create(tokenData);
      console.log('✅ Token saved to database with ID:', savedToken.address || savedToken.get('address'));
      console.log('   Full saved token:', JSON.stringify({
        address: savedToken.address,
        name: savedToken.name,
        symbol: savedToken.symbol,
        txHash: savedToken.txHash
      }));
    } catch (dbError) {
      console.warn('⚠️ Token database save failed (non-critical):', dbError.message);
      console.warn('   Error details:', dbError.detail || dbError.stack);
      // Don't fail token creation if DB save fails
    }
    
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
      include: [
        {
          model: require('../models/User'),
          as: 'creatorUser',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges', 'isVerified'],
          required: false
        },
        {
          association: 'holders',
          attributes: ['address', 'balance', 'percentage'],
          required: false
        }
      ]
    });
    
    const pages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      tokens: tokens,
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
    
    if (!isValidAddress(address)) {
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
        basic: formatEther(basicFee),
        standard: formatEther(standardFee),
        premium: formatEther(premiumFee)
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
    if (!isValidAddress(userAddress)) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }
    const tokens = await require('../models/Token').findAll({
      where: { creator: userAddress.toLowerCase() }
    });
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/token/create-with-lp
 * SEÇENEK 1: Create token + add LP in single atomic transaction
 * Combines token creation and liquidity provisioning
 */
router.post('/create-with-lp', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 [STEP 1/8] Token creation with LP request received');
    console.log('='.repeat(80));
    console.log('Request body:', req.body);
    
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
      lpTokenAmount,      // Amount of tokens for LP
      lpBnbAmount,        // Amount of BNB for LP
      customMarketingTax,
      customLiquidityTax,
      customAutoBurn
    } = req.body;

    console.log('\n✅ [STEP 2/8] Destructuring parameters');
    console.log({
      name, symbol, initialSupply, decimals, userAddress, tier,
      lpTokenAmount, lpBnbAmount, logoURL, website, telegram, twitter
    });

    // CRITICAL: Convert lpBnbAmount to string if it's a number
    const lpBnbAmountStr = typeof lpBnbAmount === 'number' ? lpBnbAmount.toString() : lpBnbAmount;

    console.log('\n✅ [STEP 3/8] Parameter conversion and validation');
    // Validation
    if (!name || !symbol || !initialSupply || !userAddress || !lpTokenAmount || !lpBnbAmountStr) {
      console.error('❌ Validation failed - missing fields:');
      if (!name) console.error('  - name is missing');
      if (!symbol) console.error('  - symbol is missing');
      if (!initialSupply) console.error('  - initialSupply is missing');
      if (!userAddress) console.error('  - userAddress is missing');
      if (!lpTokenAmount) console.error('  - lpTokenAmount is missing');
      if (!lpBnbAmountStr) console.error('  - lpBnbAmount is missing');
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, symbol, initialSupply, userAddress, lpTokenAmount, lpBnbAmount'
      });
    }

    // CRITICAL: Validate lpBnbAmount is greater than 0
    const lpBnbAmountNum = parseFloat(lpBnbAmountStr);
    console.log('  lpBnbAmount conversion:', { raw: lpBnbAmountStr, parsed: lpBnbAmountNum });
    
    if (isNaN(lpBnbAmountNum) || lpBnbAmountNum <= 0) {
      console.error('❌ lpBnbAmount validation failed:', lpBnbAmountNum);
      return res.status(400).json({
        success: false,
        error: 'LP BNB amount must be greater than 0'
      });
    }
    console.log('  ✓ lpBnbAmount is valid:', lpBnbAmountNum);

    // Validate Ethereum addresses
    console.log('\n✅ [STEP 4/8] Validating Ethereum addresses');
    console.log('  Validating userAddress:', userAddress);
    if (!isValidAddress(userAddress)) {
      console.error('❌ Invalid user address:', userAddress);
      return res.status(400).json({
        success: false,
        error: 'Invalid user address'
      });
    }
    console.log('  ✓ User address is valid');

    // Get factory contract with updated address
    console.log('\n✅ [STEP 5/8] Initializing factory contract');
    const factoryAddress = process.env.FACTORY_ADDRESS || '0x805976c21C4e08B314Da32D1D7Ed26A393389504';
    console.log('  Using Factory:', factoryAddress);
    
    if (!factoryAddress) {
      console.error('❌ Factory address not configured');
      return res.status(500).json({
        success: false,
        error: 'Factory address not configured'
      });
    }

    const FACTORY_ABI_WITH_LP = [
      "function createToken(string name, string symbol, uint256 initialSupply, string metadataURI) external payable returns (address)",
      "function createTokenWithLP(string name, string symbol, uint256 initialSupply, uint8 decimals, string metadataURI, string tier, uint256 lpTokenAmount, uint256 lpBnbAmount, uint256 customMarketingTax, uint256 customLiquidityTax, bool customAutoBurn) external payable returns (address)",
      "function getTierFee(string tier) external view returns (uint256)"
    ];

    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI_WITH_LP, provider);
    console.log('  ✓ Factory contract initialized');

    // CRITICAL: Normalize tier string - remove spaces, convert to lowercase
    console.log('\n✅ [STEP 6/8] Normalizing input parameters');
    const normalizedTier = (tier || 'standard').toLowerCase().trim();
    console.log('  Tier normalization:');
    console.log('    Original:', JSON.stringify(tier), '(type:', typeof tier + ')');
    console.log('    Normalized:', JSON.stringify(normalizedTier));

    // CRITICAL: Also normalize name and symbol - remove spaces
    const normalizedName = name.trim();
    const normalizedSymbol = symbol.trim().toUpperCase();
    console.log('  Name/Symbol normalization:');
    console.log('    Name:', JSON.stringify(normalizedName));
    console.log('    Symbol:', JSON.stringify(normalizedSymbol));

    // Get tier fee from contract
    console.log('\n✅ [STEP 7/8] Fetching tier fee from contract');
    let tierFee;
    try {
      console.log('  Calling getTierFee with tier:', JSON.stringify(normalizedTier));
      tierFee = await factory.getTierFee(normalizedTier);
      console.log('  ✓ Tier fee received:', formatEther(tierFee), 'BNB');
    } catch (err) {
      console.warn('  ⚠️ Could not get tier fee from contract:', err.message);
      console.warn('  Using fallback fee: 0.0001 BNB');
      tierFee = parseEther('0.0001'); // Fallback
    }

    // LP_CREATION_FEE is 0.001 ether (hardcoded in contract)
    const LP_CREATION_FEE = parseEther('0.001');

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

    const finalMetadataURI = metadataURI || logoURL || '';

    // Convert inputs to BigInt
    const dec = parseInt(decimals) || 18;
    const decimalsMultiplier = BigInt(10) ** BigInt(dec);
    
    console.log('\n✅ [STEP 8/8] Encoding transaction data');
    console.log('  Decimals multiplier:', decimalsMultiplier.toString(), '(10^' + dec + ')');
    
    // ⚠️ CRITICAL: DO NOT SCALE VALUES - send human-readable numbers
    // MemeToken.initialize() will scale them: initialSupply * 10^decimals
    const supply = BigInt(initialSupply.toString());  // ← HUMAN VALUE, NO SCALING
    const lpTokens = BigInt(lpTokenAmount.toString());  // ← HUMAN VALUE, NO SCALING
    const lpBnb = parseEther(lpBnbAmountStr);

    console.log('  Supply (human, NOT scaled):', supply.toString());
    console.log('  LP tokens (human, NOT scaled):', lpTokens.toString());
    console.log('  LP BNB amount:', formatEther(lpBnb), 'BNB');

    // Ensure all values are BigNumbers for proper addition
    // tierFee should already be from contract or parseEther, convert to BigInt if needed
    let tierFeeBigInt;
    try {
      tierFeeBigInt = BigInt(tierFee.toString());
      console.log('  Tier fee (BigInt):', tierFeeBigInt.toString());
    } catch (e) {
      console.warn('  ⚠️ tierFee conversion failed, using fallback');
      tierFeeBigInt = parseEther('0.0001');
    }

    let lpCreationFeeBigInt;
    try {
      lpCreationFeeBigInt = BigInt(LP_CREATION_FEE.toString());
      console.log('  LP creation fee (BigInt):', lpCreationFeeBigInt.toString());
    } catch (e) {
      console.warn('  ⚠️ LP_CREATION_FEE conversion failed');
      lpCreationFeeBigInt = parseEther('0.001');
    }

    let lpBnbBigInt;
    try {
      lpBnbBigInt = BigInt(lpBnb.toString());
      console.log('  LP BNB amount (BigInt):', lpBnbBigInt.toString());
    } catch (e) {
      console.warn('  ⚠️ lpBnb conversion failed');
      lpBnbBigInt = parseEther('0');
    }

    // Calculate total value: tierFee + LP_CREATION_FEE + lpBnbAmount
    console.log('\n  Calculating total transaction value...');
    let totalValue;
    try {
      totalValue = tierFeeBigInt + lpCreationFeeBigInt + lpBnbBigInt;
      console.log('  ✓ Total value calculated:');
      console.log('    Tier fee:', formatEther(tierFeeBigInt), 'BNB');
      console.log('    LP creation fee:', formatEther(lpCreationFeeBigInt), 'BNB');
      console.log('    LP BNB amount:', formatEther(lpBnbBigInt), 'BNB');
      console.log('    TOTAL VALUE:', formatEther(totalValue), 'BNB');
      console.log('    TOTAL VALUE (wei):', totalValue.toString());
    } catch (e) {
      console.error('  ❌ BigInt addition failed:', e);
      totalValue = parseEther('0.004'); // Fallback
      console.log('  Using fallback value: 0.004 BNB');
    }

    // Prepare transaction data
    console.log('\n  Encoding function call...');
    let encodedData;
    try {
      // Values are already scaled by decimals from above
      const marketingTaxBigInt = BigInt(customMarketingTax || 0);
      const liquidityTaxBigInt = BigInt(customLiquidityTax || 0);
      
      const params = [
        normalizedName,  // ← Use normalized name (trimmed)
        normalizedSymbol,  // ← Use normalized symbol (trimmed, uppercase)
        supply,  // ← Already scaled: initialSupply * 10^decimals
        dec,
        finalMetadataURI,
        normalizedTier,  // ← Use normalized tier (lowercase, trimmed)
        lpTokens,  // ← Already scaled: lpTokenAmount * 10^decimals
        lpBnb,  // ← In wei from parseEther
        marketingTaxBigInt,  // ← BigInt
        liquidityTaxBigInt,  // ← BigInt
        customAutoBurn || false
      ];
      
      console.log('  Function parameters:');
      console.log('    [0] name:', normalizedName);
      console.log('    [1] symbol:', normalizedSymbol);
      console.log('    [2] supply (HUMAN):', supply.toString());
      console.log('    [3] decimals:', dec);
      console.log('    [4] metadataURI:', finalMetadataURI);
      console.log('    [5] tier:', normalizedTier);
      console.log('    [6] lpTokenAmount (HUMAN):', lpTokens.toString());
      console.log('    [7] lpBnbAmount (wei):', lpBnb.toString());
      console.log('    [8] customMarketingTax:', marketingTaxBigInt.toString());
      console.log('    [9] customLiquidityTax:', liquidityTaxBigInt.toString());
      console.log('    [10] customAutoBurn:', customAutoBurn || false);
      
      encodedData = factory.interface.encodeFunctionData('createTokenWithLP', params);
      console.log('  ✓ Function encoded successfully');
      console.log('    Encoded data length:', encodedData.length);
      console.log('    Data preview:', encodedData.substring(0, 100) + '...');
    } catch (encodeErr) {
      console.error('  ❌ Error encoding function data:', encodeErr.message);
      console.error('  Stack:', encodeErr.stack);
      return res.status(500).json({
        success: false,
        error: 'Failed to encode transaction: ' + encodeErr.message
      });
    }

    // Validate that encodedData is not empty
    if (!encodedData || encodedData === '0x' || encodedData.length < 10) {
      console.error('  ❌ CRITICAL: Encoded data is empty or invalid!');
      console.error('  encodedData:', encodedData);
      return res.status(500).json({
        success: false,
        error: 'Function encoding produced invalid data'
      });
    }

    const txData = {
      to: factoryAddress,
      from: userAddress,
      value: totalValue.toString(),
      data: encodedData,
      gasLimit: 5000000 // Increased for complex operation
    };

    console.log('\n✅ Transaction prepared successfully');
    console.log('📝 Final transaction data:');
    console.log('  To:', txData.to);
    console.log('  From:', txData.from);
    console.log('  Value (wei):', txData.value);
    console.log('  Value (BNB):', formatEther(txData.value));
    console.log('  Gas limit:', txData.gasLimit);
    console.log('  Data length:', txData.data.length);
    console.log('  Data preview:', txData.data.substring(0, 100) + '...');

    res.json({
      success: true,
      message: 'Transaction with LP prepared successfully',
      transaction: txData,
      metadata,
      fees: {
        tierFee: formatEther(tierFee),
        lpCreationFee: formatEther(LP_CREATION_FEE),
        lpBnbAmount: lpBnbAmount,
        totalValue: formatEther(totalValue)
      },
      details: {
        initialSupply: initialSupply,
        lpTokenAmount: lpTokenAmount,
        lpBnbAmount: lpBnbAmount,
        tokenForUser: initialSupply - lpTokenAmount + ' tokens'
      }
    });

  } catch (error) {
    console.error('❌ Error preparing LP transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/token/finalize-creation
 * Finalize token creation after transaction is confirmed
 * Sends remaining tokens from platform wallet to user
 */
router.post('/finalize-creation', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔨 [FINALIZE] Token creation finalization request received');
    console.log('='.repeat(80));
    const { tokenAddress, userAddress, lpTokenAmount, initialSupply } = req.body;
    console.log('Request data:', { tokenAddress, userAddress, lpTokenAmount, initialSupply });

    // Validate inputs
    console.log('\n✅ [FINALIZE-STEP 1] Validating input addresses');
    if (!isValidAddress(tokenAddress) || !isValidAddress(userAddress)) {
      console.error('❌ Invalid addresses:', { tokenAddress, userAddress });
      return res.status(400).json({
        success: false,
        error: 'Invalid addresses'
      });
    }
    console.log('  ✓ Token address valid:', tokenAddress);
    console.log('  ✓ User address valid:', userAddress);

    // Get token contract
    console.log('\n✅ [FINALIZE-STEP 2] Initializing token contract');
    const token = new ethers.Contract(tokenAddress, [
      "function balanceOf(address) public view returns (uint256)",
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function decimals() public view returns (uint8)"
    ], provider);
    console.log('  ✓ Token contract initialized');

    // Get token decimals
    console.log('\n✅ [FINALIZE-STEP 3] Fetching token decimals');
    const decimals = await token.decimals();
    console.log('  ✓ Token decimals:', decimals);

    // Calculate user token amount
    console.log('\n✅ [FINALIZE-STEP 4] Calculating final token distribution');
    const userTokenAmount = BigInt(initialSupply) - BigInt(lpTokenAmount);
    const userTokenAmountWithDecimals = userTokenAmount * BigInt(10) ** BigInt(decimals);
    console.log('  Initial supply:', initialSupply);
    console.log('  LP token amount:', lpTokenAmount);
    console.log('  User token amount (human):', userTokenAmount.toString());
    console.log('  User token amount (scaled):', userTokenAmountWithDecimals.toString());

    // Check platform wallet balance
    console.log('\n✅ [FINALIZE-STEP 5] Checking platform wallet balance');
    const platformWalletAddress = process.env.PLATFORM_WALLET || '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
    console.log('  Platform wallet:', platformWalletAddress);
    const platformBalance = await token.balanceOf(platformWalletAddress);
    console.log('  ✓ Platform wallet balance:', platformBalance.toString());

    // Log for record (no on-chain action needed from backend)
    // The tokens are already distributed by the factory contract
    // This endpoint just confirms the state

    console.log('\n✅ [FINALIZE] Finalization completed successfully');
    res.json({
      success: true,
      message: 'Token finalization recorded',
      platformBalance: platformBalance.toString(),
      userReceivingAmount: userTokenAmountWithDecimals.toString(),
      note: 'Tokens are automatically distributed by factory contract'
    });

  } catch (error) {
    console.error('\n❌ [FINALIZE] Error finalizing token creation:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/tokens/:address/creator-info
 * Returns creator information including holdings % and trade history
 */
router.get('/:address/creator-info', async (req, res) => {
  try {
    const { address } = req.params;
    const Token = require('../models/Token');

    // Get token from database
    const token = await Token.findByPk(address);
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    const creatorAddress = token.creator.toLowerCase();
    const tokenDecimals = token.decimals || 18;
    const totalSupply = token.totalSupply;

    console.log('🔍 Creator Info Query:', {
      tokenAddress: address,
      creator: creatorAddress,
      totalSupply: totalSupply
    });

    try {
      // Get creator's token balance from blockchain
      const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
      const blockchainProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const ERC20_ABI = [
        'function balanceOf(address) public view returns (uint256)'
      ];
      const tokenContract = new ethers.Contract(address, ERC20_ABI, blockchainProvider);

      const creatorBalance = await tokenContract.balanceOf(creatorAddress);
      const creatorBalanceFormatted = ethers.utils.formatUnits(creatorBalance, tokenDecimals);
      
      // Calculate percentage
      // Önemli: Hem creatorBalance hem totalSupply aynı "decimals" cinsinden olmalı
      // creatorBalance blockchain'den geliyor (already with decimals applied)
      // totalSupply database'den geliyor (raw number without decimals)
      const totalSupplyWithDecimals = ethers.BigNumber.from(totalSupply.toString()).mul(
        ethers.BigNumber.from(10).pow(tokenDecimals)
      );
      const creatorPercentageBig = creatorBalance.mul(10000).div(totalSupplyWithDecimals);
      const creatorPercentage = (parseFloat(creatorPercentageBig.toString()) / 100).toFixed(2);

      console.log('💰 Creator Holdings:', {
        balance: creatorBalance.toString(),
        formatted: creatorBalanceFormatted,
        percentage: creatorPercentage,
        totalSupply: totalSupply,
        totalSupplyWithDecimals: totalSupplyWithDecimals.toString()
      });

      res.json({
        success: true,
        creator: {
          address: creatorAddress,
          balance: creatorBalanceFormatted,
          percentage: parseFloat(creatorPercentage),
          totalSupply: totalSupply
        }
      });

    } catch (blockchainError) {
      console.warn('⚠️ Could not fetch from blockchain:', blockchainError.message);
      // Return database info as fallback
      res.json({
        success: true,
        creator: {
          address: creatorAddress,
          balance: 'N/A',
          percentage: 'N/A',
          totalSupply: totalSupply,
          note: 'Blockchain data unavailable, showing database info'
        }
      });
    }

  } catch (error) {
    console.error('❌ Creator info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/hype/token/:address
 * Get active hype status for a token
 */
router.get('/hype/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Find active hype for this token
    const hype = await TokenHype.findOne({
      where: {
        tokenAddress: address.toLowerCase(),
        status: 'active'
      }
    });

    if (!hype) {
      return res.json({
        success: true,
        active: false,
        hype: null
      });
    }

    // Check if hype is still valid (not expired)
    const now = new Date();
    const endDate = new Date(hype.endDate);
    
    if (endDate <= now) {
      return res.json({
        success: true,
        active: false,
        hype: null,
        message: 'Hype expired'
      });
    }

    res.json({
      success: true,
      active: true,
      hype: {
        id: hype.id,
        tier: hype.tier,
        startDate: hype.startDate,
        endDate: hype.endDate,
        description: hype.description,
        price: hype.price,
        views: hype.views || 0,
        clicks: hype.clicks || 0
      }
    });
  } catch (error) {
    console.error('❌ Get hype error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
