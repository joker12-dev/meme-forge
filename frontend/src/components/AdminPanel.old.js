import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaCheckCircle, FaReply, FaArchive, FaTrash, FaEye, FaClock, FaChartBar, FaSignOutAlt } from 'react-icons/fa';
import AdminLogin from './AdminLogin';
import './AdminPanel.css';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [idleTimer, setIdleTimer] = useState(null);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleTimeRemaining, setIdleTimeRemaining] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      fetchStats();
      startIdleTimer();
      setupActivityListeners();

      return () => {
        clearIdleTimer();
        removeActivityListeners();
      };
    }
  }, [filter, pagination.page, isAuthenticated]);

  const checkAuthentication = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/check', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.isAuthenticated) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    checkAuthentication();
  };

  const handleLogout = async () => {
    try {
      clearIdleTimer();
      
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setMessages([]);
        setStats({
          total: 0,
          new: 0,
          read: 0,
          replied: 0,
          archived: 0
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Idle Timer Functions
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 dakika
  const WARNING_TIME = 60 * 1000; // Son 1 dakika için uyarı

  const startIdleTimer = () => {
    clearIdleTimer();
    
    const timer = setTimeout(() => {
      // 5 dakika doldu, otomatik çıkış yap
      handleIdleLogout();
    }, IDLE_TIMEOUT);

    // Son 1 dakika için uyarı timer'ı
    const warningTimer = setTimeout(() => {
      setShowIdleWarning(true);
      startWarningCountdown();
    }, IDLE_TIMEOUT - WARNING_TIME);

    setIdleTimer({ timer, warningTimer });
  };

  const clearIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer.timer);
      clearTimeout(idleTimer.warningTimer);
      setIdleTimer(null);
    }
    setShowIdleWarning(false);
    setIdleTimeRemaining(0);
  };

  const resetIdleTimer = () => {
    if (isAuthenticated) {
      clearIdleTimer();
      setShowIdleWarning(false);
      startIdleTimer();
    }
  };

  const handleIdleLogout = async () => {
    console.log('⏱️ Auto logout due to inactivity');
    await handleLogout();
    alert('Oturum süreniz doldu. 5 dakika boyunca işlem yapmadığınız için otomatik olarak çıkış yapıldı.');
  };

  const startWarningCountdown = () => {
    let remaining = 60;
    setIdleTimeRemaining(remaining);

    const countdownInterval = setInterval(() => {
      remaining--;
      setIdleTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  };

  const setupActivityListeners = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });
  };

  const removeActivityListeners = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.removeEventListener(event, resetIdleTimer);
    });
  };

  const extendSession = () => {
    setShowIdleWarning(false);
    resetIdleTimer();
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const response = await fetch(
        `${getBackendURL()}/api/admin/contact-messages?page=${pagination.page}&limit=${pagination.limit}${statusParam}`,
        {
          credentials: 'include'
        }
      );
      const data = await response.json();

      if (response.status === 401 && data.sessionExpired) {
        // Session expired
        setIsAuthenticated(false);
        alert('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        return;
      }

      if (data.success) {
        setMessages(data.data.messages);
        setPagination({
          ...pagination,
          totalPages: data.data.pagination.totalPages,
          total: data.data.pagination.total
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/contact-stats', {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const response = await fetch(`${getBackendURL()}/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        fetchMessages();
        fetchStats();
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status });
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`${getBackendURL()}/api/admin/contact-messages/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        fetchMessages();
        fetchStats();
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: { icon: <FaEnvelope />, class: 'status-new', text: 'Yeni' },
      read: { icon: <FaEye />, class: 'status-read', text: 'Okundu' },
      replied: { icon: <FaReply />, class: 'status-replied', text: 'Cevaplandı' },
      archived: { icon: <FaArchive />, class: 'status-archived', text: 'Arşivlendi' }
    };
    const badge = badges[status] || badges.new;
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="admin-panel">
        <div className="loading-screen">
          <div className="spinner-large"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-panel">
      {/* Idle Warning Modal */}
      {showIdleWarning && (
        <div className="idle-warning-overlay">
          <div className="idle-warning-modal">
            <div className="idle-warning-icon">⏱️</div>
            <h3>Oturum Süresi Doluyor!</h3>
            <p>
              {idleTimeRemaining} saniye içinde otomatik olarak çıkış yapılacak.
            </p>
            <p className="idle-warning-text">
              Oturumunuzu devam ettirmek için aşağıdaki butona tıklayın.
            </p>
            <div className="idle-warning-actions">
              <button className="extend-session-btn" onClick={extendSession}>
                Oturumu Uzat
              </button>
              <button className="logout-now-btn" onClick={handleLogout}>
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-title">
            <h1>
              <FaEnvelope className="header-icon" />
              İletişim Yönetimi
            </h1>
            <p>Kullanıcı mesajlarını görüntüleyin ve yönetin</p>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <span className="user-welcome">Hoş geldiniz,</span>
              <strong>{currentUser?.username}</strong>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Çıkış Yap">
              <FaSignOutAlt />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card total">
          <FaChartBar className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Toplam Mesaj</span>
          </div>
        </div>
        <div className="stat-card new">
          <FaEnvelope className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats.new}</span>
            <span className="stat-label">Yeni</span>
          </div>
        </div>
        <div className="stat-card read">
          <FaEye className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats.read}</span>
            <span className="stat-label">Okundu</span>
          </div>
        </div>
        <div className="stat-card replied">
          <FaReply className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats.replied}</span>
            <span className="stat-label">Cevaplandı</span>
          </div>
        </div>
        <div className="stat-card archived">
          <FaArchive className="stat-icon" />
          <div className="stat-info">
            <span className="stat-value">{stats.archived}</span>
            <span className="stat-label">Arşiv</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          Tümü ({stats.total})
        </button>
        <button 
          className={filter === 'new' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('new')}
        >
          Yeni ({stats.new})
        </button>
        <button 
          className={filter === 'read' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('read')}
        >
          Okundu ({stats.read})
        </button>
        <button 
          className={filter === 'replied' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('replied')}
        >
          Cevaplandı ({stats.replied})
        </button>
        <button 
          className={filter === 'archived' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('archived')}
        >
          Arşiv ({stats.archived})
        </button>
      </div>

      {/* Messages */}
      <div className="admin-content">
        <div className="messages-list">
          {loading ? (
            <div className="loading">Yükleniyor...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <FaEnvelope className="empty-icon" />
              <p>Henüz mesaj bulunmuyor</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id}
                className={`message-item ${selectedMessage?.id === message.id ? 'selected' : ''} ${message.status === 'new' ? 'unread' : ''}`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (message.status === 'new') {
                    updateMessageStatus(message.id, 'read');
                  }
                }}
              >
                <div className="message-header">
                  <span className="message-name">{message.name}</span>
                  {getStatusBadge(message.status)}
                </div>
                <div className="message-subject">{message.subject}</div>
                <div className="message-footer">
                  <span className="message-email">{message.email}</span>
                  <span className="message-date">
                    <FaClock /> {formatDate(message.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        {selectedMessage && (
          <div className="message-detail">
            <div className="detail-header">
              <div className="detail-title">
                <h3>{selectedMessage.subject}</h3>
                {getStatusBadge(selectedMessage.status)}
              </div>
              <div className="detail-actions">
                <button 
                  className="action-btn read"
                  onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                  disabled={selectedMessage.status === 'read'}
                  title="Okundu olarak işaretle"
                >
                  <FaEye />
                </button>
                <button 
                  className="action-btn replied"
                  onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                  disabled={selectedMessage.status === 'replied'}
                  title="Cevaplandı olarak işaretle"
                >
                  <FaReply />
                </button>
                <button 
                  className="action-btn archived"
                  onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                  disabled={selectedMessage.status === 'archived'}
                  title="Arşivle"
                >
                  <FaArchive />
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => deleteMessage(selectedMessage.id)}
                  title="Sil"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="detail-info">
              <div className="info-row">
                <span className="info-label">Gönderen:</span>
                <span className="info-value">{selectedMessage.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">E-posta:</span>
                <span className="info-value">
                  <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Tarih:</span>
                <span className="info-value">{formatDate(selectedMessage.createdAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">IP Adresi:</span>
                <span className="info-value">{selectedMessage.ipAddress || 'Bilinmiyor'}</span>
              </div>
            </div>

            <div className="detail-message">
              <h4>Mesaj:</h4>
              <p>{selectedMessage.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="admin-pagination">
          <button 
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Önceki
          </button>
          <span>
            Sayfa {pagination.page} / {pagination.totalPages}
          </span>
          <button 
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

