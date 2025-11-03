import React, { useState, useEffect } from 'react';
import { 
  FaTachometerAlt, 
  FaUserShield, 
  FaCoins, 
  FaUsers, 
  FaExchangeAlt, 
  FaEnvelope, 
  FaCog, 
  FaChartLine,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaClock,
  FaReply,
  FaArchive,
  FaExclamationTriangle,
  FaClipboardList,
  FaSyncAlt
} from 'react-icons/fa';
import VerifiedUsername from './VerifiedUsername';
import AdminLogin from './AdminLogin';
import AdminModal from './AdminModal';
import UserEditModal from './UserEditModal';
import MessageModal from './MessageModal';
import TokenModal from './TokenModal';
import AdminHypeModal from './AdminHypeModal';
import AdminCampaignModal from './AdminCampaignModal';
import Toast from './Toast';
import './AdminPanel.css';

// Backend API URL'ini dinamik olarak belirle
const getAPIBaseURL = () => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  const currentHost = window.location.hostname;
  return `http://${currentHost}:3001`;
};
const API_BASE_URL = getAPIBaseURL();
console.log('🔗 Admin Panel Backend URL:', API_BASE_URL);

const AdminPanel = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // UI state
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768); // Mobilde kapalı, PC'de açık
  const [loading, setLoading] = useState(false);

  // Data state
  const [admins, setAdmins] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hypes, setHypes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);

  // Modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showHypeModal, setShowHypeModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

    // Database clear loading state
  const [clearingDb, setClearingDb] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);

    // Clear database handler
  const handleClearDatabase = () => {
    setShowConfirmModal(true);
  };

  // Onaylandığında temizleme işlemini başlat
  const confirmClearDatabase = async () => {
    setClearingDb(true);
    setShowConfirmModal(false);
    setProgress(0);
    
    // Simulate progress
    for (let i = 1; i <= 10; i++) {
      setProgress(i * 10);
      await new Promise(res => setTimeout(res, 120));
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/clear-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setToasts(toasts => [...toasts, { 
          type: 'success', 
          message: data.message || 'Veritabanı başarıyla temizlendi.' 
        }]);
        loadSectionData();
      } else {
        setToasts(toasts => [...toasts, { 
          type: 'error', 
          message: data.error || 'Veritabanı temizlenemedi.' 
        }]);
      }
    } catch (err) {
      console.error('❌ Clear database error:', err);
      setToasts(toasts => [...toasts, { 
        type: 'error', 
        message: 'Sunucu hatası: ' + err.message 
      }]);
    }
    
    setClearingDb(false);
    setProgress(0);
  };

  // İptal et
  const cancelClearDatabase = () => {
    setShowConfirmModal(false);
  };
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tier: 'all',
    action: 'all',
    entity: 'all'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Idle timeout state
  const [idleTimer, setIdleTimer] = useState(null);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleTimeRemaining, setIdleTimeRemaining] = useState(0);
  const [countdownInterval, setCountdownInterval] = useState(null);

  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const WARNING_TIME = 60 * 1000; // 1 minute warning

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    
    // Handle window resize for sidebar
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load data when section changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSectionData();
      
      // Idle timer temporarily disabled to fix mobile click issues
      // startIdleTimer();
      // setupActivityListeners();

      return () => {
        // clearIdleTimer();
        // removeActivityListeners();
      };
    }
  }, [activeSection, isAuthenticated]);

  // Load data when page changes (but not section)
  useEffect(() => {
    if (isAuthenticated) {
      loadSectionData();
    }
  }, [pagination.page]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      const interval = setInterval(() => {
        loadSectionData();
        setLastRefreshTime(new Date());
      }, 10000); // 10 saniyede bir yenile
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, isAuthenticated, activeSection]);

  // Idle timer functions
  const startIdleTimer = () => {
    clearIdleTimer();
    
    const timer = setTimeout(() => {
      handleIdleLogout();
    }, IDLE_TIMEOUT);

    const warningTimer = setTimeout(() => {
      setShowIdleWarning(true);
      startWarningCountdown();
    }, IDLE_TIMEOUT - WARNING_TIME);

    setIdleTimer({ timer, warningTimer });
  };

  const clearIdleTimer = () => {
    if (idleTimer) {
      if (idleTimer.timer) clearTimeout(idleTimer.timer);
      if (idleTimer.warningTimer) clearTimeout(idleTimer.warningTimer);
      setIdleTimer(null);
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setShowIdleWarning(false);
    setIdleTimeRemaining(0);
  };

  // Throttle için son reset zamanını sakla
  let lastResetTime = 0;
  const RESET_THROTTLE = 1000; // 1 saniye

  const resetIdleTimer = () => {
    // Throttle: 1 saniyede bir çalışsın
    const now = Date.now();
    if (now - lastResetTime < RESET_THROTTLE) {
      return;
    }
    lastResetTime = now;

    if (isAuthenticated && !showIdleWarning) {
      clearIdleTimer();
      startIdleTimer();
    }
  };

  {isAuthenticated && (
    <button
      className="btn-danger"
      style={{ minWidth: 180 }}
      onClick={handleClearDatabase}
      disabled={clearingDb}
    >
      {clearingDb ? (
        <>
          <FaSyncAlt className="spinning" /> Temizleniyor... {progress}%
        </>
      ) : (
        'Databaseyi Temizle'
      )}
    </button>
  )}
  {clearingDb && (
    <div className="progress-bar">
      <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
    </div>
  )}

  const handleIdleLogout = async () => {
    clearIdleTimer();
    await handleLogout();
    showToast('Oturumunuz zaman aşımına uğradı. Lütfen tekrar giriş yapın.', 'warning');
  };

  const startWarningCountdown = () => {
    let remaining = 60;
    setIdleTimeRemaining(remaining);
    
    const interval = setInterval(() => {
      remaining--;
      setIdleTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleIdleLogout();
      }
    }, 1000);
    
    setCountdownInterval(interval);
  };

  const extendSession = () => {
    setShowIdleWarning(false);
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setIdleTimeRemaining(0);
    clearIdleTimer();
    startIdleTimer();
  };

  const setupActivityListeners = () => {
    // Passive event listeners ile performance optimize edildi
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });
  };

  const removeActivityListeners = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, resetIdleTimer, { passive: true });
    });
  };

  // Toast functions
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setLoading(true);
    await loadSectionData();
    setLastRefreshTime(new Date());
    showToast('Veriler güncellendi', 'success');
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    showToast(
      !autoRefresh ? 'Otomatik yenileme açıldı (10sn)' : 'Otomatik yenileme kapatıldı', 
      'info'
    );
  };

  // Auth functions
  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const response = await fetch(`${API_BASE_URL}/api/admin/check`, {
        credentials: 'include'
      });
      console.log('Auth check response:', response.status);
      const data = await response.json();
      console.log('Auth check data:', data);
      
      if (data.isAuthenticated) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        console.log('User authenticated:', data.user);
      } else {
        console.log('User not authenticated');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login success, user data:', userData);
    setIsAuthenticated(true);
    setCurrentUser(userData);
    setActiveSection('dashboard');
  };

  const handleLogout = async () => {
    clearIdleTimer();
    try {
      await fetch(`${API_BASE_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveSection('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Data loading functions
  const loadSectionData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'admins':
          await loadAdmins();
          break;
        case 'tokens':
          await loadTokens();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'trades':
          await loadTrades();
          break;
        case 'messages':
          await loadMessages();
          break;
        case 'settings':
          await loadSettings();
          break;
        case 'logs':
          await loadLogs();
          break;
        case 'hypes':
          await loadHypes();
          break;
        case 'campaigns':
          await loadCampaigns();
          break;
        case 'posts':
          await loadPosts();
          break;
        case 'votes':
          await loadVotes();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Data loading error:', error);
      if (error.message === 'Session expired') {
        setIsAuthenticated(false);
        showToast('Oturum süreniz doldu. Lütfen tekrar giriş yapın.', 'warning');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });
    
    if (response.status === 401) {
      const data = await response.json();
      if (data.sessionExpired) {
        throw new Error('Session expired');
      }
    }
    
    return response;
  };

  const loadDashboard = async () => {
    try {
      console.log('Loading dashboard...');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/analytics`);
      console.log('Dashboard response status:', response.status);
      const data = await response.json();
      console.log('Dashboard data:', data);
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Dashboard error:', data.error);
        // Set default analytics if API fails
        setAnalytics({
          total: { users: 0, tokens: 0, trades: 0, volume: 0, messages: 0, newMessages: 0 },
          lastWeek: { users: 0, tokens: 0, trades: 0 }
        });
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
      // Set default analytics on error
      setAnalytics({
        total: { users: 0, tokens: 0, trades: 0, volume: 0, messages: 0, newMessages: 0 },
        lastWeek: { users: 0, tokens: 0, trades: 0 }
      });
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users`);
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins || []);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('❌ Load admins error:', error);
      setAdmins([]);
    }
  };

  const loadTokens = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/tokens?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      if (data.success) {
        const tokensData = data.tokens || [];
        const totalCount = data.total || 0;
        
        setTokens(tokensData);
        setPagination(prev => ({ ...prev, total: totalCount }));
        
        // Eğer bu sayfa boşsa ve 1'den büyükse, önceki sayfaya dön
        if (tokensData.length === 0 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya git
        const totalPages = Math.ceil(totalCount / pagination.limit);
        if (pagination.page > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setTokens([]);
      }
    } catch (error) {
      console.error('❌ Load tokens error:', error);
      setTokens([]);
    }
  };

  const loadUsers = async () => {
    try {
      // Users için pagination'ı 50 item per page olarak ayarla
      const userLimit = 50;
      const currentPage = pagination.page;
      
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/all-users?page=${currentPage}&limit=${userLimit}`
      );
      const data = await response.json();
      if (data.success) {
        const usersData = data.users || [];
        const totalCount = data.total || 0;
        
        setUsers(usersData);
        setPagination(prev => ({ ...prev, total: totalCount, limit: userLimit }));
        
        // Eğer bu sayfa boşsa ve 1'den büyükse, önceki sayfaya dön
        if (usersData.length === 0 && currentPage > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya git
        const totalPages = Math.ceil(totalCount / userLimit);
        if (currentPage > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Load users error:', error);
      setUsers([]);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/all-trades?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      if (data.success) {
        const tradesData = data.trades || [];
        const totalCount = data.total || 0;
        
        setTrades(tradesData);
        setPagination(prev => ({ ...prev, total: totalCount }));
        
        // Eğer bu sayfa boşsa ve 1'den büyükse, önceki sayfaya dön
        if (tradesData.length === 0 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya git
        const totalPages = Math.ceil(totalCount / pagination.limit);
        if (pagination.page > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setTrades([]);
      }
    } catch (error) {
      console.error('❌ Load trades error:', error);
      setTrades([]);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/contact-messages?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      console.log('📧 Messages response:', data);
      
      if (data.success && data.data) {
        const messagesData = data.data.messages || [];
        const totalCount = data.data.pagination?.total || 0;
        
        setMessages(messagesData);
        setPagination(prev => ({ 
          ...prev, 
          total: totalCount
        }));
        
        // Eğer bu sayfa boşsa ve 1'den büyükse, önceki sayfaya dön
        if (messagesData.length === 0 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya git
        const totalPages = Math.ceil(totalCount / pagination.limit);
        if (pagination.page > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setMessages([]);
        console.warn('⚠️ No messages data in response');
      }
    } catch (error) {
      console.error('❌ Load messages error:', error);
      setMessages([]);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/settings`);
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings || []);
      } else {
        setSettings([]);
      }
    } catch (error) {
      console.error('❌ Load settings error:', error);
      setSettings([]);
    }
  };

  const loadLogs = async () => {
    try {
      // Logs için her zaman 50 limit kullan
      const logsLimit = 50;
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/logs?page=${pagination.page}&limit=${logsLimit}`
      );
      const data = await response.json();
      if (data.success) {
        const logsData = data.logs || [];
        const totalCount = data.pagination?.total || 0;
        
        setLogs(logsData);
        setPagination(prev => ({ 
          ...prev, 
          total: totalCount
        }));
        
        // Eğer bu sayfa boşsa ve 1'den büyükse, önceki sayfaya dön
        if (logsData.length === 0 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        // Eğer mevcut sayfa toplam sayfa sayısından büyükse, son sayfaya git
        const totalPages = Math.ceil(totalCount / logsLimit);
        if (pagination.page > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('❌ Load logs error:', error);
      setLogs([]);
    }
  };

  const loadHypes = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/hypes?page=${pagination.page}&limit=${pagination.limit}&status=${filters.status}&tier=${filters.tier}`
      );
      const data = await response.json();
      if (data.success) {
        setHypes(data.hypes || []);
        setPagination(prev => ({ 
          ...prev, 
          total: data.pagination?.total || 0
        }));
      } else {
        setHypes([]);
      }
    } catch (error) {
      console.error('❌ Load hypes error:', error);
      setHypes([]);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/campaigns?page=${pagination.page}&limit=${pagination.limit}&status=${filters.status}&category=${filters.category || 'all'}`
      );
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setPagination(prev => ({ 
          ...prev, 
          total: data.total || 0,
          totalPages: data.totalPages || 1
        }));
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('❌ Load campaigns error:', error);
      setCampaigns([]);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/posts?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      if (data.success) {
        const postsData = data.posts || [];
        const totalCount = data.pagination?.total || 0;
        
        setPosts(postsData);
        setPagination(prev => ({ ...prev, total: totalCount }));
        
        if (postsData.length === 0 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        const totalPages = Math.ceil(totalCount / pagination.limit);
        if (pagination.page > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Load posts error:', error);
      setPosts([]);
    }
  };

  const loadVotes = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/votes?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();
      if (data.success) {
        const votesData = data.votes || [];
        const totalCount = data.pagination?.total || 0;
        
        setVotes(votesData);
        setPagination(prev => ({ ...prev, total: totalCount }));
        
        if (votesData.length === 0 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
          return;
        }
        
        const totalPages = Math.ceil(totalCount / pagination.limit);
        if (pagination.page > totalPages && totalPages > 0) {
          setPagination(prev => ({ ...prev, page: totalPages }));
        }
      } else {
        setVotes([]);
      }
    } catch (error) {
      console.error('❌ Load votes error:', error);
      setVotes([]);
    }
  };

  // CRUD functions
  const handleSaveAdmin = async (adminData) => {
    try {
      const url = editingItem 
        ? `${API_BASE_URL}/api/admin/users/${editingItem.id}`
        : `${API_BASE_URL}/api/admin/users`;
      
      const response = await fetchWithAuth(url, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
      const data = await response.json();
      
      if (data.success) {
        showToast(editingItem ? 'Admin güncellendi' : 'Admin başarıyla eklendi', 'success');
        setShowAdminModal(false);
        setEditingItem(null);
        loadAdmins();
      } else {
        throw new Error(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Save admin error:', error);
      throw error;
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Bu admini silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Admin başarıyla silindi', 'success');
        loadAdmins();
      } else {
        showToast(data.error || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleDeleteToken = async (address) => {
    if (!window.confirm('Bu tokeni silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/tokens/${address}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Token başarıyla silindi', 'success');
        loadTokens();
      } else {
        showToast(data.error || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Delete token error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleSaveHype = async (hypeData) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/hypes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hypeData)
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Hype başarıyla oluşturuldu', 'success');
        setShowHypeModal(false);
        loadHypes();
      } else {
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('Save hype error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleCancelHype = async (id) => {
    if (!window.confirm('Bu hype\'ı iptal etmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/hypes/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Hype iptal edildi', 'success');
        loadHypes();
      } else {
        showToast(data.error || 'İptal işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Cancel hype error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleSaveCampaign = async (campaignData) => {
    try {
      const url = editingItem 
        ? `${API_BASE_URL}/api/admin/campaigns/${editingItem.id}`
        : `${API_BASE_URL}/api/admin/campaigns`;
      
      const response = await fetchWithAuth(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      const data = await response.json();
      
      if (data.success) {
        showToast(editingItem ? 'Kampanya güncellendi' : 'Kampanya başarıyla oluşturuldu', 'success');
        setShowCampaignModal(false);
        setEditingItem(null);
        loadCampaigns();
      } else {
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('Save campaign error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/campaigns/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Kampanya silindi', 'success');
        loadCampaigns();
      } else {
        showToast(data.error || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bu postu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/posts/${postId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Post silindi', 'success');
        loadPosts();
      } else {
        showToast(data.error || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handlePinPost = async (postId, currentPin) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: !currentPin })
      });
      const data = await response.json();
      
      if (data.success) {
        showToast(data.message, 'success');
        loadPosts();
      } else {
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('Pin post error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleDeleteVote = async (voteId) => {
    if (!window.confirm('Bu oyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/votes/${voteId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Oy silindi', 'success');
        loadVotes();
      } else {
        showToast(data.error || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Delete vote error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  // ============ USER MANAGEMENT HANDLERS ============
  const handleChangeUserStatus = async (userId, newStatus, reason, duration) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, reason, duration })
        }
      );
      const data = await response.json();
      
      if (data.success) {
        showToast(`Kullanıcı durumu ${newStatus} olarak ayarlandı`, 'success');
        // Güncel user bilgisini modal'da göster
        setEditingItem(prev => ({
          ...prev,
          status: data.user?.status || newStatus,
          banReason: data.user?.banReason,
          banExpiresAt: data.user?.banExpiresAt
        }));
        loadUsers();
      } else {
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('Change user status error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleAddBadge = async (userId, badge) => {
    console.log('🔵 [AdminPanel.handleAddBadge] Başladı - userId:', userId, 'badge:', badge);
    try {
      console.log('🟡 [AdminPanel] API çağrılıyor:', `${API_BASE_URL}/api/admin/users/${userId}/badge`);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/users/${userId}/badge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ badge })
        }
      );
      console.log('🟢 [AdminPanel] Response aldı:', response.status);
      const data = await response.json();
      console.log('📊 [AdminPanel] Response data:', data);
      
      if (data.success) {
        console.log('✅ [AdminPanel] Başarılı! Badges:', data.badges);
        showToast(`Rozet eklendi: ${badge}`, 'success');
        // Güncel user bilgisini modal'da göster
        setEditingItem(prev => {
          const updated = {
            ...prev,
            badges: data.badges || prev.badges
          };
          console.log('📝 [AdminPanel] setEditingItem çağrıldı:', updated);
          return updated;
        });
        console.log('🔄 [AdminPanel] loadUsers() çağrılıyor...');
        loadUsers();
      } else {
        console.error('❌ [AdminPanel] API hatası:', data.error);
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('❌ [AdminPanel] Catch hatası:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleRemoveBadge = async (userId, badge) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/users/${userId}/badge/${encodeURIComponent(badge)}`,
        {
          method: 'DELETE'
        }
      );
      const data = await response.json();
      
      if (data.success) {
        showToast(`Rozet çıkarıldı: ${badge}`, 'success');
        // Güncel user bilgisini modal'da göster
        setEditingItem(prev => ({
          ...prev,
          badges: data.badges || prev.badges
        }));
        loadUsers();
      } else {
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('Remove badge error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleUpdateUserInfo = async (userId, userInfo) => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/users/${userId}/info`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userInfo)
        }
      );
      const data = await response.json();
      
      if (data.success) {
        showToast('Kullanıcı bilgileri güncellendi', 'success');
        // Güncel user bilgisini modal'da göster
        setEditingItem(prev => ({
          ...prev,
          ...userInfo
        }));
        loadUsers();
      } else {
        showToast(data.error || 'İşlem başarısız', 'error');
      }
    } catch (error) {
      console.error('Update user info error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleUpdateSetting = async (id, value) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/settings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Ayar başarıyla güncellendi', 'success');
        loadSettings();
      } else {
        showToast(data.error || 'Güncelleme başarısız', 'error');
      }
    } catch (error) {
      console.error('Update setting error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleUpdateMessageStatus = async (messageId, status) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/contact-messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Mesaj durumu başarıyla güncellendi', 'success');
        setShowMessageModal(false);
        setSelectedMessage(null);
        loadMessages();
      } else {
        showToast(data.error || 'Güncelleme başarısız', 'error');
      }
    } catch (error) {
      console.error('Update message status error:', error);
      showToast('Bir hata oluştu', 'error');
    }
  };

  const handleSaveToken = async (tokenData) => {
  try {
    let url, method;
    
    if (selectedToken) {
      // Mevcut tokenı güncelle
      url = `${API_BASE_URL}/api/admin/tokens/${selectedToken.address}`;
      method = 'PATCH';
    } else {
      // Yeni token ekle
      url = `${API_BASE_URL}/api/admin/tokens`;
      method = 'POST';
    }
    
    const response = await fetchWithAuth(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData)
    });
    const data = await response.json();
    
    if (data.success) {
      showToast(
        selectedToken ? 'Token başarıyla güncellendi' : 'Token başarıyla eklendi', 
        'success'
      );
      setShowTokenModal(false);
      setSelectedToken(null);
      loadTokens();
    } else {
      throw new Error(data.error || 'İşlem başarısız');
    }
  } catch (error) {
    console.error('Save token error:', error);
    throw error;
  }
  };

  // Permission check
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return currentUser.permissions?.[permission] === true;
  };

  // Filter functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      tier: 'all',
      action: 'all',
      entity: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const applyFilters = (data) => {
    let filtered = [...data];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => {
        if (activeSection === 'tokens') {
          return item.name?.toLowerCase().includes(searchLower) ||
                 item.symbol?.toLowerCase().includes(searchLower) ||
                 item.address?.toLowerCase().includes(searchLower);
        } else if (activeSection === 'users') {
          return item.walletAddress?.toLowerCase().includes(searchLower);
        } else if (activeSection === 'admins') {
          return item.username?.toLowerCase().includes(searchLower) ||
                 item.email?.toLowerCase().includes(searchLower);
        } else if (activeSection === 'messages') {
          return item.name?.toLowerCase().includes(searchLower) ||
                 item.email?.toLowerCase().includes(searchLower) ||
                 item.subject?.toLowerCase().includes(searchLower);
        } else if (activeSection === 'logs') {
          return item.adminUsername?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower);
        } else if (activeSection === 'posts') {
          return item.title?.toLowerCase().includes(searchLower) ||
                 item.content?.toLowerCase().includes(searchLower);
        } else if (activeSection === 'votes') {
          return item.votingUser?.toLowerCase().includes(searchLower) ||
                 item.targetUser?.toLowerCase().includes(searchLower);
        }
        return true;
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Tier filter (for tokens)
    if (filters.tier !== 'all' && activeSection === 'tokens') {
      filtered = filtered.filter(item => item.tier === filters.tier);
    }

    // Action filter (for logs)
    if (filters.action !== 'all' && activeSection === 'logs') {
      filtered = filtered.filter(item => item.action === filters.action);
    }

    // Entity filter (for logs)
    if (filters.entity !== 'all' && activeSection === 'logs') {
      filtered = filtered.filter(item => item.entity === filters.entity);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(item => new Date(item.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.createdAt) <= toDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[filters.sortBy];
      let bVal = b[filters.sortBy];

      // Handle nested properties
      if (filters.sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  // Render sections
  const renderFilters = () => {
    return (
      <div className={`filters-panel ${showFilters ? 'open' : 'closed'}`}>
        <div className="filters-header">
          <h3>🔍 Filtreler</h3>
          <button className="btn-clear-filters" onClick={clearFilters}>
            🗑️ Temizle
          </button>
        </div>

        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group">
            <label>Arama</label>
            <input
              type="text"
              placeholder="Ara..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Date Range */}
          <div className="filter-group">
            <label>Başlangıç Tarihi</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Bitiş Tarihi</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Status Filter */}
          {(activeSection === 'admins' || activeSection === 'messages') && (
            <div className="filter-group">
              <label>Durum</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="all">Tümü</option>
                {activeSection === 'admins' && (
                  <>
                    <option value="active">Aktif</option>
                    <option value="inactive">İnaktif</option>
                    <option value="suspended">Askıda</option>
                  </>
                )}
                {activeSection === 'messages' && (
                  <>
                    <option value="new">Yeni</option>
                    <option value="read">Okundu</option>
                    <option value="replied">Cevaplandı</option>
                    <option value="archived">Arşiv</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Tier Filter for Tokens */}
          {activeSection === 'tokens' && (
            <div className="filter-group">
              <label>Tier</label>
              <select
                value={filters.tier}
                onChange={(e) => handleFilterChange('tier', e.target.value)}
                className="filter-select"
              >
                <option value="all">Tümü</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          )}

          {/* Action Filter for Logs */}
          {activeSection === 'logs' && (
            <>
              <div className="filter-group">
                <label>İşlem Tipi</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tümü</option>
                  <option value="create">Oluşturma</option>
                  <option value="update">Güncelleme</option>
                  <option value="delete">Silme</option>
                  <option value="login">Giriş</option>
                  <option value="logout">Çıkış</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Varlık Tipi</label>
                <select
                  value={filters.entity}
                  onChange={(e) => handleFilterChange('entity', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tümü</option>
                  <option value="admin">Admin</option>
                  <option value="token">Token</option>
                  <option value="user">Kullanıcı</option>
                  <option value="trade">İşlem</option>
                  <option value="message">Mesaj</option>
                  <option value="setting">Ayar</option>
                </select>
              </div>
            </>
          )}

          {/* Sort Options */}
          <div className="filter-group">
            <label>Sıralama</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Tarih</option>
              {activeSection === 'tokens' && (
                <>
                  <option value="name">İsim</option>
                  <option value="symbol">Sembol</option>
                </>
              )}
              {activeSection === 'admins' && (
                <>
                  <option value="username">Kullanıcı Adı</option>
                  <option value="email">Email</option>
                </>
              )}
            </select>
          </div>

          <div className="filter-group">
            <label>Sıralama Yönü</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="filter-select"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        </div>

        <div className="filter-results">
          <span className="filter-count">
            {applyFilters(
              activeSection === 'tokens' ? tokens :
              activeSection === 'users' ? users :
              activeSection === 'trades' ? trades :
              activeSection === 'messages' ? messages :
              activeSection === 'logs' ? logs :
              activeSection === 'admins' ? admins : []
            ).length} sonuç bulundu
          </span>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!analytics) {
      return (
        <div className="loading">
          <p>Yükleniyor...</p>
        </div>
      );
    }

    // Calculate percentages and trends
    const tokenGrowth = analytics.lastWeek?.tokens > 0 ? '+' + ((analytics.lastWeek.tokens / analytics.total.tokens) * 100).toFixed(1) + '%' : '0%';
    const userGrowth = analytics.lastWeek?.users > 0 ? '+' + ((analytics.lastWeek.users / analytics.total.users) * 100).toFixed(1) + '%' : '0%';
    const tradeGrowth = analytics.lastWeek?.trades > 0 ? '+' + ((analytics.lastWeek.trades / analytics.total.trades) * 100).toFixed(1) + '%' : '0%';

    return (
      <div className="dashboard">
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2>Dashboard</h2>
            <p className="dashboard-subtitle">Hoş geldiniz, <strong>{currentUser?.username}</strong></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="dashboard-time">
              <FaClock /> {new Date().toLocaleString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {isAuthenticated && (
              <>
                <button
                  className="btn-danger"
                  style={{ minWidth: 180 }}
                  onClick={handleClearDatabase}
                  disabled={clearingDb}
                >
                  {clearingDb ? 'Temizleniyor...' : 'Databaseyi Temizle'}
                </button>
                {clearingDb && (
                  <div className="progress-bar">
                    <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>⚠️ Veritabanı Temizleme Onayı</h3>
              </div>
              <div className="modal-body">
                <div className="warning-message">
                  <FaExclamationTriangle className="warning-icon" />
                  <p><strong>Bu işlem geri alınamaz!</strong></p>
                  <p>Tüm veriler (tokenlar, kullanıcılar, işlemler, mesajlar) kalıcı olarak silinecektir.</p>
                  <p className="warning-highlight">Emin misiniz?</p>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn-danger" 
                  onClick={confirmClearDatabase}
                  disabled={clearingDb}
                >
                  {clearingDb ? 'Temizleniyor...' : 'Evet, Temizle'}
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={cancelClearDatabase}
                  disabled={clearingDb}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-box highlight">
            <div className="stat-icon users"><FaUsers /></div>
            <div className="stat-content">
              <h3>{analytics.total?.users || 0}</h3>
              <p>Toplam Kullanıcı</p>
              <div className="stat-footer">
                <span className="stat-change positive">+{analytics.lastWeek?.users || 0} bu hafta</span>
                <span className="stat-percent">{userGrowth}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-box highlight">
            <div className="stat-icon tokens"><FaCoins /></div>
            <div className="stat-content">
              <h3>{analytics.total?.tokens || 0}</h3>
              <p>Toplam Token</p>
              <div className="stat-footer">
                <span className="stat-change positive">+{analytics.lastWeek?.tokens || 0} bu hafta</span>
                <span className="stat-percent">{tokenGrowth}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-box highlight">
            <div className="stat-icon trades"><FaExchangeAlt /></div>
            <div className="stat-content">
              <h3>{analytics.total?.trades || 0}</h3>
              <p>Toplam İşlem</p>
              <div className="stat-footer">
                <span className="stat-change positive">+{analytics.lastWeek?.trades || 0} bu hafta</span>
                <span className="stat-percent">{tradeGrowth}</span>
              </div>
            </div>
          </div>
          
          <div className="stat-box highlight">
            <div className="stat-icon messages"><FaEnvelope /></div>
            <div className="stat-content">
              <h3>{analytics.total?.messages || 0}</h3>
              <p>Toplam Mesaj</p>
              <div className="stat-footer">
                <span className="stat-change warning">{analytics.total?.newMessages || 0} yeni</span>
                <span className="stat-badge">{analytics.total?.newMessages || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h3><FaChartLine /> Haftalık Aktivite (Son 7 Gün)</h3>
          </div>
          <div className="card-content">
            <div className="simple-chart">
              {(() => {
                // Son 7 günün günlerini hesapla
                const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                const weekData = [];
                const now = new Date();
                
                for (let i = 6; i >= 0; i--) {
                  const date = new Date(now);
                  date.setDate(date.getDate() - i);
                  const dayName = days[date.getDay()];
                  
                  // Bu gün için log sayısını hesapla
                  const dayStart = new Date(date.setHours(0, 0, 0, 0));
                  const dayEnd = new Date(date.setHours(23, 59, 59, 999));
                  
                  const count = logs.filter(log => {
                    const logDate = new Date(log.createdAt);
                    return logDate >= dayStart && logDate <= dayEnd;
                  }).length;
                  
                  weekData.push({ day: dayName, count });
                }
                
                // Maximum değeri bul (chart yüksekliği için)
                const maxCount = Math.max(...weekData.map(d => d.count), 1);
                
                return weekData.map((data, index) => {
                  const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                  return (
                    <div key={index} className="chart-bar-container">
                      <div className="chart-bar" style={{ height: `${Math.max(height, 5)}%` }}>
                        <span className="chart-value">{data.count}</span>
                      </div>
                      <span className="chart-label">{data.day}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="dashboard-grid">
          {/* Recent Tokens */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3><FaCoins /> Son Oluşturulan Tokenler</h3>
              <button className="btn-link" onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('tokens');
              }}>
                Tümünü Gör →
              </button>
            </div>
            <div className="card-content">
              {tokens.slice(0, 5).map(token => (
                <div key={token.address} className="activity-item">
                  <div className="activity-icon token"><FaCoins /></div>
                  <div className="activity-info">
                    <h4>{token.name} ({token.symbol})</h4>
                    <p>{new Date(token.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="activity-meta">
                    <span className="supply">{(token.totalSupply / 1e18).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {tokens.length === 0 && (
                <div className="empty-state-mini">
                  <p>Henüz token oluşturulmamış</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Logs */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3><FaClipboardList /> Son Aktiviteler</h3>
              <button className="btn-link" onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('logs');
              }}>
                Tümünü Gör →
              </button>
            </div>
            <div className="card-content">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="activity-item">
                  <div className={`activity-icon ${log.action}`}>
                    {log.action === 'create' && <FaPlus />}
                    {log.action === 'update' && <FaEdit />}
                    {log.action === 'delete' && <FaTrash />}
                    {log.action === 'login' && <FaCheck />}
                  </div>
                  <div className="activity-info">
                    <h4>{log.adminUsername}</h4>
                    <p>{log.description}</p>
                  </div>
                  <div className="activity-meta">
                    <span className="time">{new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="empty-state-mini">
                  <p>Henüz aktivite kaydı yok</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="dashboard-card system-status">
            <div className="card-header">
              <h3><FaCog /> Sistem Durumu</h3>
            </div>
            <div className="card-content">
              <div className="status-item">
                <div className="status-label">
                  <div className="status-dot active"></div>
                  <span>Backend Sunucu</span>
                </div>
                <span className="status-value success">Aktif</span>
              </div>
              <div className="status-item">
                <div className="status-label">
                  <div className="status-dot active"></div>
                  <span>Veritabanı</span>
                </div>
                <span className="status-value success">Bağlı</span>
              </div>
              <div className="status-item">
                <div className="status-label">
                  <div className="status-dot active"></div>
                  <span>Blockchain</span>
                </div>
                <span className="status-value success">Bağlı</span>
              </div>
              <div className="status-item">
                <div className="status-label">
                  <div className="status-dot"></div>
                  <span>Toplam Admin</span>
                </div>
                <span className="status-value">{admins.length}</span>
              </div>
              <div className="status-item">
                <div className="status-label">
                  <div className="status-dot"></div>
                  <span>Oturum Süresi</span>
                </div>
                <span className="status-value">5 dk</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card quick-actions">
            <div className="card-header">
              <h3><FaChartLine /> Hızlı İşlemler</h3>
            </div>
            <div className="card-content">
              <button 
                className="quick-action-btn" 
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setActiveSection('admins');
                  setShowAdminModal(true);
                }}
                disabled={!hasPermission('manage_admins')}
              >
                <FaUserShield />
                <span>Yeni Admin Ekle</span>
              </button>
              <button 
                className="quick-action-btn" 
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setActiveSection('tokens');
                }}
                disabled={!hasPermission('manage_tokens')}
              >
                <FaCoins />
                <span>Tokenları Yönet</span>
              </button>
              <button 
                className="quick-action-btn" 
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setActiveSection('messages');
                }}
                disabled={!hasPermission('manage_contact')}
              >
                <FaEnvelope />
                <span>Mesajları Görüntüle</span>
              </button>
              <button 
                className="quick-action-btn" 
                onClick={() => {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setActiveSection('settings');
                }}
                disabled={!hasPermission('manage_settings')}
              >
                <FaCog />
                <span>Ayarları Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdmins = () => {
    const filteredAdmins = applyFilters(admins);
    
    return (
      <div className="admins-section">
        <div className="section-header">
          <h2>Adminler</h2>
        </div>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kullanıcı Adı</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Durum</th>
                <th>Son Giriş</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map(admin => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.username}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`badge ${admin.role}`}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 
                       admin.role === 'admin' ? 'Admin' : 'Moderator'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${admin.status}`}>
                      {admin.status === 'active' ? 'Aktif' : 
                       admin.status === 'inactive' ? 'İnaktif' : 'Askıda'}
                    </span>
                  </td>
                  <td>{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('tr-TR') : '-'}</td>
                  <td className="actions">
                    {hasPermission('manage_admins') && admin.role !== 'super_admin' && (
                      <>
                        <button 
                          className="btn-icon edit" 
                          onClick={() => {
                            setEditingItem(admin);
                            setShowAdminModal(true);
                          }}
                          title="Düzenle"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleDeleteAdmin(admin.id)}
                          title="Sil"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAdmins.length === 0 && (
            <div className="empty-state">
              <p>Filtreye uygun sonuç bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTokens = () => {
  const filteredTokens = applyFilters(tokens);
  
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return (
      <div className="tokens-section">
        <div className="section-header">
          <h2>Token Yönetimi</h2>

        </div>
        <div className="empty-state">
          <FaCoins style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
          <p>Henüz token oluşturulmamış</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tokens-section">
      <div className="section-header">
        <h2>Token Yönetimi</h2>
        <div className="section-actions">
          <button 
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filtreler {showFilters ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {renderFilters()}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>İsim</th>
              <th>Sembol</th>
              <th>Kontrat Adresi</th>
              <th>Supply</th>
              <th>Tier</th>
              <th>Oluşturan</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map(token => (
              <tr key={token.address}>
                <td>
                  {token.logoURL ? (
                    <img 
                      src={token.logoURL} 
                      alt={token.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      No Logo
                    </div>
                  )}
                </td>
                <td>{token.name}</td>
                <td><strong>{token.symbol}</strong></td>
                <td><code className="address">{token.address}</code></td>
                <td>{parseInt(token.totalSupply || token.initialSupply).toLocaleString()}</td>
                <td><span className={`badge ${token.tier}`}>{token.tier}</span></td>
                <td><code>{token.creatorUser?.walletAddress?.slice(0, 10) || 'Admin'}</code></td>
                <td>{new Date(token.createdAt).toLocaleDateString('tr-TR')}</td>
                <td className="actions">
                  {hasPermission('manage_tokens') && (
                    <>
                      <button 
                        className="btn-icon edit" 
                        onClick={() => {
                          setSelectedToken(token);
                          setShowTokenModal(true);
                        }}
                        title="Düzenle"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleDeleteToken(token.address)}
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTokens.length === 0 && (
          <div className="empty-state">
            <p>Filtreye uygun sonuç bulunamadı</p>
          </div>
        )}
      </div>

      {renderPagination()}
    </div>
  );
  };

  const renderUsers = () => {
    let filteredUsers = applyFilters(users);
    
    // Apply filterText for users search
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.walletAddress && user.walletAddress.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      return (
        <div className="users-section">
          <div className="section-header">
            <h2>👥 Kullanıcı Yönetimi</h2>
          </div>
          <div className="empty-state">
            <FaUsers style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
            <p>Henüz kullanıcı bulunmuyor</p>
          </div>
        </div>
      );
    }

    return (
      <div className="users-section" style={{ padding: '0' }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderBottom: '2px solid #F0B90B',
          padding: '30px',
          borderRadius: '12px 12px 0 0',
          color: '#fff',
          marginBottom: '0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#F0B90B' }}>👥 Kullanıcı Yönetimi</h2>
              <p style={{ margin: '0', opacity: '0.8', fontSize: '14px', color: '#f0f0f0' }}>Toplam {pagination.total} kullanıcı</p>
            </div>
            <div style={{
              backgroundColor: 'rgba(240, 185, 11, 0.1)',
              padding: '12px 20px',
              borderRadius: '8px',
              border: '1px solid #F0B90B',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#F0B90B' }}>{filteredUsers.length}</p>
              <p style={{ margin: '0', fontSize: '12px', opacity: '0.8', color: '#f0f0f0' }}>Görüntülenen</p>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            backgroundColor: 'rgba(26, 26, 26, 0.5)',
            padding: '15px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(240, 185, 11, 0.2)'
          }}>
            <input 
              type="text" 
              placeholder="🔍 Kullanıcı adı, cüzdan veya email ara..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{
                flex: '1',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #F0B90B',
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#F8D33A';
                e.target.style.boxShadow = '0 0 8px rgba(240, 185, 11, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#F0B90B';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '12px 20px',
                backgroundColor: 'rgba(240, 185, 11, 0.15)',
                color: '#F0B90B',
                border: '1px solid #F0B90B',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.25)';
                e.target.style.boxShadow = '0 0 12px rgba(240, 185, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.15)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {showFilters ? '🔽 Filtreler Aç' : '▶️ Filtreler Kapat'}
            </button>
          </div>
        </div>

        {renderFilters()}

        {/* Users Grid/Cards */}
        <div style={{
          padding: '30px',
          backgroundColor: 'rgba(10, 10, 10, 0.5)'
        }}>
          {filteredUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'rgba(26, 26, 26, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid rgba(240, 185, 11, 0.1)'
            }}>
              <FaUsers style={{ fontSize: '64px', color: '#F0B90B', marginBottom: '20px', opacity: '0.5' }} />
              <h3 style={{ color: '#F0B90B', marginBottom: '10px' }}>Kullanıcı Bulunamadı</h3>
              <p style={{ color: '#888', margin: '0' }}>Arama kriterlerine uygun kullanıcı yok</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.6)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: user.status === 'banned' ? '2px solid #ff4444' : user.status === 'suspended' ? '2px solid #F0B90B' : '1px solid rgba(240, 185, 11, 0.2)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    background: user.status === 'banned' ? 'rgba(255, 68, 68, 0.05)' : user.status === 'suspended' ? 'rgba(240, 185, 11, 0.05)' : 'rgba(26, 26, 26, 0.6)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 185, 11, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#F8D33A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = user.status === 'banned' ? '#ff4444' : user.status === 'suspended' ? '#F0B90B' : 'rgba(240, 185, 11, 0.2)';
                  }}
                >
                  {/* Status Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: user.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : user.status === 'suspended' ? 'rgba(240, 185, 11, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                    color: user.status === 'active' ? '#4caf50' : user.status === 'suspended' ? '#F0B90B' : '#f44336',
                    border: `1px solid ${user.status === 'active' ? '#4caf50' : user.status === 'suspended' ? '#F0B90B' : '#f44336'}`
                  }}>
                    {user.status === 'active' ? '✅ Aktif' : user.status === 'suspended' ? '⏸️ Askıya' : '🚫 Banlandı'}
                  </div>

                  {/* User Info */}
                  <div style={{ marginBottom: '15px', paddingRight: '100px' }}>
                    <h3 style={{
                      margin: '0 0 5px 0',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#F0B90B'
                    }}>
                      <VerifiedUsername
                        username={user.username || `User ${user.id}`}
                        badges={user.badges || []}
                        isVerified={user.badges?.some(b => typeof b === 'string' ? b.includes('Verified') : false) || false}
                        fontSize={16}
                        walletAddress={user.walletAddress}
                      />
                    </h3>
                    <code style={{
                      fontSize: '11px',
                      backgroundColor: 'rgba(240, 185, 11, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: '#F8D33A',
                      display: 'inline-block',
                      marginBottom: '8px',
                      border: '1px solid rgba(240, 185, 11, 0.2)'
                    }}>
                      {user.walletAddress?.slice(0, 10)}...{user.walletAddress?.slice(-8)}
                    </code>
                    {user.email && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#aaa' }}>
                        📧 {user.email}
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  {user.badges && user.badges.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#F0B90B' }}>Rozetler:</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {user.badges.slice(0, 3).map(badge => (
                          <span 
                            key={badge}
                            style={{
                              backgroundColor: 'rgba(240, 185, 11, 0.15)',
                              color: '#F0B90B',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              border: '1px solid rgba(240, 185, 11, 0.3)'
                            }}
                          >
                            ⭐ {badge}
                          </span>
                        ))}
                        {user.badges.length > 3 && (
                          <span style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#aaa',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            +{user.badges.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid rgba(240, 185, 11, 0.1)'
                  }}>
                    <span>📅 {new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                    <span>🪙 {user.tokensOwned || 0} Token</span>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button 
                      style={{
                        flex: '1',
                        padding: '10px 16px',
                        backgroundColor: 'rgba(240, 185, 11, 0.2)',
                        color: '#F0B90B',
                        border: '1px solid #F0B90B',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => {
                        setEditingItem(user);
                        setShowAdminModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.3)';
                        e.target.style.boxShadow = '0 0 12px rgba(240, 185, 11, 0.3)';
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.2)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      ✏️ Düzenle
                    </button>
                    <button 
                      style={{
                        flex: '1',
                        padding: '10px 16px',
                        backgroundColor: 'rgba(248, 211, 58, 0.2)',
                        color: '#F8D33A',
                        border: '1px solid #F8D33A',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => {
                        setEditingItem(user);
                        setShowUserEditModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(248, 211, 58, 0.3)';
                        e.target.style.boxShadow = '0 0 12px rgba(248, 211, 58, 0.3)';
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(248, 211, 58, 0.2)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      ⚙️ Yönet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px',
          padding: '30px 20px',
          backgroundColor: 'rgba(26, 26, 26, 0.3)',
          borderTop: '1px solid rgba(240, 185, 11, 0.2)'
        }}>
          <button 
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            style={{
              padding: '10px 20px',
              backgroundColor: pagination.page === 1 ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.2)',
              color: pagination.page === 1 ? '#666' : '#F0B90B',
              border: `1px solid ${pagination.page === 1 ? 'rgba(240, 185, 11, 0.1)' : '#F0B90B'}`,
              borderRadius: '6px',
              cursor: pagination.page === 1 ? 'default' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              if (pagination.page !== 1) {
                e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.3)';
                e.target.style.boxShadow = '0 0 12px rgba(240, 185, 11, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (pagination.page !== 1) {
                e.target.style.backgroundColor = 'rgba(240, 185, 11, 0.2)';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            ← Önceki
          </button>
          
          <div style={{
            backgroundColor: 'rgba(240, 185, 11, 0.1)',
            padding: '10px 20px',
            borderRadius: '6px',
            minWidth: '150px',
            textAlign: 'center',
            fontWeight: '600',
            color: '#F0B90B',
            border: '1px solid rgba(240, 185, 11, 0.3)'
          }}>
            Sayfa <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{pagination.page}</span> / <span style={{ fontSize: '14px' }}>{Math.ceil(pagination.total / 50)}</span>
          </div>

          <button 
            onClick={() => setPagination(prev => ({ 
              ...prev, 
              page: Math.min(Math.ceil(pagination.total / 50), prev.page + 1) 
            }))}
            disabled={pagination.page >= Math.ceil(pagination.total / 50)}
            style={{
              padding: '10px 20px',
              backgroundColor: pagination.page >= Math.ceil(pagination.total / 50) ? 'rgba(248, 211, 58, 0.1)' : 'rgba(248, 211, 58, 0.2)',
              color: pagination.page >= Math.ceil(pagination.total / 50) ? '#666' : '#F8D33A',
              border: `1px solid ${pagination.page >= Math.ceil(pagination.total / 50) ? 'rgba(248, 211, 58, 0.1)' : '#F8D33A'}`,
              borderRadius: '6px',
              cursor: pagination.page >= Math.ceil(pagination.total / 50) ? 'default' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              if (pagination.page < Math.ceil(pagination.total / 50)) {
                e.target.style.backgroundColor = 'rgba(248, 211, 58, 0.3)';
                e.target.style.boxShadow = '0 0 12px rgba(248, 211, 58, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (pagination.page < Math.ceil(pagination.total / 50)) {
                e.target.style.backgroundColor = 'rgba(248, 211, 58, 0.2)';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            Sonraki →
          </button>
        </div>
      </div>
    );
  };

  const renderTrades = () => {
    const filteredTrades = applyFilters(trades);
    
    if (!Array.isArray(trades) || trades.length === 0) {
      return (
        <div className="trades-section">
          <div className="section-header">
            <h2>İşlem Yönetimi</h2>
          </div>
          <div className="empty-state">
            <FaExchangeAlt style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
            <p>Henüz işlem yapılmamış</p>
          </div>
        </div>
      );
    }

    return (
      <div className="trades-section">
        <div className="section-header">
          <h2>İşlem Yönetimi</h2>
          <div className="section-actions">
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtreler {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {renderFilters()}

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Token</th>
                <th>Tür</th>
                <th>Miktar</th>
                <th>Fiyat</th>
                <th>İşlem Yapan</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map(trade => (
                <tr key={trade.id}>
                  <td>{trade.id}</td>
                  <td>{trade.token?.name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${trade.type}`}>
                      {trade.type === 'buy' ? 'Alış' : 'Satış'}
                    </span>
                  </td>
                  <td>{parseFloat(trade.amount).toFixed(4)}</td>
                  <td>{parseFloat(trade.price).toFixed(6)} BNB</td>
                  <td><code>{trade.trader?.walletAddress?.slice(0, 10)}...</code></td>
                  <td>{new Date(trade.createdAt).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTrades.length === 0 && (
            <div className="empty-state">
              <p>Filtreye uygun sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderMessages = () => {
    const filteredMessages = applyFilters(messages);
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return (
        <div className="messages-section">
          <div className="section-header">
            <h2>İletişim Mesajları</h2>
          </div>
          <div className="empty-state">
            <FaEnvelope style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
            <p>Henüz mesaj bulunmuyor</p>
          </div>
        </div>
      );
    }

    return (
      <div className="messages-section">
        <div className="section-header">
          <h2>İletişim Mesajları</h2>
          <div className="section-actions">
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtreler {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {renderFilters()}

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>İsim</th>
                <th>Email</th>
                <th>Konu</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map(message => (
                <tr key={message.id}>
                  <td>{message.id}</td>
                  <td>{message.name}</td>
                  <td>{message.email}</td>
                  <td>{message.subject}</td>
                  <td>
                    <span className={`badge ${message.status}`}>
                      {message.status === 'new' ? 'Yeni' :
                       message.status === 'read' ? 'Okundu' :
                       message.status === 'replied' ? 'Cevaplandı' : 'Arşiv'}
                    </span>
                  </td>
                  <td>{new Date(message.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="actions">
                    <button 
                      className="btn-icon view" 
                      title="Görüntüle"
                      onClick={() => {
                        setSelectedMessage(message);
                        setShowMessageModal(true);
                      }}
                    >
                      <FaEnvelope />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMessages.length === 0 && (
            <div className="empty-state">
              <p>Filtreye uygun sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Site Ayarları</h2>
        {hasPermission('manage_settings') && (
          <button className="btn-primary" onClick={() => {
            setEditingItem(null);
            setShowSettingModal(true);
          }}>
            <FaPlus /> Yeni Ayar
          </button>
        )}
      </div>

      <div className="settings-grid">
        {Object.entries(
          settings.reduce((acc, setting) => {
            if (!acc[setting.category]) acc[setting.category] = [];
            acc[setting.category].push(setting);
            return acc;
          }, {})
        ).map(([category, items]) => (
          <div key={category} className="settings-category">
            <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <div className="settings-items">
              {items.map(setting => (
                <div key={setting.id} className="setting-item">
                  <div className="setting-info">
                    <strong>{setting.key}</strong>
                    <p>{setting.description}</p>
                  </div>
                  <div className="setting-value">
                    {setting.type === 'boolean' ? (
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={setting.value === 'true'}
                          onChange={(e) => handleUpdateSetting(setting.id, e.target.checked ? 'true' : 'false')}
                          disabled={!hasPermission('manage_settings')}
                        />
                        <span className="slider"></span>
                      </label>
                    ) : (
                      <input
                        type={setting.type === 'number' ? 'number' : 'text'}
                        value={setting.value}
                        onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
                        disabled={!hasPermission('manage_settings')}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCampaigns = () => {
    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      return (
        <div className="campaigns-section">
          <div className="section-header">
            <h2>🎉 Kampanya Yönetimi</h2>
            <button className="btn-primary" onClick={() => { setEditingItem(null); setShowCampaignModal(true); }}>
              <FaPlus /> Yeni Kampanya
            </button>
          </div>
          <div className="empty-state">
            <FaClipboardList style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
            <p>Henüz kampanya bulunmuyor</p>
          </div>
        </div>
      );
    }

    const getStatusBadge = (status) => {
      const badges = {
        draft: { text: '📝 Taslak', class: 'warning' },
        active: { text: '✓ Aktif', class: 'success' },
        ended: { text: '⏱ Bitti', class: 'error' },
        cancelled: { text: '✗ İptal', class: 'error' }
      };
      return badges[status] || { text: status, class: 'default' };
    };

    return (
      <div className="campaigns-section">
        <div className="section-header">
          <h2>🎉 Kampanya Yönetimi</h2>
          <div className="section-actions">
            <select 
              value={filters.status} 
              onChange={(e) => { setFilters({...filters, status: e.target.value}); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="filter-select"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="active">Aktif</option>
              <option value="ended">Bitti</option>
              <option value="cancelled">İptal</option>
            </select>
            <select 
              value={filters.category || 'all'} 
              onChange={(e) => { setFilters({...filters, category: e.target.value}); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="filter-select"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="general">Genel</option>
              <option value="airdrop">Airdrop</option>
              <option value="competition">Yarışma</option>
              <option value="partnership">Ortaklık</option>
              <option value="event">Etkinlik</option>
              <option value="promotion">Promosyon</option>
            </select>
            <button className="btn-primary" onClick={() => { setEditingItem(null); setShowCampaignModal(true); }}>
              <FaPlus /> Yeni Kampanya
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kampanya</th>
                <th>Kategori</th>
                <th>Durum</th>
                <th>Tarihler</th>
                <th>İstatistikler</th>
                <th>Öne Çıkan</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const statusBadge = getStatusBadge(campaign.status);
                return (
                  <tr key={campaign.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {campaign.bannerUrl && (
                          <img 
                            src={campaign.bannerUrl} 
                            alt={campaign.title}
                            style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        )}
                        <div>
                          <strong>{campaign.title}</strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            /{campaign.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{campaign.category || 'general'}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div>🚀 {new Date(campaign.startDate).toLocaleDateString('tr-TR')}</div>
                        <div>🏁 {new Date(campaign.endDate).toLocaleDateString('tr-TR')}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div>👁️ {campaign.views || 0} görüntülenme</div>
                        <div>🔗 {campaign.clicks || 0} tıklama</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ textAlign: 'center' }}>
                        {campaign.featured ? (
                          <span style={{ fontSize: '20px' }}>⭐</span>
                        ) : (
                          <span style={{ fontSize: '20px', opacity: 0.3 }}>☆</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => { setEditingItem(campaign); setShowCampaignModal(true); }}
                          title="Düzenle"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          title="Sil"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
            >
              Önceki
            </button>
            <span>Sayfa {pagination.page} / {pagination.totalPages}</span>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHypes = () => {
    if (!Array.isArray(hypes) || hypes.length === 0) {
      return (
        <div className="hypes-section">
          <div className="section-header">
            <h2>🚀 Token Hype Yönetimi</h2>
            <button className="btn-primary" onClick={() => setShowHypeModal(true)}>
              <FaPlus /> Yeni Hype
            </button>
          </div>
          <div className="empty-state">
            <FaChartLine style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
            <p>Henüz hype kaydı bulunmuyor</p>
          </div>
        </div>
      );
    }

    const getTierBadge = (tier) => {
      const badges = {
        platinum: { text: '💎 PLATINUM', class: 'platinum', color: '#E5E4E2' },
        gold: { text: '👑 GOLD', class: 'gold', color: '#FFD700' },
        silver: { text: '⭐ SILVER', class: 'silver', color: '#C0C0C0' },
        bronze: { text: '🔥 BRONZE', class: 'bronze', color: '#CD7F32' }
      };
      return badges[tier] || { text: tier, class: 'default', color: '#999' };
    };

    const getStatusBadge = (status) => {
      const badges = {
        active: { text: '✓ Aktif', class: 'success' },
        expired: { text: '⏱ Süresi Doldu', class: 'warning' },
        cancelled: { text: '✗ İptal Edildi', class: 'error' }
      };
      return badges[status] || { text: status, class: 'default' };
    };

    return (
      <div className="hypes-section">
        <div className="section-header">
          <h2>🚀 Token Hype Yönetimi</h2>
          <div className="section-actions">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="filter-select"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="expired">Süresi Dolmuş</option>
              <option value="cancelled">İptal Edilmiş</option>
            </select>
            <select 
              value={filters.tier} 
              onChange={(e) => setFilters({...filters, tier: e.target.value})}
              className="filter-select"
            >
              <option value="all">Tüm Tier'lar</option>
              <option value="platinum">💎 Platinum</option>
              <option value="gold">👑 Gold</option>
              <option value="silver">⭐ Silver</option>
              <option value="bronze">🔥 Bronze</option>
            </select>
            <button className="btn-primary" onClick={() => setShowHypeModal(true)}>
              <FaPlus /> Yeni Hype
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Token</th>
                <th>Tier</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Fiyat (BNB)</th>
                <th>Görüntülenme</th>
                <th>Tıklama</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {hypes.map(hype => {
                const tierBadge = getTierBadge(hype.tier);
                const statusBadge = getStatusBadge(hype.status);
                const token = hype.token || {};
                
                return (
                  <tr key={hype.id}>
                    <td>{hype.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {token.logoURL && (
                          <img 
                            src={token.logoURL} 
                            alt={token.name}
                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: '600' }}>{token.name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>{token.symbol || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={`badge ${tierBadge.class}`}
                        style={{ background: `${tierBadge.color}22`, color: tierBadge.color, border: `1px solid ${tierBadge.color}` }}
                      >
                        {tierBadge.text}
                      </span>
                    </td>
                    <td>{new Date(hype.startTime).toLocaleString('tr-TR', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</td>
                    <td>{new Date(hype.endTime).toLocaleString('tr-TR', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</td>
                    <td>{hype.price || '0'}</td>
                    <td>
                      <span style={{ 
                        background: 'rgba(0, 255, 163, 0.1)', 
                        color: '#00FFA3', 
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        {hype.views || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        background: 'rgba(240, 185, 11, 0.1)', 
                        color: '#F0B90B', 
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        {hype.clicks || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {hype.status === 'active' && (
                          <button
                            className="btn-icon error"
                            onClick={() => handleCancelHype(hype.id)}
                            title="İptal Et"
                          >
                            <FaTimes />
                          </button>
                        )}
                        {hype.transactionHash && (
                          <a
                            href={`https://bscscan.com/tx/${hype.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon info"
                            title="Transaction'ı Görüntüle"
                          >
                            🔗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderPosts = () => {
    const filteredPosts = applyFilters(posts);
    
    if (!Array.isArray(posts) || posts.length === 0) {
      return (
        <div className="posts-section">
          <div className="section-header">
            <h2>📝 Postlar Yönetimi</h2>
          </div>
          <div className="empty-state">
            <p>Henüz post bulunmuyor</p>
          </div>
        </div>
      );
    }

    return (
      <div className="posts-section">
        <div className="section-header">
          <h2>📝 Postlar Yönetimi</h2>
          <div className="section-actions">
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtreler {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {renderFilters()}

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Başlık</th>
                <th>Oluşturan</th>
                <th>Tür</th>
                <th>Pinlendi</th>
                <th>Beğeni</th>
                <th>Yorum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => (
                <tr key={post.id}>
                  <td><code>{post.id.substring(0, 8)}</code></td>
                  <td>{post.title.substring(0, 50)}</td>
                  <td>
                    <VerifiedUsername
                      username={post.creator?.username || post.creatorAddress?.slice(0, 10)}
                      badges={post.creator?.badges || []}
                      isVerified={post.creator?.badges?.some(b => typeof b === 'string' ? b.includes('Verified') : false) || false}
                      fontSize={12}
                      walletAddress={post.creatorAddress}
                    />
                  </td>
                  <td>
                    <span className={`badge ${post.postType}`}>
                      {post.postType === 'launch' ? '🚀 Launch' :
                       post.postType === 'update' ? '📢 Güncelleme' : '📝 Duyuru'}
                    </span>
                  </td>
                  <td>
                    {post.isPinned ? (
                      <span style={{ color: '#F0B90B', fontSize: '18px' }}>📌</span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '18px' }}>○</span>
                    )}
                  </td>
                  <td>{(post.likes || []).length}</td>
                  <td>{post.commentCount || 0}</td>
                  <td>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="actions">
                    <button 
                      className="btn-icon edit" 
                      onClick={() => handlePinPost(post.id, post.isPinned)}
                      title={post.isPinned ? 'Unpin Yap' : 'Pin Yap'}
                    >
                      📌
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDeletePost(post.id)}
                      title="Sil"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPosts.length === 0 && (
            <div className="empty-state">
              <p>Filtreye uygun sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderVotes = () => {
    const filteredVotes = applyFilters(votes);
    
    if (!Array.isArray(votes) || votes.length === 0) {
      return (
        <div className="votes-section">
          <div className="section-header">
            <h2>🗳️ Oylar Yönetimi</h2>
          </div>
          <div className="empty-state">
            <p>Henüz oy bulunmuyor</p>
          </div>
        </div>
      );
    }

    return (
      <div className="votes-section">
        <div className="section-header">
          <h2>🗳️ Oylar Yönetimi</h2>
          <div className="section-actions">
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtreler {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {renderFilters()}

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Oy Kullanan</th>
                <th>Hedef Kullanıcı</th>
                <th>Oy Tipi</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredVotes.map(vote => (
                <tr key={vote.id}>
                  <td><code>{vote.id.substring(0, 8)}</code></td>
                  <td><code>{vote.votingUser.slice(0, 10)}</code></td>
                  <td><code>{vote.targetUser.slice(0, 10)}</code></td>
                  <td>
                    <span className={`badge ${vote.type === 'up' ? 'success' : 'error'}`}>
                      {vote.type === 'up' ? '👍 Up' : '👎 Down'}
                    </span>
                  </td>
                  <td>{new Date(vote.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="actions">
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDeleteVote(vote.id)}
                      title="Sil"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVotes.length === 0 && (
            <div className="empty-state">
              <p>Filtreye uygun sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderLogs = () => {
    const filteredLogs = applyFilters(logs);
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return (
        <div className="logs-section">
          <div className="section-header">
            <h2>Aktivite Logları</h2>
          </div>
          <div className="empty-state">
            <FaClipboardList style={{ fontSize: '48px', color: '#666', marginBottom: '16px' }} />
            <p>Henüz aktivite kaydı bulunmuyor</p>
          </div>
        </div>
      );
    }

    const getActionBadge = (action) => {
      const badges = {
        create: { text: 'Oluşturma', class: 'success' },
        update: { text: 'Güncelleme', class: 'info' },
        delete: { text: 'Silme', class: 'error' },
        login: { text: 'Giriş', class: 'info' },
        logout: { text: 'Çıkış', class: 'warning' }
      };
      return badges[action] || { text: action, class: 'default' };
    };

    const getEntityName = (entity) => {
      const names = {
        admin: 'Admin',
        token: 'Token',
        user: 'Kullanıcı',
        trade: 'İşlem',
        message: 'Mesaj',
        setting: 'Ayar'
      };
      return names[entity] || entity;
    };

    return (
      <div className="logs-section">
        <div className="section-header">
          <h2>Aktivite Logları</h2>
          <div className="section-actions">
            <button 
              className={`btn-filter ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filtreler {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {renderFilters()}

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tarih/Saat</th>
                <th>Admin</th>
                <th>İşlem</th>
                <th>Varlık</th>
                <th>Açıklama</th>
                <th>Durum</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const actionBadge = getActionBadge(log.action);
                return (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{new Date(log.createdAt).toLocaleString('tr-TR')}</td>
                    <td>{log.adminUsername || '-'}</td>
                    <td>
                      <span className={`badge ${actionBadge.class}`}>
                        {actionBadge.text}
                      </span>
                    </td>
                    <td>{getEntityName(log.entity)}</td>
                    <td className="log-description">{log.description}</td>
                    <td>
                      <span className={`badge ${log.status}`}>
                        {log.status === 'success' ? 'Başarılı' : 
                         log.status === 'failed' ? 'Başarısız' : 'Uyarı'}
                      </span>
                    </td>
                    <td><code>{log.ipAddress || '-'}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="empty-state">
              <p>Filtreye uygun sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderPagination = () => {
    // Logs için limit 50, diğerleri için 20
    const limit = activeSection === 'logs' ? 50 : pagination.limit;
    const totalPages = Math.ceil(pagination.total / limit);
    
    if (totalPages <= 1) return null;

    const handlePrevPage = () => {
      if (pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      }
    };

    const handleNextPage = () => {
      if (pagination.page < totalPages) {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      }
    };

    return (
      <div className="pagination">
        <button
          onClick={handlePrevPage}
          disabled={pagination.page === 1}
          className="pagination-btn"
        >
          ← Önceki
        </button>
        <div className="pagination-info">
          <span className="current-page">Sayfa {pagination.page}</span>
          <span className="page-separator">/</span>
          <span className="total-pages">{totalPages}</span>
          <span className="total-items">({pagination.total} kayıt)</span>
        </div>
        <button
          onClick={handleNextPage}
          disabled={pagination.page >= totalPages}
          className="pagination-btn"
        >
          Sonraki →
        </button>
      </div>
    );
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="admin-panel loading-screen">
        <div className="spinner-large"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close mobile menu when clicking outside
  const closeMobileMenu = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Main admin panel
  return (
    <div className="admin-panel-full">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Admin Modal */}
      {activeSection === 'users' ? (
        <UserEditModal 
          show={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setEditingItem(null);
          }}
          user={editingItem}
          onStatusChange={handleChangeUserStatus}
          onAddBadge={handleAddBadge}
          onRemoveBadge={handleRemoveBadge}
          onUpdateInfo={handleUpdateUserInfo}
        />
      ) : (
        <AdminModal 
          show={showAdminModal}
          onClose={() => {
            setShowAdminModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveAdmin}
          editingAdmin={editingItem}
        />
      )}

      {/* Token Modal */}
      <TokenModal 
        show={showTokenModal}
        onClose={() => {
          setShowTokenModal(false);
          setSelectedToken(null);
        }}
        onSave={handleSaveToken}
        editingToken={selectedToken}
      />

      {/* Hype Modal */}
      <AdminHypeModal 
        isOpen={showHypeModal}
        onClose={() => setShowHypeModal(false)}
        onSave={handleSaveHype}
      />

      {/* Campaign Modal */}
      <AdminCampaignModal 
        isOpen={showCampaignModal}
        onClose={() => { setShowCampaignModal(false); setEditingItem(null); }}
        onSave={handleSaveCampaign}
        campaign={editingItem}
      />

      {/* Message Modal */}
      <MessageModal 
        show={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedMessage(null);
        }}
        message={selectedMessage}
        onUpdateStatus={handleUpdateMessageStatus}
      />

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

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

      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>MEME FORGE</h1>
          <span className="admin-badge">{currentUser?.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setActiveSection('dashboard');
              closeMobileMenu();
            }}
          >
            <FaTachometerAlt /> Dashboard
          </button>

          {hasPermission('manage_admins') && (
            <button 
              className={activeSection === 'admins' ? 'active' : ''}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('admins');
                closeMobileMenu();
              }}
            >
              <FaUserShield /> Adminler
            </button>
          )}

          {hasPermission('manage_tokens') && (
            <button 
              className={activeSection === 'tokens' ? 'active' : ''}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('tokens');
                closeMobileMenu();
              }}
            >
              <FaCoins /> Tokenler
            </button>
          )}

          {hasPermission('manage_users') && (
            <button 
              className={activeSection === 'users' ? 'active' : ''}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('users');
                closeMobileMenu();
              }}
            >
              <FaUsers /> Kullanıcılar
            </button>
          )}

          {hasPermission('manage_trades') && (
            <button 
              className={activeSection === 'trades' ? 'active' : ''}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('trades');
                closeMobileMenu();
              }}
            >
              <FaExchangeAlt /> İşlemler
            </button>
          )}

          {hasPermission('manage_contact') && (
            <button 
              className={activeSection === 'messages' ? 'active' : ''}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('messages');
                closeMobileMenu();
              }}
            >
              <FaEnvelope /> Mesajlar
            </button>
          )}

          {hasPermission('manage_settings') && (
            <button 
              className={activeSection === 'settings' ? 'active' : ''}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                setActiveSection('settings');
                closeMobileMenu();
              }}
            >
              <FaCog /> Ayarlar
            </button>
          )}

          <button 
            className={activeSection === 'hypes' ? 'active' : ''}
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setActiveSection('hypes');
              closeMobileMenu();
            }}
          >
            <FaChartLine /> Token Hype
          </button>

          <button 
            className={activeSection === 'campaigns' ? 'active' : ''}
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setActiveSection('campaigns');
              closeMobileMenu();
            }}
          >
            <FaClipboardList /> Kampanyalar
          </button>

          <button 
            className={activeSection === 'posts' ? 'active' : ''}
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setActiveSection('posts');
              closeMobileMenu();
            }}
          >
            📝 Postlar
          </button>

          <button 
            className={activeSection === 'votes' ? 'active' : ''}
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setActiveSection('votes');
              closeMobileMenu();
            }}
          >
            🗳️ Oylar
          </button>

          <button 
            className={activeSection === 'logs' ? 'active' : ''}
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setActiveSection('logs');
              closeMobileMenu();
            }}
          >
            <FaClipboardList /> Loglar
          </button>

          <button className="logout-sidebar-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Çıkış Yap
          </button>
        </nav>

        <div className="sidebar-user">
          <p>{currentUser?.username}</p>
          <small>{currentUser?.email}</small>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-topbar">
          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          
          <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
          <div className="topbar-right">
            <div className="refresh-controls">
              <button 
                className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
                onClick={toggleAutoRefresh}
                title={autoRefresh ? 'Otomatik yenilemeyi kapat' : 'Otomatik yenilemeyi aç (10sn)'}
              >
                <FaSyncAlt className={autoRefresh ? 'spinning' : ''} />
                {autoRefresh && <span className="auto-badge">Auto</span>}
              </button>
              <button 
                className="refresh-btn manual"
                onClick={handleManualRefresh}
                title="Şimdi yenile"
                disabled={loading}
              >
                <FaSyncAlt />
              </button>
              {lastRefreshTime && (
                <span className="last-refresh">
                  Son: {lastRefreshTime.toLocaleTimeString('tr-TR')}
                </span>
              )}
            </div>
            <span className="welcome">Hoş geldiniz, <strong>{currentUser?.username}</strong></span>
          </div>
        </div>

        <div className="admin-content">
          {loading && <div className="content-loading"><div className="spinner"></div></div>}
          {!loading && activeSection === 'dashboard' && renderDashboard()}
          {!loading && activeSection === 'admins' && renderAdmins()}
          {!loading && activeSection === 'tokens' && renderTokens()}
          {!loading && activeSection === 'users' && renderUsers()}
          {!loading && activeSection === 'trades' && renderTrades()}
          {!loading && activeSection === 'messages' && renderMessages()}
          {!loading && activeSection === 'settings' && renderSettings()}
          {!loading && activeSection === 'hypes' && renderHypes()}
          {!loading && activeSection === 'campaigns' && renderCampaigns()}
          {!loading && activeSection === 'posts' && renderPosts()}
          {!loading && activeSection === 'votes' && renderVotes()}
          {!loading && activeSection === 'logs' && renderLogs()}
        </div>
      </div>

      {/* Modals */}
      {showAdminModal && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          item={editingItem}
          onSave={() => {
            setShowAdminModal(false);
            loadSectionData();
          }}
        />
      )}

      {showUserEditModal && editingItem && (
        <UserEditModal
          show={showUserEditModal}
          onClose={() => {
            setShowUserEditModal(false);
            setEditingItem(null);
          }}
          user={editingItem}
          onStatusChange={handleChangeUserStatus}
          onAddBadge={handleAddBadge}
          onRemoveBadge={handleRemoveBadge}
          onUpdateInfo={handleUpdateUserInfo}
        />
      )}

      {showSettingModal && (
        <AdminModal
          isOpen={showSettingModal}
          onClose={() => setShowSettingModal(false)}
          item={editingItem}
          onSave={() => {
            setShowSettingModal(false);
            loadSectionData();
          }}
        />
      )}

      {showMessageModal && selectedMessage && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          message={selectedMessage}
          onSave={() => {
            setShowMessageModal(false);
            loadSectionData();
          }}
        />
      )}

      {showTokenModal && selectedToken && (
        <TokenModal
          isOpen={showTokenModal}
          onClose={() => setShowTokenModal(false)}
          token={selectedToken}
          onSave={() => {
            setShowTokenModal(false);
            loadSectionData();
          }}
        />
      )}

      {showHypeModal && (
        <AdminHypeModal
          isOpen={showHypeModal}
          onClose={() => setShowHypeModal(false)}
          item={editingItem}
          onSave={() => {
            setShowHypeModal(false);
            loadSectionData();
          }}
        />
      )}

      {showCampaignModal && (
        <AdminCampaignModal
          isOpen={showCampaignModal}
          onClose={() => setShowCampaignModal(false)}
          item={editingItem}
          onSave={() => {
            setShowCampaignModal(false);
            loadSectionData();
          }}
        />
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toasts-container">
          {toasts.map((toast, idx) => (
            <Toast
              key={idx}
              type={toast.type}
              message={toast.message}
              onClose={() => setToasts(toasts.filter((_, i) => i !== idx))}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default AdminPanel;

