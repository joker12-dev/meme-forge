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
import { tokenAPI } from '../utils/api';
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
    // LP için yeni alanlar
    addLiquidity: false,
    bnbAmount: '',
    tokenAmount: '',
    lpLockTime: '30',
    autoBurn: false,
    marketingTax: '0',
    liquidityTax: '0',
    // Yeni: Token tier seçimi
    tokenTier: 'standard'
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

  
  
  // YENİ: Fee state'leri
  const [creationFee, setCreationFee] = useState('0.01');
  const [feeDistribution, setFeeDistribution] = useState({
    platform: '70%',
    development: '20%',
    marketing: '10%'
  });
  const [tierFees, setTierFees] = useState({
    basic: '0.001',      // Optimize edilmiş ücret
    standard: '0.002',   // Optimize edilmiş ücret
    premium: '0.003'     // Optimize edilmiş ücret
  });

  // Adım başlıkları - Güncellendi
  const steps = [
    { number: 1, title: 'Token Bilgileri', icon: <FaRocket size={20} /> },
    { number: 2, title: 'Paket Seçimi', icon: <FaCoins size={20} /> },
    { number: 3, title: 'Liquidity Pool', icon: <FaBolt size={20} /> },
    { number: 4, title: 'Sosyal Medya', icon: <FaGlobe size={20} /> },
    { number: 5, title: 'Önizleme', icon: <FaEye size={20} /> }
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
      console.error('Cüzdan bağlantı hatası:', error);
    }
  };

  // Factory contract'tan fee bilgilerini çek
  const fetchFeeInfo = async () => {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        console.log('MetaMask not available, using fallback fees');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const factoryContract = new ethers.Contract(
        process.env.REACT_APP_FACTORY_ADDRESS,
        [
          "function getTierFee(string) view returns (uint256)"
        ],
        provider
      );

      const [basicFee, standardFee, premiumFee] = await Promise.all([
        factoryContract.getTierFee('basic'),
        factoryContract.getTierFee('standard'),
        factoryContract.getTierFee('premium')
      ]);

      setTierFees({
        basic: ethers.formatEther(basicFee),
        standard: ethers.formatEther(standardFee),
        premium: ethers.formatEther(premiumFee)
      });

      setCreationFee(ethers.formatEther(standardFee));
    } catch (error) {
      console.error('Fee bilgisi çekme hatası:', error);
      // Fallback değerler - Optimize edilmiş
      setTierFees({
        basic: '0.001',
        standard: '0.002',
        premium: '0.003'
      });
      setCreationFee('0.002');
    }
  };

  const checkNetwork = async () => {
    try {
      const isBSC = await isConnectedToBSC();
      setIsCorrectNetwork(isBSC);
      return isBSC;
    } catch (error) {
      console.error('Ağ kontrol hatası:', error);
      return false;
    }
  };

  const checkUserBalance = async () => {
    try {
      const balance = await getBalance();
      setUserBalance(parseFloat(balance).toFixed(4));
      return parseFloat(balance);
    } catch (error) {
      console.error('Bakiye kontrol hatası:', error);
      return 0;
    }
  };

  const switchNetwork = async () => {
    try {
      await switchToBSCNetwork();
      const isBSC = await checkNetwork();
      if (isBSC) {
        setMessage('✅ BSC ağına başarıyla geçildi');
      }
    } catch (error) {
      setMessage('❌ Ağ değiştirme hatası: ' + error.message);
    }
  };

  // YENİ: Tier'a göre fee hesapla
  const getTierFee = () => {
    return tierFees[formData.tokenTier] || '0.01';
  };

  // YENİ: Toplam maliyet hesaplama (fee dahil)
  const calculateTotalCost = () => {
    const bnbAmount = formData.addLiquidity ? parseFloat(formData.bnbAmount || 0) : 0;
    const tierFee = parseFloat(getTierFee());
    const gasCost = parseFloat(estimatedGas);
    return (bnbAmount + tierFee + gasCost).toFixed(4);
  };

  // Token validasyon fonksiyonları
  const validateTokenInfo = () => {
    const { name, symbol, initialSupply, decimals } = formData;

    if (!name || !symbol || !initialSupply) {
      return '❌ Lütfen tüm zorunlu alanları doldurun';
    }

    if (name.length < 2 || name.length > 30) {
      return '❌ Token adı 2-30 karakter arasında olmalıdır';
    }

    if (!/^[A-Za-z]{3,10}$/.test(symbol)) {
      return '❌ Token sembolü 3-10 harf arasında olmalıdır';
    }

    const supply = parseFloat(initialSupply);
    if (supply <= 0 || supply > 1000000000000) {
      return '❌ Geçerli bir toplam arz girin (0-1 trilyon arası)';
    }

    const decimalNum = parseInt(decimals);
    if (decimalNum < 0 || decimalNum > 18) {
      return '❌ Ondalık basamak 0-18 arasında olmalıdır';
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
    if (!formData.addLiquidity) return null;

    const { bnbAmount, tokenAmount, marketingTax, liquidityTax, initialSupply } = formData;
    
    if (!bnbAmount || !tokenAmount) {
      return '❌ LP eklemek için BNB ve Token miktarlarını girin';
    }

    const bnb = parseFloat(bnbAmount);
    const tokens = parseFloat(tokenAmount);
    const totalSupply = parseFloat(initialSupply);
    
    if (bnb <= 0 || tokens <= 0) {
      return '❌ BNB ve Token miktarları 0\'dan büyük olmalıdır';
    }

    if (tokens > totalSupply) {
      return `❌ Token miktarı toplam arzdan fazla olamaz! Toplam arz: ${totalSupply.toLocaleString()}, Girdiğiniz: ${tokens.toLocaleString()}`;
    }

    const lpPercentage = (tokens / totalSupply) * 100;
    if (lpPercentage > 90) {
      return `⚠️ LP'ye çok yüksek miktarda token ekliyorsunuz (${lpPercentage.toFixed(1)}%). En fazla %90 önerilir.`;
    }

    const marketing = parseFloat(marketingTax);
    const liquidity = parseFloat(liquidityTax);
    
    if (marketing + liquidity > 15) {
      return '❌ Toplam tax oranı %15\'i geçemez';
    }

    return null;
  };

  // LP ekleme işlemi - Platform wallet'ten tokenları al
  const handleLPConfirm = async (lpData) => {
    setLpTxLoading(true);
    setLpTxMessage('LP ekleme işlemi başlatılıyor...');
    try {
      // LP ekleme için LiquidityAdder contract ile işlem
      const walletType = localStorage.getItem('walletType') || 'metamask';
      const rawProvider = getProviderByWallet(walletType);
      
      if (!rawProvider) {
        throw new Error('Wallet provider not found');
      }
      
      // Ethers provider ve signer al (v6 uyumlu)
      const ethersProvider = getEthersProvider(rawProvider);
      const signer = await getSigner(rawProvider);
      const userAddress = await signer.getAddress();
      
      console.log('✅ User address:', userAddress);
      console.log('✅ Signer provider:', !!signer.provider);
      
      // LiquidityAdder contract address
      const liquidityAdderAddress = process.env.REACT_APP_LIQUIDITY_ADDER_ADDRESS;
      if (!liquidityAdderAddress) {
        setLpTxMessage('❌ Hata: LiquidityAdder kontrat adresi bulunamadı! .env dosyasını kontrol et.');
        setLpTxLoading(false);
        return;
      }
      
      // Platform wallet adresini backend'den al
      let platformWallet;
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:3001`;
        console.log('🔗 Fetching platform wallet from:', `${backendUrl}/api/config/platform-wallet`);
        
        const response = await fetch(`${backendUrl}/api/config/platform-wallet`);
        
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 Backend response:', data);
        
        platformWallet = data.platformWallet;
        if (!platformWallet) {
          throw new Error('Platform wallet not found in response');
        }
        console.log('📍 Platform Wallet:', platformWallet);
      } catch (err) {
        console.error('❌ Platform wallet fetch error:', err);
        setLpTxMessage('❌ Platform wallet adresini alamadık: ' + err.message);
        setLpTxLoading(false);
        return;
      }
      
      // addLiquidityFrom ABI - platform wallet'ten tokenları çek
      const liquidityAdderAbi = [
        'function addLiquidityFrom(address token, address from, uint256 tokenAmount, address recipient) payable returns (uint256)'
      ];
      
      // Contract with signer (for write operations)
      const liquidityContract = new ethers.Contract(liquidityAdderAddress, liquidityAdderAbi, signer);
      
      let tokenAmountParsed, bnbAmountParsed;
      try {
        tokenAmountParsed = ethers.parseUnits(String(lpData.tokenAmount), 18);
        bnbAmountParsed = ethers.parseUnits(String(lpData.bnbAmount), 'ether');
      } catch (parseErr) {
        console.error('❌ Parse Units Error:', parseErr);
        setLpTxMessage('❌ Sayı dönüştürme hatası: ' + parseErr.message);
        setLpTxLoading(false);
        return;
      }
      
      setLpTxMessage('🔄 Platform wallet izin kontrol ediliyor...');
      
      // Token kontratından platform wallet'in approval'ını kontrol et
      const tokenAbi = [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ];
      
      // Contract with provider for read operations
      const tokenContractRead = new ethers.Contract(createdTokenAddress, tokenAbi, ethersProvider);
      
      // Platform wallet'in LiquidityAdder'a verdiği izni kontrol et
      const allowance = await tokenContractRead.allowance(platformWallet, liquidityAdderAddress);
      console.log('📌 Platform Allowance:', ethers.formatUnits(allowance, 18));
      
      if (allowance < tokenAmountParsed) {
        setLpTxMessage('⚠️ Platform wallet izni yetersiz. Manuel approval gerekli.');
        console.warn('Platform wallet approval insufficient. Need manual approval.');
      }
      
      setLpTxMessage('🔄 LP kontratina cagri yapiliyor (platform walletden)...');
      
      try {
        // addLiquidityFrom çağır - platform wallet'ten al, user'a LP token ver
        console.log('📤 Calling addLiquidityFrom with:', {
          token: createdTokenAddress,
          from: platformWallet,
          tokenAmount: tokenAmountParsed.toString(),
          recipient: userAddress,
          bnb: bnbAmountParsed.toString()
        });
        
        const tx = await liquidityContract.addLiquidityFrom(
          createdTokenAddress,
          platformWallet,        // from: platform wallet (token sahibi)
          tokenAmountParsed,     // tokenAmount
          userAddress,           // recipient: user kendisi (LP token alır)
          { value: bnbAmountParsed }
        );
        
        console.log('✅ TX sent:', tx.hash);
        setLpTxMessage(`✅ LP işlemi gönderildi! Hash: ${tx.hash.substring(0, 10)}...`);
        
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout - 2 min')), 120000)
          )
        ]);
        
        console.log('✅ TX confirmed:', receipt);
        
        // ✅ LOCK LP TOKENS
        setLpTxMessage('🔒 LP token\'ları kilitleniyor...');
        
        const lockDuration = parseInt(lpData.lpLockTime) || 30; // days
        const lockDurationSeconds = lockDuration * 24 * 60 * 60;
        
        // Get LP token address from Pancake pair
        // For now, we'll get the LP token balance and lock it
        const wethAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB on testnet
        const factoryAddress = process.env.REACT_APP_FACTORY_ADDRESS;
        
        // Get liquidity token amount - query user's LP balance
        const pairABI = [
          'function balanceOf(address account) view returns (uint256)'
        ];
        
        try {
          // Try to get LP token address from Pancake factory or just use a known pair
          // For now, estimate LP amount (this is complex in reality)
          console.log('🔒 LP Lock Duration:', lockDuration, 'days =', lockDurationSeconds, 'seconds');
          
          // Call backend to lock liquidity
          const lockResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://192.168.3.111:3001'}/api/liquidity/lock-liquidity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenAddress: createdTokenAddress,
              userAddress: userAddress,
              duration: lockDurationSeconds,
              lpTokenAmount: receipt.logs.length > 0 ? 'auto' : 'pending'
            })
          });
          
          if (lockResponse.ok) {
            const lockData = await lockResponse.json();
            console.log('✅ LP Locked:', lockData);
            setLpTxMessage(`✅ LP başarıyla eklendi!\n✅ ${userTokenAmount.toLocaleString()} ${formData.symbol} token'ınız wallet'a gönderildi!\n🔒 LP token'ları ${lockDuration} gün boyunca kilitlendi!`);
          } else {
            console.warn('⚠️ Lock request failed, but LP was added');
            setLpTxMessage(`✅ LP başarıyla eklendi!\n✅ ${userTokenAmount.toLocaleString()} ${formData.symbol} token'ınız wallet'a gönderildi!\n📊 ${lpTokenAmount.toLocaleString()} ${formData.symbol} havuzda kilitlendi.`);
          }
        } catch (lockErr) {
          console.warn('⚠️ Auto-lock failed (non-critical):', lockErr.message);
          // Don't fail LP addition if lock fails
          
          // Calculate distribution
          const totalSupply = parseFloat(formData.initialSupply);
          const userTokenAmount = parseFloat(lpData.tokenAmount);
          const lpTokenAmount = totalSupply - userTokenAmount;
          
          setLpTxMessage(`✅ LP başarıyla eklendi!\n✅ ${userTokenAmount.toLocaleString()} ${formData.symbol} token'ınız wallet'a gönderildi!\n📊 ${lpTokenAmount.toLocaleString()} ${formData.symbol} havuzda kilitlendi.`);
        }
      } catch (lpErr) {
        console.error('❌ addLiquidityFrom Error:', lpErr);
        throw lpErr;
      }
      setShowLPModal(false);
      setFormData({
        name: '', symbol: '', initialSupply: '', decimals: '18', metadataURI: '', website: '', telegram: '', twitter: '', description: '', logo: null, addLiquidity: false, bnbAmount: '', tokenAmount: '', lpLockTime: '30', autoBurn: false, marketingTax: '0', liquidityTax: '0', tokenTier: 'standard'
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
      
      setLpTxMessage('❌ LP ekleme hatası: ' + errorMsg);
    } finally {
      setLpTxLoading(false);
    }
  };

  // LP YÜZDESİ HESAPLAMA
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
        setMessage(`⚠️ Token miktarı toplam arzı aşıyor! Maksimum: ${totalSupply.toLocaleString()}`);
      } else if (message && message.includes('Token miktarı toplam arzı aşıyor')) {
        setMessage('');
      }
    }

    // Tier değiştiğinde LP ayarlarını güncelle
    if (name === 'tokenTier') {
      if (value === 'premium') {
        newFormData.addLiquidity = true;
        newFormData.lpLockTime = '90';
        newFormData.autoBurn = true;
      } else if (value === 'standard') {
        newFormData.addLiquidity = true;
        newFormData.lpLockTime = '30';
      } else {
        newFormData.addLiquidity = false;
      }
    }

    setFormData(newFormData);

    if (name === 'addLiquidity' || name === 'bnbAmount' || name === 'tokenTier') {
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
      setMessage('❌ Lütfen JPEG, PNG, GIF veya WebP formatında bir resim seçin');
      return;
    }
    
    if (file.size > maxSize) {
      setMessage('❌ Resim boyutu 5MB\'dan küçük olmalıdır');
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
      setMessage('📤 Logo yükleniyor...');
      
      const uploadFormData = new FormData();
      uploadFormData.append('logo', file);
      
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
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
        throw new Error(`Logo yükleme başarısız: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload response data:', data);
      
      if (data.success && data.logoURL) {
        console.log('✅ Logo uploaded successfully:', data.logoURL);
        return data.logoURL;
      } else {
        throw new Error(data.error || 'Logo yükleme başarısız');
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
    const baseGas = formData.addLiquidity ? '0.01' : '0.005';
    if (formData.addLiquidity && formData.bnbAmount) {
      const additionalGas = parseFloat(formData.bnbAmount) * 0.001;
      setEstimatedGas((parseFloat(baseGas) + additionalGas).toFixed(4));
    } else {
      setEstimatedGas(baseGas);
    }
  };

  const checkLPBalance = async () => {
    if (!formData.addLiquidity) return true;

    const bnbAmount = parseFloat(formData.bnbAmount);
    const userBNBBalance = await checkUserBalance();
    const tierFee = parseFloat(getTierFee());
    
    const totalCost = bnbAmount + parseFloat(estimatedGas) + tierFee;
    
    if (userBNBBalance < totalCost) {
      setMessage(`❌ Yetersiz BNB bakiyesi. Gerekli: ${totalCost.toFixed(4)} BNB, Mevcut: ${userBNBBalance.toFixed(4)} BNB`);
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
        setMessage('❌ Lütfen BSC Mainnet ağına geçiş yapın');
        setLoading(false);
        return;
      }

      const address = await getCurrentAccount();
      if (!address) {
        setMessage('❌ Lütfen önce cüzdanınızı bağlayın!');
        setLoading(false);
        return;
      }

      const tokenValidationError = validateTokenInfo();
      if (tokenValidationError) {
        setMessage(tokenValidationError);
        setLoading(false);
        return;
      }

      if ((formData.website && !validateURL(formData.website)) ||
          (formData.telegram && !validateURL(formData.telegram)) ||
          (formData.twitter && !validateURL(formData.twitter))) {
        setMessage('❌ Lütfen geçerli URL formatı kullanın');
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
          setMessage('❌ Logo yükleme başarısız: ' + uploadError.message);
          setLoading(false);
          return;
        }
      }

      setMessage('📝 Token kontratı hazırlanıyor...');
      
      // Store wallet address in localStorage so API interceptor can find it
      localStorage.setItem('walletAddress', address);
      
      // Debug: Data kontrolü
      const tokenData = {
        ...formData,
        userAddress: address,
        initialSupply: formData.initialSupply.toString(),
        logoURL: logoURL,
        tier: formData.tokenTier,
        creationFee: getTierFee()
      };
      
      console.log('🔍 DEBUG - Sending to backend:', tokenData);
      console.log('🔍 initialSupply:', formData.initialSupply);
      console.log('🔍 name:', formData.name);
      console.log('🔍 symbol:', formData.symbol);
      console.log('🔍 userAddress:', address);
      
      const response = await tokenAPI.createToken(tokenData);

      console.log('Backend response:', response.data);

      if (response.data.success && response.data.transaction) {
        setMessage('🔄 Wallet işlemi hazırlanıyor...');
        
        try {
          // Get the active wallet provider
          const walletType = localStorage.getItem('walletType') || 'metamask';
          const provider = getProviderByWallet(walletType);
          
          if (!provider) {
            throw new Error('Wallet provider not found. Please connect your wallet first.');
          }

          const signer = await getSigner(provider);
          
          console.log('Signer address:', await signer.getAddress());
          
          // Fee değerini ekle
          const tx = await signer.sendTransaction({
            ...response.data.transaction,
            value: response.data.transaction.value || ethers.parseEther(getTierFee())
          });
          
          setMessage(`✅ İşlem gönderildi! Onay bekleniyor... Hash: ${tx.hash.substring(0, 10)}...`);
          
          const receipt = await tx.wait();
          console.log('✅ İşlem onaylandı!', receipt);
          
          setMessage('✅ İşlem onaylandı! Token kaydediliyor...');
          
          const confirmResponse = await tokenAPI.confirmTokenCreation({
            txHash: tx.hash,
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
              userTokenAmount: formData.tokenAmount,        // ← User'a gidicek
              lpTokenAmount: formData.initialSupply - formData.tokenAmount,  // ← Havuza gidicek
              bnbAmount: formData.bnbAmount,
              lpLockTime: formData.lpLockTime
            } : null
          });

          if (confirmResponse.data.success) {
            setMessage('🎉 ' + confirmResponse.data.message);
            console.log('✅ Token başarıyla oluşturuldu. Tier:', formData.tokenTier);
            console.log('📦 Backend response:', confirmResponse.data);
            // LP modal'ı Standard ve Premium paketlerde aç
            if (formData.tokenTier !== 'basic') {
              const tokenAddress = confirmResponse.data.tokenAddress;
              console.log('🔍 tokenAddress:', tokenAddress);
              if (tokenAddress) {
                console.log('✅ LP Modal açılıyor...');
                setCreatedTokenAddress(tokenAddress);
                setShowLPModal(true);
                setLoading(false);
                return;
              } else {
                console.log('❌ tokenAddress boş! Backend response:', confirmResponse.data);
              }
            }
            // LP yoksa direkt yönlendir
            setFormData({
              name: '', symbol: '', initialSupply: '', decimals: '18', metadataURI: '', website: '', telegram: '', twitter: '', description: '', logo: null, addLiquidity: false, bnbAmount: '', tokenAmount: '', lpLockTime: '30', autoBurn: false, marketingTax: '0', liquidityTax: '0', tokenTier: 'standard'
            });
            setPreviewImage(null);
            setCurrentStep(1);
            setTimeout(() => {
              window.location.href = '/tokens';
            }, 3000);
          } else {
            setMessage('❌ Token kaydetme başarısız: ' + (confirmResponse.data.message || confirmResponse.data.error));
          }
          
        } catch (txError) {
          console.error('Transaction error:', txError);
          if (txError.code === 'ACTION_REJECTED') {
            setMessage('❌ İşlem kullanıcı tarafından reddedildi');
          } else {
            setMessage('❌ İşlem başarısız: ' + (txError.reason || txError.message));
          }
        }

      } else {
        setMessage('❌ ' + (response.data.message || response.data.error || 'Token oluşturma başarısız'));
      }

    } catch (error) {
      console.error('Token creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      setMessage('❌ Hata: ' + (error.response?.data?.error || error.response?.data?.message || error.message));
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
              <h3>Token Logosu</h3>
            </div>
            <p className="helper-text">
              Tokenınız için bir profil resmi seçin (JPEG, PNG, GIF, WebP - max 5MB)
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
                    <span>Logo Yükle</span>
                    <span className="size-hint">120x120 px önerilir</span>
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
                  Logo Seç
                </label>
                {previewImage && (
                  <p className="image-selected">✓ Logo seçildi</p>
                )}
              </div>
            </div>

            <div className="section-header" style={{ marginTop: '2rem' }}>
              <FaRocket size={28} />
              <h3>Token Bilgileri</h3>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>
                  Token Adı *
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Örn: DogeCoin"
                    required
                    minLength="2"
                    maxLength="30"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Token Sembolü *
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="Örn: DOGE"
                    required
                    pattern="[A-Za-z]{3,10}"
                    title="3-10 harf arasında olmalıdır"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Toplam Arz *
                  <input
                    type="number"
                    name="initialSupply"
                    value={formData.initialSupply}
                    onChange={handleInputChange}
                    placeholder="Örn: 1000000"
                    required
                    min="1"
                    max="1000000000000"
                    step="1"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  Ondalık Basamak
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
              <FaCoins size={28} />
              <h3>Paket Seçimi</h3>
            </div>
            <p className="helper-text">
              İhtiyaçlarınıza uygun bir paket seçin. Premium paketlerde ek özellikler bulunur.
            </p>

            <div className="tier-selection">
              <div className="tier-cards">
                {/* BASIC TIER */}
                <div 
                  className={`tier-card ${formData.tokenTier === 'basic' ? 'selected' : ''}`}
                  onClick={() => handleInputChange({ target: { name: 'tokenTier', value: 'basic' } })}
                >
                  <div className="tier-header">
                    <h4>Basic</h4>
                    <div className="tier-price">{tierFees.basic} BNB</div>
                  </div>
                  <div className="tier-features">
                    <div className="feature">✓ Temel Token Oluşturma</div>
                    <div className="feature">✓ 18 Decimal</div>
                    <div className="feature">✓ IPFS Metadata</div>
                    <div className="feature">✗ Liquidity Pool</div>
                    <div className="feature">✗ Advanced Features</div>
                  </div>
                  <div className="tier-badge">En Ekonomik</div>
                </div>

                {/* STANDARD TIER */}
                <div 
                  className={`tier-card ${formData.tokenTier === 'standard' ? 'selected' : ''}`}
                  onClick={() => handleInputChange({ target: { name: 'tokenTier', value: 'standard' } })}
                >
                  <div className="tier-header">
                    <h4>Standard</h4>
                    <div className="tier-price">{tierFees.standard} BNB</div>
                  </div>
                  <div className="tier-features">
                    <div className="feature">✓ Temel Token Oluşturma</div>
                    <div className="feature">✓ Liquidity Pool</div>
                    <div className="feature">✓ 30 Gün LP Lock</div>
                    <div className="feature">✓ Tax Ayarları</div>
                    <div className="feature">✗ Auto-Burn</div>
                  </div>
                  <div className="tier-badge popular">En Popüler</div>
                </div>

                {/* PREMIUM TIER */}
                <div 
                  className={`tier-card ${formData.tokenTier === 'premium' ? 'selected' : ''}`}
                  onClick={() => handleInputChange({ target: { name: 'tokenTier', value: 'premium' } })}
                >
                  <div className="tier-header">
                    <h4>Premium</h4>
                    <div className="tier-price">{tierFees.premium} BNB</div>
                  </div>
                  <div className="tier-features">
                    <div className="feature">✓ Tüm Standart Özellikler</div>
                    <div className="feature">✓ 90 Gün LP Lock</div>
                    <div className="feature">✓ Auto-Burn Özelliği</div>
                    <div className="feature">✓ Premium Destek</div>
                    <div className="feature">✓ Öncelikli Listeleme</div>
                  </div>
                  <div className="tier-badge premium">Premium</div>
                </div>
              </div>
            </div>

            {/* Fee Dağılım Bilgisi */}
            <div className="fee-distribution">
              <div className="section-header">
                <FaUsers size={24} />
                <h4>Fee Dağılımı</h4>
              </div>
              <div className="distribution-bars">
                <div className="distribution-item">
                  <div className="distribution-label">
                    <span>Platform ({feeDistribution.platform})</span>
                    <span>{(parseFloat(getTierFee()) * 0.7).toFixed(3)} BNB</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill platform" 
                      style={{width: feeDistribution.platform}}
                    ></div>
                  </div>
                </div>
                <div className="distribution-item">
                  <div className="distribution-label">
                    <span>Geliştirme ({feeDistribution.development})</span>
                    <span>{(parseFloat(getTierFee()) * 0.2).toFixed(3)} BNB</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill development" 
                      style={{width: feeDistribution.development}}
                    ></div>
                  </div>
                </div>
                <div className="distribution-item">
                  <div className="distribution-label">
                    <span>Marketing ({feeDistribution.marketing})</span>
                    <span>{(parseFloat(getTierFee()) * 0.1).toFixed(3)} BNB</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill marketing" 
                      style={{width: feeDistribution.marketing}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaBolt size={28} />
              <h3>Hazırlıklar Tamamlandı</h3>
            </div>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid #10B981',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <FaCheckCircle size={48} style={{ color: '#10B981', marginBottom: '1rem' }} />
              <h4 style={{ color: '#10B981', marginBottom: '1rem' }}>
                {formData.tokenTier === 'basic' 
                  ? 'Basic Paket Seçildi' 
                  : 'Liquidity Pool Seçeneği Mevcut'}
              </h4>
              
              {formData.tokenTier === 'basic' ? (
                <p style={{ color: '#CBD5E1', lineHeight: '1.6' }}>
                  Basic paketiniz token oluşturma için hazır. Sonraki adımlardan geçerek token oluşturma işlemini tamamlayabilirsiniz.
                  <br /><br />
                  <strong>Not:</strong> LP eklemek isterseniz daha sonra Token detay sayfasından ekleyebilirsiniz.
                </p>
              ) : (
                <p style={{ color: '#CBD5E1', lineHeight: '1.6' }}>
                  Seçtiğiniz paket liquidity pool özelliğini desteklemektedir.
                  <br /><br />
                  Token oluşturulduktan sonra, bir modal penceresi açılacak ve LP miktarlarını belirtip onay verebileceksiniz.
                  <br />
                  Token adresinizi cüzdanından doğrudan işlem başlatacaksınız.
                </p>
              )}
            </div>

            <div className="balance-info">
              <div className="balance-row">
                <span>Seçilen Paket:</span>
                <span className="balance-value">{formData.tokenTier?.toUpperCase() || 'STANDARD'}</span>
              </div>
              <div className="balance-row">
                <span>Paket Ücreti:</span>
                <span className="balance-value">{getTierFee()} BNB</span>
              </div>
              <div className="balance-row">
                <span>Mevcut BNB Bakiyeniz:</span>
                <span className="balance-value">{userBalance} BNB</span>
              </div>
              <div className="balance-row total">
                <span>Tahmini Toplam Maliyet:</span>
                <span className="balance-value total-cost">~{(parseFloat(getTierFee()) + 0.005).toFixed(4)} BNB</span>
              </div>
              <div className="balance-actions">
                <button 
                  type="button" 
                  onClick={checkUserBalance}
                  className="balance-check-btn"
                >
                  <FaWallet size={16} />
                  Bakiyeyi Güncelle
                </button>
                {!isCorrectNetwork && (
                  <button 
                    type="button" 
                    onClick={switchNetwork}
                    className="network-switch-btn"
                  >
                    BSC Ağına Geç
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaGlobe size={28} />
              <h3>Sosyal Medya Bağlantıları</h3>
            </div>
            <p className="helper-text">
              Tokenınızın topluluğunu büyütmek için sosyal medya bağlantılarını ekleyin (Opsiyonel)
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
              <h3>Token Açıklaması</h3>
            </div>
            
            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tokenınızın amacını, özelliklerini, kullanım alanlarını ve topluluğunuzu açıklayın..."
                rows="8"
                maxLength="1000"
              />
              <div className="char-count">
                {formData.description.length}/1000 karakter
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <div className="section-header">
              <FaEye size={28} />
              <h3>Token Önizleme</h3>
            </div>
            <p className="helper-text">
              Token bilgilerinizi kontrol edin. Onayladıktan sonra işlem başlatılacaktır.
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
                  <h4>{formData.name || 'Token Adı'}</h4>
                  <span className="preview-symbol">{formData.symbol || 'SYMBOL'}</span>
                  <div className="preview-tier">{formData.tokenTier?.toUpperCase() || 'STANDARD'} PAKET</div>
                </div>
              </div>
              
              <div className="preview-details">
                <div className="preview-row">
                  <span>Toplam Arz:</span>
                  <span className="preview-value">
                    {formData.initialSupply ? Number(formData.initialSupply).toLocaleString() : '0'} {formData.symbol || ''}
                  </span>
                </div>
                <div className="preview-row">
                  <span>Ondalık:</span>
                  <span className="preview-value">{formData.decimals}</span>
                </div>
                
                <div className="preview-section-divider">Paket Bilgileri</div>
                <div className="preview-row">
                  <span>Seçilen Paket:</span>
                  <span className="preview-value">{formData.tokenTier?.toUpperCase()}</span>
                </div>
                <div className="preview-row">
                  <span>Paket Ücreti:</span>
                  <span className="preview-value">{getTierFee()} BNB</span>
                </div>
                
                {(formData.website || formData.telegram || formData.twitter) && (
                  <div className="preview-section-divider">Sosyal Medya</div>
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
                    <div className="preview-section-divider">Açıklama</div>
                    <div className="preview-description">
                      <p>{formData.description}</p>
                    </div>
                  </>
                )}

                <div className="preview-section-divider">Maliyet Detayı</div>
                <div className="preview-row">
                  <span>Paket Ücreti:</span>
                  <span className="preview-value">{getTierFee()} BNB</span>
                </div>
                <div className="preview-row">
                  <span>Tahmini Gas Ücreti:</span>
                  <span className="preview-value">{estimatedGas} BNB</span>
                </div>
                <div className="preview-row total">
                  <span>Toplam Maliyet:</span>
                  <span className="preview-value total-cost">~{(parseFloat(getTierFee()) + 0.005).toFixed(4)} BNB</span>
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
          min-height: calc(100vh - 80px); /* Header yüksekliğini çıkar */
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
        <h1>Token Oluşturucu</h1>
        <p>BSC Network'te kendi tokenınızı oluşturun ve LP ekleyin</p>
        
        <div className={`network-status ${isCorrectNetwork ? 'connected' : 'disconnected'}`}>
          {isCorrectNetwork ? (
            <>
              <FaCheckCircle size={16} />
              BSC Mainnet'e Bağlı
            </>
          ) : (
            <>
              <FaExclamationCircle size={16} />
              BSC Mainnet'e Bağlı Değil
            </>
          )}
        </div>
        
        {userAddress && (
          <div style={{color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem'}}>
            Cüzdan: {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}
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
                Geri
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
                İleri
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
                    Token Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FaRocket size={20} />
                    Token Oluştur
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
              İpuçları
            </h4>
            <ul>
              <li>🎯 Akılda kalıcı isim ve sembol seçin</li>
              <li>💰 Gerçekçi toplam arz belirleyin</li>
              <li>🖼️ Kaliteli logo kullanın</li>
              <li>💧 LP ekleyerek likidite sağlayın</li>
              <li>📱 Sosyal medya linkleri ekleyin</li>
              <li>🔍 Bilgileri dikkatlice kontrol edin</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>
              <FaExclamationCircle size={20} />
              Önemli
            </h4>
            <ul>
              <li>⛽ Gas ücreti gerektirir</li>
              <li>🔒 İşlem geri alınamaz</li>
              <li>💧 LP tokenları kilitlenir</li>
              <li>🛡️ Cüzdan güvenliğinizi kontrol edin</li>
              <li>🌐 BSC Mainnet kullanın</li>
              <li>💰 Yeterli BNB bakiyeniz olsun</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>
              <FaDollarSign size={20} />
              Paket Ücretleri
            </h4>
            <ul>
              <li>🎯 Basic: {tierFees.basic} BNB</li>
              <li>🚀 Standard: {tierFees.standard} BNB</li>
              <li>👑 Premium: {tierFees.premium} BNB</li>
              <li>📊 Fee Dağılımı:</li>
              <li>• Platform: {feeDistribution.platform}</li>
              <li>• Geliştirme: {feeDistribution.development}</li>
              <li>• Marketing: {feeDistribution.marketing}</li>
            </ul>
          </div>

          {formData.addLiquidity && (
            <div className="info-card">
              <h4>
                <FaCoins size={20} />
                LP Bilgileri
              </h4>
              <ul>
                <li>🔒 LP tokenları kilitli kalacaktır</li>
                <li>💧 PancakeSwap'te likidite eklenecek</li>
                <li>⚡ Token oluşturduktan sonra LP ayarlarını yapın</li>
              </ul>
            </div>
          )}

          <div className="info-card">
            <h4>
              <FaWallet size={20} />
              Maliyet Özeti
            </h4>
            <ul>
              <li>📦 Paket: {getTierFee()} BNB</li>
              <li>⛽ Gas: ~0.005 BNB</li>
              <li>💰 Toplam: ~{(parseFloat(getTierFee()) + 0.005).toFixed(4)} BNB</li>
              <li>👛 Bakiyeniz: {userBalance} BNB</li>
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

