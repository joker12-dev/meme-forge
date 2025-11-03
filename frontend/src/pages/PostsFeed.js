import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import VerifiedUsername from '../components/VerifiedUsername';
import ErrorAlert from '../components/ErrorAlert';
import {
  FaHeart, FaRegHeart, FaComment, FaShare, FaFilter,
  FaSearch, FaArrowLeft, FaArrowRight, FaHashtag,
  FaClock, FaUser, FaFire, FaCheckCircle
} from 'react-icons/fa';
import './PostsFeed.css';

const PostsFeed = () => {
  const { account: walletAccount } = useWallet();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Update wallet from context
  useEffect(() => {
    if (walletAccount) {
      setWalletAddress(walletAccount.toLowerCase());
    }
  }, [walletAccount]);

  // Load posts
  useEffect(() => {
    loadPosts();
  }, [currentPage, filterType, searchTerm, sortBy]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';

      let url = `${backendURL}/api/posts?page=${currentPage}&limit=${postsPerPage}`;

      if (sortBy !== 'newest') {
        url += `&sortBy=${sortBy}`;
      }

      if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      } else {
        setError('Postlar yüklenemedi');
      }
    } catch (err) {
      console.error('Load posts error:', err);
      setError('Postlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Like post
  const handleLikePost = async (postId) => {
    if (!walletAddress) {
      setError('Cüzdan bağlanmadı');
      return;
    }

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      const response = await fetch(`${backendURL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'wallet-address': walletAddress }
      });

      const data = await response.json();

      if (data.success) {
        // Update local post data
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes }
            : post
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Add comment
  const handleAddComment = async (postId) => {
    if (!walletAddress) {
      setError('Cüzdan bağlanmadı');
      return;
    }

    if (!newComment.trim()) {
      setError('Yorum boş olamaz');
      return;
    }

    try {
      setCommentLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      const response = await fetch(`${backendURL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress
        },
        body: JSON.stringify({ content: newComment })
      });

      const data = await response.json();

      if (data.success) {
        setNewComment('');
        // Reload post and comments
        if (selectedPost) {
          loadPostDetails(selectedPost.id);
        }
      } else {
        setError(data.error || 'Yorum eklenemedi');
      }
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Yorum eklenirken hata oluştu');
    } finally {
      setCommentLoading(false);
    }
  };

  // Like/unlike comment
  const handleCommentLike = async (commentId) => {
    if (!walletAddress) {
      setError('Cüzdan bağlanmadı');
      return;
    }

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      const response = await fetch(`${backendURL}/api/posts/comment/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAddress
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update comment likes in state
        setSelectedPostComments(comments =>
          comments.map(comment =>
            comment.id === commentId
              ? { ...comment, likes: data.likes }
              : comment
          )
        );
      } else {
        setError(data.error || 'Yorum beğeni eklenemedi');
      }
    } catch (err) {
      console.error('Comment like error:', err);
      setError('Yorum beğeni eklenirken hata oluştu');
    }
  };

  // Get post details with comments
  const loadPostDetails = async (postId) => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      const response = await fetch(`${backendURL}/api/posts/${postId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPost(data.post);
        // Update in posts list too
        setPosts(posts.map(post => 
          post.id === postId ? data.post : post
        ));

        // Load comments separately
        const commentsResponse = await fetch(`${backendURL}/api/posts/${postId}/comments?page=1&limit=50`);
        const commentsData = await commentsResponse.json();
        if (commentsData.success) {
          setSelectedPostComments(commentsData.comments || []);
        }
      }
    } catch (err) {
      console.error('Load post details error:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'şimdi';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('tr-TR');
  };

  // Get countdown
  const getCountdown = (launchTime) => {
    if (!launchTime) return null;
    const now = new Date();
    const launch = new Date(launchTime);
    const diff = launch - now;

    if (diff < 0) return 'Başladı ✓';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    return `${days}g ${hours}h ${mins}m`;
  };

  // Is user liked this post
  const isLiked = (post) => {
    return post.likes && post.likes.includes(walletAddress);
  };

  return (
    <div className="posts-feed-container">
      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          onRetry={() => {
            setError(null);
            setCurrentPage(1);
          }}
          onDismiss={() => setError(null)}
          type="error"
        />
      )}

      {/* Header */}
      <div className="feed-header">
        <h1>Tüm Postlar</h1>
        <p>Topluluktan en son haberler ve güncellemeler</p>
      </div>

      {/* Search and filters */}
      <div className="feed-controls">
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Post ara..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterType('all');
              setCurrentPage(1);
            }}
          >
            Tümü
          </button>
          <button 
            className={`filter-btn ${filterType === 'launch' ? 'active' : ''}`}
            onClick={() => {
              setFilterType('launch');
              setCurrentPage(1);
            }}
          >
            <FaFire /> Launch
          </button>
          <button 
            className={`filter-btn ${filterType === 'update' ? 'active' : ''}`}
            onClick={() => {
              setFilterType('update');
              setCurrentPage(1);
            }}
          >
            Güncellemeler
          </button>
          <button 
            className={`filter-btn ${filterType === 'announcement' ? 'active' : ''}`}
            onClick={() => {
              setFilterType('announcement');
              setCurrentPage(1);
            }}
          >
            Duyurular
          </button>
        </div>

        {/* Sort Options */}
        <div className="sort-buttons" style={{ marginTop: 15, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aaa', fontSize: 14 }}>
            <FaFilter /> Sıralama:
          </label>
          <button 
            className={`filter-btn ${sortBy === 'newest' ? 'active' : ''}`}
            onClick={() => setSortBy('newest')}
            style={{padding: '6px 12px', fontSize: 12}}
          >
            Yeniden Eskiye
          </button>
          <button 
            className={`filter-btn ${sortBy === 'likes-desc' ? 'active' : ''}`}
            onClick={() => setSortBy('likes-desc')}
            style={{padding: '6px 12px', fontSize: 12}}
          >
            <FaFire /> Çok Beğenilen
          </button>
          <button 
            className={`filter-btn ${sortBy === 'likes-asc' ? 'active' : ''}`}
            onClick={() => setSortBy('likes-asc')}
            style={{padding: '6px 12px', fontSize: 12}}
          >
            Az Beğenilen
          </button>
          <button 
            className={`filter-btn ${sortBy === 'comments-desc' ? 'active' : ''}`}
            onClick={() => setSortBy('comments-desc')}
            style={{padding: '6px 12px', fontSize: 12}}
          >
            <FaComment /> Çok Yorumlanan
          </button>
        </div>
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

      {/* Posts */}
      {!loading && posts.length > 0 ? (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.id} className="post-item">
              {/* Creator info */}
              <div className="post-item-header">
                <div className="creator-info">
                  <img 
                    src={post.creator?.profileImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23ddd"/%3E%3Ctext x="20" y="20" font-size="20" fill="%23666" text-anchor="middle" dy=".3em"%3E?%3C/text%3E%3C/svg%3E'} 
                    alt={post.creator?.username}
                    className="creator-avatar"
                  />
                  <div className="creator-details">
                    <h4>
                      <VerifiedUsername 
                        username={post.creator?.username || post.creator?.walletAddress?.slice(0, 6)}
                        isVerified={post.creator?.badges?.some(b => b.includes('Verified'))}
                        fontSize={14}
                        walletAddress={post.creator?.walletAddress}
                      />
                    </h4>
                    <span className="time">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                {post.postType === 'launch' && (
                  <span className="badge-type launch">LAUNCH</span>
                )}
              </div>

              {/* Post image */}
              {post.image && (
                <div className="post-item-image">
                  <img src={post.image} alt={post.title} />
                </div>
              )}

              {/* Post content */}
              <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="post-item-content">
                  <h3 className="post-item-title">{post.title}</h3>
                  <p className="post-item-text">{post.content.slice(0, 200)}...</p>

                  {/* Launch countdown */}
                  {post.postType === 'launch' && post.launchTime && (
                    <div className="launch-timer">
                      <FaClock /> Başlama: {getCountdown(post.launchTime)}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">
                          <FaHashtag /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>

              {/* Engagement */}
              <div className="post-item-engagement">
                <button 
                  className={`engagement-btn like ${isLiked(post) ? 'liked' : ''}`}
                  onClick={() => handleLikePost(post.id)}
                  title={isLiked(post) ? 'Beğenimi kaldır' : 'Beğen'}
                >
                  {isLiked(post) ? <FaHeart /> : <FaRegHeart />}
                  {post.likes?.length || 0}
                </button>
                <button 
                  className="engagement-btn comment"
                  onClick={() => loadPostDetails(post.id).then(() => setSelectedPost(post))}
                  title="Yorum yap"
                >
                  <FaComment /> {post.commentCount || 0}
                </button>
                <button className="engagement-btn share" title="Paylaş">
                  <FaShare /> {post.shareCount || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="empty-state">
          <FaComment style={{ fontSize: '48px', opacity: 0.3, marginBottom: '20px' }} />
          <p>Henüz post yok</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && posts.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '40px',
          marginBottom: '40px'
        }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            style={{
              background: currentPage === 1 ? '#333' : '#F0B90B',
              color: currentPage === 1 ? '#666' : '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            <FaArrowLeft /> Previous
          </button>
          
          <span style={{ color: '#F0B90B', fontWeight: '600', minWidth: '80px', textAlign: 'center' }}>
            Page {currentPage} / {totalPages}
          </span>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            style={{
              background: currentPage === totalPages ? '#333' : '#F0B90B',
              color: currentPage === totalPages ? '#666' : '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next <FaArrowRight />
          </button>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="btn-close"
              onClick={() => setSelectedPost(null)}
            >
              ✕
            </button>

            {/* Post detail */}
            <div className="post-detail">
              {/* Creator */}
              <div className="detail-header">
                <img 
                  src={selectedPost.creator?.profileImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"%3E%3Crect width="50" height="50" fill="%23ddd"/%3E%3Ctext x="25" y="25" font-size="24" fill="%23666" text-anchor="middle" dy=".3em"%3E?%3C/text%3E%3C/svg%3E'} 
                  alt={selectedPost.creator?.username}
                  className="modal-creator-avatar"
                />
                <div>
                  <h3>
                    <VerifiedUsername 
                      username={selectedPost.creator?.username || selectedPost.creator?.walletAddress?.slice(0, 6)}
                      isVerified={selectedPost.creator?.badges?.some(b => b.includes('Verified'))}
                      fontSize={18}
                      walletAddress={selectedPost.creator?.walletAddress}
                    />
                  </h3>
                  <small>{formatDate(selectedPost.createdAt)}</small>
                </div>
              </div>

              {/* Title & content */}
              <h2 className="detail-title">{selectedPost.title}</h2>
              {selectedPost.image && (
                <img src={selectedPost.image} alt={selectedPost.title} className="detail-image" />
              )}
              <p className="detail-text">{selectedPost.content}</p>

              {/* Countdown */}
              {selectedPost.postType === 'launch' && selectedPost.launchTime && (
                <div className="detail-countdown">
                  <FaClock /> {getCountdown(selectedPost.launchTime)}
                </div>
              )}

              {/* Engagement buttons */}
              <div className="detail-engagement">
                <button 
                  className={`btn-engage ${isLiked(selectedPost) ? 'liked' : ''}`}
                  onClick={() => handleLikePost(selectedPost.id)}
                >
                  {isLiked(selectedPost) ? <FaHeart /> : <FaRegHeart />}
                  {selectedPost.likes?.length || 0} Beğeni
                </button>
                <button className="btn-engage">
                  <FaComment /> {selectedPost.commentCount || 0} Yorum
                </button>
                <button className="btn-engage">
                  <FaShare /> Paylaş
                </button>
              </div>

              {/* Comments section */}
              <div className="comments-section">
                <h4>Yorumlar ({selectedPost.commentCount || 0})</h4>

                {/* Add comment form */}
                {walletAddress && (
                  <div className="add-comment">
                    <textarea
                      placeholder="Yorumunuzu yazın..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <button 
                      onClick={() => handleAddComment(selectedPost.id)}
                      disabled={commentLoading}
                    >
                      {commentLoading ? 'Gönderiliyor...' : 'Yorum Yap'}
                    </button>
                  </div>
                )}

                {/* Comments list */}
                <div className="comments-list">
                  {selectedPostComments && selectedPostComments.length > 0 ? (
                    selectedPostComments.map(comment => (
                      <div key={comment.id} className="comment">
                        <img 
                          src={comment.author?.profileImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35"%3E%3Crect width="35" height="35" fill="%23ddd"/%3E%3Ctext x="17.5" y="17.5" font-size="18" fill="%23666" text-anchor="middle" dy=".3em"%3E?%3C/text%3E%3C/svg%3E'} 
                          alt={comment.author?.username}
                          className="comment-avatar"
                        />
                        <div className="comment-content">
                          <strong>
                            <VerifiedUsername 
                              username={comment.author?.username || comment.author?.walletAddress?.slice(0, 6)}
                              isVerified={comment.author?.badges?.some(b => b.includes('Verified'))}
                              fontSize={14}
                              walletAddress={comment.author?.walletAddress}
                            />
                          </strong>
                          <small>{formatDate(comment.createdAt)}</small>
                          <p>{comment.content}</p>
                          <div className="comment-engagement">
                            <button 
                              className="btn-small"
                              onClick={() => handleCommentLike(comment.id)}
                            >
                              <FaRegHeart /> {comment.likes?.length || 0}
                            </button>
                            <button className="btn-small">Yanıtla</button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#aaa', padding: 10, textAlign: 'center' }}>
                      Henüz yorum yok
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsFeed;

