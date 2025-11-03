import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { userAPI, getBackendURL } from '../utils/api';
import VerifiedUsername from '../components/VerifiedUsername';
import { 
  FaCopy, 
  FaCheckCircle, 
  FaTwitter, 
  FaTelegram, 
  FaMedal, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaExternalLinkAlt,
  FaStar,
  FaChartLine,
  FaHistory,
  FaShieldAlt,
  FaAward,
  FaGlobe,
  FaLink,
  FaEdit,
  FaCrown,
  FaFire,
  FaChartBar,
  FaArrowUp
} from 'react-icons/fa';
import { ReactComponent as DefaultAvatar } from './default-avatar.svg';
import './ProfilePage.css';

const ProfilePage = () => {
  const { address } = useParams();
  const { account: walletAccount } = useWallet();
  const [profile, setProfile] = useState(null);
  const [tokensLive, setTokensLive] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Rozet hesaplama fonksiyonu
  const calculateBadges = (profile) => {
    if (!profile) return [];
    const badges = [];
    const tokenCount = profile.tokens ? profile.tokens.length : 0;
    
    // Top Creator: 10+ token açan
    if (tokenCount >= 10) badges.push('Top Creator');
    
    // Verified: 10+ token ve 10M+ market cap
    const totalMarketCap = profile.tokens ? profile.tokens.reduce((acc, t) => {
      let mc = 0;
      if (t.marketCap) {
        mc = parseMarketCap(t.marketCap);
      }
      return acc + mc;
    }, 0) : 0;
    
    if (tokenCount >= 10 && totalMarketCap >= 10000000) badges.push('Verified');
    
    // Early Adopter: 2023'ten önce katılan
    if (profile.createdAt && new Date(profile.createdAt).getFullYear() <= 2023) badges.push('Early Adopter');
    
    // Diamond Hands: 90+ trustScore
    if (profile.trustScore >= 90) badges.push('Diamond Hands');
    
    return badges;
  };

  // Token verilerini DexScreener'dan çekme fonksiyonu
  const fetchTokenDataFromDexScreener = async (tokenAddress) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        // En yüksek hacimli pair'i bul
        const topPair = data.pairs.reduce((prev, current) => 
          (parseFloat(current.volume?.h24 || 0) > parseFloat(prev.volume?.h24 || 0)) ? current : prev
        );
        
        return {
          price: topPair.priceUsd ? `$${parseFloat(topPair.priceUsd).toFixed(6)}` : 'N/A',
          volume: topPair.volume?.h24 ? `$${(parseFloat(topPair.volume.h24)).toLocaleString()}` : 'N/A',
          liquidity: topPair.liquidity?.usd ? `$${(parseFloat(topPair.liquidity.usd)).toLocaleString()}` : 'N/A',
          change: topPair.priceChange?.h24 ? 
            `${parseFloat(topPair.priceChange.h24) > 0 ? '+' : ''}${parseFloat(topPair.priceChange.h24).toFixed(2)}%` : 'N/A',
          marketCap: topPair.fdv ? `$${(parseFloat(topPair.fdv)).toLocaleString()}` : 'N/A',
          pairAddress: topPair.pairAddress,
          dexId: topPair.dexId,
          pairUrl: topPair.url
        };
      }
    } catch (error) {
      console.error('DexScreener API error:', error);
    }
    
    return null;
  };

  // Tüm tokenların canlı verilerini güncelle
  const updateAllTokensLiveData = async (tokens) => {
    if (!tokens || !Array.isArray(tokens)) return tokens;
    
    const updatedTokens = await Promise.all(
      tokens.map(async (token) => {
        if (!token.address) return token;
        
        const liveData = await fetchTokenDataFromDexScreener(token.address);
        if (liveData) {
          return {
            ...token,
            price: liveData.price,
            volume: liveData.volume,
            liquidity: liveData.liquidity,
            change: liveData.change,
            marketCap: liveData.marketCap,
            pairAddress: liveData.pairAddress,
            dexId: liveData.dexId,
            pairUrl: liveData.pairUrl,
            hasLiveData: true
          };
        }
        
        return {
          ...token,
          hasLiveData: false
        };
      })
    );
    
    return updatedTokens;
  };

  useEffect(() => {
    const normalizedAddress = address?.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address?.toLowerCase();

    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (normalizedAddress && normalizedAddress !== '0xundefined') {
          // Gerçek API'den profil verisi çek
          import('../utils/wallet').then(async ({ getCurrentAccount }) => {
            const walletAddress = await getCurrentAccount();
            console.log('🔵 [ProfilePage] API isteği başlıyor - address:', normalizedAddress);
            
            try {
              const response = await userAPI.getProfile(normalizedAddress);
              console.log('🟢 [ProfilePage] Response geldi:', response.status);
              const data = response.data;
              
              console.log('📊 [ProfilePage] Response data:', data);
              console.log('   - success:', data.success);
              console.log('   - profile:', data.profile ? 'VAR' : 'YOK');
              if (data.profile) {
                console.log('   - badges field:', data.profile.badges);
                console.log('   - badges type:', typeof data.profile.badges);
                console.log('   - badges length:', data.profile.badges ? data.profile.badges.length : 'undefined');
              }

              if (!data.success || !data.profile) {
                console.log('❌ [ProfilePage] Hata: success=false veya profile yok');
                setProfile(null);
                setNotFound(true);
                setLoading(false);
                return;
              }
              
              console.log('✅ [ProfilePage] Profile verisi alındı');
              
              // Tokenler için canlı verileri çek
              if (data.profile.tokens && Array.isArray(data.profile.tokens)) {
                console.log('🔄 [ProfilePage] Tokens verisi güncelleniyor...');
                const tokensWithLiveData = await updateAllTokensLiveData(data.profile.tokens);
                setTokensLive(tokensWithLiveData);
                setProfile({ ...data.profile, tokens: tokensWithLiveData });
              } else {
                console.log('📝 [ProfilePage] Profile set ediliyor (tokens yok)');
                setProfile(data.profile);
              }
              setEditForm(data.profile);
              setNotFound(false);
              setLoading(false);
              console.log('✅ [ProfilePage] State güncellendi');
            } catch (err) {
              console.error('❌ [ProfilePage] Fetch hatası:', err);
              setProfile(null);
              setNotFound(true);
              setLoading(false);
            }
          });
        } else {
          // Local storage'dan profil verisi çek
          console.log('📦 [ProfilePage] LocalStorage profil çekiliyor...');
          const localProfile = localStorage.getItem('userProfile');
          if (localProfile) {
            const data = JSON.parse(localProfile);
            console.log('✅ [ProfilePage] LocalStorage profil:', data);
            console.log('   - badges:', data.badges);
            
            // Tokenler için canlı verileri çek
            if (data.tokens && Array.isArray(data.tokens)) {
              const tokensWithLiveData = await updateAllTokensLiveData(data.tokens);
              setTokensLive(tokensWithLiveData);
              setProfile({ ...data, tokens: tokensWithLiveData });
            } else {
              setProfile(data);
            }
            setEditForm(data);
            setNotFound(false);
            setLoading(false);
          } else {
            console.log('❌ [ProfilePage] LocalStorage profil yok');
            setProfile(null);
            setNotFound(false);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setProfile(null);
        setNotFound(true);
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [address]);

  useEffect(() => {
    // Cüzdan bağlantı durumunu kontrol et
    if (window.ethereum && window.ethereum.selectedAddress) {
      setWalletConnected(true);
    } else {
      setWalletConnected(false);
    }
  }, []);

  const handleCopy = () => {
    if (profile?.address) {
      navigator.clipboard.writeText(profile.address);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleVote = async (type) => {
    setVoteError('');
    if (!address) return;

    try {
      const { getCurrentAccount } = await import('../utils/wallet');
      let walletAddress = await getCurrentAccount();
      if (walletAddress) walletAddress = walletAddress.trim().toLowerCase();
      
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        setVoteError('Cüzdan bağlı değil veya geçersiz.');
        return;
      }
      
      const res = await fetch(`${getBackendURL()}/api/users/${address}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress
        },
        body: JSON.stringify({ type })
      });
      
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({
          ...prev,
          voteCount: data.voteCount,
          trustScore: data.trustScore
        }));
      } else {
        setVoteError(data.error || 'Oy kullanılamadı.');
      }
    } catch (err) {
      setVoteError('Sunucu hatası.');
    }
  };

  // Follow/Unfollow işlemi
  const handleFollowToggle = async () => {
    if (!currentWalletAddress) {
      alert('Cüzdan bağlı değil');
      return;
    }

    try {
      const normalizedAddress = address?.toLowerCase().startsWith('0x')
        ? address.toLowerCase()
        : '0x' + address?.toLowerCase();

      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${getBackendURL()}/api/follow/${normalizedAddress}/${endpoint}`, {
        method: 'POST',
        headers: {
          'wallet-address': currentWalletAddress
        }
      });

      const data = await res.json();
      if (data.success) {
        setIsFollowing(!isFollowing);
        if (profile) {
          setProfile(prev => ({
            ...prev,
            followersCount: data.targetFollowers || prev.followersCount
          }));
        }
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (err) {
      console.error('Follow error:', err);
      alert('İşlem sırasında hata oluştu');
    }
  };

  // Kullanıcının postlarını getir
  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const normalizedAddress = address?.toLowerCase().startsWith('0x')
        ? address.toLowerCase()
        : '0x' + address?.toLowerCase();

      const res = await fetch(`${getBackendURL()}/api/users/${normalizedAddress}/posts?limit=20&offset=0`);
      const data = await res.json();

      if (data.success) {
        setUserPosts(data.posts || []);
      } else {
        setUserPosts([]);
      }
    } catch (err) {
      console.error('Fetch user posts error:', err);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Follow status'unu kontrol et
  const checkFollowStatus = async (walletAddr) => {
    try {
      const normalizedAddress = address?.toLowerCase().startsWith('0x')
        ? address.toLowerCase()
        : '0x' + address?.toLowerCase();

      const res = await fetch(`${getBackendURL()}/api/follow/${normalizedAddress}/is-following`, {
        headers: walletAddr ? { 'wallet-address': walletAddr } : {}
      });

      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error('Check follow status error:', err);
    }
  };

  // Profile yüklendiğinde follow status ve posts'ı getir
  useEffect(() => {
    if (profile && address) {
      fetchUserPosts();

      // Follow status'unu kontrol et - walletAccount'tan al
      if (walletAccount) {
        const normalizedWallet = walletAccount.toLowerCase();
        setCurrentWalletAddress(normalizedWallet);
        checkFollowStatus(normalizedWallet);
      }
    }
  }, [profile, address, walletAccount]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setProfile(editForm);
      setIsEditing(false);
      
      // Profil localStorage'da ise güncelle
      if (!address || address === 'me') {
        localStorage.setItem('userProfile', JSON.stringify(editForm));
      }
    } catch (err) {
      alert('Profil güncellenemedi!');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Token kartı bileşeni
  const TokenCard = ({ token, index }) => {
    const changeColor = token.change?.startsWith('+') 
      ? '#00ff88' 
      : token.change?.startsWith('-') 
        ? '#ff4444' 
        : '#aaa';

    const badgeClass = token.change?.startsWith('+') ? 'positive' : token.change?.startsWith('-') ? 'negative' : '';

    return (
      <div className="token-card">
        {/* Token Performans İndikatörü */}
        <div className={`token-change-badge ${badgeClass}`}>
          {token.change || 'N/A'}
        </div>

        <div className="token-header">
          {token.logoURL ? (
            <img 
              src={token.logoURL} 
              alt={token.symbol} 
              className="token-icon"
            />
          ) : (
            <div className="token-icon" style={{ 
              background: '#444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffd700', 
              fontWeight: 700, 
              fontSize: '1.7rem'
            }}>
              {token.name ? token.name[0].toUpperCase() : '?'}
            </div>
          )}
          <div className="token-name">
            <div className="token-symbol">{token.name}</div>
            <div className="token-ticker">{token.symbol}</div>
          </div>
        </div>

        {/* Token Detayları */}
        <div className="token-details">
          <div className="token-detail">
            <div className="token-detail-label">Fiyat</div>
            <div className="token-detail-value">
              {token.hasLiveData ? token.price : (token.price || 'N/A')}
            </div>
          </div>
          <div className="token-detail">
            <div className="token-detail-label">Hacim (24s)</div>
            <div className="token-detail-value">
              {token.hasLiveData ? token.volume : (token.volume || 'N/A')}
            </div>
          </div>
          <div className="token-detail">
            <div className="token-detail-label">Market Cap</div>
            <div className="token-detail-value">
              {token.hasLiveData ? token.marketCap : (token.marketCap || 'N/A')}
            </div>
          </div>
          <div className="token-detail">
            <div className="token-detail-label">Likidite</div>
            <div className="token-detail-value">
              {token.hasLiveData ? token.liquidity : (token.liquidity || 'N/A')}
            </div>
          </div>
        </div>

        {/* Dex Bilgisi ve Linkler */}
        <div className="token-footer">
          <div className="token-dex-info">
            <span>{token.dexId || 'DEX'}</span>
            <span>
              {token.launchDate ? new Date(token.launchDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          
          <div className="token-links">
            {token.pairUrl && (
              <a 
                href={token.pairUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="token-link"
                onClick={(e) => e.stopPropagation()}
              >
                <FaExternalLinkAlt size={12} /> Chart
              </a>
            )}
            <a 
              href={`/token/${token.address}`}
              className="token-link"
              onClick={(e) => e.stopPropagation()}
            >
              Detay
            </a>
          </div>
        </div>

        {/* Canlı Veri İndikatörü */}
        {token.hasLiveData && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#00ff88',
            animation: 'pulse 2s infinite'
          }}></div>
        )}
      </div>
    );
  };

  if (!walletConnected && (!address || address === 'me')) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <h2 style={{ color: '#ffd700' }}>Henüz bir profiliniz yok</h2>
        <p style={{ color: '#aaa' }}>Oluşturmak için lütfen cüzdanınızı bağlayın.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: 80, 
        color: '#ffd700',
        fontSize: 18 
      }}>
        <div style={{
          width: 50,
          height: 50,
          border: '3px solid #ffd700',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        Loading profile...
      </div>
    );
  }
  
  if (notFound) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <h2 style={{ color: '#ffd700' }}>Profil bulunamadı</h2>
        <p style={{ color: '#aaa' }}>Bu adrese ait bir profil kaydı yok.</p>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <h2 style={{ color: '#ffd700' }}>Profil yüklenemedi</h2>
        <p style={{ color: '#aaa' }}>Lütfen tekrar deneyin.</p>
      </div>
    );
  }

  const displayAddress = profile.address 
    ? `${profile.address.slice(0, 8)}...${profile.address.slice(-6)}`
    : 'Address not available';

  // Rozetleri hesapla
  const computedBadges = calculateBadges(profile);
  const adminBadges = profile.badges ? profile.badges : [];
  console.log('🔍 Profile rozetleri - adminBadges:', adminBadges, 'computedBadges:', computedBadges);
  const allBadges = [...computedBadges, ...adminBadges]; // Hem hesaplanan hem admin rozetleri
  const uniqueBadges = [...new Set(allBadges)]; // Duplikatları kaldır
  console.log('🎯 Tüm rozetler (unique):', uniqueBadges);
  // Verified rozetini kontrol et - emoji'li veya emoji'siz olabilir
  const hasVerified = uniqueBadges.some(b => b.includes('Verified'));
  const otherBadges = uniqueBadges.filter(b => !b.includes('Verified'));

  // Market cap stringlerini daha sağlam şekilde parse eden fonksiyon
  function parseMarketCap(str) {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string') return 0;
    // $ ve boşlukları kaldır
    let cleaned = str.replace(/[$\s]/g, '');
    // Tüm . ve , karakterlerini kaldır
    cleaned = cleaned.replace(/[.,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Toplam market cap hesaplama
  const totalMarketCap = profile.tokens ? profile.tokens.reduce((acc, t) => {
    let mc = 0;
    if (t.marketCap) {
      mc = parseMarketCap(t.marketCap);
    }
    return acc + mc;
  }, 0) : 0;

  return (
    <div className="profile-container">
      {/* Arkaplan Efektleri */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        background: 'linear-gradient(135deg, #ffd70011 0%, transparent 50%)',
        zIndex: 0
      }}></div>
      
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '32px 24px 40px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Üst Bilgi Bölümü */}
        <style>{hasVerified ? `
          @keyframes verifiedGlow {
            0%, 100% { box-shadow: 0 0 40px rgba(240,185,11,0.5), 0 12px 40px rgba(240,185,11,0.3), inset 0 0 20px rgba(248,211,58,0.08); }
            50% { box-shadow: 0 0 60px rgba(240,185,11,0.7), 0 16px 50px rgba(240,185,11,0.4), inset 0 0 30px rgba(248,211,58,0.12); }
          }
          @keyframes verifiedBorder {
            0% { border-color: #F0B90B; }
            50% { border-color: #F8D33A; }
            100% { border-color: #F0B90B; }
          }
          @keyframes starsFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(360deg); }
          }
          @keyframes auraPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          @keyframes crownBounce {
            0%, 100% { transform: translateY(-5px) scale(1); }
            50% { transform: translateY(-15px) scale(1.1); }
          }
        ` : ''}</style>
        <div style={{
          background: hasVerified 
            ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 50%, #2a2415 100%)' 
            : 'linear-gradient(135deg, #181818 0%, #232323 100%)',
          borderRadius: 24,
          boxShadow: hasVerified 
            ? '0 0 50px rgba(240,185,11,0.4), 0 12px 40px rgba(240,185,11,0.2), inset 0 0 30px rgba(248,211,58,0.08)' 
            : '0 8px 32px rgba(0,0,0,0.3)',
          padding: 40,
          marginBottom: 32,
          border: hasVerified ? '3px solid #F0B90B' : '1px solid #333',
          position: 'relative',
          overflow: 'visible',
          animation: hasVerified ? 'verifiedGlow 3s ease-in-out infinite, verifiedBorder 4s ease-in-out infinite' : 'none'
        }}>
          {/* Dekoratif Element */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: hasVerified 
              ? 'radial-gradient(circle, #F0B90B55 0%, #F8D33A33 50%, transparent 70%)' 
              : 'radial-gradient(circle, #ffd70022 0%, transparent 70%)',
            borderRadius: '50%'
          }}></div>
          
          {/* Verified Aura - Arka plan yıldızları */}
          {hasVerified && (
            <>
              <div style={{
                position: 'absolute',
                top: 20,
                left: 40,
                fontSize: 32,
                opacity: 0.5,
                animation: 'starsFloat 4s ease-in-out infinite',
                color: '#F0B90B'
              }}>
                <FaStar />
              </div>
              <div style={{
                position: 'absolute',
                top: 70,
                right: 80,
                fontSize: 28,
                opacity: 0.4,
                animation: 'starsFloat 5s ease-in-out infinite',
                animationDelay: '0.5s',
                color: '#F0B90B'
              }}>
                <FaCrown />
              </div>
              <div style={{
                position: 'absolute',
                bottom: 50,
                left: 120,
                fontSize: 30,
                opacity: 0.45,
                animation: 'starsFloat 4.5s ease-in-out infinite',
                animationDelay: '1s',
                color: '#F0B90B'
              }}>
                <FaAward />
              </div>
              <div style={{
                position: 'absolute',
                top: 40,
                right: 40,
                fontSize: 28,
                opacity: 0.35,
                animation: 'starsFloat 6s ease-in-out infinite',
                animationDelay: '1.5s',
                color: '#F0B90B'
              }}>
                <FaCheckCircle />
              </div>
            </>
          )}

          <div style={{
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 2,
            width: '100%'
          }}>

            {/* Sol: Avatar ve Temel Bilgiler */}
            <div style={{
              flex: '1 1 100%',
              maxWidth: '400px',
              margin: '0 auto',
              background: hasVerified 
                ? 'linear-gradient(135deg, #3a3220 0%, #4a4a2a 50%, #3a3220 100%)' 
                : 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
              borderRadius: 20,
              boxShadow: hasVerified 
                ? '0 8px 40px rgba(240,185,11,0.3), inset 0 0 20px rgba(248,211,58,0.05)' 
                : '0 4px 24px rgba(255,215,0,0.1)',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: hasVerified ? '2px solid #F0B90B' : '1px solid #333',
              position: 'relative',
              width: '100%'
            }}>
              <style>{hasVerified ? `
                @keyframes avatarGlow {
                  0%, 100% { box-shadow: 0 0 25px rgba(240,185,11,0.6), 0 8px 32px rgba(240,185,11,0.3), inset 0 1px 0 rgba(255,255,255,0.1); }
                  50% { box-shadow: 0 0 45px rgba(240,185,11,0.8), 0 12px 48px rgba(240,185,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
                }
              ` : ''}</style>
              <div style={{ position: 'relative' }}>
                {profile.profileImage && typeof profile.profileImage === 'string' && profile.profileImage.trim() !== '' && (profile.profileImage.startsWith('http://') || profile.profileImage.startsWith('https://')) ? (
                  <img
                    src={profile.profileImage}
                    alt="Avatar"
                    style={{ 
                      width: 140, 
                      height: 140, 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      border: hasVerified ? '4px solid #F0B90B' : '4px solid #ffd700', 
                      background: '#fff', 
                      boxShadow: hasVerified ? '0 0 30px rgba(240,185,11,0.6), 0 8px 32px rgba(240,185,11,0.3)' : '0 8px 32px rgba(255,215,0,0.3)',
                      animation: hasVerified ? 'avatarGlow 3s ease-in-out infinite' : 'none'
                    }}
                  />
                ) : (
                  <DefaultAvatar style={{ 
                    width: 140, 
                    height: 140, 
                    borderRadius: '50%', 
                    border: hasVerified ? '4px solid #F0B90B' : '4px solid #ffd700', 
                    background: '#fff', 
                    boxShadow: hasVerified ? '0 0 30px rgba(240,185,11,0.6), 0 8px 32px rgba(240,185,11,0.3)' : '0 8px 32px rgba(255,215,0,0.3)',
                    animation: hasVerified ? 'avatarGlow 3s ease-in-out infinite' : 'none'
                  }} />
                )}
                {hasVerified && (
                  <div style={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #F0B90B 0%, #F8D33A 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    boxShadow: '0 0 25px rgba(240,185,11,0.8), 0 6px 16px rgba(240,185,11,0.5)',
                    border: '3px solid #1a1a1a',
                    animation: 'crownBounce 2s ease-in-out infinite',
                    color: '#1a1a1a'
                  }}>
                    <FaCrown />
                  </div>
                )}
              </div>

              {isEditing ? (
                <input
                  value={editForm.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#ffd700',
                    marginTop: 18,
                    background: 'transparent',
                    border: '2px solid #ffd700',
                    borderRadius: 10,
                    padding: '8px 16px',
                    textAlign: 'center',
                    width: '100%'
                  }}
                />
              ) : (
                <div style={{ 
                  fontSize: hasVerified ? 26 : 22, 
                  fontWeight: 800, 
                  color: hasVerified ? '#F0B90B' : '#ffd700', 
                  marginTop: 18, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10,
                  textShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.6)' : 'none',
                  animation: hasVerified ? 'textGlow 2s ease-in-out infinite' : 'none'
                }}>
                  <style>{hasVerified ? `
                    @keyframes textGlow {
                      0%, 100% { text-shadow: 0 0 15px rgba(240,185,11,0.6); }
                      50% { text-shadow: 0 0 25px rgba(248,211,58,0.8); }
                    }
                  ` : ''}</style>
                  <VerifiedUsername 
                    username={profile.username || 'Unnamed'} 
                    isVerified={hasVerified}
                    fontSize={hasVerified ? 26 : 22}
                    walletAddress={address}
                    isLink={false}
                  />
                </div>
              )}

              <div style={{ 
                fontSize: 16, 
                color: '#aaa', 
                marginTop: 8, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                background: hasVerified ? 'linear-gradient(135deg, #3a3220 0%, #4a4a2a 100%)' : '#2a2a2a',
                padding: '8px 16px',
                borderRadius: 10,
                border: hasVerified ? '1px solid #F0B90B' : '1px solid #333',
                boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.2)' : 'none'
              }}>
                {displayAddress}
                <button 
                  onClick={handleCopy} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: hasVerified ? '#F8D33A' : '#ffd700', 
                    cursor: 'pointer', 
                    fontSize: 16,
                    padding: 4
                  }}
                >
                  {copyFeedback ? <FaCheckCircle /> : <FaCopy />}
                </button>
              </div>

              {/* Sosyal Medya Linkleri */}
              <div style={{ 
                marginTop: 20, 
                display: 'flex', 
                gap: 16,
                padding: hasVerified ? '16px' : '0',
                background: hasVerified ? 'linear-gradient(135deg, #3a3220 0%, #4a4a2a 100%)' : 'transparent',
                borderRadius: hasVerified ? 12 : 0,
                border: hasVerified ? '1px solid #F0B90B' : 'none',
                justifyContent: hasVerified ? 'center' : 'flex-start'
              }}>
                {profile.twitter && (
                  <a 
                    href={profile.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: hasVerified ? '#F0B90B' : '#1da1f2', 
                      fontSize: 20,
                      background: hasVerified ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)' : '#1a1a1a',
                      padding: '10px',
                      borderRadius: '50%',
                      border: hasVerified ? '2px solid #F0B90B' : '1px solid #333',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (hasVerified) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F0B90B 0%, #F8D33A 100%)';
                        e.currentTarget.style.color = '#1a1a1a';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(240,185,11,0.6)';
                      } else {
                        e.currentTarget.style.background = '#1da1f2';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasVerified) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)';
                        e.currentTarget.style.color = '#F0B90B';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(240,185,11,0.3)';
                      } else {
                        e.currentTarget.style.background = '#1a1a1a';
                        e.currentTarget.style.color = '#1da1f2';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <FaTwitter />
                  </a>
                )}
                {profile.telegram && (
                  <a 
                    href={profile.telegram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: hasVerified ? '#F0B90B' : '#0088cc', 
                      fontSize: 20,
                      background: hasVerified ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)' : '#1a1a1a',
                      padding: '10px',
                      borderRadius: '50%',
                      border: hasVerified ? '2px solid #F0B90B' : '1px solid #333',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (hasVerified) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F0B90B 0%, #F8D33A 100%)';
                        e.currentTarget.style.color = '#1a1a1a';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(240,185,11,0.6)';
                      } else {
                        e.currentTarget.style.background = '#0088cc';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasVerified) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)';
                        e.currentTarget.style.color = '#F0B90B';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(240,185,11,0.3)';
                      } else {
                        e.currentTarget.style.background = '#1a1a1a';
                        e.currentTarget.style.color = '#0088cc';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <FaTelegram />
                  </a>
                )}
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: '#ffd700', 
                      fontSize: 20,
                      background: '#1a1a1a',
                      padding: '10px',
                      borderRadius: '50%',
                      border: '1px solid #333',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ffd700';
                      e.target.style.color = '#1a1a1a';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#1a1a1a';
                      e.target.style.color = '#ffd700';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaGlobe />
                  </a>
                )}
              </div>

              {/* Follow Buttons */}
              <div style={{ marginTop: 24, display: 'flex', gap: 12, width: '100%', flexDirection: 'column' }}>
                {currentWalletAddress && currentWalletAddress.toLowerCase() !== address?.toLowerCase() && (
                  <button
                    onClick={handleFollowToggle}
                    style={{
                      background: isFollowing 
                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ff8c8c 100%)'
                        : 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 24px',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(255,215,0,0.2)',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(255,215,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(255,215,0,0.2)';
                    }}
                  >
                    {isFollowing ? '✓ Takip Ediliyor' : '+ Takip Et'}
                  </button>
                )}
              </div>

              {/* Rozetler */}
              {otherBadges.length > 0 && (
                <>
                  {hasVerified && (
                    <div style={{
                      marginTop: 32,
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#F0B90B',
                      textShadow: '0 0 15px rgba(240,185,11,0.6)',
                      letterSpacing: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12
                    }}>
                      <FaStar style={{ fontSize: 24, color: '#F8D33A' }} />
                      AYIRICALIKLI ROZETLER
                      <FaStar style={{ fontSize: 24, color: '#F8D33A' }} />
                    </div>
                  )}
                  <div style={{ 
                    marginTop: hasVerified ? 20 : 24, 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                    width: '100%',
                    padding: hasVerified ? '20px' : '0',
                    background: hasVerified ? 'linear-gradient(135deg, #3a3220 0%, #4a4a2a 100%)' : 'transparent',
                    borderRadius: hasVerified ? 16 : 0,
                    border: hasVerified ? '2px solid #F0B90B' : 'none',
                    boxShadow: hasVerified ? '0 0 25px rgba(240,185,11,0.3), inset 0 0 15px rgba(248,211,58,0.05)' : 'none'
                  }}>
                  {otherBadges.map((badge, i) => {
                    let icon = <FaMedal />;
                    let color = '#ffd700';
                    let bgGradient = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
                    let tooltip = '';
                    let shape = 'rounded';
                    let animation = 'none';
                    
                    // HER ROZET FARKLI RENK VE TASARIMA SAHİP - EMOJİ YOK, PROFESIYONEL
                    const badgeConfig = {
                      'Verified': { 
                        icon: <FaCheckCircle />, 
                        color: '#3B82F6',
                        bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 50%, #1E3A8A 100%)',
                        tooltip: 'Admin tarafından doğrulanmış',
                        shape: 'rounded',
                        animation: 'pulse'
                      },
                      'Top Creator': { 
                        icon: <FaAward />, 
                        color: '#F59E0B',
                        bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
                        tooltip: '10+ token açan kullanıcılar',
                        shape: 'rounded',
                        animation: 'shimmer'
                      },
                      'Early Adopter': { 
                        icon: <FaHistory />, 
                        color: '#8B5CF6',
                        bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #4C1D95 100%)',
                        tooltip: '2023 öncesi kaydolanlar',
                        shape: 'rounded',
                        animation: 'glow'
                      },
                      'Diamond Hands': { 
                        icon: <FaStar />, 
                        color: '#06B6D4',
                        bgGradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 50%, #065F73 100%)',
                        tooltip: '90+ güven skoru',
                        shape: 'rounded',
                        animation: 'sparkle'
                      },
                      'Verified Creator': { 
                        icon: <FaCheckCircle />, 
                        color: '#10B981',
                        bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
                        tooltip: '10+ token, 4+ rating',
                        shape: 'rounded',
                        animation: 'pulse'
                      },
                      'Rocket Launcher': { 
                        icon: <FaArrowUp />, 
                        color: '#EF4444',
                        bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #991B1B 100%)',
                        tooltip: '5+ başarılı token',
                        shape: 'rounded',
                        animation: 'bounce'
                      },
                      'Community Leader': { 
                        icon: <FaCrown />, 
                        color: '#EC4899',
                        bgGradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 50%, #831843 100%)',
                        tooltip: '100+ takipçi',
                        shape: 'rounded',
                        animation: 'shimmer'
                      },
                      'Trending Creator': { 
                        icon: <FaFire />, 
                        color: '#F97316',
                        bgGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #9A3412 100%)',
                        tooltip: '50+ oy',
                        shape: 'rounded',
                        animation: 'glow'
                      },
                      'Master Builder': { 
                        icon: <FaChartBar />, 
                        color: '#14B8A6',
                        bgGradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #134E4A 100%)',
                        tooltip: '20+ token',
                        shape: 'rounded',
                        animation: 'pulse'
                      },
                      'Perfect Score': { 
                        icon: <FaStar />, 
                        color: '#F43F5E',
                        bgGradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 50%, #831843 100%)',
                        tooltip: '4.9+ rating, 5+ token',
                        shape: 'rounded',
                        animation: 'sparkle'
                      },
                      'Legendary': { 
                        icon: <FaCrown />, 
                        color: '#A78BFA',
                        bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #4C1D95 100%)',
                        tooltip: 'Efsanevi durum',
                        shape: 'rounded',
                        animation: 'shimmer'
                      }
                    };
                    
                    if (badgeConfig[badge.replace('⭐ ', '').replace('🏆 ', '').replace('📅 ', '').replace('💎 ', '').replace('🚀 ', '').replace('👑 ', '').replace('⚡ ', '').replace('🎯 ', '').replace('💯 ', '').replace('🌟 ', '')]) {
                      const cleanBadge = badge.replace('⭐ ', '').replace('🏆 ', '').replace('📅 ', '').replace('💎 ', '').replace('🚀 ', '').replace('👑 ', '').replace('⚡ ', '').replace('🎯 ', '').replace('💯 ', '').replace('🌟 ', '');
                      const config = badgeConfig[cleanBadge];
                      icon = config.icon;
                      color = config.color;
                      bgGradient = config.bgGradient;
                      tooltip = config.tooltip;
                      shape = config.shape;
                      animation = config.animation;
                    } else if (adminBadges.includes(badge)) {
                      icon = <FaStar />;
                      color = '#F0B90B';
                      bgGradient = 'linear-gradient(135deg, #F0B90B 0%, #F8D33A 50%, #FFD700 100%)';
                      tooltip = 'Admin tarafından verildi';
                      shape = 'rounded';
                      animation = 'pulse';
                    }

                    let borderRadius = '12px';
                    
                    const styleTag = `
                      @keyframes badgePulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.05); opacity: 0.9; }
                      }
                      @keyframes badgeShimmer {
                        0% { background-position: -1000px 0; }
                        100% { background-position: 1000px 0; }
                      }
                      @keyframes badgeGlow {
                        0%, 100% { box-shadow: 0 6px 20px ${color}44, inset 0 1px 0 rgba(255,255,255,0.3); }
                        50% { box-shadow: 0 8px 30px ${color}88, inset 0 1px 0 rgba(255,255,255,0.5); }
                      }
                      @keyframes badgeBounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                      }
                      @keyframes badgeSparkle {
                        0%, 100% { filter: brightness(1); }
                        50% { filter: brightness(1.2); }
                      }
                    `;

                    const animationStyle = animation === 'pulse' 
                      ? 'badgePulse 2s ease-in-out infinite'
                      : animation === 'shimmer'
                      ? 'badgeShimmer 3s linear infinite'
                      : animation === 'glow'
                      ? 'badgeGlow 2.5s ease-in-out infinite'
                      : animation === 'bounce'
                      ? 'badgeBounce 1.5s ease-in-out infinite'
                      : animation === 'sparkle'
                      ? 'badgeSparkle 2s ease-in-out infinite'
                      : 'none';
                    
                    return (
                      <div key={i} style={{ position: 'relative' }}>
                        <style>{styleTag}</style>
                        <span
                          style={{
                            position: 'relative',
                            background: bgGradient,
                            backgroundSize: '200% 200%',
                            color: '#fff',
                            borderRadius: borderRadius,
                            padding: '12px 16px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            fontSize: 12,
                            boxShadow: `0 6px 20px ${color}44, inset 0 1px 0 rgba(255,255,255,0.3), 0 0 20px ${color}22`,
                            border: `2px solid rgba(255,255,255,0.4)`,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            backdropFilter: 'blur(10px)',
                            animation: animationStyle,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            letterSpacing: '0.3px',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            minHeight: '44px',
                            width: '100%'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.08)';
                            e.currentTarget.style.boxShadow = `0 12px 35px ${color}66, inset 0 1px 0 rgba(255,255,255,0.5), 0 0 30px ${color}44`;
                            e.currentTarget.style.filter = 'brightness(1.2)';
                            const tooltipDiv = e.currentTarget.parentElement.querySelector('.badge-tooltip');
                            if (tooltipDiv) tooltipDiv.style.opacity = 1;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = `0 6px 20px ${color}44, inset 0 1px 0 rgba(255,255,255,0.3), 0 0 20px ${color}22`;
                            e.currentTarget.style.filter = 'brightness(1)';
                            const tooltipDiv = e.currentTarget.parentElement.querySelector('.badge-tooltip');
                            if (tooltipDiv) tooltipDiv.style.opacity = 0;
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{icon}</span>
                          <span>{badge.replace('⭐ ', '').replace('🏆 ', '').replace('📅 ', '').replace('💎 ', '').replace('🚀 ', '').replace('👑 ', '').replace('⚡ ', '').replace('🎯 ', '').replace('💯 ', '').replace('🌟 ', '')}</span>
                        </span>
                        <span
                          className="badge-tooltip"
                          style={{
                            opacity: 0,
                            transition: 'opacity 0.3s',
                            position: 'absolute',
                            bottom: '130%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                            color: '#fff',
                            padding: '12px 18px',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            boxShadow: `0 6px 25px rgba(0,0,0,0.6), 0 0 15px ${color}33`,
                            pointerEvents: 'none',
                            border: `1.5px solid ${color}`,
                            backdropFilter: 'blur(10px)',
                            animation: 'badgeGlow 2s ease-in-out infinite'
                          }}
                        >
                          {tooltip}
                          <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: `8px solid ${color}`
                          }} />
                        </span>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}

              {/* İstatistikler */}
              <div style={{ 
                marginTop: 24, 
                width: '100%',
                background: hasVerified 
                  ? 'linear-gradient(135deg, #3a3220 0%, #4a4a2a 50%, #3a3220 100%)' 
                  : '#2a2a2a',
                borderRadius: 16,
                padding: 20,
                border: hasVerified ? '2px solid #F0B90B' : '1px solid #333',
                boxShadow: hasVerified ? '0 0 25px rgba(240,185,11,0.3), inset 0 0 15px rgba(248,211,58,0.05)' : 'none'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 16,
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ 
                      color: hasVerified ? '#F8D33A' : '#ffd700', 
                      fontWeight: 700, 
                      fontSize: 18,
                      textShadow: hasVerified ? '0 0 10px rgba(240,185,11,0.5)' : 'none'
                    }}>
                      {profile.stats ? profile.stats.totalTokens : '-'}
                    </div>
                    <div style={{ color: '#aaa', fontSize: 12 }}>Tokenler</div>
                  </div>
                  <div>
                    <Link 
                      to={`/profile/${address}/followers`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ 
                        color: hasVerified ? '#F8D33A' : '#ffd700', 
                        fontWeight: 700, 
                        fontSize: 18,
                        textShadow: hasVerified ? '0 0 10px rgba(240,185,11,0.5)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '4px',
                        ':hover': {
                          background: 'rgba(240,185,11,0.1)'
                        }
                      }}>
                        {profile.followersCount !== undefined ? profile.followersCount : '-'}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>Takipçi</div>
                    </Link>
                  </div>
                  <div>
                    <div style={{ 
                      color: hasVerified ? '#F8D33A' : '#ffd700', 
                      fontWeight: 700, 
                      fontSize: 18,
                      textShadow: hasVerified ? '0 0 10px rgba(240,185,11,0.5)' : 'none'
                    }}>
                      {profile.stats && profile.stats.avgRating ? profile.stats.avgRating : '-'}
                    </div>
                    <div style={{ color: '#aaa', fontSize: 12 }}>Rating</div>
                  </div>
                  <div>
                    <Link 
                      to={`/profile/${address}/following`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ 
                        color: hasVerified ? '#F8D33A' : '#ffd700', 
                        fontWeight: 700, 
                        fontSize: 18,
                        textShadow: hasVerified ? '0 0 10px rgba(240,185,11,0.5)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '4px',
                        ':hover': {
                          background: 'rgba(240,185,11,0.1)'
                        }
                      }}>
                        {profile.followingCount !== undefined ? profile.followingCount : '-'}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>Takip Ediliyor</div>
                    </Link>
                  </div>
                  <div>
                    <div style={{ 
                      color: hasVerified ? '#F8D33A' : '#ffd700', 
                      fontWeight: 700, 
                      fontSize: 18,
                      textShadow: hasVerified ? '0 0 10px rgba(240,185,11,0.5)' : 'none'
                    }}>
                      {profile.stats && profile.stats.successfulLaunches ? profile.stats.successfulLaunches : '-'}
                    </div>
                    <div style={{ color: '#aaa', fontSize: 12 }}>Başarılı</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ: Detaylı Bilgiler */}
            <div style={{ flex: 1, minWidth: 340 }}>
              {/* Profil Açıklaması */}
              {isEditing ? (
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    background: hasVerified ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)' : '#2a2a2a',
                    border: hasVerified ? '2px solid #F0B90B' : '2px solid #ffd700',
                    borderRadius: 12,
                    padding: 16,
                    color: '#fff',
                    fontSize: 16,
                    marginBottom: 24,
                    minHeight: 100,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.2)' : 'none'
                  }}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div style={{ 
                  color: '#ccc', 
                  fontSize: 16, 
                  lineHeight: 1.6,
                  marginBottom: 32,
                  background: hasVerified ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)' : '#2a2a2a',
                  padding: 24,
                  borderRadius: 16,
                  border: hasVerified ? '1px solid #F0B90B' : '1px solid #333',
                  boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.2)' : 'none'
                }}>
                  {profile.description || 'No description available.'}
                </div>
              )}

              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginBottom: 32,
                background: hasVerified ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)' : '#2a2a2a',
                padding: 8,
                borderRadius: 12,
                border: hasVerified ? '1px solid #F0B90B' : '1px solid #333',
                overflowX: 'auto',
                boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.2)' : 'none'
              }}>
                {['tokens', 'posts', 'activity', 'analytics'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      minWidth: 100,
                      background: activeTab === tab ? 
                        (hasVerified 
                          ? 'linear-gradient(135deg, #F0B90B 0%, #F8D33A 100%)' 
                          : 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)')
                        : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontWeight: 600,
                      color: activeTab === tab ? '#1a1a1a' : '#aaa',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                      boxShadow: activeTab === tab && hasVerified ? '0 0 10px rgba(240,185,11,0.4)' : 'none'
                    }}
                  >
                    {tab === 'tokens' && <FaAward style={{ marginRight: 8 }} />}
                    {tab === 'posts' && <FaHistory style={{ marginRight: 8 }} />}
                    {tab === 'activity' && <FaHistory style={{ marginRight: 8 }} />}
                    {tab === 'analytics' && <FaChartLine style={{ marginRight: 8 }} />}
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'tokens' && (
                <div>
                  <div className="profile-section-title">
                    <FaAward /> Açtığı Tokenler ({profile.tokens ? profile.tokens.length : 0})
                  </div>
                  <div className="tokens-grid">
                    {profile.tokens && profile.tokens.length > 0 ? (
                      profile.tokens.map((token, index) => (
                        <TokenCard key={token.address || index} token={token} index={index} />
                      ))
                    ) : (
                      <div style={{ 
                        color: '#aaa', 
                        fontSize: 16, 
                        textAlign: 'center',
                        padding: 40,
                        background: '#2a2a2a',
                        borderRadius: 16,
                        border: '1px solid #333',
                        gridColumn: '1/-1'
                      }}>
                        Hiç token bulunamadı.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div>
                  <div className="profile-section-title">
                    <FaHistory /> Postlar ({userPosts.length})
                  </div>
                  {postsLoading ? (
                    <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                      Yükleniyor...
                    </div>
                  ) : userPosts.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 16
                    }}>
                      {userPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => window.location.href = `/posts/${post.id}`}
                          style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                            borderRadius: 12,
                            padding: 20,
                            border: '1px solid #333',
                            transition: 'all 0.3s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = '#ffd700';
                            e.target.style.boxShadow = '0 4px 12px rgba(255,215,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = '#333';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <h4 style={{ color: '#ffd700', marginBottom: 8 }}>{post.title}</h4>
                          <p style={{ color: '#ccc', marginBottom: 12, lineHeight: 1.5 }}>
                            {post.content.substring(0, 200)}...
                          </p>
                          {post.image && (
                            <img
                              src={post.image}
                              alt={post.title}
                              style={{
                                width: '100%',
                                maxHeight: 300,
                                borderRadius: 8,
                                marginBottom: 12,
                                objectFit: 'cover'
                              }}
                            />
                          )}
                          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#aaa' }}>
                            <span>❤️ {post.likes?.length || 0} Beğeni</span>
                            <span>💬 {post.commentCount || 0} Yorum</span>
                            <span>👁️ {post.viewCount || 0} Görüntüleme</span>
                            <span>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      color: '#aaa', 
                      fontSize: 16, 
                      textAlign: 'center',
                      padding: 40,
                      background: '#2a2a2a',
                      borderRadius: 16,
                      border: '1px solid #333',
                      gridColumn: '1/-1'
                    }}>
                      Henüz post yok.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                  borderRadius: 16,
                  padding: 32,
                  border: '1px solid #333'
                }}>
                  <div style={{ color: '#ffd700', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                    Son Aktivite
                  </div>
                  <div style={{ color: '#aaa', textAlign: 'center' }}>
                    Aktivite geçmişi yakında eklenecek...
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                  borderRadius: 16,
                  padding: 32,
                  border: '1px solid #333'
                }}>
                  <div style={{ color: '#ffd700', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                    Analitik Veriler
                  </div>
                  <div style={{ color: '#aaa', textAlign: 'center' }}>
                    Detaylı analizler yakında eklenecek...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alt Bilgi Bölümü */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          width: '100%',
          alignItems: 'stretch'
        }}>
          {/* Güvenilirlik & Oylama */}
          <div style={{
            background: 'linear-gradient(135deg, #181818 0%, #232323 100%)',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontWeight: 700, 
              fontSize: 20, 
              color: '#ffd700', 
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <FaShieldAlt /> Güvenilirlik & Oylama
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  background: hasVerified 
                    ? `conic-gradient(#F0B90B ${profile.trustScore}%, #2a2415 0%)`
                    : `conic-gradient(#ffd700 ${profile.trustScore}%, #333 0%)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  position: 'relative',
                  boxShadow: hasVerified ? '0 0 20px rgba(240,185,11,0.5)' : 'none'
                }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    background: hasVerified ? 'linear-gradient(135deg, #2a2415 0%, #3a3220 100%)' : '#1a1a1a',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: hasVerified ? '#F8D33A' : '#ffd700'
                  }}>
                    {profile.trustScore}%
                  </div>
                </div>
                <div style={{ color: '#aaa', fontSize: 14 }}>Güven Skoru</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: hasVerified ? '#F0B90B' : '#ffd700',
                  marginBottom: 8,
                  textShadow: hasVerified ? '0 0 10px rgba(240,185,11,0.5)' : 'none'
                }}>
                  {profile.voteCount}
                </div>
                <div style={{ color: '#aaa', fontSize: 14 }}>Toplam Oy</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => handleVote('up')}
                style={{
                  background: hasVerified 
                    ? 'linear-gradient(135deg, #F0B90B 0%, #F8D33A 100%)' 
                    : 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontWeight: 700,
                  color: hasVerified ? '#1a1a1a' : '#1a1a1a',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s',
                  flex: 1,
                  justifyContent: 'center',
                  boxShadow: hasVerified ? '0 0 15px rgba(240,185,11,0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = hasVerified 
                    ? '0 6px 20px rgba(240,185,11,0.5)' 
                    : '0 6px 20px rgba(0,255,136,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = hasVerified 
                    ? '0 0 15px rgba(240,185,11,0.3)' 
                    : 'none';
                }}
              >
                <FaThumbsUp /> Upvote
              </button>
              <button 
                onClick={() => handleVote('down')}
                style={{
                  background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s',
                  flex: 1,
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,68,68,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <FaThumbsDown /> Downvote
              </button>
            </div>

            {voteError && (
              <div style={{
                background: '#2a2a2a',
                color: '#ff4d4f',
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid #ff4d4f',
                padding: '12px 16px',
                marginTop: 16,
                textAlign: 'center'
              }}>
                {voteError}
              </div>
            )}
          </div>

          {/* Profil Bilgileri */}
          <div style={{ 
            background: 'linear-gradient(135deg, #181818 0%, #232323 100%)',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            border: '1px solid #333'
          }}>
            <div style={{ 
              fontWeight: 700, 
              fontSize: 20, 
              color: '#ffd700', 
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <FaStar /> Profil Bilgileri
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>Katılım Tarihi</span>
                <span style={{ color: '#ffd700', fontWeight: 600 }}>
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>Son Aktif</span>
                <span style={{ color: '#ffd700', fontWeight: 600 }}>
                  {profile.lastActive ? new Date(profile.lastActive).toLocaleString() : '-'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>Toplam Hacim</span>
                <span style={{ color: '#ffd700', fontWeight: 600 }}>
                  {profile.stats && profile.stats.totalVolume ? profile.stats.totalVolume : '-'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>Başarı Oranı</span>
                <span style={{ color: '#ffd700', fontWeight: 600 }}>
                  {profile.stats && profile.stats.successfulLaunches && profile.stats.totalTokens ? 
                    Math.round((profile.stats.successfulLaunches / profile.stats.totalTokens) * 100) + '%' : '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>Toplam Market Cap</span>
                <span style={{ color: '#ffd700', fontWeight: 600 }}>
                  {`$${totalMarketCap.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: #0f0f0f;
            color: #fff;
          }
        `}
      </style>
    </div>
  );
};

export default ProfilePage;

