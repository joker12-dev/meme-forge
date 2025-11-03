import { ethers } from 'ethers';
import { getProvider, getCurrentAccount } from './wallet';

// Contract ABIs
import TokenFactoryABI from '../contracts/TokenFactory.json';
import MemeTokenABI from '../contracts/MemeToken.json';
import LiquidityAdderABI from '../contracts/LiquidityAdder.json';

// Contract addresses (update after deployment)
const CONTRACTS = {
  localhost: {
    factory: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Update after deployment
    liquidityAdder: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Update after deployment
    pancakeRouter: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' // Mock router on localhost
  },
  testnet: {
    factory: '0x63a8630b51c13513629b13801A55B748f9Ab13b2', // BSC Testnet factory address v3
    liquidityAdder: '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb', // BSC Testnet liquidity adder address
    pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' // BSC Testnet router
  },
  mainnet: {
    factory: '', // BSC Mainnet factory address
    liquidityAdder: '', // BSC Mainnet liquidity adder address
    pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E' // BSC Mainnet router
  }
};

// Get contract addresses based on network
export const getContractAddresses = async () => {
  if (typeof window.ethereum === 'undefined') {
    return CONTRACTS.localhost;
  }
  
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  
  switch (chainId) {
    case '0x38': // BSC Mainnet (56)
      return CONTRACTS.mainnet;
    case '0x61': // BSC Testnet (97)
      return CONTRACTS.testnet;
    case '0x7a69': // Hardhat localhost (31337)
    default:
      return CONTRACTS.localhost;
  }
};

// Also export CONTRACTS in case other modules want static mapping
export { CONTRACTS };

/**
 * Get TokenFactory contract instance
 */
export const getTokenFactoryContract = async () => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const addresses = await getContractAddresses();
  const signer = await provider.getSigner();
  
  return new ethers.Contract(
    addresses.factory,
    TokenFactoryABI.abi,
    signer
  );
};

/**
 * Get MemeToken contract instance
 * @param {string} tokenAddress - Token contract address
 */
export const getMemeTokenContract = async (tokenAddress) => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const signer = await provider.getSigner();
  
  return new ethers.Contract(
    tokenAddress,
    MemeTokenABI.abi,
    signer
  );
};

/**
 * Get LiquidityAdder contract instance
 */
export const getLiquidityAdderContract = async () => {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');
  
  const addresses = await getContractAddresses();
  const signer = await provider.getSigner();
  
  return new ethers.Contract(
    addresses.liquidityAdder,
    LiquidityAdderABI.abi,
    signer
  );
};

/**
 * Create a new token
 * @param {Object} params - Token creation parameters
 */
export const createToken = async ({
  name,
  symbol,
  initialSupply,
  decimals = 18,
  metadataURI = '',
  tier = 'basic',
  customMarketingTax = 0,
  customLiquidityTax = 0,
  customAutoBurn = false
}) => {
  try {
    const factory = await getTokenFactoryContract();
    
    // Get tier fee
    const tierFee = await factory.getTierFee(tier);
    console.log(`Creating ${tier} token with fee:`, ethers.formatEther(tierFee), 'BNB');
    
    // Create token transaction
    const tx = await factory.createToken(
      name,
      symbol,
      initialSupply,
      decimals,
      metadataURI,
      tier,
      customMarketingTax,
      customLiquidityTax,
      customAutoBurn,
      {
        value: tierFee,
        gasLimit: 3000000 // Set reasonable gas limit
      }
    );
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    // Extract token address from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === 'TokenCreated';
      } catch {
        return false;
      }
    });
    
    if (!event) throw new Error('TokenCreated event not found');
    
    const parsedEvent = factory.interface.parseLog(event);
    const tokenAddress = parsedEvent.args.tokenAddress;
    
    console.log('✅ Token created at:', tokenAddress);
    
    return {
      success: true,
      tokenAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
};

/**
 * Get all tokens created by a user
 * @param {string} userAddress - User wallet address
 */
export const getUserTokens = async (userAddress) => {
  try {
    const factory = await getTokenFactoryContract();
    const tokens = await factory.getUserTokens(userAddress);
    return tokens;
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return [];
  }
};

/**
 * Get all tokens from factory
 */
export const getAllTokens = async () => {
  try {
    const factory = await getTokenFactoryContract();
    const tokens = await factory.getAllTokens();
    return tokens;
  } catch (error) {
    console.error('Error getting all tokens:', error);
    return [];
  }
};

/**
 * Get token details from blockchain
 * @param {string} tokenAddress - Token contract address
 */
export const getTokenDetails = async (tokenAddress) => {
  try {
    const token = await getMemeTokenContract(tokenAddress);
    
    // Fetch all data in parallel
    const [
      name,
      symbol,
      decimals,
      totalSupply,
      owner,
      metadataURI,
      marketingWallet,
      marketingTax,
      liquidityTax,
      autoBurnEnabled
    ] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.totalSupply(),
      token.owner(),
      token.metadataURI(),
      token.marketingWallet(),
      token.marketingTax(),
      token.liquidityTax(),
      token.autoBurnEnabled()
    ]);
    
    return {
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      owner,
      metadataURI,
      marketingWallet,
      marketingTax: Number(marketingTax),
      liquidityTax: Number(liquidityTax),
      autoBurnEnabled
    };
  } catch (error) {
    console.error('Error getting token details:', error);
    throw error;
  }
};

/**
 * Add liquidity to token
 * @param {Object} params - Liquidity parameters
 */
export const addLiquidity = async ({
  tokenAddress,
  tokenAmount,
  ethAmount,
  lockDuration = 0
}) => {
  try {
    const liquidityAdder = await getLiquidityAdderContract();
    const token = await getMemeTokenContract(tokenAddress);
    const userAddress = await getCurrentAccount();
    
    // Convert amounts
    const decimals = await token.decimals();
    const tokenAmountWei = ethers.parseUnits(tokenAmount.toString(), decimals);
    const ethAmountWei = ethers.parseEther(ethAmount.toString());
    
    // Approve tokens first
    console.log('Approving tokens...');
    const approveTx = await token.approve(
      await liquidityAdder.getAddress(),
      tokenAmountWei
    );
    await approveTx.wait();
    console.log('Tokens approved');
    
    // Add liquidity
    console.log('Adding liquidity...');
    const tx = await liquidityAdder.addLiquidityAndLock(
      tokenAddress,
      tokenAmountWei,
      lockDuration,
      {
        value: ethAmountWei,
        gasLimit: 500000
      }
    );
    
    const receipt = await tx.wait();
    console.log('Liquidity added:', receipt);
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('Error adding liquidity:', error);
    throw error;
  }
};

/**
 * Get tier configuration
 * @param {string} tier - Tier name (basic, standard, premium)
 */
export const getTierConfig = async (tier) => {
  try {
    const factory = await getTokenFactoryContract();
    const config = await factory.getTierConfig(tier);
    
    return {
      fee: ethers.formatEther(config.fee),
      defaultMarketingTax: Number(config.defaultMarketingTax),
      defaultLiquidityTax: Number(config.defaultLiquidityTax),
      defaultAutoBurn: config.defaultAutoBurn,
      maxTotalTax: Number(config.maxTotalTax)
    };
  } catch (error) {
    console.error('Error getting tier config:', error);
    throw error;
  }
};

/**
 * Update token taxes (owner only)
 * @param {string} tokenAddress - Token contract address
 * @param {number} marketingTax - Marketing tax percentage
 * @param {number} liquidityTax - Liquidity tax percentage
 */
export const updateTokenTaxes = async (tokenAddress, marketingTax, liquidityTax) => {
  try {
    const token = await getMemeTokenContract(tokenAddress);
    
    const tx = await token.setTaxes(marketingTax, liquidityTax);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error) {
    console.error('Error updating taxes:', error);
    throw error;
  }
};

/**
 * Burn tokens
 * @param {string} tokenAddress - Token contract address
 * @param {string} amount - Amount to burn
 */
export const burnTokens = async (tokenAddress, amount) => {
  try {
    const token = await getMemeTokenContract(tokenAddress);
    const decimals = await token.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    const tx = await token.burn(amountWei);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      amount
    };
  } catch (error) {
    console.error('Error burning tokens:', error);
    throw error;
  }
};

/**
 * Get token balance for an address
 * @param {string} tokenAddress - Token contract address
 * @param {string} walletAddress - Wallet address to check
 */
export const getTokenBalance = async (tokenAddress, walletAddress) => {
  try {
    const token = await getMemeTokenContract(tokenAddress);
    const balance = await token.balanceOf(walletAddress);
    const decimals = await token.decimals();
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

/**
 * Transfer tokens
 * @param {string} tokenAddress - Token contract address
 * @param {string} to - Recipient address
 * @param {string} amount - Amount to transfer
 */
export const transferTokens = async (tokenAddress, to, amount) => {
  try {
    const token = await getMemeTokenContract(tokenAddress);
    const decimals = await token.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    const tx = await token.transfer(to, amountWei);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash
    };
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
};

/**
 * Listen to token events
 * @param {string} tokenAddress - Token contract address
 * @param {function} callback - Callback function for events
 */
export const listenToTokenEvents = async (tokenAddress, callback) => {
  try {
    const token = await getMemeTokenContract(tokenAddress);
    
    // Listen to Transfer events
    token.on('Transfer', (from, to, amount, event) => {
      callback({
        type: 'Transfer',
        from,
        to,
        amount: ethers.formatUnits(amount, 18),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash
      });
    });
    
    // Listen to TokensBurned events
    token.on('TokensBurned', (from, amount, event) => {
      callback({
        type: 'Burn',
        from,
        amount: ethers.formatUnits(amount, 18),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash
      });
    });
    
    return () => {
      token.removeAllListeners();
    };
  } catch (error) {
    console.error('Error setting up event listeners:', error);
    throw error;
  }
};

export default {
  getTokenFactoryContract,
  getMemeTokenContract,
  getLiquidityAdderContract,
  createToken,
  getUserTokens,
  getAllTokens,
  getTokenDetails,
  addLiquidity,
  getTierConfig,
  updateTokenTaxes,
  burnTokens,
  getTokenBalance,
  transferTokens,
  listenToTokenEvents
};

