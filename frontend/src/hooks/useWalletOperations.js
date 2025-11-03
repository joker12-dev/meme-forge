import { useState, useEffect, useCallback } from 'react';
import {
  getProviderByWallet,
  getSigner,
  getWalletBalance,
  getTokenBalance,
  getCurrentNetwork,
  callContractFunction,
  sendTransaction,
  onAccountsChanged,
  onChainChanged,
  removeAllListeners
} from '../utils/walletProviders';
import { ethers } from 'ethers';

/**
 * Universal hook for all wallet operations
 * Works with MetaMask, Trust Wallet, Binance, OKX, SafePal, TokenPocket
 */
export const useWalletOperations = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize provider when component mounts
  useEffect(() => {
    initializeProvider();
  }, []);

  const initializeProvider = useCallback(async () => {
    try {
      const walletType = localStorage.getItem('walletType');
      if (!walletType) return;

      const walletProvider = getProviderByWallet(walletType);
      if (!walletProvider) return;

      setProvider(walletProvider);

      // Get account
      const accounts = await walletProvider.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        await updateBalance(walletProvider, accounts[0]);
        await updateNetwork(walletProvider);
      }

      // Setup listeners
      setupListeners(walletProvider);
    } catch (err) {
      console.error('Error initializing provider:', err);
      setError(err.message);
    }
  }, []);

  const updateBalance = async (walletProvider, address) => {
    try {
      const bal = await getWalletBalance(walletProvider, address);
      setBalance(bal);
    } catch (err) {
      console.error('Error updating balance:', err);
    }
  };

  const updateNetwork = async (walletProvider) => {
    try {
      const net = await getCurrentNetwork(walletProvider);
      setNetwork(net);
    } catch (err) {
      console.error('Error updating network:', err);
    }
  };

  const setupListeners = (walletProvider) => {
    onAccountsChanged(walletProvider, (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setBalance('0');
      } else {
        setAccount(accounts[0]);
        updateBalance(walletProvider, accounts[0]);
      }
    });

    onChainChanged(walletProvider, () => {
      window.location.reload();
    });
  };

  // Get signer for transactions
  const getWalletSigner = useCallback(async () => {
    if (!provider) {
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      if (!walletProvider) {
        throw new Error('No wallet connected');
      }
      return await getSigner(walletProvider);
    }
    return await getSigner(provider);
  }, [provider]);

  // Send a transaction
  const send = useCallback(async (transaction) => {
    setIsLoading(true);
    setError(null);
    try {
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      const receipt = await sendTransaction(walletProvider, transaction);
      setIsLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Call a contract function
  const callContract = useCallback(async (contractAddress, abi, functionName, params = [], value = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      const receipt = await callContractFunction(
        walletProvider,
        contractAddress,
        abi,
        functionName,
        params,
        value
      );
      setIsLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Read contract data (view/pure functions)
  const readContract = useCallback(async (contractAddress, abi, functionName, params = []) => {
    try {
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const contract = new ethers.Contract(contractAddress, abi, ethersProvider);
      return await contract[functionName](...params);
    } catch (err) {
      console.error('Error reading contract:', err);
      throw err;
    }
  }, []);

  // Get token balance
  const getTokenBal = useCallback(async (tokenAddress, walletAddress = null) => {
    try {
      const addr = walletAddress || account;
      if (!addr) throw new Error('No wallet address');

      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      return await getTokenBalance(walletProvider, tokenAddress, addr);
    } catch (err) {
      console.error('Error getting token balance:', err);
      return '0';
    }
  }, [account]);

  // Approve token spending
  const approveToken = useCallback(async (tokenAddress, spenderAddress, amount) => {
    setIsLoading(true);
    setError(null);
    try {
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      
      const tokenABI = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)"
      ];

      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const contract = new ethers.Contract(tokenAddress, tokenABI, ethersProvider);
      const decimals = await contract.decimals();
      
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);
      
      const walletSigner = await getSigner(walletProvider);
      const contractWithSigner = contract.connect(walletSigner);
      
      const tx = await contractWithSigner.approve(spenderAddress, amountInWei);
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return receipt;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Check allowance
  const checkAllowance = useCallback(async (tokenAddress, ownerAddress, spenderAddress) => {
    try {
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const walletProvider = getProviderByWallet(walletType);
      
      const tokenABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];

      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const contract = new ethers.Contract(tokenAddress, tokenABI, ethersProvider);
      
      const [allowance, decimals] = await Promise.all([
        contract.allowance(ownerAddress, spenderAddress),
        contract.decimals()
      ]);
      
      return ethers.formatUnits(allowance, decimals);
    } catch (err) {
      console.error('Error checking allowance:', err);
      return '0';
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (provider && account) {
      await updateBalance(provider, account);
      await updateNetwork(provider);
    }
  }, [provider, account]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (provider) {
        removeAllListeners(provider);
      }
    };
  }, [provider]);

  return {
    // State
    provider,
    signer,
    account,
    balance,
    network,
    isLoading,
    error,
    
    // Methods
    getSigner: getWalletSigner,
    sendTransaction: send,
    callContract,
    readContract,
    getTokenBalance: getTokenBal,
    approveToken,
    checkAllowance,
    refresh,
    
    // Utilities
    parseEther: ethers.parseEther,
    formatEther: ethers.formatEther,
    parseUnits: ethers.parseUnits,
    formatUnits: ethers.formatUnits
  };
};

export default useWalletOperations;

