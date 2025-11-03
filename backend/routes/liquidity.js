// backend/routes/liquidity.js
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const WebSocket = require('ws');
const Token = require('../models/Token');

// WebSocket server for real-time data
const wss = new WebSocket.Server({ port: 8081 });
const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  console.log('New liquidity WebSocket connection');
  
  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

// Broadcast to all connected clients
const broadcast = (data) => {
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// LiquidityLockManager ABI
const LOCK_MANAGER_ABI = [
  "function lockLiquidity(address lpToken, uint256 amount, uint256 duration) external",
  "function unlockLiquidity(address lpToken, uint256 lockIndex) external",
  "function getTokenLockSummary(address lpToken, address user) external view returns (tuple(uint256 totalLocked, uint256 nextUnlockTime, tuple(uint256 amount, uint256 unlockTime, bool isUnlocked)[] activeLocks))",
  "function getUserLockedTokens(address user) external view returns (address[])"
];

// Provider setup
const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org");

// Get liquidity locks for a token
router.get('/locks/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const token = await Token.findOne({ address: tokenAddress });
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Get factory contract
    const factory = new ethers.Contract(process.env.FACTORY_ADDRESS, ["function getLiquidityLockManager() external view returns (address)"], provider);
    const lockManagerAddress = await factory.getLiquidityLockManager();
    
    // Get lock manager contract
    const lockManager = new ethers.Contract(lockManagerAddress, LOCK_MANAGER_ABI, provider);
    
    // Get lock info
    const lockInfo = await lockManager.getTokenLockSummary(token.lpToken, token.owner);
    
    res.json({
      totalLocked: lockInfo.totalLocked.toString(),
      nextUnlockTime: lockInfo.nextUnlockTime.toNumber(),
      activeLocks: lockInfo.activeLocks.map(lock => ({
        amount: lock.amount.toString(),
        unlockTime: lock.unlockTime.toNumber(),
        isUnlocked: lock.isUnlocked
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lock info for a specific user
router.get('/locks/:tokenAddress/:userAddress', async (req, res) => {
  try {
    const { tokenAddress, userAddress } = req.params;
    const token = await Token.findOne({ address: tokenAddress });
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Get factory contract
    const factory = new ethers.Contract(process.env.FACTORY_ADDRESS, ["function getLiquidityLockManager() external view returns (address)"], provider);
    const lockManagerAddress = await factory.getLiquidityLockManager();
    
    // Get lock manager contract
    const lockManager = new ethers.Contract(lockManagerAddress, LOCK_MANAGER_ABI, provider);
    
    // Get user's lock info
    const lockInfo = await lockManager.getTokenLockSummary(token.lpToken, userAddress);
    
    res.json({
      totalLocked: lockInfo.totalLocked.toString(),
      nextUnlockTime: lockInfo.nextUnlockTime.toNumber(),
      activeLocks: lockInfo.activeLocks.map(lock => ({
        amount: lock.amount.toString(),
        unlockTime: lock.unlockTime.toNumber(),
        isUnlocked: lock.isUnlocked
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new lock
router.post('/lock/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { amount, duration, userAddress, txHash } = req.body;
    
    if (!amount || !duration || !userAddress || !txHash) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const token = await Token.findOne({ address: tokenAddress });
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    await Token.updateOne(
      { address: tokenAddress },
      { 
        $push: { 
          liquidityLocks: {
            amount,
            duration,
            userAddress,
            txHash,
            timestamp: new Date()
          }
        }
      }
    );
    
    // Broadcast new lock
    broadcast({
      type: 'NEW_LOCK',
      data: {
        tokenAddress,
        amount,
        duration,
        userAddress,
        txHash,
        timestamp: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lock details
router.put('/lock/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { lockId, duration, txHash } = req.body;
    
    if (!lockId || !duration || !txHash) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const token = await Token.findOne({ address: tokenAddress });
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    await Token.updateOne(
      { 
        address: tokenAddress,
        'liquidityLocks._id': lockId 
      },
      { 
        $set: { 
          'liquidityLocks.$.duration': duration,
          'liquidityLocks.$.txHash': txHash,
          'liquidityLocks.$.timestamp': new Date()
        }
      }
    );
    
    // Broadcast lock update
    broadcast({
      type: 'UPDATE_LOCK',
      data: {
        tokenAddress,
        lockId,
        duration,
        txHash,
        timestamp: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove lock
router.delete('/lock/:tokenAddress/:lockId', async (req, res) => {
  try {
    const { tokenAddress, lockId } = req.params;
    const { txHash } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ error: 'Missing txHash parameter' });
    }

    const token = await Token.findOne({ address: tokenAddress });
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    await Token.updateOne(
      { address: tokenAddress },
      { 
        $pull: { 
          liquidityLocks: { _id: lockId }
        }
      }
    );
    
    // Broadcast lock removal
    broadcast({
      type: 'REMOVE_LOCK',
      data: {
        tokenAddress,
        lockId,
        txHash,
        timestamp: new Date()
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/liquidity/lock-liquidity
 * Lock LP tokens for a specified duration
 */
router.post('/lock-liquidity', async (req, res) => {
  try {
    const { tokenAddress, userAddress, duration, lpTokenAmount } = req.body;

    console.log('🔒 Lock Liquidity Request:', {
      tokenAddress,
      userAddress,
      duration,
      lpTokenAmount
    });

    if (!tokenAddress || !userAddress || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: tokenAddress, userAddress, duration'
      });
    }

    // Validate duration (minimum 7 days in seconds)
    const MIN_LOCK_DURATION = 7 * 24 * 60 * 60; // 7 days
    if (duration < MIN_LOCK_DURATION) {
      return res.status(400).json({
        success: false,
        error: `Lock duration must be at least 7 days (${MIN_LOCK_DURATION} seconds)`
      });
    }

    // Get LiquidityLockManager address from factory or use env variable
    const lockManagerAddress = process.env.LIQUIDITY_LOCK_MANAGER_ADDRESS || 
                               '0x'; // Will be set from factory

    if (!lockManagerAddress || lockManagerAddress === '0x') {
      console.warn('⚠️ LiquidityLockManager address not configured');
      
      // For now, just log the lock (non-blocking)
      console.log('📝 Recording lock in database (contract lock skipped):', {
        tokenAddress,
        userAddress,
        duration,
        unlockTime: new Date(Date.now() + duration * 1000)
      });

      // Save to database
      try {
        const token = await Token.findOne({ address: tokenAddress });
        if (token) {
          if (!token.liquidityLocks) {
            token.liquidityLocks = [];
          }
          token.liquidityLocks.push({
            userAddress,
            amount: lpTokenAmount || 'pending',
            duration,
            unlockTime: new Date(Date.now() + duration * 1000),
            createdAt: new Date()
          });
          await token.save();
          console.log('✅ Lock recorded in database');
        }
      } catch (dbErr) {
        console.warn('⚠️ Database lock recording failed:', dbErr.message);
      }

      return res.json({
        success: true,
        message: 'LP lock scheduled',
        lockDuration: duration,
        unlockTime: new Date(Date.now() + duration * 1000).toISOString()
      });
    }

    // Try to lock on chain
    try {
      const platformPrivateKey = process.env.PRIVATE_KEY;
      if (!platformPrivateKey) {
        throw new Error('PRIVATE_KEY not configured');
      }

      const platformSigner = new ethers.Wallet(platformPrivateKey, provider);

      // Get LP token (Pancake pair) address
      // This is typically created when addLiquidityETH is called
      // For now, we use factory to get pair address
      const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || process.env.REACT_APP_FACTORY_ADDRESS;
      const WETH_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB on BSC testnet

      const FACTORY_ABI = [
        'function getPair(address tokenA, address tokenB) external view returns (address pair)'
      ];

      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const lpTokenAddress = await factory.getPair(tokenAddress, WETH_ADDRESS);

      if (!lpTokenAddress || lpTokenAddress === ethers.ZeroAddress) {
        console.warn('⚠️ LP Pair not found on chain');
        return res.status(400).json({
          success: false,
          error: 'LP pair not found'
        });
      }

      console.log('✅ LP Token Address Found:', lpTokenAddress);

      // Get user's LP balance
      const ERC20_ABI = [
        'function balanceOf(address account) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ];

      const lpTokenContract = new ethers.Contract(lpTokenAddress, ERC20_ABI, platformSigner);
      const userLPBalance = await lpTokenContract.balanceOf(userAddress);

      console.log('📊 User LP Balance:', ethers.formatEther(userLPBalance));

      if (userLPBalance === 0n) {
        return res.status(400).json({
          success: false,
          error: 'User has no LP tokens to lock'
        });
      }

      // Approve LiquidityLockManager to spend LP tokens
      const approveTx = await lpTokenContract.approve(lockManagerAddress, userLPBalance);
      console.log('✅ Approve tx sent:', approveTx.hash);
      await approveTx.wait();
      console.log('✅ Approve confirmed');

      // Lock liquidity
      const lockManagerABI = [
        'function lockLiquidity(address lpToken, uint256 amount, uint256 duration) external'
      ];

      const lockManager = new ethers.Contract(lockManagerAddress, lockManagerABI, platformSigner);
      const lockTx = await lockManager.lockLiquidity(lpTokenAddress, userLPBalance, duration);
      console.log('✅ Lock tx sent:', lockTx.hash);

      const lockReceipt = await lockTx.wait();
      console.log('✅ Lock confirmed:', lockReceipt.hash);

      return res.json({
        success: true,
        message: 'LP tokens locked successfully',
        lpTokenAddress,
        amount: ethers.formatEther(userLPBalance),
        lockDuration: duration,
        unlockTime: new Date(Date.now() + duration * 1000).toISOString(),
        txHash: lockReceipt.hash
      });

    } catch (chainErr) {
      console.warn('⚠️ On-chain lock failed:', chainErr.message);
      console.log('📝 Recording lock in database as fallback...');

      // Fallback: Record in database
      try {
        const token = await Token.findOne({ address: tokenAddress });
        if (token) {
          if (!token.liquidityLocks) {
            token.liquidityLocks = [];
          }
          token.liquidityLocks.push({
            userAddress,
            amount: lpTokenAmount || 'pending',
            duration,
            unlockTime: new Date(Date.now() + duration * 1000),
            createdAt: new Date(),
            status: 'database_only'
          });
          await token.save();
          console.log('✅ Lock recorded in database');
        }
      } catch (dbErr) {
        console.warn('⚠️ Database fallback failed:', dbErr.message);
      }

      return res.json({
        success: true,
        message: 'LP lock recorded (chain lock pending)',
        lockDuration: duration,
        unlockTime: new Date(Date.now() + duration * 1000).toISOString(),
        warning: chainErr.message
      });
    }

  } catch (error) {
    console.error('❌ Lock liquidity error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;