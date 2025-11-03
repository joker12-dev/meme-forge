import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaShieldAlt, FaBan, FaCheckCircle, FaStar, FaSync } from 'react-icons/fa';
import './AdminPanel.css';

const UserEditModal = ({ show, onClose, user, onStatusChange, onAddBadge, onRemoveBadge, onUpdateInfo }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    description: ''
  });
  const [displayUser, setDisplayUser] = useState(user); // Local state rozetleri görmek için
  const [newBadge, setNewBadge] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('📱 Modal açıldı/güncellendi - user:', user.id, 'badges:', user.badges);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        description: user.description || ''
      });
      setDisplayUser(user); // Yeni user'ı göster
      setSelectedStatus(user.status || 'active');
      setBanReason(user.banReason || '');
    }
  }, [user, show]);

  if (!show || !user) return null;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    await onStatusChange(user.id, newStatus, banReason, banDuration);
    setLoading(false);
  };

  const handleAddBadge = async () => {
    if (!newBadge.trim()) {
      console.log('❌ Badge boş, gönderilmiyor');
      return;
    }
    console.log('🔵 EKLE BUTONUNA TIKLANDI - handleAddBadge çalışmaya başladı');
    console.log('   userId:', user?.id);
    console.log('   badge:', newBadge);
    console.log('   onAddBadge prop:', typeof onAddBadge);
    setLoading(true);
    try {
      console.log('🟡 onAddBadge çağrılıyor...');
      await onAddBadge(user.id, newBadge);
      console.log('✅ onAddBadge başarılı');
      // Başarılıysa local user'ı güncelle rozetleri görmek için
      console.log('🔄 displayUser güncelleniyor...');
      setDisplayUser(prev => {
        const updated = {
          ...prev,
          badges: [...(prev.badges || []), newBadge]
        };
        console.log('📊 Yeni displayUser:', updated.badges);
        return updated;
      });
    } catch (error) {
      console.error('❌ Rozet ekleme hatası:', error);
    }
    setNewBadge('');
    setLoading(false);
  };

  const handleUpdateInfo = async () => {
    setLoading(true);
    await onUpdateInfo(user.id, formData);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const availableBadges = [
    '⭐ Verified',
    '🏆 Top Creator',
    '💎 Premium',
    '🚀 Early Supporter',
    '🎯 Community Leader',
    '📱 Social Influencer',
    '💰 Major Trader',
    '🌟 VIP Member'
  ];

  return (
    <div 
      style={{
        display: (show || isOpen) ? 'flex' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(240, 185, 11, 0.2)',
          position: 'relative',
          border: '1px solid rgba(240, 185, 11, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid rgba(240, 185, 11, 0.2)',
          backgroundColor: 'linear-gradient(135deg, rgba(240, 185, 11, 0.1) 0%, rgba(248, 211, 58, 0.05) 100%)',
          background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.1) 0%, rgba(248, 211, 58, 0.05) 100%)'
        }}>
          <h2 style={{ margin: 0, color: '#F0B90B', fontSize: '18px' }}>👤 {user?.username || `@${user?.walletAddress?.slice(0, 6)}`} - Düzenle</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#F0B90B',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#F8D33A'}
            onMouseLeave={(e) => e.target.style.color = '#F0B90B'}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Kullanıcı Bilgileri */}
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'rgba(240, 185, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(240, 185, 11, 0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#F0B90B' }}>📋 Kullanıcı Bilgileri</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#F0B90B' }}>Kullanıcı Adı</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Kullanıcı adı"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(240, 185, 11, 0.3)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(26, 26, 26, 0.5)',
                  color: '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#F0B90B' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(240, 185, 11, 0.3)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(26, 26, 26, 0.5)',
                  color: '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#F0B90B' }}>Açıklama</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Kullanıcı açıklaması"
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(240, 185, 11, 0.3)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(26, 26, 26, 0.5)',
                  color: '#fff'
                }}
              />
            </div>

            <button
              onClick={handleUpdateInfo}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                color: '#4CAF50',
                border: '1px solid #4CAF50',
                borderRadius: '4px',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: 'bold'
              }}
            >
              {loading ? '⏳ Kaydediliyor...' : '💾 Bilgileri Kaydet'}
            </button>
          </div>

          {/* Kullanıcı Durumu */}
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'rgba(240, 185, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(240, 185, 11, 0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#F0B90B' }}>⚙️ Kullanıcı Durumu</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <button
                onClick={() => handleStatusChange('active')}
                disabled={loading}
                style={{
                  padding: '12px 10px',
                  backgroundColor: user?.status === 'active' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.1)',
                  color: user?.status === 'active' ? '#4caf50' : '#4caf50',
                  border: `2px solid ${user?.status === 'active' ? '#4caf50' : 'rgba(76, 175, 80, 0.3)'}`,
                  borderRadius: '4px',
                  cursor: loading ? 'default' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaCheckCircle /> Aktifleştir
              </button>
              <button
                onClick={() => handleStatusChange('suspended')}
                disabled={loading}
                style={{
                  padding: '12px 10px',
                  backgroundColor: user?.status === 'suspended' ? 'rgba(240, 185, 11, 0.3)' : 'rgba(240, 185, 11, 0.1)',
                  color: user?.status === 'suspended' ? '#F0B90B' : '#F0B90B',
                  border: `2px solid ${user?.status === 'suspended' ? '#F0B90B' : 'rgba(240, 185, 11, 0.3)'}`,
                  borderRadius: '4px',
                  cursor: loading ? 'default' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaShieldAlt /> Askıya Al
              </button>
              <button
                onClick={() => handleStatusChange('banned')}
                disabled={loading}
                style={{
                  padding: '12px 10px',
                  backgroundColor: user?.status === 'banned' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.1)',
                  color: user?.status === 'banned' ? '#f44336' : '#f44336',
                  border: `2px solid ${user?.status === 'banned' ? '#f44336' : 'rgba(244, 67, 54, 0.3)'}`,
                  borderRadius: '4px',
                  cursor: loading ? 'default' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaBan /> Banla
              </button>
            </div>

            {user?.status === 'suspended' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#F0B90B' }}>Ban Süresi (Gün)</label>
                <input
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  min="1"
                  max="365"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(240, 185, 11, 0.3)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(26, 26, 26, 0.5)',
                    color: '#fff'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#F0B90B' }}>Ban Sebebi</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ban sebebini yazın..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid rgba(240, 185, 11, 0.3)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(26, 26, 26, 0.5)',
                  color: '#fff'
                }}
              />
            </div>

            {user?.banReason && (
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#f44336',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}>
                <strong>Mevcut Sebep:</strong> {user.banReason}
              </div>
            )}
          </div>

          {/* Rozetler */}
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'rgba(240, 185, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(240, 185, 11, 0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#F0B90B' }}>⭐ Rozetler</h3>
            
            {/* Mevcut Rozetler */}
            {displayUser?.badges && displayUser.badges.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#F0B90B', fontWeight: 'bold' }}>
                  ⭐ Tanımlı Rozetler ({displayUser.badges.length})
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {(() => {
                    return displayUser.badges.map(badge => (
                      <div
                        key={badge}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(240, 185, 11, 0.15)',
                          color: '#F0B90B',
                          borderRadius: '20px',
                          fontSize: '13px',
                          border: '1px solid rgba(240, 185, 11, 0.3)'
                        }}
                      >
                        <FaStar size={12} />
                        {badge}
                        <button
                          onClick={() => {
                            if (onRemoveBadge) onRemoveBadge(user.id, badge);
                          }}
                          disabled={loading}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ff4444',
                            cursor: loading ? 'default' : 'pointer',
                            padding: '0',
                            marginLeft: '4px',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => !loading && (e.target.style.color = '#ff0000')}
                          onMouseLeave={(e) => !loading && (e.target.style.color = '#ff4444')}
                          title="Rozeti kaldır"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
            {(!displayUser?.badges || displayUser.badges.length === 0) && (
              <div style={{ marginBottom: '15px', color: '#888', fontSize: '13px' }}>
                📭 Tanımlı rozet yok
              </div>
            )}

            {/* Rozet Ekle Bölümü */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#F0B90B' }}>➕ Rozet Ekle</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid rgba(240, 185, 11, 0.3)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'rgba(26, 26, 26, 0.5)',
                    color: '#fff'
                  }}
                >
                  <option value="">Rozet seçin...</option>
                  {availableBadges.map(badge => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddBadge}
                  disabled={loading || !newBadge}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: newBadge ? 'rgba(240, 185, 11, 0.2)' : 'rgba(240, 185, 11, 0.05)',
                    color: newBadge ? '#F0B90B' : '#666',
                    border: `1px solid ${newBadge ? '#F0B90B' : 'rgba(240, 185, 11, 0.1)'}`,
                    borderRadius: '4px',
                    cursor: (loading || !newBadge) ? 'default' : 'pointer',
                    fontWeight: 'bold',
                    opacity: (loading || !newBadge) ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (newBadge && !loading) {
                      e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.3)';
                      e.target.style.boxShadow = '0 0 8px rgba(240, 185, 11, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newBadge && !loading) {
                      e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.2)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  ➕ Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Cüzdan Bilgileri */}
          <div style={{ padding: '15px', backgroundColor: 'rgba(240, 185, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(240, 185, 11, 0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#F0B90B' }}>📊 Cüzdan Bilgileri</h3>
            <p style={{ margin: '5px 0', fontSize: '13px', color: '#aaa' }}>
              <strong style={{ color: '#F0B90B' }}>Adres:</strong> <code style={{ fontSize: '11px', backgroundColor: 'rgba(26, 26, 26, 0.5)', padding: '2px 4px', borderRadius: '2px', color: '#F8D33A' }}>{user?.walletAddress}</code>
            </p>
            <p style={{ margin: '5px 0', fontSize: '13px', color: '#aaa' }}>
              <strong style={{ color: '#F0B90B' }}>Kayıt Tarihi:</strong> {new Date(user?.createdAt).toLocaleDateString('tr-TR')}
            </p>
            <p style={{ margin: '5px 0', fontSize: '13px', color: '#aaa' }}>
              <strong style={{ color: '#F0B90B' }}>Durum:</strong> {
                user?.status === 'active' ? '✅ Aktif' :
                user?.status === 'suspended' ? '⏸️ Askıya Alındı' :
                '🚫 Banlandı'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid rgba(240, 185, 11, 0.2)',
          backgroundColor: 'rgba(26, 26, 26, 0.3)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              color: '#f44336',
              border: '1px solid #f44336',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(244, 67, 54, 0.3)';
              e.target.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ❌ Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;

