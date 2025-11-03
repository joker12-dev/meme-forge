import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  connectToWallet,
  getWalletBalance,
  getCurrentNetwork,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners,
  isWalletInstalled,
  WALLET_METADATA
} from '../utils/walletProviders';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Update balance and network when account changes
  useEffect(() => {
    if (account && provider) {
      updateWalletInfo();
    }
  }, [account, provider]);

  const checkConnection = async () => {
    try {
      // ÖNCE disconnect flag kontrol et
      const isDisconnecting = sessionStorage.getItem('wallet_disconnecting');
      if (isDisconnecting === 'true') {
        sessionStorage.removeItem('wallet_disconnecting');
        return;
      }

      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const storedWalletType = localStorage.getItem('walletType') || 'metamask';
          await reconnectWallet(storedWalletType);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const reconnectWallet = async (walletId) => {
    try {
      const result = await connectToWallet(walletId);
      setAccount(result.address);
      setProvider(result.provider);
      setWalletType(result.walletType);
      setIsConnected(true);
      
      localStorage.setItem('walletType', result.walletType);
      
      setupListeners(result.provider);
    } catch (error) {
      console.error('Error reconnecting wallet:', error);
    }
  };

  const updateWalletInfo = async () => {
    try {
      if (!provider || !account) return;

      const [walletBalance, networkInfo] = await Promise.all([
        getWalletBalance(provider, account),
        getCurrentNetwork(provider)
      ]);

      setBalance(walletBalance);
      setNetwork(networkInfo);
    } catch (error) {
      console.error('Error updating wallet info:', error);
    }
  };

  const connect = async (walletId) => {
    setIsConnecting(true);
    setError(null);

    try {
      // If switching wallets, clear previous connection first
      const previousWalletType = localStorage.getItem('walletType');
      if (previousWalletType && previousWalletType !== walletId) {
        console.log(`Switching from ${previousWalletType} to ${walletId}`);
        if (provider) {
          removeAllListeners(provider);
        }
        localStorage.removeItem('walletType');
        localStorage.removeItem('walletAddress');
      }

      // Check if wallet is installed
      if (!isWalletInstalled(walletId) && walletId !== 'walletconnect') {
        const metadata = WALLET_METADATA[walletId];
        throw new Error(
          `${metadata?.name || 'Wallet'} is not installed. Please install it from ${metadata?.downloadUrl}`
        );
      }

      const result = await connectToWallet(walletId);
      
      setAccount(result.address);
      setProvider(result.provider);
      setWalletType(result.walletType);
      setIsConnected(true);
      
      // Store wallet info in localStorage
      localStorage.setItem('walletType', result.walletType);
      localStorage.setItem('walletAddress', result.address);
      
      setupListeners(result.provider);
      
      return result;
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = useCallback(() => {
    console.log('🔓 Disconnecting wallet...');
    
    // Set disconnect flag
    sessionStorage.setItem('wallet_disconnecting', 'true');
    
    if (provider) {
      removeAllListeners(provider);
    }
    
    setAccount(null);
    setBalance('0');
    setNetwork(null);
    setProvider(null);
    setWalletType(null);
    setIsConnected(false);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletAddress');
    
    console.log('✅ Wallet disconnected, reloading page...');
    
    // Reload page to fully disconnect
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [provider]);

  const setupListeners = (walletProvider) => {
    if (!walletProvider) return;

    // Remove existing listeners first
    removeAllListeners(walletProvider);

    // Account change listener
    onAccountsChanged(walletProvider, (accounts) => {
      console.log('🔄 Accounts changed in WalletContext:', accounts);
      
      if (accounts.length === 0) {
        // Wallet disconnected
        console.log('❌ No accounts, disconnecting...');
        sessionStorage.setItem('wallet_disconnecting', 'true');
        disconnect();
      } else {
        // Account changed
        const newAccount = accounts[0];
        console.log('✅ Account changed to:', newAccount);
        setAccount(newAccount);
        localStorage.setItem('walletAddress', newAccount);
        updateBalance(walletProvider, newAccount);
      }
    });

    // Chain change listener - reload page on network change
    onChainChanged(walletProvider, () => {
      console.log('🔄 Network changed, reloading...');
      window.location.reload();
    });
  };

  const switchNetwork = async () => {
    try {
      if (!provider) {
        throw new Error('No wallet connected');
      }
      await switchOrAddBSCTestnet(provider);
      await updateWalletInfo();
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  };

  const refreshBalance = async () => {
    if (provider && account) {
      await updateWalletInfo();
    }
  };

  const value = {
    // State
    account,
    balance,
    network,
    provider,
    walletType,
    isConnecting,
    isConnected,
    error,
    
    // Methods
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    
    // Helper
    isWalletInstalled: (walletId) => isWalletInstalled(walletId),
    getWalletMetadata: (walletId) => WALLET_METADATA[walletId]
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;

