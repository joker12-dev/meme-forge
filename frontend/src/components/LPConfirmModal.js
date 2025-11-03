import React, { useState } from 'react';
import { FaBolt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const LPConfirmModal = ({ open, onClose, onConfirm, tokenAddress, lpTxLoading, lpTxMessage }) => {
  const [lpFormData, setLpFormData] = useState({
    bnbAmount: '',
    tokenAmount: '',
    lpLockTime: '30'
  });
  const [lpError, setLpError] = useState('');

  if (!open) return null;

  const handleLPInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bnbAmount' || name === 'tokenAmount') {
      if (value && parseFloat(value) < 0) return;
    }
    setLpFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLpError('');
  };

  const handleLPConfirm = () => {
    setLpError('');
    
    if (!lpFormData.bnbAmount || !lpFormData.tokenAmount) {
      setLpError('❌ BNB ve Token miktarlarını girin');
      return;
    }

    const bnb = parseFloat(lpFormData.bnbAmount);
    const tokens = parseFloat(lpFormData.tokenAmount);

    if (bnb <= 0 || tokens <= 0) {
      setLpError('❌ Miktarlar 0\'dan büyük olmalıdır');
      return;
    }

    // onConfirm callback'e verileri gönder
    onConfirm({
      bnbAmount: lpFormData.bnbAmount,
      tokenAmount: lpFormData.tokenAmount,
      lpLockTime: lpFormData.lpLockTime
    });
  };

  return (
    <div className="lp-modal-overlay">
      <div className="lp-modal">
        <h2><FaBolt /> Liquidity Pool Ekleme</h2>
        <p>Token başarıyla oluşturuldu! Şimdi likidite ekleyin.</p>
        
        <div className="lp-token-address">
          <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Token Adresi:</div>
          <div style={{
            background: 'rgba(30, 32, 38, 0.8)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            wordBreak: 'break-all',
            color: '#F0B90B',
            marginTop: '0.25rem'
          }}>
            {tokenAddress}
          </div>
        </div>

        <div className="lp-form-group">
          <label>BNB Miktarı *</label>
          <input
            type="number"
            name="bnbAmount"
            value={lpFormData.bnbAmount}
            onChange={handleLPInputChange}
            placeholder="0.1"
            step="0.001"
            min="0.001"
            disabled={lpTxLoading}
          />
        </div>

        <div className="lp-form-group">
          <label>Token Miktarı *</label>
          <input
            type="number"
            name="tokenAmount"
            value={lpFormData.tokenAmount}
            onChange={handleLPInputChange}
            placeholder="100000"
            min="1"
            disabled={lpTxLoading}
          />
        </div>

        <div className="lp-form-group">
          <label>LP Kilit Süresi (Gün)</label>
          <input
            type="number"
            name="lpLockTime"
            value={lpFormData.lpLockTime}
            onChange={handleLPInputChange}
            min="1"
            max="365"
            disabled={lpTxLoading}
          />
        </div>

        {lpError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            padding: '0.75rem',
            borderRadius: '8px',
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            <FaExclamationCircle /> {lpError}
          </div>
        )}

        {lpTxMessage && (
          <div style={{
            background: lpTxMessage.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(240, 185, 11, 0.1)',
            color: lpTxMessage.includes('✅') ? '#10B981' : '#F0B90B',
            padding: '0.75rem',
            borderRadius: '8px',
            marginTop: '1rem',
            fontSize: '0.85rem'
          }}>
            {lpTxMessage}
          </div>
        )}

        <div className="lp-modal-actions">
          <button 
            className="lp-confirm-btn" 
            onClick={handleLPConfirm}
            disabled={lpTxLoading}
            style={{ opacity: lpTxLoading ? 0.5 : 1, cursor: lpTxLoading ? 'not-allowed' : 'pointer' }}
          >
            <FaCheckCircle /> {lpTxLoading ? 'İşleniyor...' : 'Devam Et ve Onayla'}
          </button>
          <button 
            className="lp-cancel-btn" 
            onClick={onClose}
            disabled={lpTxLoading}
            style={{ opacity: lpTxLoading ? 0.5 : 1, cursor: lpTxLoading ? 'not-allowed' : 'pointer' }}
          >
            Vazgeç
          </button>
        </div>
      </div>
      <style>{`
        .lp-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }
        .lp-modal {
          background: linear-gradient(135deg, #1E2026 0%, #232830 100%);
          color: #fff;
          padding: 2rem;
          border-radius: 16px;
          min-width: 100%;
          max-width: 450px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          border: 1px solid rgba(240, 185, 11, 0.2);
          max-height: 90vh;
          overflow-y: auto;
        }
        .lp-modal h2 {
          margin-bottom: 0.5rem;
          color: #F0B90B;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .lp-modal > p {
          color: #CBD5E1;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }
        .lp-token-address {
          background: rgba(30, 32, 38, 0.5);
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid rgba(240, 185, 11, 0.1);
          margin-bottom: 1.5rem;
        }
        .lp-form-group {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
        }
        .lp-form-group label {
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .lp-form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid rgba(240, 185, 11, 0.3);
          border-radius: 8px;
          font-size: 1rem;
          background-color: rgba(30, 32, 38, 0.8);
          color: #FFFFFF;
          transition: all 0.3s ease;
          outline: none;
          font-family: inherit;
        }
        .lp-form-group input:focus {
          border-color: #F0B90B;
          box-shadow: 0 0 0 3px rgba(240, 185, 11, 0.1);
        }
        .lp-form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .lp-modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .lp-confirm-btn {
          flex: 1;
          background: linear-gradient(135deg, #10B981, #34D399);
          color: #fff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .lp-confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .lp-confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .lp-cancel-btn {
          flex: 1;
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .lp-cancel-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }
        .lp-cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default LPConfirmModal;

