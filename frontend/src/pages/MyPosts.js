import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getBackendURL } from '../utils/api';
import ErrorAlert from '../components/ErrorAlert';
import {
  FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaImage,
  FaTimes, FaCheck, FaComments, FaHeart, FaShare,
  FaArrowLeft, FaArrowRight, FaClock, FaHashtag
} from 'react-icons/fa';
import './MyPosts.css';

const MyPosts = () => {
  const { account: walletAccount } = useWallet();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null,
    imagePreview: null,
    postType: 'announcement',
    launchTime: '',
    tags: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: ''
  });

  // Get wallet address
  useEffect(() => {
    if (walletAccount) {
      const address = walletAccount.toLowerCase();
      setWalletAddress(address);
      setCurrentPage(1);  // Reset to page 1
    }
  }, [walletAccount]);

  // Load user's posts
  const loadMyPosts = async (address, page = 1) => {
    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      
      const response = await fetch(`${backendURL}/api/users/${address}/posts?page=${page}&limit=${postsPerPage}`, {
        headers: { 'wallet-address': address }
      });

      const data = await response.json();

      if (data.success) {
        setMyPosts(data.posts || []);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / postsPerPage));
      } else {
        setError(data.error || 'Posts could not be loaded');
      }
    } catch (err) {
      console.error('Load posts error:', err);
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  // Load posts when page or wallet changes
  useEffect(() => {
    if (walletAddress) {
      loadMyPosts(walletAddress, currentPage);
    }
  }, [walletAddress, currentPage]);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📷 [POST] Image selected:', { name: file.name, size: file.size, type: file.type });
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('📷 [POST] Image preview loaded');
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Create or update post
  const handleSubmitPost = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Başlık ve içerik zorunludur');
      return;
    }

    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const formDataMultipart = new FormData();

      console.log('📨 [POST SUBMIT] Starting submission...', { walletAddress, image: formData.image ? formData.image.name : null });

      formDataMultipart.append('title', formData.title);
      formDataMultipart.append('content', formData.content);
      // Ensure postType has a value
      const postType = formData.postType || 'announcement';
      formDataMultipart.append('postType', postType);
      console.log('📨 [POST SUBMIT] postType:', postType);
      
      if (formData.launchTime) {
        formDataMultipart.append('launchTime', formData.launchTime);
      }
      if (formData.tags) {
        formDataMultipart.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())));
      }
      if (formData.website) {
        formDataMultipart.append('website', formData.website);
      }
      if (formData.twitter) {
        formDataMultipart.append('twitter', formData.twitter);
      }
      if (formData.telegram) {
        formDataMultipart.append('telegram', formData.telegram);
      }
      if (formData.discord) {
        formDataMultipart.append('discord', formData.discord);
      }
      if (formData.image) {
        console.log('📨 [POST SUBMIT] Adding image:', { name: formData.image.name, size: formData.image.size, type: formData.image.type });
        formDataMultipart.append('image', formData.image);
      }

      const endpoint = editingPost 
        ? `${backendURL}/api/posts/${editingPost.id}`
        : `${backendURL}/api/posts`;
      
      const method = editingPost ? 'PUT' : 'POST';

      console.log('📨 [POST SUBMIT] Request:', { method, url: endpoint });

      const response = await fetch(endpoint, {
        method,
        headers: { 'wallet-address': walletAddress },
        body: formDataMultipart
      });

      console.log('📨 [POST SUBMIT] Response status:', response.status);

      const data = await response.json();
      console.log('📨 [POST SUBMIT] Response:', { success: data.success, error: data.error });

      if (data.success) {
        console.log('✅ [POST SUBMIT] Success!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          content: '',
          image: null,
          imagePreview: null,
          postType: 'announcement',
          launchTime: '',
          tags: '',
          website: '',
          twitter: '',
          telegram: '',
          discord: ''
        });
        setEditingPost(null);
        loadMyPosts(walletAddress);
      } else {
        console.error('❌ [POST SUBMIT] Error:', data.error);
        setError(data.error || 'Post oluşturulamadı');
      }
    } catch (err) {
      console.error('❌ [POST SUBMIT] Exception:', err);
      setError('Post gönderilirken hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit post
  const handleEditPost = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image: null,
      imagePreview: post.image,
      postType: post.postType,
      launchTime: post.launchTime ? new Date(post.launchTime).toISOString().slice(0, 16) : '',
      tags: post.tags ? post.tags.join(', ') : '',
      website: post.website || '',
      twitter: post.twitter || '',
      telegram: post.telegram || '',
      discord: post.discord || ''
    });
    setShowCreateModal(true);
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Postu silmek istediğinizden emin misiniz?')) return;

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'wallet-address': walletAddress }
      });

      const data = await response.json();

      if (data.success) {
        loadMyPosts(walletAddress);
      } else {
        setError(data.error || 'Post silinemedi');
      }
    } catch (err) {
      console.error('Delete post error:', err);
      setError('Post silinirken hata oluştu');
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
    if (diffMins < 60) return `${diffMins}m önce`;
    if (diffHours < 24) return `${diffHours}h önce`;
    if (diffDays < 7) return `${diffDays}d önce`;
    
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate time until launch
  const getCountdown = (launchTime) => {
    if (!launchTime) return null;
    const now = new Date();
    const launch = new Date(launchTime);
    const diff = launch - now;

    if (diff < 0) return 'Başladı';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    return `${days}g ${hours}s ${mins}m kaldı`;
  };

  // Paging
  const startIdx = (currentPage - 1) * postsPerPage;
  const paginatedPosts = myPosts.slice(startIdx, startIdx + postsPerPage);

  return (
    <div className="my-posts-container">
      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          onRetry={() => {
            setError(null);
            if (walletAddress) {
              loadMyPosts(walletAddress, 1);
            }
          }}
          onDismiss={() => setError(null)}
          type="error"
        />
      )}

      {/* Header */}
      <div className="my-posts-header">
        <h1>Benim Postlarım</h1>
        <button 
          className="btn-create-post"
          onClick={() => {
            setEditingPost(null);
            setFormData({
              title: '',
              content: '',
              image: null,
              imagePreview: null,
              postType: 'announcement',
              launchTime: '',
              tags: '',
              website: '',
              twitter: '',
              telegram: '',
              discord: ''
            });
            setShowCreateModal(true);
          }}
        >
          <FaPlus /> Yeni Post Oluştur
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="btn-close">✕</button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="loading-spinner">Yükleniyor...</div>}

      {/* Posts list */}
      {!loading && paginatedPosts.length > 0 ? (
        <div className="posts-list">
          {paginatedPosts.map(post => (
            <div key={post.id} className="post-card">
              {/* Post header */}
              <div className="post-header">
                <div className="post-title-section">
                  <h2 className={`post-title post-type-${post.postType}`}>
                    {post.title}
                  </h2>
                  {post.postType === 'launch' && (
                    <span className="badge-launch">LAUNCH</span>
                  )}
                </div>
                <div className="post-actions">
                  <button 
                    className="btn-icon edit"
                    onClick={() => handleEditPost(post)}
                    title="Düzenle"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-icon delete"
                    onClick={() => handleDeletePost(post.id)}
                    title="Sil"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Post image */}
              {post.image && (
                <div className="post-image-container">
                  <img src={post.image} alt={post.title} className="post-image" />
                </div>
              )}

              {/* Post content */}
              <div className="post-content">
                <p>{post.content}</p>
              </div>

              {/* Launch countdown */}
              {post.postType === 'launch' && post.launchTime && (
                <div 
                  className="launch-countdown"
                  style={{
                    color: new Date(post.launchTime) <= new Date() ? '#00ff88' : '#ff6b6b',
                    fontWeight: 700
                  }}
                >
                  <FaClock /> {getCountdown(post.launchTime)}
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(tag => (
                    <span key={tag} className="tag">
                      <FaHashtag /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Post stats */}
              <div className="post-stats">
                <span className="stat">
                  <FaHeart /> {post.likes ? post.likes.length : 0} beğeni
                </span>
                <span className="stat">
                  <FaComments /> {post.commentCount || 0} yorum
                </span>
                <span className="stat time">
                  {formatDate(post.createdAt)}
                </span>
              </div>

              {/* Post footer */}
              <div className="post-footer">
                <span className="post-meta">
                  {post.createdAt && (
                    <>
                      <FaCalendarAlt /> {new Date(post.createdAt).toLocaleString('tr-TR')}
                    </>
                  )}
                </span>
                {post.editedAt && (
                  <span className="edited-badge">Düzenlendi</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="empty-state">
          <FaComments style={{ fontSize: '48px', opacity: 0.3, marginBottom: '20px' }} />
          <p>Henüz post oluşturmadınız</p>
          <button 
            className="btn-create-post"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus /> İlk Postunuzu Oluşturun
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && myPosts.length > 0 && (
        <div className="pagination" style={{
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPost ? 'Postu Düzenle' : 'Yeni Post Oluştur'}</h2>
              <button 
                className="btn-close-modal"
                onClick={() => setShowCreateModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="post-form">
              {/* Title */}
              <div className="form-group">
                <label>Başlık *</label>
                <input
                  type="text"
                  placeholder="Post başlığı..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  maxLength={200}
                  required
                />
                <small>{formData.title.length}/200</small>
              </div>

              {/* Post Type */}
              <div className="form-group">
                <label>Post Türü</label>
                <select 
                  value={formData.postType}
                  onChange={e => setFormData({...formData, postType: e.target.value})}
                >
                  <option value="announcement">Duyuru</option>
                  <option value="update">Güncelleme</option>
                  <option value="launch">Launch</option>
                </select>
              </div>

              {/* Launch Time (for launch posts) */}
              {formData.postType === 'launch' && (
                <div className="form-group">
                  <label>Launch Zamanı</label>
                  <input
                    type="datetime-local"
                    value={formData.launchTime}
                    onChange={e => setFormData({...formData, launchTime: e.target.value})}
                  />
                </div>
              )}

              {/* Content */}
              <div className="form-group">
                <label>İçerik *</label>
                <textarea
                  placeholder="Post içeriğini yazın..."
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  rows={6}
                  maxLength={5000}
                  required
                />
                <small>{formData.content.length}/5000</small>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label>Etiketler (virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="#token #launch #airdrop"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                />
              </div>

              {/* Links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.website}
                    onChange={e => setFormData({...formData, website: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Twitter</label>
                  <input
                    type="url"
                    placeholder="https://twitter.com/..."
                    value={formData.twitter}
                    onChange={e => setFormData({...formData, twitter: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Telegram</label>
                  <input
                    type="url"
                    placeholder="https://t.me/..."
                    value={formData.telegram}
                    onChange={e => setFormData({...formData, telegram: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Discord</label>
                  <input
                    type="url"
                    placeholder="https://discord.gg/..."
                    value={formData.discord}
                    onChange={e => setFormData({...formData, discord: e.target.value})}
                  />
                </div>
              </div>

              {/* Image */}
              <div className="form-group">
                <label>Görsel Ekle</label>
                <div className="image-upload-area">
                  {formData.imagePreview ? (
                    <div className="image-preview">
                      <img src={formData.imagePreview} alt="Preview" />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, image: null, imagePreview: null})}
                        className="btn-remove-image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <FaImage />
                      <span>Görsel seçin veya sürükleyin</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Form actions */}
              <div className="form-actions">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-cancel"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-submit"
                >
                  <FaCheck /> {editingPost ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPosts;

