import React, { useState, useEffect } from 'react';
import WalletConnect from './WalletConnect';
import { getCurrentAccount, getBalance, getCurrentNetwork } from '../utils/wallet';
import './WalletConnectExample.css';

const WalletConnectExample = () => {
  const [showModal, setShowModal] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState({ name: 'No Network', isBSC: false });

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection();

    // Listen for account changes
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

  const checkWalletConnection = async () => {
    const currentAccount = await getCurrentAccount();
    if (currentAccount) {
      setAccount(currentAccount);
      updateWalletInfo(currentAccount);
    }
  };

  const updateWalletInfo = async (address) => {
    const walletBalance = await getBalance(address);
    const currentNetwork = await getCurrentNetwork();
    setBalance(walletBalance);
    setNetwork(currentNetwork);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance('0');
      setNetwork({ name: 'No Network', isBSC: false });
    } else {
      setAccount(accounts[0]);
      updateWalletInfo(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const handleConnect = async (address, walletType) => {
    console.log(`Connected with ${walletType}:`, address);
    setAccount(address);
    await updateWalletInfo(address);
    setShowModal(false);
  };

  const handleDisconnect = () => {
    setAccount(null);
    setBalance('0');
    setNetwork({ name: 'No Network', isBSC: false });
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-connect-example">
      <div className="wallet-connect-container">
        <h1>🔐 Wallet Connection</h1>
        <p className="subtitle">Connect your wallet to interact with BSC Testnet</p>

        {!account ? (
          <div className="connect-section">
            <button 
              className="connect-button"
              onClick={() => setShowModal(true)}
            >
              <span className="button-icon">🔗</span>
              Connect Wallet
            </button>
            <p className="info-text">
              Connect MetaMask or Trust Wallet to get started
            </p>
          </div>
        ) : (
          <div className="wallet-info-section">
            <div className="wallet-status">
              <div className="status-indicator connected"></div>
              <span>Connected</span>
            </div>

            <div className="wallet-details-grid">
              <div className="wallet-detail-card">
                <div className="detail-label">Address</div>
                <div className="detail-value address-value">
                  {formatAddress(account)}
                  <button 
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(account);
                      alert('Address copied!');
                    }}
                    title="Copy full address"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="wallet-detail-card">
                <div className="detail-label">Balance</div>
                <div className="detail-value">
                  {parseFloat(balance).toFixed(4)} BNB
                </div>
              </div>

              <div className="wallet-detail-card">
                <div className="detail-label">Network</div>
                <div className="detail-value">
                  <span className={network.isBSC ? 'network-badge bsc' : 'network-badge other'}>
                    {network.name}
                  </span>
                </div>
              </div>

              <div className="wallet-detail-card">
                <div className="detail-label">Status</div>
                <div className="detail-value">
                  {network.isBSC ? (
                    <span className="status-text success">✓ Ready</span>
                  ) : (
                    <span className="status-text warning">⚠ Wrong Network</span>
                  )}
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="refresh-button"
                onClick={() => updateWalletInfo(account)}
              >
                🔄 Refresh
              </button>
              <button 
                className="disconnect-button"
                onClick={handleDisconnect}
              >
                🔓 Disconnect
              </button>
            </div>

            {!network.isBSC && (
              <div className="warning-box">
                <strong>⚠️ Wrong Network</strong>
                <p>Please switch to BSC Testnet in your wallet to continue.</p>
              </div>
            )}
          </div>
        )}

        <div className="network-info-box">
          <h3>📡 BSC Testnet Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Network Name:</span>
              <span className="info-value">BSC Testnet</span>
            </div>
            <div className="info-item">
              <span className="info-label">Chain ID:</span>
              <span className="info-value">97</span>
            </div>
            <div className="info-item">
              <span className="info-label">RPC URL:</span>
              <span className="info-value">https://data-seed-prebsc-1-s1.binance.org:8545/</span>
            </div>
            <div className="info-item">
              <span className="info-label">Explorer:</span>
              <a 
                href="https://testnet.bscscan.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
              >
                testnet.bscscan.com →
              </a>
            </div>
          </div>
          <a 
            href="https://testnet.binance.org/faucet-smart" 
            target="_blank" 
            rel="noopener noreferrer"
            className="faucet-button"
          >
            🚰 Get Test BNB
          </a>
        </div>
      </div>

      {showModal && (
        <WalletConnect 
          onConnect={handleConnect}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default WalletConnectExample;

