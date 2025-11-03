import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaCloudUploadAlt, FaCopy, FaCheck } from 'react-icons/fa';
import './TokenModal.css';

const getAPIBaseURL = () => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  const currentHost = window.location.hostname;
  return `http://${currentHost}:3001`;
};

const API_BASE_URL = getAPIBaseURL();

const TokenModal = ({ show, onClose, onSave, editingToken }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    address: '',
    totalSupply: '',
    decimals: '18',
    logoURL: '',
    description: '',
    website: '',
    telegram: '',
    twitter: '',
    tier: 'basic',
    isActive: true,
    newAddress: '' // YENİ EKLENEN
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    if (editingToken) {
      setFormData({
        name: editingToken.name || '',
        symbol: editingToken.symbol || '',
        address: editingToken.address || '',
        totalSupply: editingToken.totalSupply || editingToken.initialSupply || '',
        decimals: editingToken.decimals || '18',
        logoURL: editingToken.logoURL || '',
        description: editingToken.description || '',
        website: editingToken.website || '',
        telegram: editingToken.telegram || '',
        twitter: editingToken.twitter || '',
        tier: editingToken.tier || 'basic',
        isActive: editingToken.isActive !== false,
        newAddress: '' // YENİ ADRES BOŞ BAŞLAT
      });
      if (editingToken.logoURL) {
        setLogoPreview(editingToken.logoURL);
      }
    } else {
      resetForm();
    }
  }, [editingToken, show]);

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      address: '',
      totalSupply: '',
      decimals: '18',
      logoURL: '',
      description: '',
      website: '',
      telegram: '',
      twitter: '',
      tier: 'basic',
      isActive: true,
      newAddress: '' // YENİ EKLENEN
    });
    setLogoFile(null);
    setLogoPreview('');
    setError('');
    setCopied(false);
    setCopiedField('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Sadece resim dosyaları yükleyebilirsiniz (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      setLogoFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      console.log('📤 Logo yükleniyor...', file.name);
      setUploading(true);
      
      const backendFormData = new FormData();
      backendFormData.append('logo', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/logo`, {
        method: 'POST',
        body: backendFormData,
        credentials: 'include'
      });

      console.log('📡 Logo upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Logo upload error response:', errorText);
        throw new Error(`Logo yükleme başarısız: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Logo upload başarılı:', data);
      
      if (data.success && data.logoURL) {
        return data.logoURL;
      } else {
        throw new Error(data.error || 'Logo yükleme başarısız');
      }
    } catch (error) {
      console.error('❌ Logo upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const validateAddress = (address) => {
    return address && address.length === 42 && address.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const copyToClipboard = (text, field) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedField(field);
      setTimeout(() => {
        setCopied(false);
        setCopiedField('');
      }, 2000);
    }
  };

  const removeImage = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({
      ...prev,
      logoURL: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔥 Token güncelleme formu gönderildi:', formData);

      // Validations
      if (!formData.name.trim()) {
        throw new Error('Token adı gerekli');
      }

      if (!formData.symbol.trim()) {
        throw new Error('Token sembolü gerekli');
      }

      if (!formData.address.trim()) {
        throw new Error('Kontrat adresi gerekli');
      }

      if (!validateAddress(formData.address)) {
        throw new Error('Geçerli bir Ethereum kontrat adresi girin (0x ile başlamalı, 42 karakter)');
      }

      if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
        throw new Error('Geçerli bir toplam supply değeri girin');
      }

      // Yeni adres validasyonu
      if (formData.newAddress && !validateAddress(formData.newAddress)) {
        throw new Error('Yeni kontrat adresi geçersiz format');
      }

      let finalLogoURL = formData.logoURL;

      // Yeni logo yüklendiyse Cloudinary'e yükle
      if (logoFile && !logoPreview.startsWith('http')) {
        try {
          finalLogoURL = await uploadToCloudinary(logoFile);
          console.log('✅ Logo başarıyla yüklendi:', finalLogoURL);
        } catch (uploadError) {
          console.warn('⚠ Logo yükleme hatası, mevcut logo kullanılacak:', uploadError);
          finalLogoURL = formData.logoURL; // Mevcut logo URL'sini koru
        }
      }

      // Token verilerini hazırla - TÜM ALANLARI GÖNDER
      const tokenData = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        address: formData.address.trim(),
        totalSupply: formData.totalSupply.toString(),
        decimals: parseInt(formData.decimals),
        logoURL: finalLogoURL,
        description: formData.description.trim(),
        website: formData.website.trim(),
        telegram: formData.telegram.trim(),
        twitter: formData.twitter.trim(),
        tier: formData.tier,
        isActive: formData.isActive,
        newAddress: formData.newAddress.trim() // YENİ ADRESİ GÖNDER
      };

      console.log('💾 Güncellenecek token verileri:', tokenData);

      // Backend PATCH endpoint'ini kullan
      const response = await fetch(`${API_BASE_URL}/api/admin/tokens/${editingToken.address}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(tokenData)
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        
        let errorMessage = 'Token güncellenemedi';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Token başarıyla güncellendi:', result);
      
      // Parent component'e güncellenen token'ı gönder
      if (onSave) {
        onSave(result.token);
      }
      
      resetForm();
      onClose();
      
    } catch (err) {
      console.error('❌ Token güncelleme hatası:', err);
      setError(err.message || 'Token güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content token-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Token Düzenle</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading || uploading}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <FaTimes />
                {error}
              </div>
            )}

            {(loading || uploading) && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>{uploading ? 'Logo yükleniyor...' : 'Token güncelleniyor...'}</p>
              </div>
            )}

            {/* Logo Upload Section */}
            <div className="form-section">
              <div className="section-header">
                <FaCloudUploadAlt />
                <h3>Token Logosu</h3>
              </div>
              <div className="logo-upload-container">
                <div className="logo-preview-area">
                  {logoPreview ? (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Token logo preview" />
                      <button 
                        type="button" 
                        className="remove-logo-btn"
                        onClick={removeImage}
                        disabled={loading || uploading}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="logo-placeholder">
                      <FaCloudUploadAlt size={32} />
                      <span>Token Logosu</span>
                      <small>PNG, JPG, GIF - Max 5MB</small>
                    </div>
                  )}
                </div>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    disabled={loading || uploading}
                  />
                  <label htmlFor="logo-upload" className="file-upload-btn">
                    <FaCloudUploadAlt />
                    {logoFile ? 'Dosya Değiştir' : 'Logo Değiştir'}
                  </label>
                  {logoFile && (
                    <div className="file-info">
                      <span className="file-name">{logoFile.name}</span>
                      <span className="file-size">
                        {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                  {formData.logoURL && !logoFile && (
                    <div className="file-info">
                      <span className="file-name">Mevcut logo kullanılıyor</span>
                      <span className="file-size">Yeni logo seçerseniz değişecek</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Token Basic Info */}
            <div className="form-section">
              <div className="section-header">
                <FaCloudUploadAlt />
                <h3>Token Bilgileri</h3>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="token-name">
                    Token Adı *
                    <span className="required">*</span>
                  </label>
                  <input
                    id="token-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Örn: Bitcoin"
                    required
                    disabled={loading || uploading}
                    maxLength={50}
                  />
                  <div className="char-count">
                    {formData.name.length}/50
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="token-symbol">
                    Token Sembolü *
                    <span className="required">*</span>
                  </label>
                  <input
                    id="token-symbol"
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="Örn: BTC"
                    required
                    disabled={loading || uploading}
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <div className="char-count">
                    {formData.symbol.length}/10
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="token-supply">
                    Toplam Supply *
                    <span className="required">*</span>
                  </label>
                  <input
                    id="token-supply"
                    type="number"
                    name="totalSupply"
                    value={formData.totalSupply}
                    onChange={handleInputChange}
                    placeholder="1000000"
                    required
                    disabled={loading || uploading}
                    min="1"
                    step="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="token-decimals">Ondalık Basamak</label>
                  <select
                    id="token-decimals"
                    name="decimals"
                    value={formData.decimals}
                    onChange={handleInputChange}
                    disabled={loading || uploading}
                  >
                    <option value="0">0</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="18">18 (Standart)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mevcut Kontrat Adresi */}
            <div className="form-section">
              <div className="section-header">
                <FaCopy />
                <h3>Mevcut Kontrat Adresi</h3>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="contract-address">
                  Kontrat Adresi *
                  <span className="required">*</span>
                  {formData.address && (
                    <span className={`address-status ${validateAddress(formData.address) ? 'valid' : 'invalid'}`}>
                      {validateAddress(formData.address) ? '✓ Geçerli' : '⚠ Geçersiz'}
                    </span>
                  )}
                </label>
                <div className="address-input-container">
                  <input
                    id="contract-address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="0x..."
                    required
                    disabled={loading || uploading}
                    className="address-input"
                    pattern="^0x[a-fA-F0-9]{40}$"
                  />
                  {formData.address && (
                    <button
                      type="button"
                      className={`copy-btn ${copied && copiedField === 'address' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(formData.address, 'address')}
                      title="Adresi kopyala"
                      disabled={loading || uploading}
                    >
                      {copied && copiedField === 'address' ? <FaCheck /> : <FaCopy />}
                    </button>
                  )}
                </div>
                {formData.address && !validateAddress(formData.address) && (
                  <div className="validation-hint">
                    ⚠ Geçerli bir Ethereum kontrat adresi girin (0x ile başlamalı, 42 karakter)
                  </div>
                )}
              </div>
            </div>

            {/* Yeni Kontrat Adresi (Değişiklik için) */}
            <div className="form-section">
              <div className="section-header">
                <FaCopy />
                <h3>Yeni Kontrat Adresi (Değiştirmek için)</h3>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="new-contract-address">
                  Yeni Kontrat Adresi
                  {formData.newAddress && (
                    <span className={`address-status ${validateAddress(formData.newAddress) ? 'valid' : 'invalid'}`}>
                      {validateAddress(formData.newAddress) ? '✓ Geçerli' : '⚠ Geçersiz'}
                    </span>
                  )}
                </label>
                <div className="address-input-container">
                  <input
                    id="new-contract-address"
                    type="text"
                    name="newAddress"
                    value={formData.newAddress}
                    onChange={handleInputChange}
                    placeholder="Yeni adres (0x...)"
                    disabled={loading || uploading}
                    className="address-input"
                    pattern="^0x[a-fA-F0-9]{40}$"
                  />
                  {formData.newAddress && (
                    <button
                      type="button"
                      className={`copy-btn ${copied && copiedField === 'newAddress' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(formData.newAddress, 'newAddress')}
                      title="Adresi kopyala"
                      disabled={loading || uploading}
                    >
                      {copied && copiedField === 'newAddress' ? <FaCheck /> : <FaCopy />}
                    </button>
                  )}
                </div>
                {formData.newAddress && !validateAddress(formData.newAddress) && (
                  <div className="validation-hint">
                    ⚠ Geçerli bir Ethereum kontrat adresi girin (0x ile başlamalı, 42 karakter)
                  </div>
                )}
                <div className="info-text">
                  <small>
                    💡 Token adresini değiştirmek istiyorsanız bu alana yeni adresi girin. 
                    Boş bırakırsanız mevcut adres korunur.
                  </small>
                </div>
              </div>
            </div>

            {/* Token Tier */}
            <div className="form-section">
              <div className="section-header">
                <FaCloudUploadAlt />
                <h3>Token Tier</h3>
              </div>
              
              <div className="tier-selection">
                <div className="tier-options">
                  <label className="tier-option">
                    <input
                      type="radio"
                      name="tier"
                      value="free"
                      checked={formData.tier === 'free'}
                      onChange={handleInputChange}
                      disabled={loading || uploading}
                    />
                    <div className="tier-card">
                      <div className="tier-header">
                        <h4>Free</h4>
                        <div className="tier-badge free">Ücretsiz</div>
                      </div>
                      <div className="tier-features">
                        <span>✓ Temel özellikler</span>
                        <span>✓ 18 Decimal</span>
                        <span>✗ Premium özellikler</span>
                      </div>
                    </div>
                  </label>

                  <label className="tier-option">
                    <input
                      type="radio"
                      name="tier"
                      value="basic"
                      checked={formData.tier === 'basic'}
                      onChange={handleInputChange}
                      disabled={loading || uploading}
                    />
                    <div className="tier-card">
                      <div className="tier-header">
                        <h4>Basic</h4>
                        <div className="tier-badge basic">Standart</div>
                      </div>
                      <div className="tier-features">
                        <span>✓ Tüm temel özellikler</span>
                        <span>✓ Öncelikli listeleme</span>
                        <span>✓ Temel analytics</span>
                      </div>
                    </div>
                  </label>

                  <label className="tier-option">
                    <input
                      type="radio"
                      name="tier"
                      value="premium"
                      checked={formData.tier === 'premium'}
                      onChange={handleInputChange}
                      disabled={loading || uploading}
                    />
                    <div className="tier-card">
                      <div className="tier-header">
                        <h4>Premium</h4>
                        <div className="tier-badge premium">Premium</div>
                      </div>
                      <div className="tier-features">
                        <span>✓ Tüm özellikler</span>
                        <span>✓ Öncelikli destek</span>
                        <span>✓ Gelişmiş analytics</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="form-section">
              <div className="section-header">
                <FaCloudUploadAlt />
                <h3>Sosyal Medya Bağlantıları</h3>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    disabled={loading || uploading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telegram">Telegram</label>
                  <input
                    id="telegram"
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    placeholder="@group veya https://t.me/group"
                    disabled={loading || uploading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="twitter">Twitter</label>
                  <input
                    id="twitter"
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="@username"
                    disabled={loading || uploading}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-section">
              <div className="section-header">
                <FaCloudUploadAlt />
                <h3>Açıklama</h3>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="description">Token Açıklaması</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tokenınız hakkında detaylı açıklama..."
                  rows="4"
                  disabled={loading || uploading}
                  maxLength={500}
                />
                <div className="char-count">
                  {formData.description.length}/500
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="form-section">
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={loading || uploading}
                  />
                  <span className="checkmark"></span>
                  Token aktif ve listede görünsün
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleClose}
              disabled={loading || uploading}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Güncelleniyor...
                </>
              ) : uploading ? (
                <>
                  <div className="spinner-small"></div>
                  Logo Yükleniyor...
                </>
              ) : (
                <>
                  <FaSave />
                  Token Güncelle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TokenModal;

