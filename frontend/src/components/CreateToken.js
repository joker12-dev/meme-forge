import React, { useState, useEffect } from 'react';
import { 
  FaCamera, 
  FaGlobe, 
  FaTelegramPlane, 
  FaTwitter, 
  FaFileAlt, 
  FaEye, 
  FaCheckCircle, 
  FaArrowRight, 
  FaArrowLeft, 
  FaRocket, 
  FaInfoCircle, 
  FaExclamationCircle, 
  FaCoins, 
  FaDollarSign, 
  FaLock, 
  FaWallet, 
  FaUsers, 
  FaBolt 
} from 'react-icons/fa';
import LPConfirmModal from './LPConfirmModal';
import { tokenAPI, getBackendURL } from '../utils/api';
import { getCurrentAccount, getBalance, switchToBSCNetwork, isConnectedToBSC } from '../utils/wallet';
import { getProviderByWallet, getSigner, getContractWithSigner, getContractWithProvider, getEthersProvider } from '../utils/walletProviders';
import { ethers } from 'ethers';


const CreateToken = () => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    initialSupply: '',
    decimals: '18',
    metadataURI: '',
    website: '',
    telegram: '',
    twitter: '',
    description: '',
    logo: null,
    // LP için yeni alanlar - addLiquidity her zaman TRUE
    addLiquidity: true,
    bnbAmount: '',
    tokenAmount: '',
    lpLockTime: '30',
    autoBurn: false,
    marketingTax: '0',
    liquidityTax: '0'
    // REMOVED: tokenTier (no tier selection anymore)
  });

  // LP Modal state
  const [showLPModal, setShowLPModal] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState('');
  const [lpTxLoading, setLpTxLoading] = useState(false);
  const [lpTxMessage, setLpTxMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userBalance, setUserBalance] = useState('0');
  const [estimatedGas, setEstimatedGas] = useState('0.005');
  const [userAddress, setUserAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  
  
  // Fee state - SIMPLIFIED: fixed 0.0001 BNB (no tier selection)
  const [creationFee, setCreationFee] = useState('0.0001');
  const [feeDistribution, setFeeDistribution] = useState({
    platform: '70%',
    development: '20%',
    marketing: '10%'
  });
  // REMOVED: tierFees (now fixed fee)

  // Step titles - REMOVED: Package Selection (Step 2)
  const steps = [
    { number: 1, title: 'Token Information', icon: <FaRocket size={20} /> },
    { number: 2, title: 'Liquidity Pool', icon: <FaBolt size={20} /> },
    { number: 3, title: 'Social Media', icon: <FaGlobe size={20} /> },
    { number: 4, title: 'Preview', icon: <FaEye size={20} /> }
  ];

  // Bakiye, ağ ve fee kontrolü
  useEffect(() => {
    checkWalletConnection();
    fetchFeeInfo();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const address = await getCurrentAccount();
      if (address) {
        setUserAddress(address);
        await checkNetwork();
        await checkUserBalance();
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  // Fetch fee information - FIXED: 0.0001 BNB (no tier selection)
  const fetchFeeInfo = async () => {
    try {
      console.log('📊 Using fixed creation fee: 0.0001 BNB');
      setCreationFee('0.0001');
    } catch (error) {
      console.error('Error fetching fee information:', error);
      setCreationFee('0.0001');
    }
  };

  const checkNetwork = async () => {
    try {
      const isBSC = await isConnectedToBSC();
      setIsCorrectNetwork(isBSC);
      return isBSC;
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  };

  const checkUserBalance = async () => {
    try {
      const balance = await getBalance();
      setUserBalance(parseFloat(balance).toFixed(4));
      return parseFloat(balance);
    } catch (error) {
      console.error('Balance check error:', error);
      return 0;
    }
  };
  const switchNetwork = async () => {
    try {
      await switchToBSCNetwork(true); // true = testnet
      const isBSC = await checkNetwork();
      if (isBSC) {
        setMessage('✅ Successfully switched to BSC Testnet network');
      }
    } catch (error) {
      setMessage('❌ Network switching error: ' + error.message);
    }
  };

  // NEW: Calculate fee based on tier
  // Calculate fee - FIXED: 0.0001 BNB (no tier selection)
  const getTierFee = () => {
    return '0.0001';
  };

  // Calculate total cost - LP ALWAYS ENABLED
  const calculateTotalCost = () => {
    const bnbAmount = parseFloat(formData.bnbAmount || 0);
    const tierFee = parseFloat(getTierFee());
    const lpFee = 0.001; // LP creation fee
    const gasCost = parseFloat(estimatedGas);
    return (bnbAmount + tierFee + lpFee + gasCost).toFixed(4);
  };

  // Token validation functions
  const validateTokenInfo = () => {
    const { name, symbol, initialSupply, decimals } = formData;

    if (!name || !symbol || !initialSupply) {
      return '❌ Please fill in all required fields';
    }

    if (name.length < 2 || name.length > 30) {
      return '❌ Token name must be between 2-30 characters';
    }

    if (!/^[A-Za-z]{3,10}$/.test(symbol)) {
      return '❌ Token symbol must be between 3-10 letters';
    }

    const supply = parseFloat(initialSupply);
    if (supply <= 0 || supply > 1000000000000) {
      return '❌ Enter a valid total supply (between 0-1 trillion)';
    }

    const decimalNum = parseInt(decimals);
    if (decimalNum < 0 || decimalNum > 18) {
      return '❌ Decimal places must be between 0-18';
    }

    return null;
  };

  const validateURL = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateLPSettings = () => {
    // LP ALWAYS REQUIRED - no addLiquidity check
    const { bnbAmount, tokenAmount, marketingTax, liquidityTax, initialSupply } = formData;
    
    if (!bnbAmount || !tokenAmount) {
      return '❌ Enter BNB and Token amounts (LP is required)';
    }

    const bnb = parseFloat(bnbAmount);
    const tokens = parseFloat(tokenAmount);
    const totalSupply = parseFloat(initialSupply);
    
    if (bnb <= 0 || tokens <= 0) {
      return '❌ BNB and Token amounts must be greater than 0';
    }

    if (tokens > totalSupply) {
      return `❌ Token amount cannot exceed total supply! Total supply: ${totalSupply.toLocaleString()}, Entered: ${tokens.toLocaleString()}`;
    }

    const lpPercentage = (tokens / totalSupply) * 100;
    if (lpPercentage > 90) {
      return `⚠️ You are adding a high amount of tokens to LP (${lpPercentage.toFixed(1)}%). Maximum 90% is recommended.`;
    }

    const marketing = parseFloat(marketingTax);
    const liquidity = parseFloat(liquidityTax);
    
    if (marketing + liquidity > 15) {
      return '❌ Total tax rate cannot exceed 15%';
    }

    return null;
  };

  // LP addition process - call backend endpoint
  const handleLPConfirm = async (lpData) => {
    setLpTxLoading(true);
    setLpTxMessage('🚀 Starting LP addition process...');
    try {
      // Get user wallet address
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const rawProvider = getProviderByWallet(walletType);
      
      if (!rawProvider) {
        throw new Error('Wallet provider not found');
      }
      
      const signer = await getSigner(rawProvider);
      const userAddress = await signer.getAddress();
      
      console.log('✅ User address:', userAddress);
      console.log('📊 LP Data:', lpData);

      // STEP 1: User approves tokens to LiquidityAdder
      setLpTxMessage('🔐 Approving tokens for LP addition...');
      const liquidityAdderAddress = '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
      
      const tokenABI = [
        'function approve(address spender, uint256 amount) public returns (bool)',
        'function allowance(address owner, address spender) public view returns (uint256)',
        'function decimals() public view returns (uint8)'
      ];
      
      const tokenContract = new ethers.Contract(createdTokenAddress, tokenABI, signer);
      const decimals = await tokenContract.decimals();
      const totalSupplyForApproval = parseFloat(formData.initialSupply);
      const totalSupplyInDecimals = ethers.parseUnits(totalSupplyForApproval.toString(), decimals);
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(userAddress, liquidityAdderAddress);
      console.log('Current allowance:', ethers.formatUnits(currentAllowance, decimals));
      
      if (currentAllowance < totalSupplyInDecimals) {
        console.log('Approving', totalSupplyForApproval, 'tokens to LiquidityAdder...');
        const approveTx = await tokenContract.approve(liquidityAdderAddress, ethers.MaxUint256);
        console.log('✅ Approval tx sent:', approveTx.hash);
        const approveReceipt = await approveTx.wait();
        console.log('✅ Approval confirmed:', approveReceipt.hash);
      } else {
        console.log('✅ Tokens already approved');
      }

      // STEP 2: User sends BNB to platform wallet
      setLpTxMessage('💸 User sending BNB to platform wallet...');
      const platformWalletAddress = '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
      const bnbInWei = ethers.parseEther(lpData.bnbAmount.toString());
      
      const txResponse = await signer.sendTransaction({
        to: platformWalletAddress,
        value: bnbInWei
      });
      
      console.log('✅ BNB transfer tx sent:', txResponse.hash);
      const txReceipt = await txResponse.wait();
      console.log('✅ BNB transfer confirmed:', txReceipt.hash);
      
      // STEP 3: Call backend endpoint to handle LP addition
      setLpTxMessage('🔄 Sending LP request to backend...');
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:3001`;
      const response = await fetch(`${backendUrl}/api/liquidity/add-liquidity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: createdTokenAddress,
          userRequestedTokenAmount: parseFloat(lpData.tokenAmount),
          bnbAmount: parseFloat(lpData.bnbAmount),
          userWallet: userAddress
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Backend error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Backend Response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'LP addition failed');
      }
      
      // Calculate tokens for display
      const totalSupply = parseFloat(formData.initialSupply);
      const userTokenAmount = parseFloat(lpData.tokenAmount);
      const lpTokenAmount = totalSupply - userTokenAmount;
      
      setLpTxMessage(`
        ✅ LP added successfully!
        📤 User received: ${userTokenAmount.toLocaleString()} ${formData.symbol}
        📊 Pool contains: ${lpTokenAmount.toLocaleString()} ${formData.symbol} + ${lpData.bnbAmount} BNB
        🔗 User TX: ${result.data?.userTransactionHash?.substring(0, 10)}...
        🔗 Pool TX: ${result.data?.liquidityTransactionHash?.substring(0, 10)}...
      `);
      
      setShowLPModal(false);
      setFormData({
        name: '', symbol: '', initialSupply: '', decimals: '18', metadataURI: '', website: '', telegram: '', twitter: '', description: '', logo: null, addLiquidity: true, bnbAmount: '', tokenAmount: '', lpLockTime: '30', autoBurn: false, marketingTax: '0', liquidityTax: '0'
      });
      setPreviewImage(null);
      setCurrentStep(1);
      setTimeout(() => {
        window.location.href = '/tokens';
      }, 3000);
    } catch (err) {
      console.error('❌ LP Error Details:', {
        message: err.message,
        reason: err.reason,
        code: err.code,
        data: err.data,
        transaction: err.transaction,
        fullError: err
      });
      
      let errorMsg = err.reason || err.message;
      if (err.data?.message) errorMsg = err.data.message;
      
      setLpTxMessage('❌ LP addition error: ' + errorMsg);
    } finally {
      setLpTxLoading(false);
    }
  };

  // LP PERCENTAGE CALCULATION
  const calculateLPPercentage = () => {
    if (!formData.initialSupply || !formData.tokenAmount) return 0;
    const totalSupply = parseFloat(formData.initialSupply);
    const tokenAmount = parseFloat(formData.tokenAmount);
    if (totalSupply > 0) {
      return (tokenAmount / totalSupply) * 100;
    }
    return 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    if (name === 'symbol') {
      processedValue = value.toUpperCase().replace(/[^A-Z]/g, '');
    }
    
    if (name === 'initialSupply' || name === 'bnbAmount' || name === 'tokenAmount') {
      if (value && parseFloat(value) < 0) {
        processedValue = '0';
      }
    }

    if (name === 'marketingTax' || name === 'liquidityTax') {
      if (value && (parseFloat(value) < 0 || parseFloat(value) > 10)) {
        return;
      }
    }

    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : processedValue
    };

    if (name === 'tokenAmount' || name === 'initialSupply') {
      const tokenAmount = parseFloat(newFormData.tokenAmount || 0);
      const totalSupply = parseFloat(newFormData.initialSupply || 0);
      
      if (tokenAmount > totalSupply && totalSupply > 0) {
        setMessage(`⚠️ Token amount exceeds total supply! Maximum: ${totalSupply.toLocaleString()}`);
      } else if (message && message.includes('Token amount exceeds total supply')) {
        setMessage('');
      }
    }

    setFormData(newFormData);

    if (name === 'addLiquidity' || name === 'bnbAmount') {
      estimateGasCost();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      removeImage();
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
      setMessage('❌ Please select an image in JPEG, PNG, GIF or WebP format');
      return;
    }
    
    if (file.size > maxSize) {
      setMessage('❌ Image size must be smaller than 5MB');
      return;
    }

    setFormData(prev => ({
      ...prev,
      logo: file
    }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    setMessage('');
  };

  const uploadImageToIPFS = async (file) => {
    try {
      console.log('📤 Starting logo upload...', file.name);
      setMessage('📤 Uploading logo...');
      
      const uploadFormData = new FormData();
      uploadFormData.append('logo', file);
      
      const backendURL = process.env.REACT_APP_BACKEND_URL || getBackendURL();
      const uploadURL = `${backendURL}/api/upload/logo`;
      console.log('Upload URL:', uploadURL);
      
      const response = await fetch(uploadURL, {
        method: 'POST',
        body: uploadFormData
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Logo upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload response data:', data);
      
      if (data.success && data.logoURL) {
        console.log('✅ Logo uploaded successfully:', data.logoURL);
        return data.logoURL;
      } else {
        throw new Error(data.error || 'Logo upload failed');
      }
      
    } catch (error) {
      console.error('❌ Logo upload error:', error);
      throw error;
    }
  };

  const calculateTokenPrice = () => {
    if (!formData.bnbAmount || !formData.tokenAmount) return '0';
    const bnbAmount = parseFloat(formData.bnbAmount);
    const tokenAmount = parseFloat(formData.tokenAmount);
    if (bnbAmount > 0 && tokenAmount > 0) {
      return (bnbAmount / tokenAmount).toFixed(8);
    }
    return '0';
  };

  const calculateTotalValue = () => {
    if (!formData.bnbAmount) return '0';
    return (parseFloat(formData.bnbAmount) * 2).toFixed(4);
  };

  const estimateGasCost = () => {
    // LP ALWAYS ENABLED
    const baseGas = '0.01';
    if (formData.bnbAmount) {
      const additionalGas = parseFloat(formData.bnbAmount) * 0.001;
      setEstimatedGas((parseFloat(baseGas) + additionalGas).toFixed(4));
    } else {
      setEstimatedGas(baseGas);
    }
  };

  const checkLPBalance = async () => {
    // LP ALWAYS REQUIRED
    const bnbAmount = parseFloat(formData.bnbAmount);
    const userBNBBalance = await checkUserBalance();
    const tierFee = parseFloat(getTierFee());
    const lpFee = 0.001;
    
    const totalCost = bnbAmount + parseFloat(estimatedGas) + tierFee + lpFee;
    
    if (userBNBBalance < totalCost) {
      setMessage(`❌ Insufficient BNB balance. Required: ${totalCost.toFixed(4)} BNB, Available: ${userBNBBalance.toFixed(4)} BNB`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!isCorrectNetwork) {
        setMessage('❌ Please switch to BSC Mainnet network');
        setLoading(false);
        return;
      }

      const address = await getCurrentAccount();
      if (!address) {
        setMessage('❌ Please connect your wallet first!');
        setLoading(false);
        return;
      }

      const tokenValidationError = validateTokenInfo();
      if (tokenValidationError) {
        setMessage(tokenValidationError);
        setLoading(false);
        return;
      }

      // LP is REQUIRED - validate
      const lpValidationError = validateLPSettings();
      if (lpValidationError) {
        setMessage(lpValidationError);
        setLoading(false);
        return;
      }

      if ((formData.website && !validateURL(formData.website)) ||
          (formData.telegram && !validateURL(formData.telegram)) ||
          (formData.twitter && !validateURL(formData.twitter))) {
        setMessage('❌ Please use valid URL format');
        setLoading(false);
        return;
      }

      console.log('Creating token with data:', formData);

      let logoURL = '';
      
      if (formData.logo) {
        try {
          logoURL = await uploadImageToIPFS(formData.logo);
          console.log('Logo uploaded to IPFS:', logoURL);
        } catch (uploadError) {
          setMessage('❌ Logo upload failed: ' + uploadError.message);
          setLoading(false);
          return;
        }
      }

      setMessage('📝 Preparing token contract...');
      
      // Store wallet address in localStorage so API interceptor can find it
      localStorage.setItem('walletAddress', address);
      
      // ALWAYS use createTokenWithLP (LP is now required)
      const endpoint = 'createTokenWithLP';
      
      const tokenData = {
        ...formData,
        userAddress: address,
        initialSupply: formData.initialSupply.toString(),
        logoURL: logoURL,
        tier: 'standard',  // FIXED: default tier (no selection)
        creationFee: getTierFee(),
        // LP ALWAYS required
        lpTokenAmount: parseFloat(formData.tokenAmount),
        lpBnbAmount: parseFloat(formData.bnbAmount),
        customMarketingTax: parseFloat(formData.marketingTax) || 0,
        customLiquidityTax: parseFloat(formData.liquidityTax) || 0,
        customAutoBurn: formData.autoBurn
      };
      
      console.log('🔍 DEBUG - Using endpoint:', endpoint);
      console.log('🔍 DEBUG - Sending data:', tokenData);
      
      // Call createTokenWithLP endpoint
      const response = await tokenAPI.createTokenWithLP(tokenData);

      console.log('Backend response:', response.data);

      if (response.data.success && response.data.transaction) {
        setMessage('🔄 Preparing wallet transaction...');
        
        try {
          // Get the active wallet provider
          const walletType = localStorage.getItem('walletType') || 'metamask';
          const provider = getProviderByWallet(walletType);
          
          if (!provider) {
            throw new Error('Wallet provider not found. Please connect your wallet first.');
          }

          const signer = await getSigner(provider);
          
          console.log('Signer address:', await signer.getAddress());
          console.log('📝 Response from backend:', {
            transaction: response.data.transaction,
            fees: response.data.fees
          });
          
          // Add fee value from transaction data
          // The value is in wei format from backend, ethers.js v6 handles both string wei and bigint
          const txToSend = {
            ...response.data.transaction,
            value: response.data.transaction.value || response.data.fees?.totalValue
          };
          
          // CRITICAL: Verify data field is present and not empty
          console.log('🔍 DATA FIELD VERIFICATION:');
          console.log('  data present:', !!txToSend.data);
          console.log('  data value:', txToSend.data);
          console.log('  data length:', txToSend.data ? txToSend.data.length : 'MISSING');
          console.log('  data starts with 0x:', txToSend.data ? txToSend.data.startsWith('0x') : false);
          
          if (!txToSend.data || txToSend.data === '0x' || txToSend.data.length < 10) {
            throw new Error('❌ CRITICAL: Function data is empty! Transaction would fail. Data field: ' + JSON.stringify(txToSend.data));
          }
          
          console.log('📤 Transaction to send to MetaMask (before formatting):', txToSend);
          
          // CRITICAL FIX: Ensure all transaction fields are properly formatted for ethers v6
          // The issue was that value as string wasn't being properly included in the serialized tx
          const formattedTx = {
            to: txToSend.to,
            from: txToSend.from,
            data: txToSend.data,
            value: txToSend.value ? BigInt(txToSend.value) : 0n,
            gasLimit: txToSend.gasLimit ? BigInt(txToSend.gasLimit) : 5000000n
          };
          
          console.log('📤 Transaction AFTER formatting:', formattedTx);
          console.log('  to:', formattedTx.to);
          console.log('  from:', formattedTx.from);
          console.log('  data length:', formattedTx.data.length);
          console.log('  data preview:', formattedTx.data.substring(0, 50));
          console.log('  value:', formattedTx.value.toString());
          console.log('  gasLimit:', formattedTx.gasLimit.toString());
          
          // DEBUG: Log transaction being sent to MetaMask
          console.log('📨 SENDING TO METAMASK:', JSON.stringify({
            to: formattedTx.to,
            from: formattedTx.from,
            data: formattedTx.data,
            value: formattedTx.value.toString(),
            gasLimit: formattedTx.gasLimit.toString()
          }, null, 2));
          
          // Use populateTransaction to ensure proper serialization
          const populatedTx = await signer.populateTransaction(formattedTx);
          console.log('✅ Populated transaction:', populatedTx);
          console.log('  populated data:', populatedTx.data);
          console.log('  populated value:', populatedTx.value?.toString());
          
          // CRITICAL FIX: Don't use signer.sendTransaction() - it strips data!
          // Instead, send directly through MetaMask provider with manual hex serialization
          console.log('🔧 CRITICAL FIX: Sending transaction through MetaMask provider...');
          
          // Get the raw MetaMask provider
          const rawProvider = window.ethereum;
          if (!rawProvider) {
            throw new Error('MetaMask provider not available');
          }
          
          // Manually serialize transaction to prevent MetaMask from stripping data
          // ⚠️ IMPORTANT: Don't include gasPrice - let MetaMask handle EIP-1559 gas parameters
          const txForMetaMask = {
            to: populatedTx.to,
            from: populatedTx.from,
            value: populatedTx.value ? '0x' + populatedTx.value.toString(16) : '0x0',
            data: populatedTx.data,
            gas: populatedTx.gasLimit ? '0x' + populatedTx.gasLimit.toString(16) : '0x4C4B40'
            // ❌ REMOVED: gasPrice - causes "both gasPrice and (maxFeePerGas or maxPriorityFeePerGas) specified" error
            // MetaMask will automatically set maxFeePerGas and maxPriorityFeePerGas
          };
          
          console.log('📨 FINAL TX TO METAMASK:', JSON.stringify(txForMetaMask, null, 2));
          
          // Send through MetaMask's JSON-RPC (bypasses ethers v6 serialization issues)
          const txHash = await rawProvider.request({
            method: 'eth_sendTransaction',
            params: [txForMetaMask]
          });
          console.log('✅ Transaction hash from MetaMask:', txHash);
          
          setMessage(`✅ Transaction sent! Waiting for confirmation... Hash: ${txHash.substring(0, 10)}...`);
          
          // Create a transaction response object to track confirmation
          const ethersProvider = new ethers.BrowserProvider(rawProvider);
          const txResponse = {
            hash: txHash,
            wait: async () => {
              let receipt = null;
              let attempts = 0;
              while (!receipt && attempts < 60) {
                receipt = await ethersProvider.getTransactionReceipt(txHash);
                if (!receipt) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
                attempts++;
              }
              return receipt;
            }
          };
          
          // Wait for confirmation
          const receipt = await txResponse.wait();
          console.log('✅ Transaction receipt:', receipt);
          
          setMessage(`✅ Transaction sent! Waiting for confirmation... Hash: ${txHash.substring(0, 10)}...`);
          
          console.log('✅ Transaction confirmed!', receipt);
          
          setMessage('✅ Transaction confirmed! Saving token...');
          
          const confirmResponse = await tokenAPI.confirmTokenCreation({
            txHash: txHash,
            name: formData.name,
            symbol: formData.symbol,
            initialSupply: formData.initialSupply.toString(),
            userAddress: address,
            website: formData.website,
            telegram: formData.telegram,
            twitter: formData.twitter,
            description: formData.description,
            logoURL: logoURL,
            decimals: formData.decimals,
            tier: formData.tokenTier,
            creationFee: getTierFee(),
            liquidityAdded: formData.addLiquidity,
            liquidityInfo: formData.addLiquidity ? {
              tokenAmount: parseFloat(formData.tokenAmount),
              bnbAmount: parseFloat(formData.bnbAmount),
              lpLockTime: formData.lpLockTime,
              customMarketingTax: parseFloat(formData.marketingTax) || 0,
              customLiquidityTax: parseFloat(formData.liquidityTax) || 0,
              customAutoBurn: formData.autoBurn
            } : null
          });

          if (confirmResponse.data.success) {
            setMessage('🎉 ' + confirmResponse.data.message);
            console.log('✅ Token created successfully!');
            if (formData.addLiquidity) {
              setMessage('🎉 Token created with LP in single transaction!');
            }
            // Reset form
            setFormData({
              name: '', symbol: '', initialSupply: '', decimals: '18', metadataURI: '', website: '', telegram: '', twitter: '', description: '', logo: null, addLiquidity: true, bnbAmount: '', tokenAmount: '', lpLockTime: '30', autoBurn: false, marketingTax: '0', liquidityTax: '0'
            });
            setPreviewImage(null);
            setCurrentStep(1);
            setTimeout(() => {
              window.location.href = '/tokens';
            }, 3000);
          } else {
            setMessage('❌ Token save failed: ' + (confirmResponse.data.message || confirmResponse.data.error));
          }
          
        } catch (txError) {
          console.error('Transaction error:', txError);
          if (txError.code === 'ACTION_REJECTED') {
            setMessage('❌ Transaction rejected by user');
          } else {
            setMessage('❌ Transaction failed: ' + (txError.reason || txError.message));
          }
        }

      } else {
        setMessage('❌ ' + (response.data.message || response.data.error || 'Token creation failed'));
      }

    } catch (error) {
      console.error('Token creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      setMessage('❌ Error: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      logo: null
    }));
    setPreviewImage(null);
  };

  const nextStep = async () => {
    setMessage('');

    if (currentStep === 1) {
      const validationError = validateTokenInfo();
      if (validationError) {
        setMessage(validationError);
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const StepIndicator = () => (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div key={step.number} className="step-container">
          <div className={`step-circle ${currentStep >= step.number ? 'active' : ''}`}>
            {currentStep > step.number ? <FaCheckCircle size={24} /> : step.icon}
          </div>
          <span className={`step-text ${currentStep >= step.number ? 'active' : ''}`}>
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div className={`step-line ${currentStep > step.number ? 'active' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaCamera size={28} />
              <h3>Token Logo</h3>
            </div>
            <p className="helper-text">
              Select a profile image for your token (JPEG, PNG, GIF, WebP - max 5MB)
            </p>
            
            <div className="logo-section">
              <div className="logo-preview">
                {previewImage ? (
                  <div className="logo-image-container">
                    <img src={previewImage} alt="Token logo" />
                    <button type="button" onClick={removeImage} className="remove-image-btn">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="logo-placeholder">
                    <FaCamera size={32} />
                    <span>Upload Logo</span>
                    <span className="size-hint">120x120 px recommended</span>
                  </div>
                )}
              </div>
              <div className="file-input-container">
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <FaCamera size={20} />
                  Select Logo
                </label>
                {previewImage && (
                  <p className="image-selected">✓ Logo selected</p>
                )}
              </div>
            </div>

            <div className="section-header" style={{ marginTop: '2rem' }}>
              <FaRocket size={28} />
              <h3>Token Information</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>
                  Token Name *
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: DogeCoin"
                    required
                    minLength="2"
                    maxLength="30"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Token Symbol *
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="Ex: DOGE"
                    required
                    pattern="[A-Za-z]{3,10}"
                    title="Must be between 3-10 letters"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Total Supply *
                  <input
                    type="number"
                    name="initialSupply"
                    value={formData.initialSupply}
                    onChange={handleInputChange}
                    placeholder="Ex: 1000000"
                    required
                    min="1"
                    max="1000000000000"
                    step="1"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Decimal Places
                  <input
                    type="number"
                    name="decimals"
                    value={formData.decimals}
                    onChange={handleInputChange}
                    placeholder="18"
                    min="0"
                    max="18"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaBolt size={28} />
              <h3>Liquidity Pool Setup</h3>
            </div>
            <p className="helper-text">
              Set up liquidity pool configuration. Token + LP creation happens in ONE atomic transaction!
            </p>

            {/* Benefits */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '2px solid #3B82F6',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ color: '#3B82F6', marginBottom: '1rem' }}>✨ Benefits:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#CBD5E1', fontSize: '0.95rem' }}>
                <div>✓ Single transaction (token + LP together)</div>
                <div>✓ Lower fees (no double gas cost)</div>
                <div>✓ Atomic execution (all or nothing)</div>
                <div>✓ Instant LP token distribution</div>
              </div>
            </div>

            {/* LP Configuration (always enabled - no toggle) */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid #10B981',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <div className="form-grid">
                  {/* Token Amount for LP */}
                  <div className="form-group">
                    <label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Tokens for LP *</span>
                        <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                          Max: {formData.initialSupply}
                        </span>
                      </div>
                      <input
                        type="number"
                        name="tokenAmount"
                        value={formData.tokenAmount}
                        onChange={handleInputChange}
                        placeholder="Ex: 500000"
                        required
                        min="1"
                        max={formData.initialSupply}
                        step="1"
                      />
                    </label>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Remaining for you: {Math.max(0, formData.initialSupply - (parseFloat(formData.tokenAmount) || 0))} tokens
                    </p>
                  </div>

                  {/* BNB Amount for LP */}
                  <div className="form-group">
                    <label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>BNB for LP *</span>
                        <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                          Available: {userBalance} BNB
                        </span>
                      </div>
                      <input
                        type="number"
                        name="bnbAmount"
                        value={formData.bnbAmount}
                        onChange={handleInputChange}
                        placeholder="Ex: 1.5"
                        required
                        min="0.01"
                        step="0.01"
                        max={userBalance}
                      />
                    </label>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Recommended: 0.5 - 2 BNB for good liquidity
                    </p>
                  </div>

                  {/* Lock Time */}
                  <div className="form-group">
                    <label>
                      LP Lock Duration
                      <select
                        name="lpLockTime"
                        value={formData.lpLockTime}
                        onChange={handleInputChange}
                      >
                        <option value="30">30 Days (Standard)</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days (Premium)</option>
                        <option value="180">180 Days</option>
                        <option value="365">1 Year</option>
                      </select>
                    </label>
                  </div>

                  {/* Auto Burn */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="checkbox"
                        name="autoBurn"
                        checked={formData.autoBurn}
                        onChange={handleInputChange}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span>Enable Auto-Burn</span>
                    </label>
                    <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Automatically burn remaining tokens after LP setup
                    </p>
                  </div>

                  {/* Marketing Tax */}
                  <div className="form-group">
                    <label>
                      Marketing Tax (%)
                      <input
                        type="number"
                        name="marketingTax"
                        value={formData.marketingTax}
                        onChange={handleInputChange}
                        placeholder="0-5"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </label>
                  </div>

                  {/* Liquidity Tax */}
                  <div className="form-group">
                    <label>
                      Liquidity Tax (%)
                      <input
                        type="number"
                        name="liquidityTax"
                        value={formData.liquidityTax}
                        onChange={handleInputChange}
                        placeholder="0-5"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </label>
                  </div>
                </div>

                {/* LP Summary */}
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'rgba(51, 65, 85, 0.5)',
                  borderRadius: '12px',
                  borderLeft: '4px solid #10B981'
                }}>
                  <h4 style={{ color: '#10B981', marginBottom: '1rem' }}>LP Summary:</h4>
                  <div style={{ display: 'grid', gap: '0.75rem', color: '#CBD5E1', fontSize: '0.95rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tokens for LP:</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                        {formData.tokenAmount || '0'} tokens
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>BNB for LP:</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                        {formData.bnbAmount || '0'} BNB
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Your Tokens After LP:</span>
                      <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>
                        {Math.max(0, formData.initialSupply - (parseFloat(formData.tokenAmount) || 0))} tokens
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                      <span>LP Lock Duration:</span>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                        {formData.lpLockTime} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Fee Summary */}
            <div className="balance-info" style={{ marginTop: '2rem' }}>
              <div className="balance-row">
                <span>Token Creation Fee:</span>
                <span className="balance-value">{getTierFee()} BNB</span>
              </div>
              <div className="balance-row">
                <span>LP Creation Fee:</span>
                <span className="balance-value">0.001 BNB</span>
              </div>
              <div className="balance-row">
                <span>BNB for Liquidity:</span>
                <span className="balance-value">{formData.bnbAmount || '0'} BNB</span>
              </div>
              <div className="balance-row total">
                <span>Total Cost:</span>
                <span className="balance-value total-cost">
                  {(
                    parseFloat(getTierFee()) + 
                    0.001 + 
                    parseFloat(formData.bnbAmount || 0) +
                    0.005
                  ).toFixed(4)} BNB
                </span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaGlobe size={28} />
              <h3>Social Media Links</h3>
            </div>
            <p className="helper-text">
              Add social media links to grow your token's community (Optional)
            </p>
            
            <div className="social-grid">
              <div className="social-input-group">
                <FaGlobe size={24} className="social-icon" />
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://your-token.com"
                    pattern="https://.*"
                  />
                </div>
              </div>

              <div className="social-input-group">
                <FaTelegramPlane size={24} className="social-icon" />
                <div className="form-group">
                  <label>Telegram</label>
                  <input
                    type="url"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    placeholder="https://t.me/your-token"
                    pattern="https://.*"
                  />
                </div>
              </div>

              <div className="social-input-group">
                <FaTwitter size={24} className="social-icon" />
                <div className="form-group">
                  <label>Twitter (X)</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/your-token"
                    pattern="https://.*"
                  />
                </div>
              </div>
            </div>

            <div className="section-header" style={{ marginTop: '2rem' }}>
              <FaFileAlt size={28} />
              <h3>Token Description</h3>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Explain the purpose, features, use cases and community of your token..."
                rows="8"
                maxLength="1000"
              />
              <div className="char-count">
                {formData.description.length}/1000 characters
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaEye size={28} />
              <h3>Token Preview</h3>
            </div>
            <p className="helper-text">
              Review your token information. The process will start after confirmation.
            </p>
            
            <div className="preview-card">
              <div className="preview-header">
                {previewImage ? (
                  <img src={previewImage} alt="Token logo" className="preview-logo" />
                ) : (
                  <div className="preview-logo-placeholder">
                    <FaCamera size={32} />
                  </div>
                )}
                <div className="preview-title">
                  <h4>{formData.name || 'Token Name'}</h4>
                  <span className="preview-symbol">{formData.symbol || 'SYMBOL'}</span>
                  <div className="preview-tier">STANDARD TIER</div>
                </div>
              </div>
              
              <div className="preview-details">
                <div className="preview-row">
                  <span>Total Supply:</span>
                  <span className="preview-value">
                    {formData.initialSupply ? Number(formData.initialSupply).toLocaleString() : '0'} {formData.symbol || ''}
                  </span>
                </div>
                <div className="preview-row">
                  <span>Decimals:</span>
                  <span className="preview-value">{formData.decimals}</span>
                </div>
                
                {(formData.website || formData.telegram || formData.twitter) && (
                  <div className="preview-section-divider">Social Media</div>
                )}
                {formData.website && (
                  <div className="preview-row">
                    <span>Website:</span>
                    <span className="preview-link">{formData.website}</span>
                  </div>
                )}
                {formData.telegram && (
                  <div className="preview-row">
                    <span>Telegram:</span>
                    <span className="preview-link">{formData.telegram}</span>
                  </div>
                )}
                {formData.twitter && (
                  <div className="preview-row">
                    <span>Twitter:</span>
                    <span className="preview-link">{formData.twitter}</span>
                  </div>
                )}
                {formData.description && (
                  <>
                    <div className="preview-section-divider">Description</div>
                    <div className="preview-description">
                      <p>{formData.description}</p>
                    </div>
                  </>
                )}

                <div className="preview-section-divider">Cost Details</div>
                <div className="preview-row">
                  <span>Creation Fee:</span>
                  <span className="preview-value">0.0001 BNB</span>
                </div>
                <div className="preview-row">
                  <span>Liquidity Pool Fee:</span>
                  <span className="preview-value">0.001 BNB</span>
                </div>
                <div className="preview-row">
                  <span>Liquidity BNB:</span>
                  <span className="preview-value">{formData.bnbAmount} BNB</span>
                </div>
                <div className="preview-row">
                  <span>Estimated Gas Fee:</span>
                  <span className="preview-value">{estimatedGas} BNB</span>
                </div>
                <div className="preview-row total">
                  <span>Total Cost:</span>
                  <span className="preview-value total-cost">~{calculateTotalCost()} BNB</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 80px)', marginTop: '0px' }}>
      <style>{`
        * { box-sizing: border-box;   margin: 0;
  padding: 0;}
        .container {
          min-height: calc(100vh - 80px); /* Subtract header height */
          margin-top: 0px !important;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #FFFFFF;
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .header { text-align: center; margin-bottom: 2rem; padding: 1rem; }
        .header h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #F0B90B, #F8D33A, #F0B90B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        .header p {
          font-size: clamp(1rem, 3vw, 1.3rem);
          color: #CBD5E1;
          margin: 0;
          font-weight: 400;
        }

        .network-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          margin: 1rem auto;
          max-width: 300px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .network-status.connected {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10B981;
        }
        .network-status.disconnected {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #EF4444;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto 3rem;
          padding: 2rem 1rem;
          overflow-x: auto;
          max-width: 100%;
        }
        .step-container { display: flex; align-items: center; position: relative; flex-shrink: 0; }
        .step-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s ease;
          z-index: 2;
          background-color: rgba(240, 185, 11, 0.1);
          border: 2px solid rgba(240, 185, 11, 0.3);
        }
        .step-circle.active {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          box-shadow: 0 4px 15px rgba(240, 185, 11, 0.4);
          border: none;
        }
        .step-text {
          position: absolute;
          top: 100%;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #94A3B8;
          white-space: nowrap;
          transition: all 0.3s ease;
          left: 50%;
          transform: translateX(-50%);
        }
        .step-text.active { color: #F0B90B; font-weight: 600; }
        .step-line {
          width: 80px;
          height: 2px;
          background-color: rgba(240, 185, 11, 0.2);
          margin: 0 0.5rem;
          transition: all 0.3s ease;
        }
        .step-line.active {
          background-color: #F0B90B;
          box-shadow: 0 0 8px rgba(240, 185, 11, 0.5);
        }
        .content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          padding: 0 1rem;
        }
        .form { width: 100%; }
        .step-content {
          background-color: rgba(43, 47, 54, 0.8);
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          color: #F0B90B;
        }
        .section-header h3 {
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          font-weight: 700;
          margin: 0;
        }
        .helper-text {
          font-size: 1rem;
          color: #CBD5E1;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }

        /* YENİ: Tier Selection Styles */
        .tier-selection {
          margin: 2rem 0;
        }
        .tier-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .tier-card {
          background: rgba(30, 32, 38, 0.6);
          border: 2px solid rgba(240, 185, 11, 0.2);
          border-radius: 16px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .tier-card:hover {
          transform: translateY(-5px);
          border-color: rgba(240, 185, 11, 0.5);
        }
        .tier-card.selected {
          border-color: #F0B90B;
          background: rgba(240, 185, 11, 0.1);
        }
        .tier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .tier-header h4 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: #FFFFFF;
        }
        .tier-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: #F0B90B;
        }
        .tier-features {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #CBD5E1;
          font-size: 0.9rem;
        }
        .tier-badge {
          position: absolute;
          top: 1rem;
          right: -2rem;
          background: #F0B90B;
          color: #1E2026;
          padding: 0.3rem 2rem;
          font-size: 0.8rem;
          font-weight: 700;
          transform: rotate(45deg);
        }
        .tier-badge.popular {
          background: #10B981;
          color: white;
        }
        .tier-badge.premium {
          background: #8B5CF6;
          color: white;
        }

        /* YENİ: Fee Distribution Styles */
        .fee-distribution {
          background: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(240, 185, 11, 0.2);
        }
        .distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .distribution-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #CBD5E1;
        }
        .distribution-bar {
          width: 100%;
          height: 8px;
          background: rgba(240, 185, 11, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }
        .distribution-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .distribution-fill.platform {
          background: linear-gradient(90deg, #F0B90B, #F8D33A);
        }
        .distribution-fill.development {
          background: linear-gradient(90deg, #10B981, #34D399);
        }
        .distribution-fill.marketing {
          background: linear-gradient(90deg, #8B5CF6, #A78BFA);
        }

        /* YENİ: LP Disabled Styles */
        .lp-disabled {
          text-align: center;
          padding: 3rem 2rem;
          background: rgba(30, 32, 38, 0.6);
          border-radius: 16px;
          border: 2px dashed rgba(240, 185, 11, 0.3);
        }
        .lp-disabled h4 {
          color: #F0B90B;
          margin: 1rem 0 0.5rem 0;
        }
        .lp-disabled p {
          color: #CBD5E1;
          margin-bottom: 2rem;
        }

        .balance-info {
          background-color: rgba(30, 32, 38, 0.6);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          margin-bottom: 1.5rem;
        }
        .balance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          color: #CBD5E1;
        }
        .balance-row.total {
          border-top: 1px solid rgba(240, 185, 11, 0.2);
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-weight: 600;
        }
        .balance-value {
          font-weight: 600;
          color: #F0B90B;
        }
        .balance-value.total-cost {
          color: #10B981;
          font-size: 1.1rem;
        }
        .balance-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        .balance-check-btn {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          border: 1px solid rgba(240, 185, 11, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .balance-check-btn:hover {
          background: rgba(240, 185, 11, 0.2);
        }
        .network-switch-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .network-switch-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .lp-info-card {
          background-color: rgba(240, 185, 11, 0.1);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          margin: 1rem 0;
        }
        .lp-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0;
          color: #CBD5E1;
          font-size: 0.9rem;
        }
        .lp-percentage-good {
          color: #10B981;
          font-weight: 600;
        }
        .lp-percentage-medium {
          color: #F59E0B;
          font-weight: 600;
        }
        .lp-percentage-high {
          color: #EF4444;
          font-weight: 600;
        }
        .lp-info-note {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(240, 185, 11, 0.2);
          font-size: 0.8rem;
          color: #94A3B8;
          text-align: center;
        }

        .logo-section {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        .logo-preview {
          width: 140px;
          height: 140px;
          border-radius: 16px;
          overflow: hidden;
          border: 2px dashed rgba(240, 185, 11, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }
        .logo-image-container { position: relative; width: 100%; height: 100%; }
        .logo-image-container img { width: 100%; height: 100%; object-fit: cover; }
        .remove-image-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .remove-image-btn:hover {
          background: rgba(239, 68, 68, 1);
          transform: scale(1.1);
        }
        .logo-placeholder {
          color: #F0B90B;
          font-size: 0.9rem;
          text-align: center;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .size-hint { font-size: 0.8rem; color: #94A3B8; }
        .file-input-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }
        .file-input-label {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          padding: 0.875rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-align: center;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 14px rgba(240, 185, 11, 0.3);
        }
        .file-input-label:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(240, 185, 11, 0.4);
        }
        .image-selected {
          color: #10B981;
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .social-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .social-input-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          background-color: rgba(30, 32, 38, 0.6);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(240, 185, 11, 0.1);
        }
        .social-icon { color: #F0B90B; flex-shrink: 0; }
        .form-group { display: flex; flex-direction: column; flex: 1; }
        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #FFFFFF;
          font-size: 0.95rem;
        }
        .form-group input,
        .form-group textarea {
          padding: 0.875rem 1rem;
          border: 1px solid rgba(240, 185, 11, 0.3);
          border-radius: 10px;
          font-size: 1rem;
          background-color: rgba(30, 32, 38, 0.8);
          color: #FFFFFF;
          transition: all 0.3s ease;
          outline: none;
          font-family: inherit;
          width: 100%;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #F0B90B;
          box-shadow: 0 0 0 3px rgba(240, 185, 11, 0.1);
        }
        .form-group input:invalid {
          border-color: #EF4444;
        }
        .form-group textarea { resize: vertical; min-height: 120px; }
        .char-count {
          text-align: right;
          font-size: 0.8rem;
          color: #94A3B8;
          margin-top: 0.5rem;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        .btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          justify-content: center;
          min-width: 140px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          box-shadow: 0 4px 15px rgba(240, 185, 11, 0.4);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(240, 185, 11, 0.5);
        }
        .btn-primary:disabled { 
          opacity: 0.6; 
          cursor: not-allowed;
          background: #474D57;
          color: #94A3B8;
          box-shadow: none;
        }
        .btn-secondary {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          border: 1px solid rgba(240, 185, 11, 0.3);
        }
        .btn-secondary:hover { 
          background: rgba(240, 185, 11, 0.2);
          transform: translateY(-1px);
        }
        .btn-submit {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          color: #F0B90B;
          border: 1px solid rgba(240, 185, 11, 0.3);
        }
        .btn-secondary:hover { 
          background: rgba(240, 185, 11, 0.2);
          transform: translateY(-1px);
        }
        .btn-submit {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          box-shadow: 0 4px 20px rgba(240, 185, 11, 0.4);
          padding: 1.2rem 3rem;
          font-size: 1.2rem;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(240, 185, 11, 0.5);
        }
        .btn-loading { 
          background: #474D57; 
          cursor: not-allowed; 
          opacity: 0.8;
          transform: none !important;
          box-shadow: none !important;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid #F0B90B;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .message {
          padding: 1.2rem;
          border-radius: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 1rem;
          margin-top: 1rem;
          line-height: 1.5;
        }
        .message.success {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10B981;
        }
        .message.error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #EF4444;
        }
        .sidebar { display: grid; gap: 2rem; }
        .info-card {
          background-color: rgba(43, 47, 54, 0.8);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(240, 185, 11, 0.2);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .info-card h4 {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: #F0B90B;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .info-card li {
          color: #CBD5E1;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .info-card li:last-child { border-bottom: none; }
        .preview-card {
          background-color: rgba(30, 32, 38, 0.6);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(240, 185, 11, 0.2);
        }
        .preview-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .preview-logo {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          object-fit: cover;
        }
        .preview-logo-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          background-color: rgba(240, 185, 11, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F0B90B;
        }
        .preview-title {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .preview-title h4 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #FFFFFF;
        }
        .preview-symbol {
          font-size: 1.2rem;
          color: #F0B90B;
          font-weight: 600;
          background-color: rgba(240, 185, 11, 0.1);
          padding: 0.3rem 0.8rem;
          border-radius: 8px;
          display: inline-block;
        }
        .preview-tier {
          font-size: 0.8rem;
          color: #8B5CF6;
          background: rgba(139, 92, 246, 0.1);
          padding: 0.2rem 0.8rem;
          border-radius: 6px;
          margin-top: 0.5rem;
          display: inline-block;
          font-weight: 600;
        }
        .preview-details { display: flex; flex-direction: column; gap: 1rem; }
        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .preview-row.total {
          border-top: 1px solid rgba(240, 185, 11, 0.3);
          margin-top: 0.5rem;
          padding-top: 1rem;
          font-weight: 700;
        }
        .preview-value { font-weight: 600; color: #FFFFFF; }
        .preview-value.total-cost {
          color: #10B981;
          font-size: 1.1rem;
        }
        .preview-link {
          color: #F0B90B;
          text-decoration: none;
          font-size: 0.9rem;
          word-break: break-all;
        }
        .preview-description {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.8rem 0;
        }
        .preview-description p {
          margin: 0;
          color: #CBD5E1;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .lp-settings {
          background-color: rgba(30, 32, 38, 0.4);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(240, 185, 11, 0.1);
        }
        
        .price-info {
          background-color: rgba(240, 185, 11, 0.1);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          border: 1px solid rgba(240, 185, 11, 0.2);
        }
        
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }
        
        .price-value {
          font-weight: 600;
          color: #F0B90B;
        }
        
        .checkbox-group {
          margin: 1.5rem 0;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
        }
        
        .checkbox-label input {
          display: none;
        }
        
        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #F0B90B;
          border-radius: 4px;
          position: relative;
          transition: all 0.3s ease;
        }
        
        .checkbox-label input:checked + .checkmark {
          background-color: #F0B90B;
        }
        
        .checkbox-label input:checked + .checkmark:after {
          content: '✓';
          position: absolute;
          color: #1E2026;
          font-weight: bold;
          left: 3px;
          top: -2px;
        }
        
        .checkbox-description {
          color: #CBD5E1;
          margin: 0.5rem 0 0 2rem;
          font-size: 0.9rem;
        }
        
        .lp-warning {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        .lp-warning p {
          margin: 0;
          color: #EF4444;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .preview-section-divider {
          font-weight: 600;
          color: #F0B90B;
          margin: 1rem 0 0.5rem 0;
          padding-top: 1rem;
          border-top: 1px solid rgba(240, 185, 11, 0.3);
        }

        @media (min-width: 768px) {
          .container { padding: 2rem 1.5rem; }
          .header { margin-bottom: 3rem; }
          .step-indicator { margin-bottom: 3rem; }
          .step-circle { width: 55px; height: 55px; }
          .step-text { font-size: 0.9rem; }
          .step-line { width: 100px; margin: 0 1rem; }
          .logo-section { flex-direction: row; align-items: flex-start; gap: 2rem; }
          .file-input-container { align-items: flex-start; }
          .step-content { padding: 2rem; }
          .social-input-group { flex-direction: row; }
          .balance-actions { flex-direction: row; }
        }

        @media (min-width: 1024px) {
          .content { grid-template-columns: 2fr 1fr; gap: 3rem; }
          .step-content { padding: 2.5rem; }
          .form-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .step-indicator { justify-content: flex-start; padding: 2rem 1rem; }
          .step-circle { width: 45px; height: 45px; }
          .step-line { width: 40px; margin: 0 0.25rem; }
          .step-text { font-size: 0.75rem; max-width: 80px; text-align: center; }
          .button-group { flex-direction: column; }
          .btn { width: 100%; }
          .preview-header { flex-direction: column; align-items: flex-start; }
          .balance-actions { flex-direction: column; }
          .balance-check-btn, .network-switch-btn { width: 100%; justify-content: center; }
          .tier-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="header">
        <h1>Token Creator</h1>
        <p>Create your own token on BSC Network and add LP</p>
        
        <div className={`network-status ${isCorrectNetwork ? 'connected' : 'disconnected'}`}>
          {isCorrectNetwork ? (
            <>
              <FaCheckCircle size={16} />
              Connected to BSC Mainnet
            </>
          ) : (
            <>
              <FaExclamationCircle size={16} />
              Not Connected to BSC Mainnet
            </>
          )}
        </div>
        
        {userAddress && (
          <div style={{color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem'}}>
            Wallet: {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}
          </div>
        )}
      </div>

      <StepIndicator />

      <div className="content">
        <form onSubmit={handleSubmit} className="form">
          {renderStepContent()}

          <div className="button-group">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep}
                className="btn btn-secondary"
              >
                <FaArrowLeft size={20} />
                Previous
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button 
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.symbol || !formData.initialSupply)) ||
                  !userAddress
                }
              >
                Next
                <FaArrowRight size={20} />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading || !userAddress || !isCorrectNetwork}
                className={`btn ${loading ? 'btn-loading' : 'btn-submit'}`}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creating Token...
                  </>
                ) : (
                  <>
                    <FaRocket size={20} />
                    Create Token
                  </>
                )}
              </button>
            )}
          </div>

          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : message.includes('✅') ? 'success' : 'success'}`}>
              {message}
            </div>
          )}
        </form>

        <div className="sidebar">
          <div className="info-card">
            <h4>
              <FaInfoCircle size={20} />
              Tips
            </h4>
            <ul>
              <li>🎯 Choose a memorable name and symbol</li>
              <li>💰 Set a realistic total supply</li>
              <li>🖼️ Use a quality logo</li>
              <li>💧 Add LP to provide liquidity</li>
              <li>📱 Add social media links</li>
              <li>🔍 Check information carefully</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>
              <FaExclamationCircle size={20} />
              Important
            </h4>
            <ul>
              <li>⛽ Gas fee required</li>
              <li>🔒 Transactions cannot be reversed</li>
              <li>💧 LP tokens will be locked</li>
              <li>🛡️ Check your wallet security</li>
              <li>🌐 Use BSC Mainnet</li>
              <li>💰 Have sufficient BNB balance</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>
              <FaDollarSign size={20} />
              Token Creation Fee
            </h4>
            <ul>
              <li>✅ Fixed Token Fee: 0.0001 BNB</li>
              <li>✅ Liquidity Pool Fee: 0.001 BNB</li>
              <li>✅ Estimated Gas: ~0.01 BNB</li>
              <li>� Total estimated cost: ~0.0111 BNB</li>
            </ul>
          </div>

          {formData.addLiquidity && (
            <div className="info-card">
              <h4>
                <FaCoins size={20} />
                LP Information
              </h4>
              <ul>
                <li>🔒 LP tokens will remain locked</li>
                <li>💧 Liquidity will be added to PancakeSwap</li>
                <li>⚡ Configure LP settings after creating token</li>
              </ul>
            </div>
          )}

          <div className="info-card">
            <h4>
              <FaWallet size={20} />
              Cost Summary
            </h4>
            <ul>
              <li>📦 Package: {getTierFee()} BNB</li>
              <li>⛽ Gas: ~0.005 BNB</li>
              <li>💰 Total: ~{(parseFloat(getTierFee()) + 0.005).toFixed(4)} BNB</li>
              <li>👛 Your Balance: {userBalance} BNB</li>
            </ul>
          </div>
        </div>
      </div>

      <LPConfirmModal
        open={showLPModal}
        onClose={() => setShowLPModal(false)}
        onConfirm={handleLPConfirm}
        tokenAddress={createdTokenAddress}
        lpTxLoading={lpTxLoading}
        lpTxMessage={lpTxMessage}
      />
    </div>
  );
};

export default CreateToken;

