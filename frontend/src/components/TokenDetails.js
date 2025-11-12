import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import HypeModal from './HypeModal';
import AddLiquidityModal from './AddLiquidityModal';
import ErrorAlert from './ErrorAlert';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from './NotificationContainer';
import { getBackendURL } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { 
  FaGlobe, 
  FaTelegramPlane, 
  FaTwitter,
  FaCopy,
  FaExternalLinkAlt,
  FaHeart,
  FaShareAlt,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaUsers,
  FaDollarSign,
  FaExchangeAlt,
  FaSyncAlt,
  FaCheckCircle,
  FaShieldAlt,
  FaFire,
  FaRocket,
  FaPlus,
  FaHistory
} from 'react-icons/fa';
import { BiTrendingUp } from 'react-icons/bi';

// Chart.js register
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

// BSC Configuration
const BSC_RPC = "https://bsc-dataseed.binance.org/";
// Router and WBNB will be resolved at runtime based on connected network
let RUNTIME_PANCAKE_ROUTER = null;
let RUNTIME_WBNB_ADDRESS = null;

// ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// PancakeSwap Router ABI
const PANCAKE_ROUTER_ABI = [
  "function WETH() external view returns (address)",
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

// API Service
const APIService = {
  // DexScreener API
  getTokenPairs: async (tokenAddress) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.error('DexScreener pairs error:', error);
      return null;
    }
  },

  getPairData: async (pairAddress) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${pairAddress}`);
      if (!response.ok) throw new Error('Chart API error');
      return await response.json();
    } catch (error) {
      console.error('DexScreener pair error:', error);
      return null;
    }
  },

  // Backend API - Trade işlemleri için
  saveTrade: async (tradeData) => {
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });
      return await response.json();
    } catch (error) {
      console.error('Trade save error:', error);
      return null;
    }
  },

  getTokenTrades: async (tokenAddress) => {
    try {
      const backendURL = getBackendURL();
      const response = await fetch(`${backendURL}/api/trades/${tokenAddress}`);
      if (!response.ok) throw new Error('Trades API error');
      return await response.json();
    } catch (error) {
      console.error('Trades fetch error:', error);
      return [];
    }
  },

  // Token holders bilgisi
  getTokenHolders: async (tokenAddress) => {
    try {
      const backendURL = getBackendURL();
      const response = await fetch(`${backendURL}/api/tokens/${tokenAddress}/holders`);
      if (!response.ok) throw new Error('Holders API error');
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Holders fetch error:', error);
      return 0;
    }
  }
};

const TokenDetails = () => {
  const { address } = useParams();
  const { account, connect, isConnecting } = useWallet();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [realTimeData, setRealTimeData] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [trades, setTrades] = useState([]);
  const [tradePage, setTradePage] = useState(1);
  const tradeLimit = 50;
  const [totalTradeCount, setTotalTradeCount] = useState(0);
  const [swapAmount, setSwapAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState('');
  const [userTokenBalance, setUserTokenBalance] = useState('0');
  const [userBNBBalance, setUserBNBBalance] = useState('0');
  const [slippage, setSlippage] = useState(2.0);
  const [provider, setProvider] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [routerContract, setRouterContract] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [priceChange1h, setPriceChange1h] = useState(0);
  const [hypeModalOpen, setHypeModalOpen] = useState(false);
  const [addLiquidityModalOpen, setAddLiquidityModalOpen] = useState(false);
  const [priceChange7d, setPriceChange7d] = useState(0);
  const [holders, setHolders] = useState('0');
  const [hypeStatus, setHypeStatus] = useState(null); // { tier: 'gold'/'silver'/'bronze', active: true/false }
  const [tokenSecurity, setTokenSecurity] = useState({
    isHoneypot: false,
    canBuy: true,
    canSell: true,
    taxBuy: 5,
    taxSell: 7,
    holderCount: 1250,
    creatorBalance: '2.5%'
  });
  const [dexScreenerPairAddress, setDexScreenerPairAddress] = useState('');
  const [tokenImage, setTokenImage] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshIntervalRef = useRef(null);

  // Initialize provider and contracts
  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          try {
            await switchToBSCNetwork();
            
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
            
            const tokenContract = new ethers.Contract(address, ERC20_ABI, web3Provider);
            setTokenContract(tokenContract);
            
            // Resolve router address based on network
            const { getContractAddresses } = await import('../utils/contracts');
            const addresses = await getContractAddresses();
            const routerAddr = addresses.pancakeRouter;
            RUNTIME_PANCAKE_ROUTER = routerAddr;
            console.log('🔧 Using Router:', routerAddr);
            const routerContract = new ethers.Contract(routerAddr, PANCAKE_ROUTER_ABI, web3Provider);

            // Resolve WBNB from router if available
            try {
              const weth = await routerContract.WETH();
              RUNTIME_WBNB_ADDRESS = weth;
              console.log('✅ WBNB resolved from router:', weth);
            } catch (e) {
              console.warn('⚠️ Failed to get WETH from router, using fallback');
              // Fallback: determine based on chainId
              const network = await web3Provider.getNetwork();
              if (network.chainId === 97n) {
                // BSC Testnet WBNB
                RUNTIME_WBNB_ADDRESS = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
              } else {
                // BSC Mainnet WBNB
                RUNTIME_WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
              }
              console.log('📍 Using fallback WBNB:', RUNTIME_WBNB_ADDRESS);
            }
            setRouterContract(routerContract);
            
            await fetchTokenInfo(tokenContract);
          } catch (error) {
            console.error('Metamask initialization error:', error);
            // Metamask hatası bile olsa token info'yu fetch et
            await fetchTokenInfoFromBackendOnly();
            setLoading(false);
          }
        } else {
          // Metamask yok, sadece backend'den veri çek
          console.log('⚠️ Metamask not installed, fetching from backend only');
          await fetchTokenInfoFromBackendOnly();
          setLoading(false);
        }
      } catch (error) {
        console.error('Init error:', error);
        setLoading(false);
      }
    };
    
    init();

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [address]);

  // Auto-refresh data
  // Auto-connect wallet on page load for swap operations
  useEffect(() => {
    const autoConnect = async () => {
      if (!account && !isConnecting) {
        try {
          console.log('🔗 Auto-connecting wallet for swap operations...');
          await connect('metamask');
        } catch (error) {
          console.warn('⚠️ Auto-connect skipped (user will connect manually if needed)');
        }
      }
    };

    autoConnect();
  }, []);

  // Update connectedAccount when WalletContext account changes
  useEffect(() => {
    if (account) {
      setConnectedAccount(account);
    }
  }, [account]);

  // Fetch balances when connected account changes or token contract is ready
  useEffect(() => {
    if (connectedAccount && tokenContract && provider) {
      console.log('💰 Fetching balances for:', connectedAccount);
      fetchBalances(connectedAccount);
    }
  }, [connectedAccount, tokenContract, provider]);

  useEffect(() => {
    if (autoRefresh && dexScreenerPairAddress) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDexScreenerData();
        fetchTokenTrades();
      }, 5000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, dexScreenerPairAddress, tradePage]);

  // Fetch trades when page changes
  useEffect(() => {
    if (address) {
      fetchTokenTrades();
    }
  }, [tradePage]);

  // Fetch token info from blockchain
  const fetchTokenInfo = async (contract) => {
    try {
      // First, fetch from backend to get logoURL and other info
      let backendToken = null;
      try {
        const backendResponse = await fetch(`${getBackendURL()}/api/tokens/${address}`);
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          backendToken = backendData;
          console.log('✅ Backend token data:', backendToken);
        }
      } catch (err) {
        console.log('⚠️ Backend token not found, using blockchain data only');
      }
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => 'Unknown Token'),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => '0')
      ]);
      
      const formattedSupply = ethers.formatUnits(totalSupply, decimals);
      
      // Format backend totalSupply if it exists (in case it's in wei format)
      let backendFormattedSupply = formattedSupply;
      if (backendToken?.totalSupply && backendToken?.decimals) {
        try {
          // Backend'den gelen büyük sayıları formatla
          backendFormattedSupply = ethers.formatUnits(backendToken.totalSupply, backendToken.decimals);
        } catch (err) {
          // Eğer zaten formatlanmışsa (string sayı), olduğu gibi kullan
          backendFormattedSupply = backendToken.totalSupply;
        }
      }
      
      setToken({
        address,
        name: backendToken?.name || name,
        symbol: backendToken?.symbol || symbol,
        decimals,
        totalSupply: backendFormattedSupply,
        description: backendToken?.description || `${name} (${symbol}) - BSC Token`,
        website: backendToken?.website || 'https://example.com',
        telegram: backendToken?.telegram || 'https://t.me/example',
        twitter: backendToken?.twitter || 'https://twitter.com/example',
        logoURL: backendToken?.logoURL || null,
        creator: backendToken?.creator || null
      });
      
      // Set logo if available
      if (backendToken?.logoURL) {
        if (backendToken.logoURL.startsWith('http')) {
          setTokenImage(backendToken.logoURL);
          console.log('✅ Using logo from backend (Cloudinary):', backendToken.logoURL);
        } else {
          const logoUrl = `${getBackendURL()}${backendToken.logoURL}`;
          setTokenImage(logoUrl);
          console.log('✅ Using logo from backend (Local):', logoUrl);
        }
      }
      
      await Promise.all([
        fetchDexScreenerData(),
        fetchTokenTrades(),
        fetchTokenHolders(),
        fetchHypeStatus(),
        fetchCreatorInfo()
      ]);
      
    } catch (error) {
      console.error('Token info error:', error);
      setToken({
        address,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        totalSupply: '0',
        description: 'BSC Token',
        website: 'https://example.com',
        telegram: 'https://t.me/example',
        twitter: 'https://twitter.com/example'
      });
      await Promise.all([
        fetchDexScreenerData(),
        fetchTokenTrades(),
        fetchTokenHolders(),
        fetchHypeStatus()
      ]);
    }
  };

  // Metamask yoksa backend'ten token info çek
  const fetchTokenInfoFromBackendOnly = async () => {
    try {
      console.log('📡 Fetching token info from backend only...');
      const response = await fetch(`${getBackendURL()}/api/tokens/${address}`);
      
      if (!response.ok) {
        throw new Error('Token not found in backend');
      }
      
      const backendData = await response.json();
      console.log('✅ Backend token data:', backendData);
      
      setToken({
        address,
        name: backendData.name || 'Unknown Token',
        symbol: backendData.symbol || 'UNKNOWN',
        decimals: backendData.decimals || 18,
        totalSupply: backendData.totalSupply || '0',
        description: backendData.description || 'BSC Token',
        website: backendData.website || 'https://example.com',
        telegram: backendData.telegram || 'https://t.me/example',
        twitter: backendData.twitter || 'https://twitter.com/example',
        logoURL: backendData.logoURL || null
      });
      
      // Logo'yu set et
      if (backendData.logoURL) {
        if (backendData.logoURL.startsWith('http')) {
          setTokenImage(backendData.logoURL);
          console.log('✅ Logo from backend (Cloudinary):', backendData.logoURL);
        } else {
          const logoUrl = `${getBackendURL()}${backendData.logoURL}`;
          setTokenImage(logoUrl);
          console.log('✅ Logo from backend (Local):', logoUrl);
        }
      }
      
      // Opsiyonel veriler: Trades, Hype, DexScreener
      await Promise.all([
        fetchDexScreenerData().catch(e => console.warn('DexScreener error:', e)),
        fetchTokenTrades().catch(e => console.warn('Trades error:', e)),
        fetchTokenHolders().catch(e => console.warn('Holders error:', e)),
        fetchHypeStatus().catch(e => console.warn('Hype error:', e))
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Backend-only token fetch error:', error);
      // Fallback
      setToken({
        address,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        totalSupply: '0',
        description: 'BSC Token',
        website: 'https://example.com',
        telegram: 'https://t.me/example',
        twitter: 'https://twitter.com/example'
      });
      setLoading(false);
    }
  };

  // Fetch hype status
  const fetchHypeStatus = async () => {
    try {
      const response = await fetch(`${getBackendURL()}/api/hype/token/${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.active) {
          const now = new Date();
          const endDate = new Date(data.endDate);
          if (endDate > now) {
            setHypeStatus({
              tier: data.tier,
              active: true,
              endDate: data.endDate,
              title: data.title
            });
            console.log('✅ Token is hyped:', data.tier);
          } else {
            setHypeStatus({ active: false });
          }
        } else {
          setHypeStatus({ active: false });
        }
      } else {
        setHypeStatus({ active: false });
      }
    } catch (error) {
      console.error('Hype status fetch error:', error);
      setHypeStatus({ active: false });
    }
  };

  // Gerçek trade verilerini getir
  const fetchTokenTrades = async () => {
    try {
      const res = await fetch(`${getBackendURL()}/api/trades/${address}?page=${tradePage}&limit=${tradeLimit}`);
      const tradesData = await res.json();
      let tradeList = Array.isArray(tradesData.trades)
        ? tradesData.trades
        : [];
      const sortedTrades = tradeList
        .map(trade => ({
          ...trade,
          timestamp: new Date(trade.timestamp)
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setTrades(sortedTrades);
      setTotalTradeCount(tradesData.totalCount || sortedTrades.length);
    } catch (error) {
      console.error('Trade fetch error:', error);
    }
  };

  // Holders bilgisini getir
  const fetchTokenHolders = async () => {
    try {
      const holdersCount = await APIService.getTokenHolders(address);
      setHolders(holdersCount.toString());
    } catch (error) {
      console.error('Holders fetch error:', error);
      // Fallback olarak random değer
      setHolders((Math.random() * 5000 + 500).toFixed(0));
    }
  };

  // DexScreener API - Gerçek veriler
  const fetchDexScreenerData = async () => {
    try {
      console.log('🔄 DexScreener verileri çekiliyor...');
      const data = await APIService.getTokenPairs(address);
      
      if (data && data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        console.log('✅ DexScreener Pair:', pair);
        
        // Logo'yu SADECE backend'den yoksa DexScreener'dan al
        if (!tokenImage && pair.info && pair.info.imageUrl) {
          setTokenImage(pair.info.imageUrl);
          console.log('✅ Using logo from DexScreener:', pair.info.imageUrl);
        }
        
        const realTimeData = {
          price: pair.priceUsd,
          priceChange24h: pair.priceChange?.h24 || 0,
          priceChange1h: pair.priceChange?.h1 || 0,
          priceChange7d: pair.priceChange?.h24 * 7 || 0,
          liquidity: pair.liquidity?.usd || 0,
          volume24h: pair.volume?.h24 || 0,
          fdv: pair.fdv || 0,
          pairAddress: pair.pairAddress,
          dexId: pair.dexId,
          url: pair.url
        };
        
        setRealTimeData(realTimeData);
        setDexScreenerPairAddress(pair.pairAddress);
        setPriceChange1h(pair.priceChange?.h1 || 0);
        setPriceChange7d(pair.priceChange?.h24 * 7 || 0);
        
        // Generate chart data
        await generateChartDataFromDexScreener(realTimeData);
        
        setLastUpdate(new Date());
        console.log('✅ DexScreener verileri yüklendi');
      } else {
        throw new Error('No pair data found');
      }
    } catch (error) {
      console.error('❌ DexScreener error:', error);
      // Mock data fallback
      const mockData = {
        price: '0.000001',
        priceChange24h: 5.2,
        priceChange1h: 1.5,
        priceChange7d: 12.8,
        liquidity: 150000,
        volume24h: 50000,
        fdv: 1000000,
        pairAddress: '0x' + Math.random().toString(16).substr(2, 40)
      };
      
      setRealTimeData(mockData);
      setDexScreenerPairAddress(mockData.pairAddress);
      setPriceChange1h(1.5);
      setPriceChange7d(12.8);
      generateMockChartData(mockData.price);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  // DexScreener'dan chart data oluştur
  const generateChartDataFromDexScreener = async (realTimeData) => {
    try {
      if (realTimeData.pairAddress) {
        const pairData = await APIService.getPairData(realTimeData.pairAddress);
        
        if (pairData && pairData.pair && pairData.pair.priceHistory) {
          const formattedData = pairData.pair.priceHistory.map(item => ({
            timestamp: new Date(item.timestamp),
            price: parseFloat(item.price)
          }));
          
          setPriceData(formattedData);
          console.log('✅ Gerçek chart data yüklendi:', formattedData.length, 'data points');
        } else {
          generateMockChartData(realTimeData.price);
        }
      } else {
        generateMockChartData(realTimeData.price);
      }
    } catch (error) {
      console.error('Chart data error:', error);
      generateMockChartData(realTimeData.price);
    }
  };

  // Mock chart data (fallback)
  const generateMockChartData = (basePrice = '0.000001') => {
    const now = new Date();
    const pricePoints = [];
    const volumePoints = [];
    let currentPrice = parseFloat(basePrice);
    
    for (let i = 200; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000);
      const change = (Math.random() - 0.5) * 0.08;
      currentPrice = Math.max(currentPrice * (1 + change), 0.00000001);
      const volume = Math.random() * 100000 + 50000;
      
      pricePoints.push({
        timestamp,
        price: currentPrice
      });
      
      volumePoints.push({
        timestamp,
        volume: volume
      });
    }
    
    setPriceData(pricePoints);
    setVolumeData(volumePoints);
    console.log('📊 Mock chart data oluşturuldu');
  };

  // BSC Network'e geçiş
  const switchToBSCNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // BSC Testnet (97)
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x61', // BSC Testnet (97)
              chainName: 'Binance Smart Chain Testnet',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
              },
              rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
              blockExplorerUrls: ['https://testnet.bscscan.com/']
            }]
          });
        } catch (addError) {
          console.error('BSC Testnet network eklenemedi:', addError);
        }
      }
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      showError('Please install MetaMask!');
      return;
    }

    try {
      await switchToBSCNetwork();
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setConnectedAccount(accounts[0]);
      await fetchBalances(accounts[0]);
      showSuccess('Wallet connected successfully!');
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      showError('Wallet connection failed: ' + error.message);
    }
  };

  // Fetch balances
  const fetchBalances = async (account) => {
    if (!provider || !tokenContract) return;

    try {
      const [tokenBalance, bnbBalance, decimals] = await Promise.all([
        tokenContract.balanceOf(account),
        provider.getBalance(account),
        tokenContract.decimals()
      ]);

      setUserTokenBalance(parseFloat(ethers.formatUnits(tokenBalance, decimals)).toFixed(4));
      setUserBNBBalance(parseFloat(ethers.formatUnits(bnbBalance, 18)).toFixed(4));
      
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  // Get swap quote
  const getSwapQuote = async (amount, buy) => {
    if (!routerContract || !amount || parseFloat(amount) <= 0) return null;

    try {
      const amountIn = ethers.parseUnits(amount, 18);
      // Use runtime WBNB address, fallback to testnet WBNB
      const wbnb = RUNTIME_WBNB_ADDRESS || '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
      const path = buy ? [wbnb, address] : [address, wbnb];
      
      const amounts = await routerContract.getAmountsOut(amountIn, path);
      return ethers.formatUnits(amounts[1], buy ? token?.decimals : 18);
      
    } catch (error) {
      console.error('Swap quote error:', error);
      return null;
    }
  };

  // Trade'i database'e kaydet
  const saveTradeToDatabase = async (tradeData) => {
    try {
      const tradeToSave = {
        ...tradeData,
        tokenAddress: address.toLowerCase(),
        tokenSymbol: token?.symbol,
        tokenName: token?.name,
        network: 'BSC',
        chainId: 56,
        status: 'CONFIRMED',
        type: tradeData.type.toUpperCase(),
        baseCurrency: 'BNB',
        timestamp: new Date().toISOString()
      };

      const result = await APIService.saveTrade(tradeToSave);
      if (result) {
        console.log('✅ Trade database\'e kaydedildi:', result);
        // Trade listesini güncelle
        setTrades(prev => [result, ...prev.slice(0, 24)]);
      }
    } catch (error) {
      console.error('❌ Trade kaydetme hatası:', error);
    }
  };

  // Fetch creator info (holdings %)
  const fetchCreatorInfo = async () => {
    try {
      const response = await fetch(`${getBackendURL()}/api/tokens/${address}/creator-info`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Creator info fetched:', data.creator);
          setCreatorInfo(data.creator);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch creator info:', error);
    }
  };

  // Add Liquidity Function
  const addLiquidity = async (tokenAmount, bnbAmount) => {
    if (!provider || !tokenContract || !connectedAccount) {
      showWarning('Please connect your wallet first');
      return;
    }

    try {
      const signer = await provider.getSigner();
      const liquidityAdderAddress = process.env.REACT_APP_LIQUIDITY_ADDER_ADDRESS;
      const liquidityAdderABI = [
        "function addLiquidityETH(address,uint256,uint256,uint256,uint256) external payable returns (uint256)"
      ];
      
      const liquidityAdder = new ethers.Contract(liquidityAdderAddress, liquidityAdderABI, signer);
      
      // Approve tokens
      const tokenAmountWei = ethers.parseUnits(tokenAmount.toString(), token.decimals);
      const approveTx = await tokenContract.approve(liquidityAdderAddress, tokenAmountWei);
      await approveTx.wait();
      
      // Add liquidity
      const bnbAmountWei = ethers.parseEther(bnbAmount.toString());
      const slippage = Math.floor(slippage * 100); // Convert 0.5% to 50
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      const tx = await liquidityAdder.addLiquidityETH(
        token.address,
        tokenAmountWei,
        bnbAmountWei,
        slippage,
        deadline,
        { value: bnbAmountWei }
      );
      
      const receipt = await tx.wait();
      console.log('Liquidity added:', receipt);
      
      showSuccess('✅ Liquidity added successfully!');
      await fetchDexScreenerData(); // Refresh price data
      
    } catch (error) {
      console.error('Add liquidity error:', error);
      showError('❌ Failed to add liquidity: ' + error.message);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!provider || !swapAmount || parseFloat(swapAmount) <= 0) {
      showWarning('Please enter a valid amount');
      return;
    }

    if (!connectedAccount) {
      showWarning('Please connect your wallet first');
      return;
    }

    setIsSwapping(true);

    try {
      const signer = await provider.getSigner();
      
      // Re-initialize router dynamically (handles network changes)
      const { getContractAddresses } = await import('../utils/contracts');
      const addresses = await getContractAddresses();
      const routerAddr = addresses.pancakeRouter;
      const currentRouterContract = new ethers.Contract(routerAddr, PANCAKE_ROUTER_ABI, provider);
      const routerWithSigner = currentRouterContract.connect(signer);
      
      console.log('🔧 Using Router for swap:', routerAddr);
      
      const amountIn = ethers.parseUnits(swapAmount, isBuying ? 18 : token?.decimals);
      // Use runtime WBNB address, fallback to testnet WBNB
      const wbnb = RUNTIME_WBNB_ADDRESS || '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
      const tokenAddr = address.toLowerCase();
      const wbnbAddr = wbnb.toLowerCase();
      console.log('💱 Swap path:', isBuying ? `BNB(${wbnbAddr}) → Token(${tokenAddr})` : `Token(${tokenAddr}) → BNB(${wbnbAddr})`);
      const path = isBuying ? [wbnbAddr, tokenAddr] : [tokenAddr, wbnbAddr];
      
      // Check if liquidity exists by trying to get amounts
      let amounts;
      let quoteAttempts = 0;
      let lastQuoteError = null;
      
      // Retry logic for LP pair discovery (gives blockchain time to settle)
      while (quoteAttempts < 3) {
        try {
          amounts = await routerContract.getAmountsOut(amountIn, path);
          console.log('✅ LP pair found after', quoteAttempts, 'attempts');
          break;
        } catch (quoteError) {
          lastQuoteError = quoteError;
          quoteAttempts++;
          if (quoteAttempts < 3) {
            console.warn(`⚠️ LP query failed (attempt ${quoteAttempts}/3), retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!amounts) {
        console.error('❌ LP pair not found after retries:', lastQuoteError?.message);
        // Provide user-friendly guidance
        let errorMsg = '⚠️ Bu token için liquidity pool bulunamadı!\n\n';
        if (token?.liquidityAdded) {
          errorMsg += 'Liquidity eklenmişken pair bulunamadı. Bu nadir bir durumdur.\n\n';
        }
        errorMsg += 'Çözüm:\n';
        errorMsg += '1. "Add Liquidity" butonunda manuel olarak liquidity ekleyin\n';
        errorMsg += '2. Token miktarı ve BNB miktarı girin\n';
        errorMsg += '3. İşlemi onaylayın\n\n';
        errorMsg += 'Sonra swap yapabilirsiniz.';
        throw new Error(errorMsg);
      }
      const minAmountOut = amounts[1] * BigInt(10000 - slippage * 100) / BigInt(10000);
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      
      let tx;
      
      if (isBuying) {
        tx = await routerWithSigner.swapExactETHForTokens(
          minAmountOut,
          path,
          connectedAccount,
          deadline,
          { value: amountIn }
        );
      } else {
        const tokenWithSigner = tokenContract.connect(signer);
        const routerToApprove = RUNTIME_PANCAKE_ROUTER || '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
        console.log('✅ Approving router:', routerToApprove);
        const approveTx = await tokenWithSigner.approve(routerToApprove, amountIn);
        await approveTx.wait();
        
        tx = await routerWithSigner.swapExactTokensForETH(
          amountIn,
          minAmountOut,
          path,
          connectedAccount,
          deadline
        );
      }
      
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      if (receipt.status === 1) {
        showSuccess(`✅ Swap successful! ${isBuying ? 'Bought' : 'Sold'} ${swapAmount} ${isBuying ? token?.symbol : 'BNB'}`);
        
        await fetchBalances(connectedAccount);
        
        // Trade'i database'e kaydet
        const newTrade = {
          type: isBuying ? 'BUY' : 'SELL',
          amount: swapAmount,
          value: (parseFloat(swapAmount) * parseFloat(realTimeData?.price || 0)).toFixed(2),
          price: realTimeData?.price || '0',
          user: connectedAccount,
          txHash: receipt.hash,
          timestamp: new Date().toISOString()
        };
        
        await saveTradeToDatabase(newTrade);
        setSwapAmount('');
        
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error) {
      console.error('Swap error:', error);
      
      // Daha açıklayıcı hata mesajları
      let errorMessage = error.message;
      if (errorMessage.includes('liquidity pool') || errorMessage.includes('require(false)') || errorMessage.includes('INSUFFICIENT_LIQUIDITY')) {
        errorMessage = '⚠️ Liquidity pool bulunamadı!\n\n' + 
          'Bu token için henüz liquidity pool oluşturulmamış olabilir.\n\n' +
          'Çözüm:\n' +
          '1. Token sahibi mi kontrol edin\n' +
          '2. "Add Liquidity" butonuna tıklayın\n' +
          '3. Token ve BNB miktarı girin\n' +
          '4. Liquidity ekleyin\n\n' +
          'Sonra swap yapabilirsiniz.';
      } else if (errorMessage.includes('insufficient allowance')) {
        errorMessage = '⚠️ Yeterli allowance yok. Lütfen approve yapın.';
      } else if (errorMessage.includes('insufficient')) {
        errorMessage = '⚠️ Yeterli bakiye yok. Lütfen miktarı kontrol edin.';
      }
      
      showError(`❌ Swap hatası: ${errorMessage}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const shareToken = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showSuccess('Token link copied to clipboard!');
  };

  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDexScreenerData(),
      fetchTokenTrades(),
      fetchTokenHolders()
    ]);
    setLoading(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      // Auto refresh'i aç
      refreshIntervalRef.current = setInterval(() => {
        fetchDexScreenerData();
        fetchTokenTrades();
      }, 30000);
    } else {
      // Auto refresh'i kapat
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }
  };

  // Chart data and options
  const chartData = {
    datasets: [
      {
        label: 'Price',
        data: priceData,
        borderColor: realTimeData?.priceChange24h >= 0 ? '#00FFA3' : '#FF4D4D',
        backgroundColor: realTimeData?.priceChange24h >= 0 ? 'rgba(240, 185, 11, 0.1)' : 'rgba(255, 77, 77, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3
      }
    ]
  };

  const volumeChartData = {
    datasets: [
      {
        label: 'Volume',
        data: volumeData,
        backgroundColor: 'rgba(240, 185, 11, 0.3)',
        borderColor: 'rgba(240, 185, 11, 0.5)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe === '1H' ? 'minute' : 
                timeframe === '6H' ? 'hour' : 'hour'
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#A0AEC0'
        }
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#A0AEC0',
          callback: (value) => {
            if (value < 0.0001) return `$${value.toFixed(8)}`;
            if (value < 0.01) return `$${value.toFixed(6)}`;
            return `$${value.toFixed(4)}`;
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value < 0.0001) return `Price: $${value.toFixed(8)}`;
            if (value < 0.01) return `Price: $${value.toFixed(6)}`;
            return `Price: $${value.toFixed(4)}`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // DexScreener iframe URL oluştur
  const getDexScreenerIframeUrl = () => {
    if (!dexScreenerPairAddress) return '';
    return `https://dexscreener.com/bsc/${dexScreenerPairAddress}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15`;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading Token Details...</p>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.container,
      ...(hypeStatus?.active && hypeStatus.tier === 'gold' && styles.containerGold),
      ...(hypeStatus?.active && hypeStatus.tier === 'silver' && styles.containerSilver),
      ...(hypeStatus?.active && hypeStatus.tier === 'bronze' && styles.containerBronze),
      ...(hypeStatus?.active && hypeStatus.tier === 'platinum' && styles.containerPlatinum)
    }}>
      {/* Header */}
      <div style={{
        ...styles.header,
        ...(hypeStatus?.active && hypeStatus.tier === 'gold' && styles.headerGold),
        ...(hypeStatus?.active && hypeStatus.tier === 'silver' && styles.headerSilver),
        ...(hypeStatus?.active && hypeStatus.tier === 'bronze' && styles.headerBronze),
        ...(hypeStatus?.active && hypeStatus.tier === 'platinum' && styles.headerPlatinum)
      }}>
        <div style={styles.tokenInfo}>
          <div style={styles.tokenIdentity}>
            {tokenImage ? (
              <img 
                src={tokenImage} 
                alt={token?.name}
                style={styles.tokenLogoImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              style={{
                ...styles.tokenLogo,
                display: tokenImage ? 'none' : 'flex'
              }}
            >
              {token?.symbol?.charAt(0) || 'T'}
            </div>
            <div style={styles.tokenDetails}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={styles.tokenName}>{token?.name || 'Loading...'}</h1>
                {hypeStatus?.active && (
                  <span style={{
                    ...styles.hypedBadge,
                    ...(hypeStatus.tier === 'gold' && styles.hypedBadgeGold),
                    ...(hypeStatus.tier === 'silver' && styles.hypedBadgeSilver),
                    ...(hypeStatus.tier === 'bronze' && styles.hypedBadgeBronze),
                    ...(hypeStatus.tier === 'platinum' && styles.hypedBadgePlatinum)
                  }}>
                    <FaFire style={{marginRight: '0.5rem'}} /> HYPED
                  </span>
                )}
              </div>
              <div style={styles.tokenMeta}>
                <span style={styles.tokenSymbol}>{token?.symbol || '...'}</span>
                <div style={styles.tokenBadges}>
                  <span style={styles.verifiedBadge}><FaCheckCircle style={{marginRight: '4px', verticalAlign: 'middle'}} /> Verified</span>
                  <span style={styles.networkBadge}>BSC</span>
                </div>
              </div>
              <div style={styles.contractInfo}>
                <span style={styles.contract}>
                  {address.substring(0, 8)}...{address.substring(address.length - 6)}
                </span>
                <button 
                  style={styles.iconButton}
                  onClick={() => navigator.clipboard.writeText(address)}
                  title="Copy address"
                >
                  <FaCopy size={14} />
                </button>
                <a 
                  href={`https://bscscan.com/token/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.iconButton}
                  title="View on BSCScan"
                >
                  <FaExternalLinkAlt size={14} />
                </a>
                {realTimeData?.url && (
                  <a 
                    href={realTimeData.url}
                    target="_blank"
                  rel="noopener noreferrer"
                  style={styles.iconButton}
                  title="View on DexScreener"
                >
                  <FaChartLine size={14} />
                </a>
              )}
            </div>              {/* Social Media Links */}
              {(token?.website || token?.telegram || token?.twitter) && (
              <div style={styles.socialLinks}>
                {token?.website && (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialButton}
                  title="Website"
                >
                  <FaGlobe size={16} />
                </a>
                )}
                {token?.telegram && (
                <a
                  href={token.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialButton}
                  title="Telegram"
                >
                  <FaTelegramPlane size={16} />
                </a>
                )}
                {token?.twitter && (
                <a
                  href={token.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialButton}
                  title="Twitter"
                >
                  <FaTwitter size={16} />
                </a>
                )}
              </div>
              )}
            </div>
          </div>
          
          <div style={styles.headerActions}>
            {!hypeStatus?.active && (
              <button 
                style={styles.hypeBtn} 
                onClick={() => setHypeModalOpen(true)}
                title="Hypelayin!"
              >
                <FaRocket style={{marginRight: '0.5rem'}} /> HYPE
              </button>
            )}
            {connectedAccount && token?.creator && 
              connectedAccount.toLowerCase() === token.creator.toLowerCase() && (
              <button 
                style={{...styles.hypeBtn, backgroundColor: '#9945FF'}} 
                onClick={() => setAddLiquidityModalOpen(true)}
                title="Add Liquidity"
              >
                <FaPlus style={{marginRight: '0.5rem'}} /> Add Liquidity
              </button>
            )}
            <button style={styles.favoriteBtn} onClick={toggleFavorite}>
              <FaHeart size={20} fill={isFavorite ? '#FF4D4D' : 'none'} />
            </button>
            <button style={styles.shareBtn} onClick={shareToken}>
              <FaShareAlt size={20} />
            </button>
          </div>
        </div>

        <div style={styles.priceSection}>
          <div style={styles.priceMain}>
            <div style={styles.price}>
              ${realTimeData?.price ? parseFloat(realTimeData.price).toFixed(8) : '0.00000000'}
            </div>
            <div style={{
              ...styles.priceChange,
              color: realTimeData?.priceChange24h >= 0 ? '#00FFA3' : '#FF4D4D'
            }}>
              {realTimeData?.priceChange24h >= 0 ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
              {Math.abs(realTimeData?.priceChange24h || 0).toFixed(2)}%
            </div>
          </div>
          
          {connectedAccount ? (
            <div style={styles.walletInfo}>
              <span style={styles.walletAddress}>
                {connectedAccount.substring(0, 6)}...{connectedAccount.substring(connectedAccount.length - 4)}
              </span>
              <span style={styles.balance}>
                {userTokenBalance} {token?.symbol}
              </span>
              <span style={styles.balance}>
                {userBNBBalance} BNB
              </span>
            </div>
          ) : (
            <div style={{...styles.walletInfo, color: '#888'}}>
              <span>🔄 Connecting wallet...</span>
            </div>
          )}
        </div>
      </div>

        {/* Price Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaDollarSign size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Market Cap</div>
            <div style={styles.statValue}>
              ${realTimeData?.fdv ? (realTimeData.fdv / 1000000).toFixed(2) + 'M' : 'N/A'}
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <BiTrendingUp size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Liquidity</div>
            <div style={styles.statValue}>
              ${realTimeData?.liquidity ? (realTimeData.liquidity / 1000).toFixed(1) + 'K' : 'N/A'}
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaChartLine size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Total Trades</div>
            <div style={styles.statValue}>
              {trades.length || 0}
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaChartLine size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>24h Volume</div>
            <div style={styles.statValue}>
              ${realTimeData?.volume24h ? (realTimeData.volume24h / 1000).toFixed(1) + 'K' : 'N/A'}
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaUsers size={20} />
          </div>
          <div>
            <div style={styles.statLabel}>Holders</div>
            <div style={styles.statValue}>{holders}</div>
          </div>
        </div>
      </div>      {/* Refresh Controls */}
      <div style={styles.refreshControls}>
        <div style={styles.refreshInfo}>
          {lastUpdate && (
            <span style={styles.lastUpdate}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div style={styles.refreshButtons}>
          <button 
            style={{
              ...styles.refreshButton,
              ...(autoRefresh ? styles.refreshButtonActive : {})
            }}
            onClick={toggleAutoRefresh}
            title={autoRefresh ? 'Auto refresh enabled' : 'Auto refresh disabled'}
          >
            <FaSyncAlt size={14} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button 
            style={styles.refreshButton}
            onClick={refreshAllData}
            title="Refresh all data"
          >
            <FaSyncAlt size={14} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Main Content - Tek Sayfa Düzeni */}
      <div style={styles.content}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Chart Section */}
          <div style={styles.chartSection}>
            {/* DexScreener Chart Iframe */}
            {dexScreenerPairAddress && (
              <div style={styles.dexScreenerContainer}>
                <iframe
                  src={getDexScreenerIframeUrl()}
                  style={styles.dexScreenerIframe}
                  title="DexScreener Chart"
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                />
              </div>
            )}
            
            {/* Fallback Custom Chart */}
            {!dexScreenerPairAddress && (
              <>
                <div style={styles.chartWrapper}>
                  {priceData.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div style={styles.chartLoading}>
                      <div style={styles.spinner}></div>
                      <p>Loading chart data...</p>
                    </div>
                  )}
                </div>
                
                {/* Volume Chart */}
                <div style={styles.volumeChart}>
                  <Bar data={volumeChartData} options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: { ...chartOptions.scales.y, beginAtZero: true }
                    }
                  }} />
                </div>
              </>
            )}
          </div>

          {/* Creator Info Card */}
          {creatorInfo && (
            <div style={styles.statsCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h3 style={styles.cardTitle}>👤 Creator Information</h3>
                <Link 
                  to={`/profile/${creatorInfo.address}`}
                  style={{
                    background: '#F0B90B',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#FFD700'}
                  onMouseLeave={(e) => e.target.style.background = '#F0B90B'}
                >
                  View Profile →
                </Link>
              </div>
              <div style={styles.statsGridSmall}>
                <div style={styles.statItem}>
                  <span style={{fontSize: '1.1rem', color: '#F0B90B'}}>Wallet:</span>
                  <span style={{color: '#CBD5E1', fontFamily: 'monospace', fontSize: '0.85rem'}}>
                    {creatorInfo.address.substring(0, 6)}...{creatorInfo.address.substring(creatorInfo.address.length - 4)}
                  </span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(creatorInfo.address)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#F0B90B',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    title="Copy address"
                  >
                    📋
                  </button>
                </div>
                <div style={styles.statItem}>
                  <span style={{fontSize: '1.1rem', color: '#F0B90B'}}>Holdings:</span>
                  <span style={{color: '#00FFA3', fontWeight: 'bold'}}>
                    {creatorInfo.percentage === 'N/A' ? 'N/A' : creatorInfo.percentage.toFixed(2)}%
                  </span>
                  <span style={{color: '#94A3B8', fontSize: '0.9rem'}}>
                    ({creatorInfo.balance !== 'N/A' ? parseFloat(creatorInfo.balance).toFixed(2) : 'N/A'} {token?.symbol})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trades Section - Chart'ın hemen altında */}
          <div style={styles.tradesSection}>
            <div style={styles.tradesHeader}>
              <h3 style={styles.sectionTitle}>Live Trading Activity</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'12px',alignItems:'center',marginTop:'12px'}}>
                <span style={styles.tradesCount}>{trades.length} trades in {totalTradeCount}</span>
                {totalTradeCount > tradeLimit && (
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <button 
                      onClick={()=>setTradePage(p=>Math.max(1,p-1))} 
                      disabled={tradePage===1}
                      style={{
                        background:tradePage===1?'#333':'#F0B90B',
                        color:tradePage===1?'#666':'#1a1a1a',
                        border:'none',
                        borderRadius:'6px',
                        padding:'8px 12px',
                        cursor:tradePage===1?'not-allowed':'pointer',
                        opacity:tradePage===1?0.5:1,
                        fontWeight:'bold',
                        transition:'all 0.2s'
                      }}
                    >← Previous</button>
                    <span style={{color:'#F0B90B',fontWeight:'bold',minWidth:'60px',textAlign:'center'}}>
                      {tradePage} / {Math.max(1,Math.ceil(totalTradeCount/tradeLimit))}
                    </span>
                    <button 
                      onClick={()=>setTradePage(p=>p+1)} 
                      disabled={tradePage>=Math.ceil(totalTradeCount/tradeLimit)}
                      style={{
                        background:tradePage>=Math.ceil(totalTradeCount/tradeLimit)?'#333':'#F0B90B',
                        color:tradePage>=Math.ceil(totalTradeCount/tradeLimit)?'#666':'#1a1a1a',
                        border:'none',
                        borderRadius:'6px',
                        padding:'8px 12px',
                        cursor:tradePage>=Math.ceil(totalTradeCount/tradeLimit)?'not-allowed':'pointer',
                        opacity:tradePage>=Math.ceil(totalTradeCount/tradeLimit)?0.5:1,
                        fontWeight:'bold',
                        transition:'all 0.2s'
                      }}
                    >Next →</button>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.tradesList}>
              {trades.length > 0 ? (
                trades.map((trade, index) => {
                  const t = trade.dataValues || trade;
                  return (
                    <div key={index} style={{
                      ...styles.tradeItem,
                      background: 'rgba(20,20,30,0.6)',
                      border: '1px solid rgba(240, 185, 11, 0.2)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#F0B90B';
                      e.currentTarget.style.background = 'rgba(20,20,30,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(240, 185, 11, 0.2)';
                      e.currentTarget.style.background = 'rgba(20,20,30,0.6)';
                    }}>
                      {/* Trade Type Badge */}
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: t.type === 'BUY' ? 'rgba(0, 255, 163, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                        color: t.type === 'BUY' ? '#00FFA3' : '#FF4D4D',
                        fontWeight: 'bold',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        {t.type === 'BUY' ? <><FaArrowUp style={{marginRight: '0.5rem', color: '#10B981'}} /> BUY</> : <><FaArrowDown style={{marginRight: '0.5rem', color: '#EF4444'}} /> SELL</>}
                      </div>
                      
                      {/* Trader Info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: '180px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #F0B90B, #FFD700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#1a1a1a',
                          flexShrink: 0
                        }}>
                          {t.user ? t.user.substring(2, 3).toUpperCase() : '?'}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{
                            color: '#CBD5E1',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace'
                          }}>
                            {t.user ? `${t.user.substring(0, 6)}...${t.user.substring(t.user.length - 4)}` : 'Unknown Trader'}
                          </div>
                          <div style={{
                            color: '#94A3B8',
                            fontSize: '0.75rem'
                          }}>
                            Trader
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount & Value */}
                      <div style={{flex: 1, textAlign: 'center'}}>
                        <div style={{
                          color: '#00FFA3',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}>
                          {t.amount ? Number(t.amount).toFixed(2) : '0'} {token?.symbol}
                        </div>
                        <div style={{
                          color: '#F0B90B',
                          fontSize: '0.85rem',
                          marginTop: '4px'
                        }}>
                          {t.value ? `${Number(t.value).toFixed(4)} BNB` : '-'}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div style={{
                        textAlign: 'right',
                        minWidth: '100px'
                      }}>
                        <div style={{
                          color: '#CBD5E1',
                          fontSize: '0.85rem'
                        }}>
                          Price
                        </div>
                        <div style={{
                          color: '#00FFA3',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {t.price && !isNaN(Number(t.price)) ? `$${Number(t.price).toFixed(8)}` : '-'}
                        </div>
                      </div>
                      
                      {/* Time & Link */}
                      <div style={{
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          color: '#94A3B8',
                          fontSize: '0.8rem',
                          minWidth: '80px'
                        }}>
                          {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '-'}
                        </div>
                        {t.txHash && (
                          <a 
                            href={`https://bscscan.com/tx/${t.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#F0B90B',
                              textDecoration: 'none',
                              fontSize: '1.2rem',
                              transition: 'all 0.2s'
                            }}
                            title="View on BscScan"
                            onMouseEnter={(e) => e.target.style.color = '#FFD700'}
                            onMouseLeave={(e) => e.target.style.color = '#F0B90B'}
                          >
                            <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  color: '#94A3B8'
                }}>
                  <div style={{fontSize: '3rem', marginBottom: '12px'}}><FaHistory /></div>
                  <h4 style={{fontSize: '1.1rem', marginBottom: '8px', color: '#CBD5E1'}}>No Trades Yet</h4>
                  <p style={{fontSize: '0.9rem'}}>
                    Be the first to trade this token! Connect your wallet and make a swap.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section - REMOVED */}
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Swap Card */}
          <div style={styles.swapCard}>
            <div style={styles.swapHeader}>
              <FaExchangeAlt size={20} />
              <h3>Swap</h3>
            </div>

            {/* Trade Type Toggle */}
            <div style={styles.tradeTypeToggle}>
              <button
                style={{
                  ...styles.toggleButton,
                  ...(isBuying ? styles.toggleActive : {})
                }}
                onClick={() => setIsBuying(true)}
              >
                Buy
              </button>
              <button
                style={{
                  ...styles.toggleButton,
                  ...(!isBuying ? styles.toggleActive : {})
                }}
                onClick={() => setIsBuying(false)}
              >
                Sell
              </button>
            </div>

            {/* Swap Form */}
            <div style={styles.swapForm}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  {isBuying ? 'Pay with BNB' : `Sell ${token?.symbol}`}
                </label>
                <div style={styles.inputContainer}>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    style={styles.input}
                  />
                  <div style={styles.tokenSelector}>
                    <span style={styles.tokenBadge}>
                      {isBuying ? (
                        <>
                          <div style={styles.bnbLogo}>⎈</div>
                          BNB
                        </>
                      ) : (
                        <>
                          {tokenImage ? (
                            <img 
                              src={tokenImage} 
                              alt={token?.symbol}
                              style={styles.tokenLogoImageSmall}
                            />
                          ) : (
                            <div style={styles.tokenLogoSmall}>
                              {token?.symbol?.charAt(0)}
                            </div>
                          )}
                          {token?.symbol}
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div style={styles.balanceInfo}>
                  Balance: {isBuying ? userBNBBalance : userTokenBalance} {isBuying ? 'BNB' : token?.symbol}
                </div>
              </div>

              {/* Slippage Settings */}
              <div style={styles.slippageContainer}>
                <label style={styles.slippageLabel}>Slippage Tolerance</label>
                <div style={styles.slippageOptions}>
                  {[0.5, 1.0, 2.0].map(value => (
                    <button
                      key={value}
                      style={{
                        ...styles.slippageOption,
                        ...(slippage === value ? styles.slippageActive : {})
                      }}
                      onClick={() => setSlippage(value)}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionButtons}>
                <button
                  style={{
                    ...styles.swapButton,
                    ...(isBuying ? styles.buyButton : styles.sellButton),
                    ...(isSwapping || !swapAmount ? styles.buttonDisabled : {})
                  }}
                  onClick={executeSwap}
                  disabled={isSwapping || !swapAmount || parseFloat(swapAmount) <= 0}
                >
                  {isSwapping ? (
                    <>
                      <div style={styles.spinnerSmall}></div>
                      Swapping...
                    </>
                  ) : (
                    `${isBuying ? 'Buy' : 'Sell'} ${token?.symbol}`
                  )}
                </button>
              </div>

              {/* Swap Info */}
              <div style={styles.swapInfo}>
                <div style={styles.swapRow}>
                  <span>Price</span>
                  <span>${realTimeData?.price ? parseFloat(realTimeData.price).toFixed(8) : '0.00000000'}</span>
                </div>
                <div style={styles.swapRow}>
                  <span>Network</span>
                  <span>BSC Mainnet</span>
                </div>
                <div style={styles.swapRow}>
                  <span>Slippage</span>
                  <span>{slippage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Stats */}
          <div style={styles.statsCard}>
            <h3 style={styles.cardTitle}>Market Stats</h3>
            <div style={styles.statsGridSmall}>
              <div style={styles.statItem}>
                <FaDollarSign size={16} />
                <span>Market Cap</span>
                <span>${realTimeData?.fdv ? (realTimeData.fdv / 1000000).toFixed(2) + 'M' : 'N/A'}</span>
              </div>
              <div style={styles.statItem}>
                <BiTrendingUp size={16} />
                <span>Liquidity</span>
                <span>${realTimeData?.liquidity ? (realTimeData.liquidity / 1000).toFixed(1) + 'K' : 'N/A'}</span>
              </div>
              <div style={styles.statItem}>
                <FaChartLine size={16} />
                <span>24h Volume</span>
                <span>${realTimeData?.volume24h ? (realTimeData.volume24h / 1000).toFixed(1) + 'K' : 'N/A'}</span>
              </div>
              <div style={styles.statItem}>
                <FaUsers size={16} />
                <span>Holders</span>
                <span>{holders}</span>
              </div>
            </div>
          </div>

          {/* Price Performance */}
          <div style={styles.performanceCard}>
            <h3 style={styles.cardTitle}>Price Performance</h3>
            <div style={styles.performanceGrid}>
              <div style={styles.performanceItem}>
                <span>1h</span>
                <span style={{color: priceChange1h >= 0 ? '#00FFA3' : '#FF4D4D'}}>
                  {priceChange1h >= 0 ? '+' : ''}{priceChange1h.toFixed(2)}%
                </span>
              </div>
              <div style={styles.performanceItem}>
                <span>24h</span>
                <span style={{color: realTimeData?.priceChange24h >= 0 ? '#00FFA3' : '#FF4D4D'}}>
                  {realTimeData?.priceChange24h >= 0 ? '+' : ''}{realTimeData?.priceChange24h?.toFixed(2)}%
                </span>
              </div>
              <div style={styles.performanceItem}>
                <span>7d</span>
                <span style={{color: priceChange7d >= 0 ? '#00FFA3' : '#FF4D4D'}}>
                  {priceChange7d >= 0 ? '+' : ''}{priceChange7d.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hype Modal */}
      <HypeModal 
        isOpen={hypeModalOpen}
        onClose={() => setHypeModalOpen(false)}
        token={token}
      />

      {/* Add Liquidity Modal */}
      <AddLiquidityModal
        isOpen={addLiquidityModalOpen}
        onClose={async () => {
          setAddLiquidityModalOpen(false);
          // Refresh everything after adding liquidity
          console.log('🔄 LP eklenmiş, data refresh ediliyor...');
          
          // LP işlemi blockchain'de kaydedilmesi için biraz bekle
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (connectedAccount && tokenContract && provider) {
            // Refetch token info to ensure pool exists
            await fetchTokenInfo(tokenContract);
            // Refresh balances
            await fetchBalances(connectedAccount);
            // Reset swap amount to trigger new quote
            setSwapAmount('');
            console.log('✅ Data refresh tamamlandı');
          }
        }}
        token={token}
      />
    </div>
  );
};

// Styles - BSC Renk Teması
// Responsive breakpoints
const isMobile = window.innerWidth <= 768;
const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: isMobile ? '1rem 0.75rem' : '2rem 1rem',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    minHeight: '100vh',
    color: '#FFFFFF',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    borderRadius: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(240, 185, 11, 0.3)',
    borderTop: '3px solid #F0B90B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #FFFFFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  header: {
    marginBottom: '2rem',
    padding: '1.5rem',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  // Hype theme styles - Daha belirgin
  containerGold: {
    background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(26, 26, 26, 1) 50%)',
    border: '3px solid rgba(255, 215, 0, 0.5)',
    boxShadow: '0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 60px rgba(255, 215, 0, 0.1)',
  },
  containerSilver: {
    background: 'linear-gradient(180deg, rgba(192, 192, 192, 0.15) 0%, rgba(26, 26, 26, 1) 50%)',
    border: '3px solid rgba(192, 192, 192, 0.5)',
    boxShadow: '0 0 40px rgba(192, 192, 192, 0.3), inset 0 0 60px rgba(192, 192, 192, 0.1)',
  },
  containerBronze: {
    background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.15) 0%, rgba(26, 26, 26, 1) 50%)',
    border: '3px solid rgba(205, 127, 50, 0.5)',
    boxShadow: '0 0 40px rgba(205, 127, 50, 0.3), inset 0 0 60px rgba(205, 127, 50, 0.1)',
  },
  containerPlatinum: {
    background: 'linear-gradient(180deg, rgba(229, 228, 226, 0.15) 0%, rgba(26, 26, 26, 1) 50%)',
    border: '3px solid rgba(229, 228, 226, 0.6)',
    boxShadow: '0 0 50px rgba(229, 228, 226, 0.4), inset 0 0 70px rgba(229, 228, 226, 0.15)',
  },
  headerGold: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.15) 100%)',
    border: '2px solid rgba(255, 215, 0, 0.5)',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4), inset 0 2px 10px rgba(255, 215, 0, 0.2)',
  },
  headerSilver: {
    background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.2) 0%, rgba(169, 169, 169, 0.15) 100%)',
    border: '2px solid rgba(192, 192, 192, 0.5)',
    boxShadow: '0 8px 32px rgba(192, 192, 192, 0.4), inset 0 2px 10px rgba(192, 192, 192, 0.2)',
  },
  headerBronze: {
    background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.2) 0%, rgba(184, 115, 51, 0.15) 100%)',
    border: '2px solid rgba(205, 127, 50, 0.5)',
    boxShadow: '0 8px 32px rgba(205, 127, 50, 0.4), inset 0 2px 10px rgba(205, 127, 50, 0.2)',
  },
  headerPlatinum: {
    background: 'linear-gradient(135deg, rgba(229, 228, 226, 0.25) 0%, rgba(180, 180, 180, 0.2) 100%)',
    border: '2px solid rgba(229, 228, 226, 0.6)',
    boxShadow: '0 8px 32px rgba(229, 228, 226, 0.5), inset 0 2px 10px rgba(229, 228, 226, 0.25)',
  },
  hypedBadge: {
    padding: '8px 16px',
    borderRadius: '25px',
    fontSize: '13px',
    fontWeight: '800',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    animation: 'pulse 2s ease-in-out infinite',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  hypedBadgeGold: {
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4)',
    border: '2px solid rgba(255, 215, 0, 0.8)',
  },
  hypedBadgeSilver: {
    background: 'linear-gradient(135deg, #E8E8E8, #A9A9A9)',
    color: '#000',
    boxShadow: '0 4px 20px rgba(192, 192, 192, 0.6), 0 0 30px rgba(192, 192, 192, 0.4)',
    border: '2px solid rgba(192, 192, 192, 0.8)',
  },
  hypedBadgeBronze: {
    background: 'linear-gradient(135deg, #CD7F32, #B87333)',
    color: '#FFF',
    boxShadow: '0 4px 20px rgba(205, 127, 50, 0.6), 0 0 30px rgba(205, 127, 50, 0.4)',
    border: '2px solid rgba(205, 127, 50, 0.8)',
  },
  hypedBadgePlatinum: {
    background: 'linear-gradient(135deg, #E5E4E2, #B4B4B4)',
    color: '#000',
    boxShadow: '0 4px 20px rgba(229, 228, 226, 0.7), 0 0 30px rgba(229, 228, 226, 0.5)',
    border: '2px solid rgba(229, 228, 226, 0.9)',
  },
  tokenInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  tokenIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.75rem' : '1rem',
    flex: 1,
  },
  tokenLogo: {
    width: isMobile ? '48px' : '64px',
    height: isMobile ? '48px' : '64px',
    borderRadius: isMobile ? '12px' : '16px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '1.2rem' : '1.5rem',
    fontWeight: 'bold',
    color: '#1E2026',
  },
  tokenLogoImage: {
    width: isMobile ? '48px' : '64px',
    height: isMobile ? '48px' : '64px',
    borderRadius: isMobile ? '12px' : '16px',
    objectFit: 'cover',
  },
  tokenLogoImageSmall: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    objectFit: 'cover',
  },
  tokenLogoSmall: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#1E2026',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: isMobile ? '1.5rem' : (isTablet ? '1.75rem' : '2rem'),
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    wordBreak: 'break-word',
  },
  tokenMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  tokenSymbol: {
    fontSize: isMobile ? '1rem' : '1.2rem',
    color: '#CBD5E1',
    fontWeight: '600',
  },
  tokenBadges: {
    display: 'flex',
    gap: '0.5rem',
  },
  verifiedBadge: {
    background: 'rgba(0, 255, 163, 0.2)',
    color: '#00FFA3',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  networkBadge: {
    background: 'rgba(240, 185, 11, 0.2)',
    color: '#F0B90B',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  contractInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#94A3B8',
    fontSize: '0.9rem',
  },
  contract: {
    fontSize: '0.9rem',
  },
  socialLinks: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  socialButton: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    color: '#CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  'socialButton:hover': {
    background: 'rgba(240, 185, 11, 0.2)',
    borderColor: '#F0B90B',
    color: '#F0B90B',
    transform: 'scale(1.1)',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#F0B90B',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  favoriteBtn: {
    background: 'none',
    border: 'none',
    color: '#FF4D4D',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
  },
  shareBtn: {
       background: 'rgba(240, 185, 11, 0.2)',
    border: 'none',
    color: '#F0B90B',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
  },
  priceSection: {
   
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '20px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  priceMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: '800',
  },
  priceChange: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
  connectButton: {
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    border: 'none',
    color: '#1E2026',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
  },
  walletInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
  },
  walletAddress: {
    color: '#CBD5E1',
    fontSize: '0.9rem',
  },
  balance: {
    color: '#F0B90B',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : (isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))'),
    gap: isMobile ? '0.75rem' : '1rem',
    marginBottom: '1rem',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: isMobile ? '16px' : '20px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.75rem' : '1rem',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  statIcon: {
    width: isMobile ? '40px' : '48px',
    height: isMobile ? '40px' : '48px',
    borderRadius: isMobile ? '10px' : '12px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1E2026',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  refreshInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  lastUpdate: {
    fontSize: '0.9rem',
    color: '#94A3B8',
  },
  refreshButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  refreshButton: {
    background: 'rgba(240, 185, 11, 0.1)',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    color: '#F0B90B',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  },
  refreshButtonActive: {
    background: 'rgba(240, 185, 11, 0.3)',
    borderColor: '#F0B90B',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr' : '2fr 1fr'),
    gap: isMobile ? '1.5rem' : '2rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '1.5rem' : '2rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  lockCard: {
    background: 'rgba(255, 255, 255, 0.05)', 
    padding: '1.5rem',
    borderRadius: '20px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  lockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    color: '#F0B90B',
  },
  lockForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  inputLabel: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    fontWeight: '600',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    borderRadius: '12px',
    padding: '0.75rem',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '1.2rem',
    outline: 'none',
  },
  tokenSelector: {
    display: 'flex',
    alignItems: 'center',
  },
  tokenBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(240, 185, 11, 0.2)',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  bnbLogo: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#1E2026',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  locksList: {
    marginTop: '2rem',
  },
  locksTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#CBD5E1',
  },
  lockItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    marginBottom: '0.5rem',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  lockAmount: {
    color: '#F0B90B',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  },
  lockDuration: {
    color: '#94A3B8',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  noLocks: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#94A3B8',
  },
  noLocksText: {
    fontSize: '0.9rem',
    color: '#CBD5E1',
  },
  
  chartSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0',
    borderRadius: isMobile ? '20px' : '24px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
    overflow: 'hidden',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '1rem' : '1.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: isMobile ? '1.1rem' : '1.25rem',
    fontWeight: '700',
    margin: 0,
    color: '#FFFFFF',
  },
  chartControls: {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.5rem' : '1rem',
    flexWrap: 'wrap',
  },
  timeFilters: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  timeFilter: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#CBD5E1',
    padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: isMobile ? '0.85rem' : '0.9rem',
  },
  timeFilterActive: {
    background: 'rgba(240, 185, 11, 0.3)',
    color: '#F0B90B',
  },
  // DexScreener Iframe Styles
  dexScreenerContainer: {
    position: 'relative',
    height: isMobile ? '350px' : (isTablet ? '450px' : '500px'),
    marginBottom: '1rem',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(240, 185, 11, 0.3)',
  },
  dexScreenerIframe: {
    width: '100%',
    height: '107%',
    border: 'none',
    background: 'transparent',
  },
  iframeOverlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    background: 'rgba(15, 23, 42, 0.9)',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(240, 185, 11, 0.2)',
    zIndex: 10,
  },
  iframeLabel: {
    fontSize: '0.9rem',
    color: '#CBD5E1',
    fontWeight: '600',
  },
  iframeLink: {
    color: '#F0B90B',
    fontSize: '0.8rem',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    background: 'rgba(240, 185, 11, 0.2)',
    transition: 'all 0.2s',
  },
  chartWrapper: {
    height: '300px',
    marginBottom: '1rem',
  },
  volumeChart: {
    height: '80px',
  },
  chartLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#94A3B8',
  },
  chartFooter: {
    marginTop: '1rem',
    textAlign: 'center',
  },
  dataSource: {
    fontSize: '0.8rem',
    color: '#94A3B8',
  },
  tradesSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: isMobile ? '20px' : '24px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  tradesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '1rem' : '1.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tradesCount: {
    background: 'rgba(240, 185, 11, 0.2)',
    color: '#F0B90B',
    padding: '0.5rem 1rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  tradesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '0.5rem' : '0.75rem',
    maxHeight: isMobile ? '400px' : '500px',
    overflowY: 'auto',
  },
  tradeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.75rem' : '1rem',
    padding: isMobile ? '0.75rem' : '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: isMobile ? '10px' : '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  },
  tradeType: {
    minWidth: isMobile ? '60px' : '80px',
    padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '0.7rem' : '0.8rem',
    fontWeight: '600',
  },
  tradeDetails: {
    flex: 1,
  },
  tradeMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  tradeAmount: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: '0.95rem',
  },
  tradeValue: {
    color: '#F0B90B',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  tradeMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.75rem',
    color: '#94A3B8',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tradePrice: {
    color: '#CBD5E1',
    fontWeight: '500',
  },
  tradeUser: {
    fontFamily: 'monospace',
  },
  tradeTime: {
    color: '#64748B',
  },
  txLink: {
    color: '#F0B90B',
    textDecoration: 'none',
    fontSize: '0.8rem',
  },
  noTrades: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#94A3B8',
  },
  noTradesIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  noTradesTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#CBD5E1',
  },
  noTradesText: {
    fontSize: '0.9rem',
    lineHeight: '1.5',
    margin: 0,
  },
  analyticsSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: isMobile ? '20px' : '24px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  analyticsCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  analyticsCardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 1rem 0',
    color: '#F0B90B',
  },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  securityItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  securityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0',
  },
  securityIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  swapCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: isMobile ? '1rem' : '1.5rem',
    borderRadius: isMobile ? '20px' : '24px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  swapHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: isMobile ? '1rem' : '1.5rem',
  },
  tradeTypeToggle: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '1.5rem',
  },
  toggleButton: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#CBD5E1',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: 'rgba(240, 185, 11, 0.3)',
    color: '#F0B90B',
  },
  swapForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  inputLabel: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    fontWeight: '600',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    borderRadius: '12px',
    padding: '0.75rem',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '1.2rem',
    outline: 'none',
  },
  tokenSelector: {
    display: 'flex',
    alignItems: 'center',
  },
  tokenBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(240, 185, 11, 0.2)',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  bnbLogo: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #F0B90B, #F8D33A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#1E2026',
  },
  balanceInfo: {
    fontSize: '0.8rem',
    color: '#94A3B8',
    textAlign: 'right',
  },
  slippageContainer: {
    marginBottom: '0.5rem',
  },
  slippageLabel: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    marginBottom: '0.5rem',
    display: 'block'
  },
  slippageOptions: {
    display: 'flex',
    gap: '0.5rem',
  },
  slippageOption: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(240, 185, 11, 0.3)',
    color: '#CBD5E1',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  slippageActive: {
    background: 'rgba(240, 185, 11, 0.3)',
    color: '#F0B90B',
    borderColor: '#F0B90B',
  },
  swapButton: {
    padding: isMobile ? '0.85rem' : '1rem',
    border: 'none',
    borderRadius: '12px',
    fontSize: isMobile ? '0.95rem' : '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  buyButton: {
    background: 'linear-gradient(135deg, #00FFA3, #00D18C)',
    color: '#1E2026',
  },
  sellButton: {
    background: 'linear-gradient(135deg, #FF4D4D, #E60000)',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  swapInfo: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1rem',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  swapRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: '#94A3B8',
  },
  statsCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '24px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: '0 0 1rem 0',
    color: '#FFFFFF',
  },
  statsGridSmall: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
  },
  performanceCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '24px',
    border: '1px solid rgba(240, 185, 11, 0.2)',
  },
  performanceGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  performanceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
  },
  hypeBtn: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
    marginRight: '10px',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(255, 215, 0, 0.5)',
    }
  },
};

// CSS Animations için global styles
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
`;

// İlk render'da style'ı ekle
if (typeof window !== 'undefined' && document.styleSheets.length > 0) {
  const styleSheet = document.styleSheets[0];
  try {
    styleSheet.insertRule(globalStyles, styleSheet.cssRules.length);
  } catch (e) {
    // Style zaten eklenmişse hata vermesini önle
  }
}

export default TokenDetails;

