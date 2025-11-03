import { ethers } from 'ethers';

// BSC Mainnet ve Testnet bilgileri
const BSC_MAINNET = {
  chainId: '0x38',
  chainName: 'Binance Smart Chain Mainnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

const BSC_TESTNET = {
  chainId: '0x61',
  chainName: 'Binance Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
};

const HARDHAT_localhost = {
  chainId: '0x7a69', // 31337 in hex
  chainName: 'Hardhat localhost',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [process.env.REACT_APP_BSC_RPC_URL],
  blockExplorerUrls: [],
};

// MetaMask bağlantısı - BSC Testnet'e otomatik geçiş
export const connectWallet = async (walletType = 'MetaMask') => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      let provider = window.ethereum;

      console.log('🔍 Wallet Detection Started');
      console.log('Requested wallet:', walletType);
      console.log('window.ethereum exists:', !!window.ethereum);
      console.log('window.ethereum.providers:', window.ethereum.providers);
      
      // Multiple provider detection (MetaMask injects providers array)
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        console.log('📦 Multiple providers detected:', window.ethereum.providers.length);
        
        // Log all providers
        window.ethereum.providers.forEach((p, index) => {
          console.log(`Provider ${index}:`, {
            isMetaMask: p.isMetaMask,
            isPhantom: p.isPhantom,
            isBraveWallet: p.isBraveWallet,
          });
        });
        
        if (walletType === 'Phantom') {
          // Phantom'ı bul
          provider = window.ethereum.providers.find(p => p.isPhantom === true);
          
          if (!provider) {
            console.error('❌ Phantom provider not found');
            throw new Error('Phantom yüklü değil. Lütfen Phantom eklentisini yükleyin.');
          }
          console.log('✅ Found Phantom provider');
        } else if (walletType === 'MetaMask') {
          // MetaMask'ı bul - isMetaMask true ama isPhantom false olan
          provider = window.ethereum.providers.find(p => p.isMetaMask === true && !p.isPhantom);
          
          if (!provider) {
            // Alternatif: ilk MetaMask provider'ı al
            provider = window.ethereum.providers.find(p => p.isMetaMask === true);
          }
          
          if (!provider) {
            console.error('❌ MetaMask provider not found');
            throw new Error('MetaMask yüklü değil. Lütfen MetaMask eklentisini yükleyin.');
          }
          console.log('✅ Found MetaMask provider');
        }
      } else {
        // Single provider - Her ikisi de aynı provider'ı kullanıyor
        console.log('📦 Single provider detected');
        console.log('Provider flags:', {
          isMetaMask: window.ethereum.isMetaMask,
          isPhantom: window.ethereum.isPhantom,
        });
        
        // Phantom kontrolü
        if (walletType === 'Phantom') {
          if (window.phantom?.ethereum) {
            // Phantom'ın kendi provider'ı varsa
            provider = window.phantom.ethereum;
            console.log('✅ Using Phantom provider from window.phantom');
          } else if (!window.ethereum.isPhantom) {
            throw new Error('Phantom yüklü değil. Lütfen Phantom eklentisini yükleyin.');
          }
        } else if (walletType === 'MetaMask') {
          if (!window.ethereum.isMetaMask) {
            throw new Error('MetaMask yüklü değil. Lütfen MetaMask eklentisini yükleyin.');
          }
        }
        
        // Her iki cüzdan da yüklü ve tek provider kullanıyorsa
        if (window.ethereum.isMetaMask && window.ethereum.isPhantom) {
          console.log('⚠️ Both wallets detected on same provider');
        }
      }
      
      console.log('🔗 Connecting to provider...');
      
      // Request accounts from the specific provider
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('Hesap bulunamadı');
      }
      
      console.log(`✅ Connected to ${walletType}:`, accounts[0]);
      
      // Check current network
      const chainId = await provider.request({ method: 'eth_chainId' });
      console.log('Current chain:', chainId);
      
      // Always try to switch to BSC Testnet
      try {
        await switchToBSCNetwork(true, provider); // true = testnet
        console.log('✅ Switched to BSC Testnet');
      } catch (error) {
        console.warn('Could not switch to BSC Testnet:', error);
      }
      
      return accounts[0];
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      throw error;
    }
  } else {
    throw new Error('Web3 cüzdanı bulunamadı. Lütfen MetaMask veya Phantom yükleyin.');
  }
};

// Mevcut hesabı kontrol et
export const getCurrentAccount = async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts[0] || null;
  }
  return null;
};

// Provider oluştur
export const getProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

// BSC ağına bağlı mı kontrol et (BSC Testnet'i tercih et)
export const isConnectedToBSC = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      
      // BSC Testnet: 0x61 (97 decimal) - Preferred for development
      // BSC Mainnet: 0x38 (56 decimal)
      return chainId === '0x61' || chainId === '0x38';
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }
  return false;
};

// BSC Mainnet'e geç
export const switchToBSCNetwork = async (useTestnet = false, provider = null) => {
  const ethereumProvider = provider || window.ethereum;
  
  if (typeof ethereumProvider !== 'undefined') {
    try {
      const targetNetwork = useTestnet ? BSC_TESTNET : BSC_MAINNET;
      
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
      
      return true;
    } catch (switchError) {
      // Eğer zincir MetaMask'ta ekli değilse, eklemeyi dene
      if (switchError.code === 4902) {
        try {
          const targetNetwork = useTestnet ? BSC_TESTNET : BSC_MAINNET;
          
          await ethereumProvider.request({
            method: 'wallet_addEthereumChain',
            params: [targetNetwork],
          });
          
          return true;
        } catch (addError) {
          console.error('Error adding BSC network:', addError);
          throw new Error('Failed to add BSC network to wallet');
        }
      }
      console.error('Error switching to BSC network:', switchError);
      throw new Error('Failed to switch to BSC network');
    }
  } else {
    throw new Error('Wallet not installed');
  }
};

// BNB balance'ını al
export const getBalance = async (userAddress = null) => {
  try {
    let address = userAddress;
    if (!address) {
      address = await getCurrentAccount();
      if (!address) throw new Error('No wallet connected');
    }
    
    const provider = getProvider();
    if (!provider) throw new Error('Provider not available');
    
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance);
    console.log(`BNB Balance: ${formattedBalance} for ${address}`);
    return formattedBalance;
  } catch (error) {
    console.error('Error getting BNB balance:', error);
    return '0';
  }
};

// ETH balance'ını al (BNB ile uyumluluk için)
export const getETHBalance = async (userAddress = null) => {
  return getBalance(userAddress);
};

// Token balance'ını al
export const getTokenBalance = async (tokenAddress, userAddress = null) => {
  try {
    let address = userAddress;
    if (!address) {
      address = await getCurrentAccount();
      if (!address) throw new Error('No wallet connected');
    }

    const provider = getProvider();
    if (!provider) throw new Error('Provider not available');

    // ERC-20 Token ABI
    const tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
    
    // Balance ve decimals'i paralel al
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(address),
      tokenContract.decimals()
    ]);
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log(`Token Balance: ${formattedBalance} for ${address}`);
    
    return formattedBalance;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

// Token approve işlemi
export const approveToken = async (tokenAddress, spenderAddress, amount) => {
  try {
    const provider = getProvider();
    if (!provider) throw new Error('Provider not available');

    const signer = await provider.getSigner();
    const tokenABI = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)"
    ];

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    const decimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);
    
    console.log(`Approving ${amount} tokens for spender: ${spenderAddress}`);
    const tx = await tokenContract.approve(spenderAddress, amountInWei);
    
    const receipt = await tx.wait();
    console.log('Approve transaction confirmed:', receipt);
    return receipt;
  } catch (error) {
    console.error('Error approving token:', error);
    throw error;
  }
};

// Transaction tamamlandı mı kontrol et
export const waitForTransaction = async (txHash, confirmations = 1) => {
  try {
    const provider = getProvider();
    if (!provider) throw new Error('Provider not available');
    
    console.log(`Waiting for transaction ${txHash} with ${confirmations} confirmations...`);
    
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    console.log('Transaction confirmed:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

// Gas price tahmini al
export const getGasPrice = async () => {
  try {
    const provider = getProvider();
    if (!provider) throw new Error('Provider not available');
    
    const gasPrice = await provider.getGasPrice();
    return ethers.formatUnits(gasPrice, 'gwei');
  } catch (error) {
    console.error('Error getting gas price:', error);
    return '0';
  }
};

// Mevcut network bilgisini al
export const getCurrentNetwork = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      
      switch (chainId) {
        case '0x1':
          return { name: 'Ethereum Mainnet', isBSC: false };
        case '0x38':
          return { name: 'BSC Mainnet', isBSC: true };
        case '0x61':
          return { name: 'BSC Testnet', isBSC: true };
        case '0x7a69':
          return { name: 'Hardhat localhost', isBSC: true }; // Treat as BSC-compatible
        case '0xaa36a7':
          return { name: 'Sepolia Testnet', isBSC: false };
        default:
          return { name: 'Unknown Network', isBSC: false };
      }
    } catch (error) {
      console.error('Error getting network:', error);
      return { name: 'Unknown', isBSC: false };
    }
  }
  return { name: 'No Wallet', isBSC: false };
};

// Wallet event listener'ları ekle
export const setupWalletListeners = (onAccountsChanged, onChainChanged) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (onAccountsChanged) onAccountsChanged(accounts);
    });
    
    window.ethereum.on('chainChanged', (chainId) => {
      if (onChainChanged) onChainChanged(chainId);
    });
  }
};

// Wallet event listener'larını kaldır
export const removeWalletListeners = () => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};

