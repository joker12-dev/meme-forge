import React, { useState, useEffect } from 'react';
import './AdminCampaignModal.css';

const AdminCampaignModal = ({ campaign, isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    imageUrl: '',
    bannerUrl: '',
    startDate: '',
    endDate: '',
    category: 'general',
    tags: [],
    externalUrl: '',
    buttonText: 'Learn More',
    priority: 0,
    featured: false
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (!campaign && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, campaign]);

  // Populate form when editing
  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        title: campaign.title || '',
        slug: campaign.slug || '',
        description: campaign.description || '',
        content: campaign.content || '',
        imageUrl: campaign.imageUrl || '',
        bannerUrl: campaign.bannerUrl || '',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
        category: campaign.category || 'general',
        tags: campaign.tags || [],
        externalUrl: campaign.externalUrl || '',
        buttonText: campaign.buttonText || 'Learn More',
        priority: campaign.priority || 0,
        featured: campaign.featured || false
      });
    } else if (!campaign && isOpen) {
      // Reset form for new campaign
      setFormData({
        title: '',
        slug: '',
        description: '',
        content: '',
        imageUrl: '',
        bannerUrl: '',
        startDate: '',
        endDate: '',
        category: 'general',
        tags: [],
        externalUrl: '',
        buttonText: 'Learn More',
        priority: 0,
        featured: false
      });
      setTagInput('');
    }
  }, [campaign, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.startDate || !formData.endDate) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(formData.slug)) {
      alert('Slug sadece küçük harf, rakam ve tire (-) içerebilir');
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
            {/* Info Box */}
            <div className="info-box">
              <div className="info-box-icon">💡</div>
              <div className="info-box-content">
                <div className="info-box-title">Kampanya Oluşturma İpuçları</div>
                <div className="info-box-text">
                  Başlık ve açıklama alanlarını kullanıcıların ilgisini çekecek şekilde doldurun. 
                  Görsel URL'leri için yüksek kaliteli ve uygun boyutta görseller kullanın.
                </div>
              </div>
            </div>

            {/* Temel Bilgiler */}
            <div className="campaign-form-row">
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

              <div className="campaign-form-group">
                <label className="campaign-form-label required">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="campaign-form-input"
                  placeholder="buyuk-airdrop-kampanyasi"
                  pattern="[a-z0-9-]+"
                  title="Sadece küçük harf, rakam ve tire kullanın"
                />
              </div>
            </div>

            {/* Açıklamalar */}
            <div className="campaign-form-group full-width">
              <label className="campaign-form-label">Kısa Açıklama</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="campaign-form-textarea"
                placeholder="Slider'da gösterilecek kısa açıklama (max 150 karakter önerilir)..."
              />
            </div>

            <div className="campaign-form-group full-width">
              <label className="campaign-form-label">Detaylı İçerik</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="campaign-form-textarea large"
                placeholder="Kampanyanın detaylı açıklaması, katılım şartları, ödüller vb..."
              />
            </div>

            {/* Görseller */}
            <div className="campaign-form-row">
              <div className="campaign-form-group">
                <label className="campaign-form-label">📷 Kart Görseli URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="campaign-form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="campaign-form-group">
                <label className="campaign-form-label">🖼️ Banner Görseli URL</label>
                <input
                  type="url"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  className="campaign-form-input"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
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

            {/* Kategori ve URL */}
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
                <label className="campaign-form-label">🔗 Dış URL</label>
                <input
                  type="url"
                  name="externalUrl"
                  value={formData.externalUrl}
                  onChange={handleChange}
                  className="campaign-form-input"
                  placeholder="https://kampanya-sitesi.com"
                />
              </div>
            </div>

            {/* Buton ve Öncelik */}
            <div className="campaign-form-row">
              <div className="campaign-form-group">
                <label className="campaign-form-label">🔘 Buton Metni</label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  className="campaign-form-input"
                  placeholder="Katıl, Detaylar, Şimdi Başla..."
                />
              </div>

              <div className="campaign-form-group priority-input-group">
                <label className="campaign-form-label">⭐ Öncelik</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="campaign-form-input"
                  placeholder="0"
                />
                <span className="priority-hint">0-100 (Yüksek üstte)</span>
              </div>
            </div>

            {/* Etiketler */}
            <div className="campaign-form-group full-width">
              <label className="campaign-form-label">🏷️ Etiketler</label>
              <div className="tag-manager">
                <div className="tag-input-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="campaign-form-input"
                    placeholder="Etiket yazın ve Enter'a basın..."
                  />
                  <button 
                    type="button" 
                    onClick={addTag} 
                    disabled={!tagInput.trim()}
                    className="tag-add-btn"
                  >
                    + Ekle
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="tag-list">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="tag-chip">
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(index)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Öne Çıkan */}
            <div className="campaign-form-group full-width">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="featured"
                  id="featured-checkbox"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                <label htmlFor="featured-checkbox" className="checkbox-label">
                  <span className="checkbox-label-text">⭐ Öne Çıkan Kampanya</span>
                  <span className="checkbox-label-hint">
                    Öne çıkan kampanyalar slider'da badge ile gösterilir ve önceliklendirilir
                  </span>
                </label>
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
            {loading ? '⏳ Kaydediliyor...' : (campaign ? '✅ Güncelle' : '🚀 Oluştur')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCampaignModal;

