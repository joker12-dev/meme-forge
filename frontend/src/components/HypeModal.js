import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './HypeModal.css';

const HypeModal = ({ isOpen, onClose, token }) => {
  const [prices, setPrices] = useState({});
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPrices();
      checkWallet();
    }
  }, [isOpen]);

  const loadPrices = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/hype/prices');
      const data = await response.json();
      if (data.success) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.error('Load prices error:', error);
    }
  };

  const checkWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    }
  };

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      alert('Cüzdan bağlanırken hata oluştu');
    }
  };

  const handleHype = async () => {
    if (!selectedTier || !account) return;

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const price = prices[selectedTier].price;
      const priceInWei = ethers.parseEther(price.toString());

      // Platform cüzdanına ödeme yap (örnek adres, gerçekte .env'den alınmalı)
      const platformWallet = '0x742d35Cc6634C0532925a3b8D4B9991a1f4D8E5F';
      
      const tx = await signer.sendTransaction({
        to: platformWallet,
        value: priceInWei
      });

      alert('Ödeme işlemi başlatıldı, onaylanması bekleniyor...');
      
      const receipt = await tx.wait();

      // Backend'e kaydet
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/hype/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': account
        },
        body: JSON.stringify({
          tokenAddress: token.address,
          tier: selectedTier,
          transactionHash: receipt.transactionHash
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('🎉 Token başarıyla hypelandı! 24 saat boyunca slider\'da görünecek.');
        onClose();
        window.location.reload();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Hype error:', error);
      alert('İşlem başarısız: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tierConfigs = {
    bronze: {
      color: '#CD7F32',
      icon: '🔥',
      name: 'BRONZE'
    },
    silver: {
      color: '#C0C0C0',
      icon: '⭐',
      name: 'SILVER'
    },
    gold: {
      color: '#FFD700',
      icon: '👑',
      name: 'GOLD'
    },
    platinum: {
      color: '#E5E4E2',
      icon: '💎',
      name: 'PLATINUM'
    }
  };

  return (
    <div className="hype-modal-overlay" onClick={onClose}>
      <div className="hype-modal" onClick={(e) => e.stopPropagation()}>
        <button className="hype-modal-close" onClick={onClose}>×</button>

        <h2 className="hype-modal-title">
          🚀 Token Hypelayin!
        </h2>

        <p className="hype-modal-subtitle">
          Tokeninizi 24 saat boyunca ana sayfada öne çıkarın
        </p>

        <div className="hype-tiers">
          {Object.entries(prices).map(([tier, data]) => {
            const config = tierConfigs[tier];
            return (
              <div
                key={tier}
                className={`hype-tier ${selectedTier === tier ? 'selected' : ''}`}
                onClick={() => setSelectedTier(tier)}
                style={{
                  '--tier-color': config.color
                }}
              >
                <div className="tier-icon">{config.icon}</div>
                <div className="tier-name">{config.name}</div>
                <div className="tier-price">{data.price} BNB</div>
                <div className="tier-duration">{data.duration} Saat</div>
                <div className="tier-features">
                  {data.features.map((feature, idx) => (
                    <div key={idx} className="feature">✓ {feature}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!account ? (
          <button className="hype-connect-btn" onClick={connectWallet}>
            💰 Cüzdan Bağla
          </button>
        ) : (
          <div className="hype-actions">
            <div className="hype-wallet">
              <span>Bağlı Cüzdan:</span>
              <code>{account.substring(0, 6)}...{account.substring(38)}</code>
            </div>
            <button
              className="hype-submit-btn"
              onClick={handleHype}
              disabled={!selectedTier || loading}
            >
              {loading ? 'İşlem Yapılıyor...' : `${selectedTier ? prices[selectedTier]?.price + ' BNB Öde ve Hypelayin' : 'Tier Seçin'}`}
            </button>
          </div>
        )}

        <div className="hype-info">
          <p>ℹ️ Hype süresi başladıktan sonra iptal edilemez</p>
          <p>📊 Tokeniniz tüm ziyaretçilere gösterilecek</p>
          <p>⏱️ 24 saat sonra otomatik olarak sona erer</p>
        </div>
      </div>
    </div>
  );
};

export default HypeModal;

