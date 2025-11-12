import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import './AddLiquidityModal.css';

const AddLiquidityModal = ({ isOpen, onClose, token }) => {
  const { account, provider } = useWallet();
  const [tokenAmount, setTokenAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Token miktarı değiştiğinde yüzdeyi hesapla
  useEffect(() => {
    if (tokenAmount && (token?.supply || token?.totalSupply)) {
      const amount = parseFloat(tokenAmount);
      const supply = parseFloat(token?.supply || token?.totalSupply);
      if (amount > 0 && supply > 0) {
        const percent = ((amount / supply) * 100).toFixed(2);
        setPercentage(percent);
      } else {
        setPercentage(0);
      }
    } else {
      setPercentage(0);
    }
  }, [tokenAmount, token]);

  const handleTokenAmountChange = (e) => {
    const value = e.target.value;
    setTokenAmount(value);
    setError('');
  };

  const handleBnbAmountChange = (e) => {
    const value = e.target.value;
    setBnbAmount(value);
    setError('');
  };

  const handleAddLiquidity = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Validasyonlar
      if (!tokenAmount || !bnbAmount) {
        setError('Lütfen token ve BNB miktarını girin');
        return;
      }

      if (!provider) {
        setError('Lütfen cüzdanınızı bağlayın');
        return;
      }

      const tokenAmt = parseFloat(tokenAmount);
      const bnbAmt = parseFloat(bnbAmount);

      if (tokenAmt <= 0 || bnbAmt <= 0) {
        setError('Miktarlar 0 dan büyük olmalıdır');
        return;
      }

      if (tokenAmt > parseFloat(token?.supply || token?.totalSupply)) {
        setError('Token miktarı toplam supply\'ı aşamaz');
        return;
      }

      console.log('💸 LP ekleme işlemi başlıyor:');
      console.log('  User: ' + account);
      console.log('  Token miktar: ' + tokenAmt);
      console.log('  BNB miktar: ' + bnbAmt);

      // STEP 1: User tokens'ı LiquidityAdder için approve etmeli
      console.log('� Step 1: Tokens LiquidityAdder\'a approve ediliyor...');
      
      const platformWalletAddress = process.env.REACT_APP_PLATFORM_WALLET || '0x4169B7B19Fb2228a5eaaE84a43e42aFDCE15741C';
      const liquidityAdderAddress = process.env.REACT_APP_LIQUIDITY_ADDER || '0xAAA098C78157b242E5f9E3F63aAD778c376E29eb';
      const signer = await provider.getSigner();
      
      // Token contract ABI
      const tokenABI = [
        'function approve(address spender, uint256 amount) public returns (bool)',
        'function allowance(address owner, address spender) public view returns (uint256)',
        'function decimals() public view returns (uint8)'
      ];
      
      const tokenContract = new ethers.Contract(token.contractAddress || token.address, tokenABI, signer);
      const decimals = await tokenContract.decimals();
      const totalSupply = parseFloat(token?.supply || token?.totalSupply);
      const totalSupplyInDecimals = ethers.parseUnits(totalSupply.toString(), decimals);
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(account, liquidityAdderAddress);
      console.log('Current allowance:', ethers.formatUnits(currentAllowance, decimals));
      
      if (currentAllowance < totalSupplyInDecimals) {
        console.log('Approving', totalSupply, 'tokens to LiquidityAdder...');
        const approveTx = await tokenContract.approve(liquidityAdderAddress, ethers.MaxUint256);
        console.log('✅ Approval tx sent:', approveTx.hash);
        const approveReceipt = await approveTx.wait();
        console.log('✅ Approval confirmed:', approveReceipt.hash);
      } else {
        console.log('✅ Tokens already approved');
      }

      // STEP 2: User BNB'yi PLATFORM WALLET'a gönderiyor (on-chain)
      console.log('📤 Step 2: User ' + bnbAmt + ' BNB gönderiliyor platform wallet\'a...');
      
      const bnbInWei = ethers.parseEther(bnbAmt.toString());
      
      const txResponse = await signer.sendTransaction({
        to: platformWalletAddress,
        value: bnbInWei
      });

      console.log('✅ BNB transfer tx gönderildi:', txResponse.hash);
      const txReceipt = await txResponse.wait();
      console.log('✅ BNB transfer tamamlandı:', txReceipt.hash);

      // STEP 3: Backend'e LP ekleme talebini gönder
      // Backend: user'ın tokenlarını gönderecek + approve edecek + LP ekleyecek
      console.log('📡 Step 3: Backend\'e talepte bulunuluyor...');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/liquidity/add-liquidity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tokenAddress: token.contractAddress || token.address,
          userRequestedTokenAmount: tokenAmt.toString(),
          bnbAmount: bnbAmt.toString(),
          userWallet: account
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'LP ekleme işlemi başarısız oldu');
        return;
      }

      console.log('✅ Backend işlemi başarılı. LP havuzu oluşturuldu!');

      setSuccess(`LP başarıyla eklendi! 🎉\n✓ ${tokenAmt.toLocaleString('tr-TR')} token size gönderildi\n✓ ${bnbAmt} BNB + ${(parseFloat(token?.supply || token?.totalSupply) - tokenAmt).toLocaleString('tr-TR')} token havuza eklendi`);
      setTokenAmount('');
      setBnbAmount('');
      setPercentage(0);

      // 4 saniye sonra modal'ı kapat ve parent'a close event gönder
      setTimeout(() => {
        onClose();
      }, 4000);

    } catch (err) {
      console.error('LP ekleme hatası:', err);
      
      // Kullanıcı dostu hata mesajları
      let errorMsg = err.message || 'Bir hata oluştu';
      if (err.message?.includes('insufficient funds')) {
        errorMsg = 'Yeterli BNB bakiyeniz yok';
      } else if (err.message?.includes('user rejected')) {
        errorMsg = 'İşlem iptal edildi';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (percent) => {
    if (token?.supply || token?.totalSupply) {
      const amount = (parseFloat(token?.supply || token?.totalSupply) * percent) / 100;
      setTokenAmount(amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 }));
      setPercentage(percent);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-liquidity-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Başlığı */}
        <div className="modal-header">
          <h2>Likidite Ekle</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          
          {/* Hata Mesajı */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Başarı Mesajı */}
          {success && (
            <div className="alert alert-success">
              <span>✓ {success}</span>
            </div>
          )}

          {/* Token Bilgisi */}
          <div className="token-info-card">
            <div className="info-item">
              <span className="label">Token Adı:</span>
              <span className="value">{token?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Toplam Supply:</span>
              <span className="value">{parseFloat(token?.supply || token?.totalSupply || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Token Miktarı Input */}
          <div className="form-group">
            <label>Platform'dan Almak İstediğiniz Token Miktarı</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={tokenAmount}
                onChange={handleTokenAmountChange}
                placeholder="0.00"
                disabled={loading}
                min="0"
                max={token?.supply || token?.totalSupply}
              />
              <span className="input-suffix">{token?.symbol}</span>
            </div>
            
            {/* Yüzdelik Oran */}
            <div className="percentage-display">
              <span className="percentage-label">Toplam Supply'dan:</span>
              <span className="percentage-value">{percentage}%</span>
            </div>

            {/* Hızlı Seçim Butonları */}
            <div className="quick-select-buttons">
              <button
                className="quick-btn"
                onClick={() => handleQuickSelect(10)}
                disabled={loading}
              >
                10%
              </button>
              <button
                className="quick-btn"
                onClick={() => handleQuickSelect(25)}
                disabled={loading}
              >
                25%
              </button>
              <button
                className="quick-btn"
                onClick={() => handleQuickSelect(50)}
                disabled={loading}
              >
                50%
              </button>
              <button
                className="quick-btn"
                onClick={() => handleQuickSelect(100)}
                disabled={loading}
              >
                Max
              </button>
            </div>

            {/* Bilgi */}
            <div className="info-box" style={{ marginTop: '12px' }}>
              <p>
                <strong>Not:</strong> Bu miktar platform wallet'tan size gönderilecek. 
                Kalan token havuzda kalacak.
              </p>
            </div>
          </div>

          {/* BNB Miktarı Input */}
          <div className="form-group">
            <label>BNB Miktarı</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={bnbAmount}
                onChange={handleBnbAmountChange}
                placeholder="0.00"
                disabled={loading}
                min="0"
                step="0.01"
              />
              <span className="input-suffix">BNB</span>
            </div>
          </div>

          {/* Özet */}
          <div className="summary-card">
            <h3>İşlem Özeti</h3>
            <div className="summary-item">
              <span>Platform Wallet'taki Token:</span>
              <span className="value">{token?.supply || token?.totalSupply ? parseFloat(token?.supply || token?.totalSupply).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '0'} {token?.symbol}</span>
            </div>
            <div className="summary-item">
              <span>+ BNB Miktar:</span>
              <span className="value">{bnbAmount || '0'} BNB</span>
            </div>
            <div className="summary-item info-row" style={{ borderTop: '2px dashed rgba(102, 126, 234, 0.3)', paddingTop: '12px', marginTop: '12px' }}>
              <span>↓ LP Havuzuna Gidecek:</span>
              <span className="value">
                {(token?.supply || token?.totalSupply) && bnbAmount ? 
                  `${parseFloat(token?.supply || token?.totalSupply).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ${token?.symbol} + ${bnbAmount} BNB` 
                  : `${token?.supply || token?.totalSupply || '0'} ${token?.symbol} + ${bnbAmount || '0'} BNB`
                }
              </span>
            </div>
            <div className="summary-item highlight-section" style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px', padding: '10px', marginTop: '12px' }}>
              <span>↓ Size Gönderilecek:</span>
              <span className="value highlight">{tokenAmount || '0'} {token?.symbol}</span>
            </div>
            <div className="summary-item highlight-section" style={{ background: 'rgba(102, 126, 234, 0.1)', borderRadius: '6px', padding: '10px', marginTop: '8px' }}>
              <span>↓ Havuzda Kalacak:</span>
              <span className="value">
                {(token?.supply || token?.totalSupply) ? (
                  parseFloat(token?.supply || token?.totalSupply) - (parseFloat(tokenAmount) || 0)
                ) : '0'} {token?.symbol}
              </span>
            </div>
          </div>

          {/* Bilgi Notu */}
          <div className="info-box">
            <p>
              <strong>İşlem Akışı:</strong><br/>
              1. Platform wallet'taki tüm token ({(token?.supply || token?.totalSupply) ? parseFloat(token?.supply || token?.totalSupply).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '0'}) + {bnbAmount || '0'} BNB → LP havuzuna gider<br/>
              2. Siz {tokenAmount || '0'} {token?.symbol} alırsınız<br/>
              3. Havuzda {(token?.supply || token?.totalSupply) ? (parseFloat(token?.supply || token?.totalSupply) - (parseFloat(tokenAmount) || 0)) : '0'} {token?.symbol} kalır
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </button>
          <button
            className="btn-primary"
            onClick={handleAddLiquidity}
            disabled={loading || !bnbAmount}
          >
            {loading ? (
              <>
                <span className="spinner"></span> İşleniyor...
              </>
            ) : (
              'Likidite Ekle'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddLiquidityModal;
