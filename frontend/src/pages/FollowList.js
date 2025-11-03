import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaUserPlus, FaUserCheck, FaArrowLeft, FaArrowRight,
  FaCheckCircle, FaTrophy, FaFire, FaCrown, FaTimes
} from 'react-icons/fa';
import VerifiedUsername from '../components/VerifiedUsername';
import './FollowList.css';

const FollowList = ({ type = 'followers' }) => {
  // type: 'followers' atau 'following'
  const { address } = useParams();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [followingState, setFollowingState] = useState({});

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('followers-desc'); // 'followers-desc', 'followers-asc', 'date-newest', 'date-oldest'
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Get wallet
  useEffect(() => {
    const getWallet = async () => {
      try {
        const { getCurrentAccount } = await import('../utils/wallet');
        const addr = await getCurrentAccount();
        if (addr) {
          setWalletAddress(addr.toLowerCase());
        }
      } catch (err) {
        console.error('Wallet error:', err);
      }
    };

    getWallet();
  }, []);

  // Load list
  useEffect(() => {
    if (address) {
      loadList();
    }
  }, [address, type]);

  // Apply sorting and filtering
  useEffect(() => {
    let processed = [...users];

    // Search filter
    if (searchTerm) {
      processed = processed.filter(user =>
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    processed.sort((a, b) => {
      switch (sortBy) {
        case 'followers-desc':
          return (b.followersCount || 0) - (a.followersCount || 0);
        case 'followers-asc':
          return (a.followersCount || 0) - (b.followersCount || 0);
        case 'date-newest':
          return new Date(b.followedAt || b.createdAt) - new Date(a.followedAt || a.createdAt);
        case 'date-oldest':
          return new Date(a.followedAt || a.createdAt) - new Date(b.followedAt || b.createdAt);
        default:
          return 0;
      }
    });

    setFilteredUsers(processed);
  }, [users, sortBy, searchTerm]);

  const loadList = async () => {
    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';

      const endpoint = type === 'followers' ? 'followers' : 'following';
      const response = await fetch(
        `${backendURL}/api/follow/${address}/${endpoint}?page=${currentPage}&limit=${usersPerPage}`
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data[type === 'followers' ? 'followers' : 'following']);

        // Check following status for each user
        if (walletAddress) {
          const newFollowingState = {};
          for (const user of data[type === 'followers' ? 'followers' : 'following']) {
            const isFollowingResponse = await fetch(
              `${backendURL}/api/follow/${user.walletAddress}/is-following`,
              { headers: { 'wallet-address': walletAddress } }
            );
            const isFollowingData = await isFollowingResponse.json();
            newFollowingState[user.walletAddress] = isFollowingData.isFollowing;
          }
          setFollowingState(newFollowingState);
        }
      } else {
        setError(data.error || 'List yüklenemedi');
      }
    } catch (err) {
      console.error('Load list error:', err);
      setError('List yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Follow/unfollow
  const handleFollowToggle = async (userAddress) => {
    if (!walletAddress) {
      setError('Cüzdan bağlanmadı');
      return;
    }

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      const isFollowing = followingState[userAddress];
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      const response = await fetch(
        `${backendURL}/api/follow/${userAddress}/${endpoint}`,
        {
          method: 'POST',
          headers: { 'wallet-address': walletAddress }
        }
      );

      const data = await response.json();

      if (data.success) {
        setFollowingState(prev => ({
          ...prev,
          [userAddress]: !isFollowing
        }));
      } else {
        setError(data.error || 'İşlem başarısız');
      }
    } catch (err) {
      console.error('Follow error:', err);
      setError('İşlem sırasında hata oluştu');
    }
  };

  // Get badge icon
  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'Top Creator':
        return <FaCrown style={{ color: '#FFD700' }} />;
      case 'Early Adopter':
        return <FaFire style={{ color: '#FF6B6B' }} />;
      case 'Verified Creator':
        return <FaCheckCircle style={{ color: '#4DABF7' }} />;
      default:
        return <FaTrophy style={{ color: '#FFD700' }} />;
    }
  };

  const listTitle = type === 'followers' ? 'Takipçiler' : 'Takip Ediliyor';

  return (
    <div className="follow-list-container">
      {/* Header */}
      <div className="follow-list-header">
        <h1>{listTitle}</h1>
        <p>{users.length} kişi</p>
      </div>

      {/* Search & Filter Controls */}
      <div className="follow-controls">
        {/* Search */}
        <input
          type="text"
          className="search-input"
          placeholder="Kullanıcı adı veya cüzdan ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Sort */}
        <select 
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="followers-desc">📊 En Yüksek Takipçi</option>
          <option value="followers-asc">📊 En Düşük Takipçi</option>
          <option value="date-newest">📅 En Yeni</option>
          <option value="date-oldest">📅 En Eski</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="loading">Yükleniyor...</div>}

      {/* Users list */}
      {!loading && filteredUsers.length > 0 ? (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.walletAddress} className="user-card">
              {/* Avatar */}
              <img
                src={user.profileImage || 'https://via.placeholder.com/100'}
                alt={user.username}
                className="user-avatar"
              />

              {/* Info */}
              <div className="user-info">
                <h3>
                  <VerifiedUsername
                    username={user.username || user.walletAddress.slice(0, 6) + '...'}
                    badges={user.badges || []}
                    isVerified={user.badges?.some(b => typeof b === 'string' ? b.includes('Verified') : false) || false}
                    fontSize={16}
                    walletAddress={user.walletAddress}
                  />
                </h3>
                <p className="address">{user.walletAddress.slice(0, 10)}...</p>

                {/* Badges */}
                {user.badges && user.badges.length > 0 && (
                  <div className="user-badges">
                    {user.badges.map(badge => (
                      <span key={badge} className="badge" title={badge}>
                        {getBadgeIcon(badge)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="user-stats">
                  <span className="stat">
                    <strong>{user.followersCount || 0}</strong> Takipçi
                  </span>
                  <span className="stat">
                    Trust: <strong>{user.trustScore || 0}</strong>
                  </span>
                </div>
              </div>

              {/* Follow button */}
              {walletAddress && walletAddress !== user.walletAddress && (
                <button
                  className={`btn-follow ${followingState[user.walletAddress] ? 'following' : ''}`}
                  onClick={() => handleFollowToggle(user.walletAddress)}
                  title={followingState[user.walletAddress] ? 'Takipten çık' : 'Takip et'}
                >
                  {followingState[user.walletAddress] ? (
                    <>
                      <FaUserCheck /> Takip Ediliyor
                    </>
                  ) : (
                    <>
                      <FaUserPlus /> Takip Et
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="empty-state">
          <p>🔍 Sonuç bulunamadı</p>
        </div>
      )}

      {/* Pagination - removed since we're now showing all results */}
    </div>
  );
};

export default FollowList;

