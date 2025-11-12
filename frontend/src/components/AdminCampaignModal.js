import React, { useState, useEffect } from 'react';
import { FaStar, FaClock, FaCheck, FaRocket } from 'react-icons/fa';
import './AdminCampaignModal.css';

const AdminCampaignModal = ({ campaign, isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tokenAddress: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    category: 'general',
    tier: 'bronze'
  });

  // Populate form when editing
  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        tokenAddress: campaign.tokenAddress || '',
        title: campaign.title || '',
        description: campaign.description || '',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
        category: campaign.category || 'general',
        tier: campaign.tier || 'bronze'
      });
    } else if (!campaign && isOpen) {
      // Reset form for new campaign
      setFormData({
        tokenAddress: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        category: 'general',
        tier: 'bronze'
      });
    }
  }, [campaign, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.tokenAddress || !formData.startDate || !formData.endDate) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="campaign-modal-overlay" onClick={onClose}>
      <div className="campaign-modal" onClick={e => e.stopPropagation()}>
        <div className="campaign-modal-header">
          <h2>
            {campaign ? '✏️ Kampanya Düzenle' : '🎉 Yeni Kampanya Oluştur'}
          </h2>
          <button className="campaign-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="campaign-modal-content">
          <form onSubmit={handleSubmit} className="campaign-form">
            {/* Temel Bilgiler */}
            <div className="campaign-form-row">
              <div className="campaign-form-group">
                <label className="campaign-form-label required">Token Adresi</label>
                <input
                  type="text"
                  name="tokenAddress"
                  value={formData.tokenAddress}
                  onChange={handleChange}
                  required
                  className="campaign-form-input"
                  placeholder="0x..."
                />
              </div>

              <div className="campaign-form-group">
                <label className="campaign-form-label required">Kampanya Başlığı</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="campaign-form-input"
                  placeholder="Örn: Büyük Airdrop Kampanyası 🎁"
                />
              </div>
            </div>

            {/* Açıklama */}
            <div className="campaign-form-group full-width">
              <label className="campaign-form-label">Açıklama</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="campaign-form-textarea"
                placeholder="Kampanyanın açıklaması..."
              />
            </div>

            {/* Tarihler */}
            <div className="campaign-form-row">
              <div className="campaign-form-group">
                <label className="campaign-form-label required">⏰ Başlangıç Tarihi</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="campaign-form-input"
                />
              </div>

              <div className="campaign-form-group">
                <label className="campaign-form-label required">⏱️ Bitiş Tarihi</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="campaign-form-input"
                />
              </div>
            </div>

            {/* Kategori ve Tier */}
            <div className="campaign-form-row">
              <div className="campaign-form-group">
                <label className="campaign-form-label">🏷️ Kategori</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="campaign-form-select"
                >
                  <option value="general">Genel</option>
                  <option value="airdrop">Airdrop</option>
                  <option value="competition">Yarışma</option>
                  <option value="partnership">Ortaklık</option>
                  <option value="event">Etkinlik</option>
                  <option value="promotion">Promosyon</option>
                </select>
              </div>

              <div className="campaign-form-group">
                <label className="campaign-form-label"><FaStar style={{marginRight: '6px'}} /> Tier (Seviye)</label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="campaign-form-select"
                >
                  <option value="bronze">Bronz</option>
                  <option value="silver">Gümüş</option>
                  <option value="gold">Altın</option>
                  <option value="platinum">Platin</option>
                  <option value="diamond">Elmas</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="campaign-modal-footer">
          <button 
            type="button" 
            onClick={onClose} 
            className="campaign-btn campaign-btn-cancel"
          >
            ❌ İptal
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
            className="campaign-btn campaign-btn-submit"
          >
            {loading ? <><FaClock style={{marginRight: '6px'}} /> Kaydediliyor...</> : (campaign ? <><FaCheck style={{marginRight: '6px'}} /> Güncelle</> : <><FaRocket style={{marginRight: '6px'}} /> Oluştur</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCampaignModal;

