/**
 * New Routes for Token Creator Info & Holdings
 * Add this to backend/routes/tokens.js
 */

// GET /api/tokens/:address/creator-info
// Returns creator information including holdings % and trade history
router.get('/:address/creator-info', async (req, res) => {
  try {
    const { address } = req.params;

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
    const totalSupply = BigInt(token.totalSupply);

    console.log('🔍 Creator Info Query:', {
      tokenAddress: address,
      creator: creatorAddress,
      totalSupply: totalSupply.toString()
    });

    // Get creator's token balance from blockchain
    const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545');
    const ERC20_ABI = [
      'function balanceOf(address) public view returns (uint256)',
      'function decimals() public view returns (uint8)'
    ];
    const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);

    const creatorBalance = await tokenContract.balanceOf(creatorAddress);
    const creatorBalanceFormatted = ethers.utils.formatUnits(creatorBalance, tokenDecimals);
    
    // Calculate percentage
    const creatorPercentage = (BigInt(creatorBalance) * BigInt(100) / totalSupply).toString();

    console.log('💰 Creator Holdings:', {
      balance: creatorBalance.toString(),
      formatted: creatorBalanceFormatted,
      percentage: creatorPercentage
    });

    // Get creator's trade history from database
    const trades = await Trade.findAll({
      where: {
        [Op.or]: [
          { user: creatorAddress },
          { from: creatorAddress }
        ],
        tokenAddress: address.toLowerCase()
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
      raw: true
    });

    // Format trades response
    const formattedTrades = trades.map(trade => ({
      type: trade.type || (trade.amount > 0 ? 'BUY' : 'SELL'),
      amount: trade.amount,
      value: trade.value,
      price: trade.price,
      txHash: trade.txHash,
      timestamp: trade.createdAt,
      timeAgo: getTimeAgo(new Date(trade.createdAt))
    }));

    res.json({
      success: true,
      creator: {
        address: creatorAddress,
        balance: creatorBalanceFormatted,
        percentage: parseFloat(creatorPercentage),
        totalSupply: ethers.utils.formatUnits(totalSupply, tokenDecimals)
      },
      trades: formattedTrades,
      tradesCount: formattedTrades.length
    });

  } catch (error) {
    console.error('❌ Creator info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to format time
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return seconds + 's ago';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

// GET /api/tokens/:address/holders
// Returns top holders of the token
router.get('/:address/holders', async (req, res) => {
  try {
    const { address } = req.params;

    // Get token from database
    const token = await Token.findByPk(address);
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // In a real system, you'd query a database or indexer with holder information
    // For now, return empty as we don't have this data source
    res.json({
      success: true,
      holders: [],
      message: 'Holder data requires external indexer integration'
    });

  } catch (error) {
    console.error('❌ Holders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
