import { ethers } from 'ethers';

// BSC Testnet Configuration
export const BSC_TESTNET_CONFIG = {
  chainId: '0x61', // 97
  chainName: 'BSC Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/']
};

/**
 * Simple wallet detection - Just use window.ethereum
 */
export const detectWalletProvider = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return window.ethereum;
};

/**
 * Get wallet provider - just return window.ethereum
 */
export const getProviderByWallet = (walletId) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.log(`❌ No wallet provider found`);
    return null;
  }
  
  console.log(`✅ Using window.ethereum for ${walletId}`);
  return window.ethereum;
};

/**
 * Check if wallet is installed - just check window.ethereum
 */
export const isWalletInstalled = (walletId) => {
  const hasWallet = typeof window !== 'undefined' && !!window.ethereum;
  console.log(`${hasWallet ? '✅' : '❌'} Wallet ${hasWallet ? 'installed' : 'NOT installed'}`);
  return hasWallet;
};

/**
 * Connect to wallet - Simple connection like before
 */
export const connectToWallet = async (walletId) => {
  console.log(`\n🔗 Connecting to wallet: ${walletId}`);
  
  try {
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
    }

    console.log(`📲 Requesting accounts...`);

    // Request accounts - works for all EIP-1193 compatible wallets
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    console.log(`✅ Connected to: ${address.substring(0, 6)}...${address.substring(38)}`);

    // Check and switch to BSC Testnet
    console.log(`🌐 Checking network...`);
    await switchOrAddBSCTestnet(window.ethereum);
    console.log(`✅ Network OK\n`);

    return {
      address: address,
      provider: window.ethereum,
      walletType: walletId
    };
  } catch (error) {
    console.log(`\n❌ Connection failed: ${error.message}\n`);
    throw error;
  }
};

// Switch to BSC Testnet or add it
export const switchOrAddBSCTestnet = async (provider) => {
  try {
    const chainId = await provider.request({ method: 'eth_chainId' });
    
    if (chainId === BSC_TESTNET_CONFIG.chainId) {
      return true;
    }

    // Try to switch
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_CONFIG.chainId }]
      });
      return true;
    } catch (switchError) {
      // If chain doesn't exist (error 4902), add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_TESTNET_CONFIG]
        });
        return true;
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Error switching network:', error);
    throw error;
  }
};

// Get ethers provider (ethers v6 - BrowserProvider)
export const getEthersProvider = (provider) => {
  if (!provider) {
    throw new Error('No provider available');
  }
  return new ethers.BrowserProvider(provider);
};

// Get signer (ethers v6)
export const getSigner = async (provider) => {
  try {
    const ethersProvider = getEthersProvider(provider);
    const signer = await ethersProvider.getSigner();
    console.log('✅ Signer obtained:', await signer.getAddress());
    return signer;
  } catch (error) {
    console.error('❌ Error getting signer:', error);
    throw error;
  }
};

// Get balance
export const getWalletBalance = async (provider, address) => {
  try {
    const ethersProvider = getEthersProvider(provider);
    const balance = await ethersProvider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

// Get token balance
export const getTokenBalance = async (provider, tokenAddress, walletAddress) => {
  try {
    const ethersProvider = getEthersProvider(provider);
    const tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, tokenABI, ethersProvider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals()
    ]);
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

// Sign message
export const signMessage = async (provider, message) => {
  try {
    const signer = await getSigner(provider);
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

// Send transaction
export const sendTransaction = async (provider, transaction) => {
  try {
    const signer = await getSigner(provider);
    const tx = await signer.sendTransaction(transaction);
    return await tx.wait();
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

// Call contract function
export const callContractFunction = async (provider, contractAddress, abi, functionName, params = [], value = null) => {
  try {
    const signer = await getSigner(provider);
    const contract = new ethers.Contract(contractAddress, abi, signer);
    
    const options = {};
    if (value) {
      options.value = ethers.parseEther(value.toString());
    }
    
    const tx = await contract[functionName](...params, options);
    return await tx.wait();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

// Get contract with signer (for write operations)
export const getContractWithSigner = async (provider, contractAddress, abi) => {
  const signer = await getSigner(provider);
  return new ethers.Contract(contractAddress, abi, signer);
};

// Get contract with provider (for read-only operations)
export const getContractWithProvider = (provider, contractAddress, abi) => {
  const ethersProvider = getEthersProvider(provider);
  return new ethers.Contract(contractAddress, abi, ethersProvider);
};

// Get current network
export const getCurrentNetwork = async (provider) => {
  try {
    const chainId = await provider.request({ method: 'eth_chainId' });
    
    const networks = {
      '0x1': { name: 'Ethereum Mainnet', isBSC: false },
      '0x38': { name: 'BSC Mainnet', isBSC: true },
      '0x61': { name: 'BSC Testnet', isBSC: true },
      '0x89': { name: 'Polygon Mainnet', isBSC: false },
      '0xaa36a7': { name: 'Sepolia Testnet', isBSC: false }
    };
    
    return networks[chainId] || { name: 'Unknown Network', isBSC: false, chainId };
  } catch (error) {
    console.error('Error getting network:', error);
    return { name: 'Unknown', isBSC: false };
  }
};

// Listen to account changes
export const onAccountsChanged = (provider, callback) => {
  if (provider && provider.on) {
    provider.on('accountsChanged', callback);
  }
};

// Listen to chain changes
export const onChainChanged = (provider, callback) => {
  if (provider && provider.on) {
    provider.on('chainChanged', callback);
  }
};

// Remove listeners
export const removeAllListeners = (provider) => {
  if (provider && provider.removeAllListeners) {
    provider.removeAllListeners('accountsChanged');
    provider.removeAllListeners('chainChanged');
  }
};

// Wallet metadata
export const WALLET_METADATA = {
  metamask: {
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    downloadUrl: 'https://metamask.io/download/',
    color: '#F6851B',
    deepLink: 'https://metamask.app.link/dapp/'
  },
  trustwallet: {
    name: 'Trust Wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
    downloadUrl: 'https://trustwallet.com/download',
    color: '#3375BB',
    deepLink: 'https://link.trustwallet.com/open_url?url='
  },
  binance: {
    name: 'Binance Wallet',
    icon: 'https://bin.bnbstatic.com/static/images/common/favicon.ico',
    downloadUrl: 'https://www.binance.com/en/wallet',
    color: '#F0B90B',
    deepLink: null
  },
  okx: {
    name: 'OKX Wallet',
    icon: 'https://static.okx.com/cdn/assets/imgs/221/58A8C28DF6F6C7EB.png',
    downloadUrl: 'https://www.okx.com/web3',
    color: '#000000',
    deepLink: null
  },
  safepal: {
    name: 'SafePal',
    icon: 'https://www.safepal.com/favicon.ico',
    downloadUrl: 'https://www.safepal.com/download',
    color: '#6366F1',
    deepLink: null
  },
  tokenpocket: {
    name: 'TokenPocket',
    icon: 'https://www.tokenpocket.pro/favicon.ico',
    downloadUrl: 'https://www.tokenpocket.pro/en/download/app',
    color: '#2980FE',
    deepLink: null
  }
};

export default {
  detectWalletProvider,
  getProviderByWallet,
  isWalletInstalled,
  connectToWallet,
  switchOrAddBSCTestnet,
  getEthersProvider,
  getSigner,
  getWalletBalance,
  getTokenBalance,
  signMessage,
  sendTransaction,
  callContractFunction,
  getCurrentNetwork,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners,
  WALLET_METADATA,
  BSC_TESTNET_CONFIG
};

