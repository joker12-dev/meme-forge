import React, { useState, useEffect } from 'react';
import './AdminHypeModal.css';

const AdminHypeModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tokenAddress: '',
    tier: 'bronze',
    duration: 24,
    price: 0
  });
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  // Token address değiştiğinde token bilgilerini yükle
  useEffect(() => {
    if (formData.tokenAddress && formData.tokenAddress.length === 42) {
      loadTokenInfo(formData.tokenAddress);
    } else {
      setTokenInfo(null);
    }
  }, [formData.tokenAddress]);

  const tierPrices = {
    bronze: 0.1,
    silver: 0.25,
    gold: 0.5,
    platinum: 1.0
  };

  const tierInfo = {
    bronze: {
      icon: '🥉',
      name: 'Bronze',
      features: ['24 saat görünürlük', 'Standart kart'],
      gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
    },
    silver: {
      icon: '🥈',
      name: 'Silver',
      features: ['24 saat görünürlük', 'Gümüş efektler'],
      gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)'
    },
    gold: {
      icon: '🥇',
      name: 'Gold',
      features: ['24 saat görünürlük', 'Ateş efekti', 'Parlayan border'],
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
    },
    platinum: {
      icon: '💎',
      name: 'Platinum',
      features: ['24 saat görünürlük', 'Ateş + Parçacık efekti', 'Premium animasyon'],
      gradient: 'linear-gradient(135deg, #E5E4E2 0%, #00CED1 100%)'
    }
  };

  const loadTokenInfo = async (address) => {
    try {
      const response = await fetch(`${getBackendURL()}/api/tokens/${address}`);
      const data = await response.json();
      if (data.success) {
        setTokenInfo(data.token);
      } else {
        setTokenInfo(null);
      }
    } catch (error) {
      console.error('Load token info error:', error);
      setTokenInfo(null);
    }
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      price: tierPrices[prev.tier]
    }));
  }, [formData.tier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tokenAddress) {
      alert('Lütfen token adresi girin');
      return;
    }
    if (formData.tokenAddress.length !== 42 || !formData.tokenAddress.startsWith('0x')) {
      alert('Geçersiz token adresi formatı');
      return;
    }

    setLoading(true);
    await onSave(formData);
    setLoading(false);
    setFormData({
      tokenAddress: '',
      tier: 'bronze',
      duration: 24,
      price: 0
    });
    setTokenInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-hype-modal-overlay" onClick={onClose}>
      <div className="admin-hype-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-hype-modal-header">
          <h2>🚀 Yeni Token Hype Oluştur</h2>
          <button className="admin-hype-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-hype-form">
          {/* Token Address Input */}
          <div className="admin-hype-form-group">
            <label>Token Contract Adresi *</label>
            <input
              type="text"
              value={formData.tokenAddress}
              onChange={(e) => setFormData({...formData, tokenAddress: e.target.value.trim()})}
              placeholder="0x..."
              required
              className="admin-hype-address-input"
            />
            <small>Token'ın contract adresini girin</small>
          </div>

          {/* Token Info Preview */}
          {tokenInfo && (
            <div className="admin-hype-token-preview">
              {tokenInfo.logoURL && (
                <img src={tokenInfo.logoURL} alt={tokenInfo.name} className="admin-hype-token-logo" />
              )}
              <div className="admin-hype-token-info">
                <h3>{tokenInfo.name}</h3>
                <p>{tokenInfo.symbol}</p>
              </div>
            </div>
          )}

          {/* Tier Selection */}
          <div className="admin-hype-form-group">
            <label>Hype Tier *</label>
            <div className="admin-hype-tier-grid">
              {Object.entries(tierInfo).map(([key, info]) => (
                <div
                  key={key}
                  className={`admin-hype-tier-card ${formData.tier === key ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, tier: key, price: tierPrices[key]})}
                >
                  <div className="admin-hype-tier-icon" style={{ background: info.gradient }}>
                    {info.icon}
                  </div>
                  <h4>{info.name}</h4>
                  <div className="admin-hype-tier-price">{tierPrices[key]} BNB</div>
                  <ul className="admin-hype-tier-features">
                    {info.features.map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Duration Input */}
          <div className="admin-hype-form-group">
            <label>Süre (Saat) *</label>
            <div className="admin-hype-duration-input">
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                min="1"
                max="168"
                required
              />
              <span className="admin-hype-duration-label">saat</span>
            </div>
            <small>Maximum 168 saat (7 gün)</small>
          </div>

          {/* Info Box */}
          <div className="admin-hype-info-box">
            <span className="admin-hype-info-icon">ℹ️</span>
            <p>Admin olarak oluşturduğunuz hype'lar <strong>ücretsizdir</strong> ve ödeme gerektirmez.</p>
          </div>

          {/* Actions */}
          <div className="admin-hype-modal-actions">
            <button type="button" className="admin-hype-btn-cancel" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="admin-hype-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="admin-hype-spinner"></span>
                  Oluşturuluyor...
                </>
              ) : (
                <>🚀 Hype Oluştur</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminHypeModal;

