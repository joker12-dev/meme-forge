import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getBackendURL } from '../utils/api';
import '../styles/MyWallet.css';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

const MyWallet = () => {
  const { account: walletAccount } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value'); // value, name, balance
  const [provider, setProvider] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!walletAccount) {
      navigate('/');
      return;
    }
    setWalletAddress(walletAccount);
    
    // Setup provider and fetch tokens
    const initAndFetch = async () => {
      try {
        if (window.ethereum) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          
          // Fetch tokens with provider ready
          await fetchAllTokens(walletAccount, web3Provider);
        } else {
          console.warn('No Ethereum provider found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Setup error:', error);
        setLoading(false);
      }
    };
    
    initAndFetch();
  }, [navigate, walletAccount]);

  const fetchAllTokens = async (address, web3Provider) => {
    try {
      setLoading(true);
      console.log('🔄 Fetching all tokens for address:', address);
      
      // Fetch all tokens from backend
      const response = await fetch(`${getBackendURL()}/api/tokens?limit=1000`);
      const data = await response.json();
      
      console.log('📦 Backend response:', data);
      
      // Backend returns data.data, not data.tokens
      const tokensList = data.data || data.tokens || [];
      console.log('📦 Total tokens from backend:', tokensList.length);
      
      if (data.success && Array.isArray(tokensList)) {
        // Process tokens sequentially to avoid overload
        const enrichedTokens = [];
        
        for (const token of tokensList) {
          let userBalance = '0';
          let balanceNum = 0;
          
          try {
            if (web3Provider && token.address) {
              // Validate address format
              if (!ethers.isAddress(token.address)) {
                console.warn(`Invalid token address: ${token.address}`);
                continue;
              }
              
              const contract = new ethers.Contract(token.address, ERC20_ABI, web3Provider);
              
              // Get balance and decimals
              const [balance, decimals] = await Promise.all([
                contract.balanceOf(address),
                contract.decimals()
              ]);
              
              userBalance = ethers.formatUnits(balance, decimals);
              balanceNum = parseFloat(userBalance);
              
              if (balanceNum > 0) {
                console.log(`✅ ${token.symbol}: ${balanceNum} (${userBalance})`);
              }
            }
          } catch (error) {
            console.warn(`⚠️ Balance check failed for ${token.symbol}:`, error.message);
            // Continue with zero balance
          }
          
          enrichedTokens.push({
            ...token,
            balance: balanceNum,
            balanceFormatted: userBalance
          });
        }
        
        // Filter out zero-balance tokens for display
        const nonZeroTokens = enrichedTokens.filter(t => t.balance > 0);
        console.log(`✅ Found ${nonZeroTokens.length} tokens with balance > 0`);
        setTokens(nonZeroTokens);
      } else {
        console.error('Invalid response format:', data);
        setTokens([]);
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = (tokenAddress) => {
    navigate(`/token/${tokenAddress}`);
  };

  const getTokenLogo = (token) => {
    // Use logoURL from database if available
    if (token.logoURL) {
      return token.logoURL;
    }
    return null; // Will show badge instead
  };

  const handleLogoError = (e, tokenName) => {
    try {
      e.target.style.display = 'none';
      
      // Create and show text badge
      const badge = document.createElement('div');
      badge.className = 'logo-badge';
      badge.textContent = (tokenName || '?')[0].toUpperCase();
      e.target.parentNode.insertBefore(badge, e.target);
    } catch (err) {
      console.error('Logo error handler failed:', err);
    }
  };

  const calculateTotalValue = () => {
    return tokens.reduce((sum, token) => {
      // Use price from token data, fallback to 0
      const price = parseFloat(token.price || 0);
      return sum + (parseFloat(token.balance) * price);
    }, 0);
  };

  const calculateTotalBalance = () => {
    return tokens.reduce((sum, token) => sum + parseFloat(token.balance || 0), 0);
  };

  // Filter and sort tokens
  const getFilteredAndSortedTokens = () => {
    let filtered = tokens.filter(t => 
      t.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const priceA = parseFloat(a.price || 0);
      const priceB = parseFloat(b.price || 0);
      const valueA = parseFloat(a.balance) * priceA;
      const valueB = parseFloat(b.balance) * priceB;

      switch(sortBy) {
        case 'value':
          return valueB - valueA;
        case 'balance':
          return parseFloat(b.balance) - parseFloat(a.balance);
        case 'name':
          return a.symbol.localeCompare(b.symbol);
        default:
          return valueB - valueA;
      }
    });

    return filtered;
  };

  const filteredTokens = getFilteredAndSortedTokens();
  const totalValue = calculateTotalValue();
  const totalBalance = calculateTotalBalance();

  const formatNumber = (num) => {
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  return (
    <div className="my-wallet-container">
      {/* Header */}
      <div className="my-wallet-header">
        <div className="header-content">
          <h1>💼 My Wallet</h1>
          <p>Manage your token portfolio and track holdings</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading wallet...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <p>You don't have any tokens yet</p>
          <button 
            className="cta-button"
            onClick={() => navigate('/tokens')}
          >
            Explore Tokens
          </button>
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}
          <div className="portfolio-summary">
            <div className="summary-card primary">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-label">Portfolio Value</div>
                <div className="summary-value">{totalValue.toFixed(4)} BNB</div>
                <div className="summary-subtext">${(totalValue * 1000).toFixed(2)} (est)</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">🪙</div>
              <div className="summary-content">
                <div className="summary-label">Total Holdings</div>
                <div className="summary-value">{tokens.length}</div>
                <div className="summary-subtext">Unique tokens</div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <div className="summary-label">Total Balance</div>
                <div className="summary-value">{formatNumber(totalBalance)}</div>
                <div className="summary-subtext">Combined tokens</div>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="controls-section">
            <div className="search-box">
              <input 
                type="text"
                placeholder="🔍 Search tokens by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="sort-controls">
              <label>Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="value">Portfolio Value</option>
                <option value="balance">Balance</option>
                <option value="name">Token Name</option>
              </select>
            </div>
          </div>

          {/* Tokens Grid */}
          <div className="tokens-grid">
            {filteredTokens.length === 0 ? (
              <div className="no-results">
                <p>No tokens match your search</p>
              </div>
            ) : (
              filteredTokens.map((token, index) => {
                const priceA = parseFloat(token.price || 0);
                const value = parseFloat(token.balance) * priceA;

                return (
                  <div 
                    key={index}
                    className="token-card"
                    onClick={() => handleTokenClick(token.address)}
                  >
                    {/* Card Background Gradient */}
                    <div className="card-glow"></div>

                    {/* Token Logo */}
                    <div className="token-header">
                      {getTokenLogo(token) ? (
                        <img 
                          src={getTokenLogo(token)} 
                          alt={token.symbol}
                          className="token-logo"
                          onError={(e) => handleLogoError(e, token.name)}
                        />
                      ) : (
                        <div className="logo-badge">{(token.name || '?')[0].toUpperCase()}</div>
                      )}
                      <div className="token-info">
                        <div className="token-symbol">{token.symbol}</div>
                        <div className="token-name">{token.name?.substring(0, 25)}</div>
                      </div>
                    </div>

                    {/* Token Stats */}
                    <div className="token-stats">
                      <div className="stat">
                        <span className="stat-label">Balance</span>
                        <span className="stat-value">{formatNumber(token.balance)}</span>
                      </div>

                      <div className="stat">
                        <span className="stat-label">Price</span>
                        <span className="stat-value">${parseFloat(priceA).toFixed(8)}</span>
                      </div>

                      <div className="stat">
                        <span className="stat-label">Value</span>
                        <span className="stat-value accent">{value.toFixed(4)} BNB</span>
                      </div>
                    </div>

                    {/* Percentage of Portfolio */}
                    <div className="portfolio-percentage">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(value / totalValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="percentage-text">
                        {((value / totalValue) * 100).toFixed(1)}% of portfolio
                      </span>
                    </div>

                    {/* Action Button */}
                    <button className="token-action-btn">View Details →</button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyWallet;
