/**
 * DexScreener API Integration
 * Fetches real-time token data from DexScreener
 */

const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest/dex';

/**
 * Fetch token data by address from DexScreener
 * @param {string} tokenAddress - The token contract address
 * @param {string} chain - The blockchain (default: 'bsc')
 * @returns {Promise<Object>} Token data from DexScreener
 */
export const fetchTokenDataFromDexScreener = async (tokenAddress, chain = 'bsc') => {
  try {
    const url = `${DEXSCREENER_API_BASE}/tokens/${tokenAddress}`;
    console.log(`🔍 Fetching DexScreener data for ${tokenAddress}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      console.warn(`⚠️ No pairs found on DexScreener for ${tokenAddress}`);
      return null;
    }
    
    // Get the most liquid pair (usually the main trading pair)
    const mainPair = data.pairs.reduce((prev, current) => 
      (parseFloat(current.liquidity?.usd || 0) > parseFloat(prev.liquidity?.usd || 0)) ? current : prev
    );
    
    console.log(`✅ DexScreener data fetched for ${tokenAddress}:`, mainPair);
    
    return {
      address: tokenAddress,
      name: mainPair.baseToken?.name,
      symbol: mainPair.baseToken?.symbol,
      price: parseFloat(mainPair.priceUsd) || 0,
      priceChange24h: parseFloat(mainPair.priceChange?.h24) || 0,
      priceChange6h: parseFloat(mainPair.priceChange?.h6) || 0,
      priceChange1h: parseFloat(mainPair.priceChange?.h1) || 0,
      volume24h: parseFloat(mainPair.volume?.h24) || 0,
      volume6h: parseFloat(mainPair.volume?.h6) || 0,
      liquidity: parseFloat(mainPair.liquidity?.usd) || 0,
      fdv: parseFloat(mainPair.fdv) || 0, // Fully Diluted Valuation
      marketCap: parseFloat(mainPair.marketCap) || 0,
      pairAddress: mainPair.pairAddress,
      dexId: mainPair.dexId,
      pairCreatedAt: mainPair.pairCreatedAt,
      url: mainPair.url,
      txns24h: {
        buys: mainPair.txns?.h24?.buys || 0,
        sells: mainPair.txns?.h24?.sells || 0,
        total: (mainPair.txns?.h24?.buys || 0) + (mainPair.txns?.h24?.sells || 0)
      },
      txns6h: {
        buys: mainPair.txns?.h6?.buys || 0,
        sells: mainPair.txns?.h6?.sells || 0,
        total: (mainPair.txns?.h6?.buys || 0) + (mainPair.txns?.h6?.sells || 0)
      }
    };
  } catch (error) {
    console.error(`❌ Error fetching DexScreener data for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Fetch multiple tokens data from DexScreener
 * @param {Array<string>} tokenAddresses - Array of token addresses
 * @param {string} chain - The blockchain (default: 'bsc')
 * @returns {Promise<Object>} Object mapping addresses to their DexScreener data
 */
export const fetchMultipleTokensData = async (tokenAddresses, chain = 'bsc') => {
  try {
    const results = {};
    
    // DexScreener has rate limits, so we'll batch requests with delays
    for (const address of tokenAddresses) {
      const data = await fetchTokenDataFromDexScreener(address, chain);
      if (data) {
        results[address.toLowerCase()] = data;
      }
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error fetching multiple tokens from DexScreener:', error);
    return {};
  }
};

/**
 * Search tokens on DexScreener
 * @param {string} query - Search query (name, symbol, or address)
 * @returns {Promise<Array>} Search results
 */
export const searchTokensOnDexScreener = async (query) => {
  try {
    const url = `${DEXSCREENER_API_BASE}/search?q=${encodeURIComponent(query)}`;
    console.log(`🔍 Searching DexScreener for: ${query}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.pairs || [];
  } catch (error) {
    console.error(`❌ Error searching DexScreener:`, error);
    return [];
  }
};

/**
 * Get token price chart data (if available)
 * Note: DexScreener API doesn't provide historical chart data directly
 * You might need to use their pairs endpoint and cache data
 */
export const getTokenPriceHistory = async (pairAddress) => {
  // DexScreener doesn't provide this in their public API
  // You would need to cache price data over time or use another service
  console.warn('⚠️ Price history not available from DexScreener public API');
  return null;
};

/**
 * Format DexScreener data to match our token structure
 * @param {Object} dexData - Data from DexScreener
 * @param {Object} dbToken - Token data from database
 * @returns {Object} Merged token data
 */
export const mergeDexDataWithToken = (dexData, dbToken) => {
  if (!dexData) return dbToken;
  
  return {
    ...dbToken,
    // Override with fresh DexScreener data
    price: dexData.price,
    priceChange24h: dexData.priceChange24h,
    priceChange6h: dexData.priceChange6h,
    priceChange1h: dexData.priceChange1h,
    volume24h: dexData.volume24h,
    volume6h: dexData.volume6h,
    liquidity: dexData.liquidity,
    marketCap: dexData.marketCap,
    fdv: dexData.fdv,
    pairAddress: dexData.pairAddress,
    dexId: dexData.dexId,
    txns24h: dexData.txns24h,
    txns6h: dexData.txns6h,
    dexScreenerUrl: dexData.url,
    // Calculated fields
    holders: dbToken.holders || Math.floor(dexData.txns24h.total * 0.3), // Estimate
    // Keep database data
    name: dbToken.name || dexData.name,
    symbol: dbToken.symbol || dexData.symbol,
    description: dbToken.description,
    website: dbToken.website,
    telegram: dbToken.telegram,
    twitter: dbToken.twitter,
    tier: dbToken.tier,
    features: dbToken.features,
    createdAt: dbToken.createdAt
  };
};

/**
 * Check if token exists on DexScreener (has liquidity/trading)
 * @param {string} tokenAddress
 * @returns {Promise<boolean>}
 */
export const isTokenLiveOnDex = async (tokenAddress) => {
  const data = await fetchTokenDataFromDexScreener(tokenAddress);
  return data !== null && data.liquidity > 0;
};

export default {
  fetchTokenDataFromDexScreener,
  fetchMultipleTokensData,
  searchTokensOnDexScreener,
  getTokenPriceHistory,
  mergeDexDataWithToken,
  isTokenLiveOnDex
};

