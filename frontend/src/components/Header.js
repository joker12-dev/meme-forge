import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connectWallet, getCurrentAccount } from '../utils/wallet';
import { ethers } from 'ethers';
import { FaHome, FaRocket, FaChartBar, FaBook, FaLink, FaCheckCircle, FaCopy, FaTimes, FaBars, FaFire, FaCrown, FaChevronDown, FaPenFancy } from 'react-icons/fa';

const Header = () => {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkWalletConnection();
    checkNetwork();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (account) {
      fetchBalance();
    }
  }, [account, network]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsWalletDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    if (account) {
      // Cüzdan bağlanınca backend'e profil oluşturma isteği gönder
      fetch(process.env.REACT_APP_BACKEND_URL + '/api/users/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: account })
      })
        .then(res => res.json())
        .then(data => {
          // Profil verisini localStorage veya context ile saklayabilirsin
          localStorage.setItem('userProfile', JSON.stringify(data));
          // Kullanıcı başarıyla kaydedildiyse bir feedback veya state güncellemesi yapılabilir
        })
        .catch(err => {
          console.error('Profil oluşturulamadı:', err);
        });
    }
  }, [account]);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance(null);
    } else {
      setAccount(accounts[0]);
    }
    setIsWalletDropdownOpen(false);
  };

  const handleChainChanged = (chainId) => {
    setNetwork(getNetworkName(chainId));
    window.location.reload();
  };

  const checkWalletConnection = async () => {
    try {
      const isDisconnected = localStorage.getItem('wallet_disconnected');
      if (isDisconnected === 'true') {
        return;
      }

      const currentAccount = await getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const checkNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setNetwork(getNetworkName(chainId));
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  };

  const fetchBalance = async () => {
    if (typeof window.ethereum !== 'undefined' && account) {
      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        setBalance(parseFloat(ethers.formatEther(balance)).toFixed(4));
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }
  };

  const getNetworkName = (chainId) => {
    const networks = {
      '0x1': 'ETH',
      '0xaa36a7': 'Sepolia',
      '0x89': 'Polygon',
      '0x13881': 'Mumbai',
      '0xa86a': 'AVAX',
      '0x38': 'BSC',
      '0x61': 'BSC Test',
      '0x539': 'Local'
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  const handleConnectWallet = async () => {
    if (loading) return;
    
    localStorage.removeItem('wallet_disconnected');
    
    setLoading(true);
    try {
      const walletAddress = await connectWallet('MetaMask');
      setAccount(walletAddress);
      await checkNetwork();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert(error.message || 'Failed to connect MetaMask. Please make sure MetaMask is installed and unlocked.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.setItem('wallet_disconnected', 'true');
    
    setAccount(null);
    setBalance(null);
    setNetwork('');
    setIsWalletDropdownOpen(false);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const shortenAddress = (addr) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  const isActive = (path) => location.pathname === path;

  const getNetworkColor = (networkName) => {
    const colors = {
      'ETH': '#627EEA',
      'Sepolia': '#8B5CF6',
      'Polygon': '#8247E5',
      'Mumbai': '#8B5CF6',
      'AVAX': '#E84142',
      'BSC': '#F0B90B',
      'BSC Test': '#F0B90B',
      'Local': '#10B981'
    };
    return colors[networkName] || '#8B5CF6';
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .header-container {
          background: #0A0A0A;
          border-bottom: 1px solid #1F1F1F;
          padding: 0.5rem 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          height: 60px;
        }

        .logo-sectionn {
       display: flex;
       align-items: center;
       gap: 2rem;
       flex: 1;
        }

        .logo-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .desktop-nav {
       display: none;
       align-items: center;
       gap: 0.5rem;
       margin-left: 2rem;
        }

        .nav-link {
          color: #CBD5E1;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .nav-link:hover {
          background: #1F1F1F;
          color: #F0B90B;
        }

        .nav-link-active {
          color: #F0B90B;
          background: #1F1F1F;
        }

        .nav-icon {
          font-size: 0.9rem;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .language-selector {
          display: none;
          align-items: center;
          gap: 0.5rem;
          color: #CBD5E1;
          font-size: 0.8rem;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .language-selector:hover {
          background: #1F1F1F;
        }

        .desktop-wallet {
          display: none;
          align-items: center;
          gap: 0.75rem;
        }

        .network-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
          color: #FFFFFF;
          background: #1F1F1F;
        }

        .wallet-wrapper {
          position: relative;
        }

        .wallet-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #1F1F1F;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #333;
        }

        .wallet-info:hover {
          background: #2A2A2A;
          border-color: #F0B90B;
        }

        .wallet-identicon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: bold;
          color: #1E2026;
        }

        .wallet-address {
          color: #FFFFFF;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .dropdown-arrow {
          color: #CBD5E1;
          font-size: 0.7rem;
          transition: transform 0.2s ease;
        }

        .wallet-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: #1A1A1A;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 0.75rem;
          min-width: 200px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          z-index: 1001;
          animation: fadeIn 0.2s ease;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;
          color: #CBD5E1;
          font-size: 0.8rem;
          border-bottom: 1px solid #333;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .connection-status {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
        }

        .copy-button {
          background: none;
          border: none;
          color: #CBD5E1;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          color: #F0B90B;
        }

        .copy-feedback {
          color: #10B981;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .disconnect-button {
          width: 100%;
          padding: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 0.5rem;
          transition: all 0.2s ease;
        }

        .disconnect-button:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .connect-button {
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          color: #1E2026;
          border: none;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .connect-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(240, 185, 11, 0.4);
        }

        .connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top: 2px solid #1E2026;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .mobile-menu-button {
          background: none;
          border: none;
          color: #CBD5E1;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-menu-button:hover {
          background: #1F1F1F;
        }

        .mobile-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999;
        }

        .mobile-overlay.open {
          display: block;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 300px;
          background: #0A0A0A;
          border-left: 1px solid #1F1F1F;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-y: auto;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }

        .mobile-menu.open {
          transform: translateX(0);
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1F1F1F;
          padding-bottom: 1rem;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mobile-logo-text {
          font-size: 1.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #F0B90B, #F8D33A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mobile-close {
          background: none;
          border: none;
          color: #CBD5E1;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: all 0.2s ease;
        }

        .mobile-close:hover {
          color: #F0B90B;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-nav-link {
          color: #CBD5E1;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .mobile-nav-link-active {
          color: #F0B90B;
          background: #1F1F1F;
        }

        .mobile-wallet-section {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid #1F1F1F;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-wallet-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #1F1F1F;
          border-radius: 8px;
        }

        .mobile-wallet-actions {
          display: flex;
          gap: 0.5rem;
        }

        .mobile-copy-button,
        .mobile-disconnect-button {
          flex: 1;
          padding: 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid;
          transition: all 0.2s ease;
        }

        .mobile-copy-button {
          background: rgba(240, 185, 11, 0.1);
          color: #F0B90B;
          border-color: rgba(240, 185, 11, 0.3);
        }

        .mobile-disconnect-button {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        @media (min-width: 768px) {
          .header-content {
            padding: 0 1.5rem;
          }

          .desktop-nav {
            display: flex;
            margin-left: 2rem;
          }

          .desktop-wallet {
            display: flex;
          }

          .language-selector {
            display: flex;
          }

          .mobile-menu-button {
            display: none;
          }
        }

        @media (min-width: 1024px) {
          .logo-sectionn {
            gap: 3rem;
          }

          .desktop-nav {
            gap: 0.75rem;
          }

          .nav-link {
            padding: 0.6rem 1.25rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <header className="header-container">
        <div className="header-content">
          <div className="logo-sectionn">
            <Link to="/" className="logo-link">
              <span className="logo-text">MEME FORGE</span>
            </Link>
            
            <nav className="desktop-nav">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
              >
                <FaHome className="nav-icon" />
                Home
              </Link>
              <Link 
                to="/create" 
                className={`nav-link ${isActive('/create') ? 'nav-link-active' : ''}`}
              >
                <FaRocket className="nav-icon" />
                Create Token
              </Link>
              <Link 
                to="/tokens" 
                className={`nav-link ${isActive('/tokens') ? 'nav-link-active' : ''}`}
              >
                <FaChartBar className="nav-icon" />
                Tokens
              </Link>
              <Link 
                to="/posts" 
                className={`nav-link ${isActive('/posts') ? 'nav-link-active' : ''}`}
              >
                <FaFire className="nav-icon" />
                Posts
              </Link>
              <Link 
                to="/ranked" 
                className={`nav-link ${isActive('/ranked') ? 'nav-link-active' : ''}`}
              >
                <FaCrown className="nav-icon" />
                Ranking
              </Link>
              <Link 
                to="/campaigns" 
                className={`nav-link ${isActive('/campaigns') ? 'nav-link-active' : ''}`}
              >
                <FaChartBar className="nav-icon" />
                Campaigns
              </Link>
            </nav>
          </div>

          <div className="header-right">
            <div className="language-selector">
              <span>English</span>
              <FaChevronDown size={10} />
            </div>
            
            <div className="desktop-wallet">
              {network && (
                <div 
                  className="network-badge"
                  style={{
                    borderColor: getNetworkColor(network),
                    backgroundColor: `${getNetworkColor(network)}15`
                  }}
                >
                  {network}
                </div>
              )}
              
              {account ? (
                <div className="wallet-wrapper">
                  <div 
                    className="wallet-info"
                    onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                  >
                    <div className="wallet-identicon">
                      {account.substring(2, 4).toUpperCase()}
                    </div>
                    <span className="wallet-address">
                      {shortenAddress(account)}
                    </span>
                    <span className="dropdown-arrow" style={{
                      transform: isWalletDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      <FaChevronDown size={10} />
                    </span>
                  </div>
                  
                  {isWalletDropdownOpen && (
                    <div className="wallet-dropdown">
                      <div className="dropdown-item">
                        <span>Connected</span>
                        <div className="connection-status"></div>
                      </div>
                      <div className="dropdown-item">
                        <span>Network</span>
                        <span style={{ color: getNetworkColor(network), fontWeight: '600' }}>
                          {network}
                        </span>
                      </div>
                      {balance && (
                        <div className="dropdown-item">
                          <span>Balance</span>
                          <span style={{ color: '#F0B90B', fontWeight: '600' }}>
                            {balance} BNB
                          </span>
                        </div>
                      )}
                      <div className="dropdown-item">
                        <span>Copy Address</span>
                        <button 
                          onClick={handleCopyAddress}
                          className="copy-button"
                        >
                          {copyFeedback ? <FaCheckCircle /> : <FaCopy />}
                        </button>
                      </div>
                      {copyFeedback && (
                        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                          <span className="copy-feedback">Copied!</span>
                        </div>
                      )}
                      <Link to="/my-profile" style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 400, width: '100%', display: 'block', textAlign: 'left', padding: '0.5rem 0', fontSize: '0.8rem', borderTop: '1px solid rgba(75, 75, 75, 0.3)', paddingTop: '0.5rem', marginTop: '0.5rem' }} onClick={() => setIsWalletDropdownOpen(false)}>
                        Profile
                      </Link>
                      <Link to="/my-tokens" style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 400, width: '100%', display: 'block', textAlign: 'left', padding: '0.5rem 0', fontSize: '0.8rem' }} onClick={() => setIsWalletDropdownOpen(false)}>
                         My Tokens
                      </Link>
                      <Link to="/my-posts" style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 400, width: '100%', display: 'block', textAlign: 'left', padding: '0.5rem 0', fontSize: '0.8rem' }} onClick={() => setIsWalletDropdownOpen(false)}>
                         My Posts
                      </Link>
                      <button 
                        onClick={handleDisconnect}
                        className="disconnect-button"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleConnectWallet}
                  disabled={loading}
                  className="connect-button"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FaLink />
                      Connect Wallet
                    </>
                  )}
                </button>
              )}
            </div>

            <button 
              className="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>

      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-header">
            <div className="mobile-logo">
              <span className="mobile-logo-text">MEME FORGE</span>
            </div>
            <button 
              className="mobile-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <nav className="mobile-nav">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaHome className="nav-icon" />
              Home
            </Link>
            <Link 
              to="/create" 
              className={`mobile-nav-link ${isActive('/create') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaRocket className="nav-icon" />
              Create Token
            </Link>
            <Link 
              to="/my-tokens" 
              className={`mobile-nav-link ${isActive('/my-tokens') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaCheckCircle className="nav-icon" />
              My Tokens
            </Link>
            <Link 
              to="/tokens" 
              className={`mobile-nav-link ${isActive('/tokens') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaChartBar className="nav-icon" />
              Tokens
            </Link>
            <Link 
              to="/posts" 
              className={`mobile-nav-link ${isActive('/posts') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaFire className="nav-icon" />
              Posts
            </Link>
            <Link 
              to="/ranked" 
              className={`mobile-nav-link ${isActive('/ranked') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaCrown className="nav-icon" />
              Ranking
            </Link>
            <Link 
              to="/campaigns" 
              className={`mobile-nav-link ${isActive('/campaigns') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaChartBar className="nav-icon" />
              Campaign
            </Link>
            <Link 
              to="/my-profile" 
              className={`mobile-nav-link ${isActive('/my-profile') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaCheckCircle className="nav-icon" />
              Profile
            </Link>
            <Link 
              to="/my-posts" 
              className={`mobile-nav-link ${isActive('/my-posts') ? 'mobile-nav-link-active' : ''}`}
            >
              <FaPenFancy className="nav-icon" />
              My Posts
            </Link>
          </nav>

          <div className="mobile-wallet-section">
            {network && (
              <div 
                className="network-badge"
                style={{
                  borderColor: getNetworkColor(network),
                  backgroundColor: `${getNetworkColor(network)}15`,
                  justifyContent: 'center'
                }}
              >
                {network}
              </div>
            )}
            
            {account ? (
              <div>
                <div className="mobile-wallet-info">
                  <div className="wallet-identicon">
                    {account.substring(2, 4).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      {shortenAddress(account)}
                    </div>
                    {balance && (
                      <div style={{
                        color: '#F0B90B',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {balance} BNB
                      </div>
                    )}
                  </div>
                </div>
                <div className="mobile-wallet-actions">
                  <button 
                    onClick={handleCopyAddress}
                    className="mobile-copy-button"
                  >
                    <FaCopy />
                    {copyFeedback ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={handleDisconnect}
                    className="mobile-disconnect-button"
                  >
                    <FaTimes />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleConnectWallet}
                disabled={loading}
                className="connect-button"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <FaLink />
                    Connect Wallet
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;

