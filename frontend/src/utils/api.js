import axios from 'axios';

// Backend URL'ini dinamik olarak belirle
export const getBackendURL = () => {
  // Eğer .env'de tanımlıysa onu kullan
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Yoksa mevcut host'u kullan (IP veya localhost)
  const currentHost = window.location.hostname;
  const backendPort = 3001;
  
  return `http://${currentHost}:${backendPort}`;
};

const API_BASE_URL = getBackendURL();

console.log('🔗 Backend URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - wallet address header'ını ekle
api.interceptors.request.use((config) => {
  // Eğer wallet address varsa header'a ekle
  let walletAddress = localStorage.getItem('walletAddress') || sessionStorage.getItem('walletAddress');
  
  // Eğer request body'de userAddress varsa onu da kullan
  if (!walletAddress && config.data && config.data.userAddress) {
    walletAddress = config.data.userAddress;
    // localStorage'a kaydet sonraki istekler için
    localStorage.setItem('walletAddress', walletAddress);
  }
  
  if (walletAddress) {
    config.headers['wallet-address'] = walletAddress;
  }
  
  return config;
});

// Response interceptor - error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Token işlemleri
export const tokenAPI = {
  // Tüm tokenları getir
  getTokens: () => api.get('/api/tokens'),
  
  // Token detayını getir
  getToken: (address) => api.get(`/api/tokens/${address}`),
  
  // Token oluştur
  createToken: (tokenData) => api.post('/api/token/create', tokenData),
  
  // LP ile token oluştur
  createTokenWithLP: (tokenData) => api.post('/api/token/create-with-lp', tokenData),
  
  // Token creation'ı onayla
  confirmTokenCreation: (confirmationData) => api.post('/api/token/confirm', confirmationData),
  
  // Token holders bilgisi
  getTokenHolders: (tokenAddress) => api.get(`/api/token/${tokenAddress}/holders`),
  
  // Kullanıcı token'larını getir
  getMyTokens: () => api.get('/api/my-tokens'),
  
  // LP kilitleme
  getLocks: (tokenAddress) => api.get(`/api/token/${tokenAddress}/locks`),
  
  // LP kilit detayları
  getLockInfo: (tokenAddress, userAddress) => 
    api.get(`/api/token/${tokenAddress}/locks/${userAddress}`),
  
  // Kilit süresini güncelle
  updateLock: (tokenAddress, lockData) => 
    api.put(`/api/token/${tokenAddress}/lock`, lockData),
  
  // Yeni kilit oluştur
  createLock: (tokenAddress, lockData) => 
    api.post(`/api/token/${tokenAddress}/lock`, lockData),
  
  // Kilidi kaldır
  removeLock: (tokenAddress, lockIndex) => 
    api.delete(`/api/token/${tokenAddress}/lock/${lockIndex}`),
    
  // Token tier bilgisi
  getTokenTier: (tokenAddress) => api.get(`/api/token/${tokenAddress}/tier`),
  
  // Tier ücretleri
  getTierFees: () => api.get('/api/tiers/fees'),
};

// Trade işlemleri
export const tradeAPI = {
  // Trade kaydet
  saveTrade: (tradeData) => api.post('/api/trades', tradeData),
  
  // Token'a ait tradeleri getir
  getTokenTrades: (tokenAddress, params = {}) => 
    api.get(`/api/trades/${tokenAddress}`, { params }),
  
  // Kullanıcının tradelerini getir
  getUserTrades: (userAddress, params = {}) => 
    api.get(`/api/trades/user/${userAddress}`, { params }),
  
  // Trade istatistiklerini getir
  getTradeStats: (tokenAddress) => 
    api.get(`/api/trades/${tokenAddress}/stats`),
};

// Debug ve utility
export const debugAPI = {
  // Transaction debug
  debugTransaction: (txHash) => api.get(`/api/debug/tx/${txHash}`),
  
  // Test endpoint
  test: () => api.get('/api/test'),
};

// User işlemleri
export const userAPI = {
  // Profil bilgisi getir
  getProfile: (address) => api.get(`/api/users/${address}`),
  
  // Profil güncelle
  updateProfile: (address, profileData) => api.put(`/api/users/${address}`, profileData),
  
  // Cüzdan bağla
  connect: (walletAddress) => api.post('/api/users/connect', { walletAddress }),
  
  // Kullanıcıyı takip et
  follow: (address) => api.post(`/api/follow/${address}/follow`),
  
  // Takip etmeyi bırak
  unfollow: (address) => api.post(`/api/users/${address}/unfollow`),
  
  // Takipçileri getir
  getFollowers: (address, params = {}) => api.get(`/api/users/${address}/followers`, { params }),
  
  // Takip ettikleri getir
  getFollowing: (address, params = {}) => api.get(`/api/users/${address}/following`, { params }),
  
  // Takip durumunu kontrol et
  isFollowing: (address) => api.get(`/api/users/${address}/is-following`),
};

// Health check
export const healthCheck = () => api.get('/api/health');

// Wallet address'i set et
export const setWalletAddress = (address) => {
  if (address) {
    localStorage.setItem('walletAddress', address);
  } else {
    localStorage.removeItem('walletAddress');
  }
};

// Wallet address'i get et
export const getWalletAddress = () => {
  return localStorage.getItem('walletAddress');
};

export default api;

