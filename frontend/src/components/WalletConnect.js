import React, { useState } from 'react';
import { connectToWallet, isWalletInstalled, WALLET_METADATA } from '../utils/walletProviders';
import './WalletConnect.css';

const WalletConnect = ({ onConnect, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
      color: '#F6851B'
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      description: 'Connect using Trust Wallet',
      icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
      color: '#3375BB'
    },
    {
      id: 'binance',
      name: 'Binance Wallet',
      description: 'Connect using Binance Chain Wallet',
      icon: 'https://bin.bnbstatic.com/static/images/common/favicon.ico',
      color: '#F0B90B'
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      description: 'Connect using OKX Wallet',
      icon: 'https://static.okx.com/cdn/assets/imgs/221/58A8C28DF6F6C7EB.png',
      color: '#000000'
    },
    {
      id: 'safepal',
      name: 'SafePal',
      description: 'Connect using SafePal Wallet',
      icon: 'https://www.safepal.com/favicon.ico',
      color: '#6366F1'
    },
    {
      id: 'tokenpocket',
      name: 'TokenPocket',
      description: 'Connect using TokenPocket',
      icon: 'https://www.tokenpocket.pro/favicon.ico',
      color: '#2980FE'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan with WalletConnect to connect',
      icon: 'https://walletconnect.com/walletconnect-logo.svg',
      color: '#3B99FC'
    }
  ];

  const connectWalletHandler = async (walletId) => {
    console.log(`\n👆 User clicked: ${walletId}\n`);
    
    setIsConnecting(true);
    setError('');

    try {
      // Clear previous connection if switching wallets
      const previousWalletType = localStorage.getItem('walletType');
      if (previousWalletType && previousWalletType !== walletId) {
        console.log(`🔄 Switching from ${previousWalletType} to ${walletId}`);
        localStorage.removeItem('walletType');
        localStorage.removeItem('walletAddress');
      }

      // Check if wallet is installed
      if (walletId !== 'walletconnect' && !isWalletInstalled(walletId)) {
        const metadata = WALLET_METADATA[walletId];
        const errorMsg = `${metadata?.name || walletId} yüklü değil!`;
        
        setError(`${errorMsg} Yüklemek için yönlendiriliyorsunuz...`);
        
        // Wait 1 second then open download link
        setTimeout(() => {
          if (metadata?.downloadUrl) {
            console.log(`🌐 Opening: ${metadata.downloadUrl}`);
            window.open(metadata.downloadUrl, '_blank');
          }
          setIsConnecting(false);
        }, 1000);
        
        return;
      }

      // Connect using window.ethereum (works for all wallets)
      const result = await connectToWallet(walletId);

      // Store wallet info
      localStorage.setItem('walletType', walletId);
      localStorage.setItem('walletAddress', result.address);

      // Call parent callback
      if (onConnect) {
        await onConnect(result.address, walletId, result.provider);
      }

      setIsConnecting(false);
      console.log(`\n🎉 Connected successfully!\n`);
      
    } catch (err) {
      console.log(`\n❌ Error: ${err.message}\n`);
      setError(err.message || 'Cüzdan bağlantısı başarısız');
      setIsConnecting(false);
    }
  };

  return (
    <div className="wallet-connect-overlay" onClick={onClose}>
      <div className="wallet-connect-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2>Connect a Wallet</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="wallet-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="wallet-section">
          <div className="section-label">Recommended</div>
          <div className="wallet-grid">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`wallet-item ${isConnecting ? 'disabled' : ''}`}
                onClick={() => !isConnecting && connectWalletHandler(wallet.id)}
              >
                <div className="wallet-item-content">
                  <img 
                    src={wallet.icon} 
                    alt={wallet.name}
                    className="wallet-logo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="wallet-fallback-icon" style={{ display: 'none', backgroundColor: wallet.color }}>
                    {wallet.name.charAt(0)}
                  </div>
                  <span className="wallet-name">{wallet.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isConnecting && (
          <div className="connecting-loader">
            <div className="spinner"></div>
            <p>Initializing connection...</p>
          </div>
        )}

        <div className="wallet-modal-footer">
          <div className="footer-info">
            <h4>What is a Wallet?</h4>
            <div className="info-row">
              <div className="info-icon">💼</div>
              <div className="info-content">
                <strong>A Home for your Digital Assets</strong>
                <p>Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTs.</p>
              </div>
            </div>
            <div className="info-row">
              <div className="info-icon">🔐</div>
              <div className="info-content">
                <strong>A New Way to Log In</strong>
                <p>Instead of creating new accounts and passwords on every website, just connect your wallet.</p>
              </div>
            </div>
          </div>
          <div className="footer-actions">
            <button className="get-wallet-button">
              Get a Wallet
            </button>
            <a 
              href="https://testnet.binance.org/faucet-smart" 
              target="_blank" 
              rel="noopener noreferrer"
              className="learn-more-link"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;

