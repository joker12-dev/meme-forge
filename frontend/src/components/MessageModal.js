import React from 'react';
import './MessageModal.css';

const MessageModal = ({ show, onClose, message, onUpdateStatus }) => {
  if (!show || !message) return null;

  const getStatusBadge = (status) => {
    const badges = {
      new: { text: 'Yeni', color: '#4CAF50' },
      read: { text: 'Okundu', color: '#2196F3' },
      replied: { text: 'Cevaplandı', color: '#9C27B0' },
      archived: { text: 'Arşivlendi', color: '#607D8B' }
    };
    return badges[status] || badges.new;
  };

  const statusBadge = getStatusBadge(message.status);

  return (
    <div className="message-modal-overlay" onClick={onClose}>
      <div className="message-modal" onClick={(e) => e.stopPropagation()}>
        <div className="message-modal-header">
          <div>
            <h2>Mesaj Detayı</h2>
            <span 
              className="status-badge" 
              style={{ backgroundColor: statusBadge.color }}
            >
              {statusBadge.text}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="message-modal-body">
          <div className="message-info-grid">
            <div className="info-item">
              <label>ID</label>
              <span>#{message.id}</span>
            </div>
            <div className="info-item">
              <label>Gönderen</label>
              <span>{message.name}</span>
            </div>
            <div className="info-item">
              <label>E-posta</label>
              <span>{message.email}</span>
            </div>
            <div className="info-item">
              <label>Tarih</label>
              <span>{new Date(message.createdAt).toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div className="message-subject">
            <label>Konu</label>
            <h3>{message.subject}</h3>
          </div>

          <div className="message-content">
            <label>Mesaj İçeriği</label>
            <div className="content-text">{message.message}</div>
          </div>

          <div className="message-actions">
            <label>Durum Değiştir</label>
            <div className="status-buttons">
              <button 
                className={`status-btn ${message.status === 'read' ? 'active' : ''}`}
                onClick={() => onUpdateStatus(message.id, 'read')}
                disabled={message.status === 'read'}
              >
                ✓ Okundu
              </button>
              <button 
                className={`status-btn ${message.status === 'replied' ? 'active' : ''}`}
                onClick={() => onUpdateStatus(message.id, 'replied')}
                disabled={message.status === 'replied'}
              >
                ↩ Cevaplandı
              </button>
              <button 
                className={`status-btn ${message.status === 'archived' ? 'active' : ''}`}
                onClick={() => onUpdateStatus(message.id, 'archived')}
                disabled={message.status === 'archived'}
              >
                📦 Arşivle
              </button>
            </div>
          </div>
        </div>

        <div className="message-modal-footer">
          <button className="btn-close" onClick={onClose}>Kapat</button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;

