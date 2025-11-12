import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getBackendURL } from '../utils/api';
import VerifiedUsername from '../components/VerifiedUsername';
import {
  FaArrowLeft, FaHeart, FaRegHeart, FaComment, FaShare,
  FaTwitter, FaTelegram, FaGlobe, FaDiscord, FaEdit, FaTrash
} from 'react-icons/fa';
import './PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const { account: walletAccount } = useWallet();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Load post detail
  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId, walletAccount]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/${postId}`);
      const data = await response.json();

      if (data.success && data.post) {
        setPost(data.post);
        if (walletAccount && data.post.likes) {
          setIsLiked(data.post.likes.includes(walletAccount.toLowerCase()));
        }
      } else {
        setError(data.error || 'Post yüklenemedi');
      }
    } catch (err) {
      console.error('Load post error:', err);
      setError('Post yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/${postId}/comments?page=1&limit=50`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments || []);
        console.log('✅ Comments loaded:', data.comments?.length);
      } else {
        console.error('Comments error:', data.error);
      }
    } catch (err) {
      console.error('Load comments error:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!walletAccount) {
      alert('Cüzdan bağlı değil');
      return;
    }

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'wallet-address': walletAccount
        }
      });

      const data = await response.json();
      if (data.success) {
        setPost(prev => ({
          ...prev,
          likes: data.likes
        }));
        setIsLiked(!isLiked);
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!walletAccount) {
      alert('Cüzdan bağlı değil');
      return;
    }

    if (!newComment.trim()) {
      alert('Yorum boş olamaz');
      return;
    }

    try {
      setCommentLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAccount
        },
        body: JSON.stringify({ content: newComment })
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        loadComments(); // Reload comments to get new one
        loadPost(); // Reload post to update comment count
      } else {
        alert(data.error || 'Yorum eklenemedi');
      }
    } catch (err) {
      console.error('Add comment error:', err);
      alert('Yorum ekleme hatası');
    } finally {
      setCommentLoading(false);
    }
  };

  // Like/unlike comment
  const handleCommentLike = async (commentId) => {
    if (!walletAccount) {
      alert('Cüzdan bağlı değil');
      return;
    }

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/comment/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'wallet-address': walletAccount
        }
      });

      const data = await response.json();

      if (data.success) {
        // Update comment likes in state
        setComments(commentsList =>
          commentsList.map(comment =>
            comment.id === commentId
              ? { ...comment, likes: data.likes }
              : comment
          )
        );
      } else {
        alert(data.error || 'Yorum beğeni eklenemedi');
      }
    } catch (err) {
      console.error('Comment like error:', err);
      alert('Yorum beğeni eklenirken hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Postu silmek istediğinize emin misiniz?')) return;

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'getBackendURL()';
      const response = await fetch(`${backendURL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'wallet-address': walletAccount
        }
      });

      const data = await response.json();
      if (data.success) {
        navigate('/posts');
      } else {
        alert(data.error || 'Post silinemedi');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Silme hatası');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#ffd700' }}>Yükleniyor...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 18, color: '#ff6b6b' }}>{error || 'Post bulunamadı'}</div>
        <button
          onClick={() => navigate('/posts')}
          style={{
            background: '#ffd700',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FaArrowLeft /> Geri Dön
        </button>
      </div>
    );
  }

  const isOwnPost = walletAccount?.toLowerCase() === post.creatorAddress?.toLowerCase();
  const formatDate = (date) => new Date(date).toLocaleString('tr-TR');
  const getInitial = (username) => (username || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <button
            onClick={() => navigate('/posts')}
            style={{
              background: 'transparent',
              color: '#ffd700',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20
            }}
          >
            <FaArrowLeft /> Geri Dön
          </button>

          {/* Post Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
            border: '1px solid #333',
            borderRadius: 16,
            overflow: 'hidden'
          }}>
            {/* Post Image */}
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '500px',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* Post Content */}
            <div style={{ padding: '30px' }}>
              {/* Author Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: '#ffd700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    fontSize: 20
                  }}>
                    {getInitial(post.creator?.username)}
                  </div>
                  <div>
                    <VerifiedUsername
                      username={post.creator?.username || 'Anonymous'}
                      badges={post.creator?.badges || []}
                      isVerified={post.creator?.badges?.some(b => typeof b === 'string' ? b.includes('Verified') : false) || false}
                      fontSize={14}
                      walletAddress={post.creatorAddress}
                    />
                    <div style={{ color: '#aaa', fontSize: 12 }}>
                      {post.creatorAddress?.slice(0, 6)}...{post.creatorAddress?.slice(-4)}
                    </div>
                  </div>
                </div>

                {/* Edit/Delete Buttons */}
                {isOwnPost && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => navigate(`/my-posts?edit=${postId}`)}
                      style={{
                        background: '#4a7c59',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <FaEdit /> Düzenle
                    </button>
                    <button
                      onClick={handleDelete}
                      style={{
                        background: '#c92a2a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <FaTrash /> Sil
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Content */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {post.isPinned && (
                  <span style={{ fontSize: 24, title: 'Sabitlenmiş Post' }}>📌</span>
                )}
                <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
                  {post.title}
                </h1>
              </div>

              <div style={{
                fontSize: 12,
                color: '#aaa',
                marginBottom: 16,
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap'
              }}>
                <span>{formatDate(post.createdAt)}</span>
                {post.postType && <span>Tür: {post.postType}</span>}
                {post.launchTime && <span>Launch: {formatDate(post.launchTime)}</span>}
              </div>

              <p style={{
                fontSize: 16,
                lineHeight: '1.6',
                marginBottom: 24,
                color: '#e0e0e0'
              }}>
                {post.content}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255, 215, 0, 0.1)',
                        color: '#ffd700',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                {post.website && (
                  <a
                    href={post.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#ffd700',
                      textDecoration: 'none'
                    }}
                  >
                    <FaGlobe /> Website
                  </a>
                )}
                {post.twitter && (
                  <a
                    href={post.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#1DA1F2',
                      textDecoration: 'none'
                    }}
                  >
                    <FaTwitter /> Twitter
                  </a>
                )}
                {post.telegram && (
                  <a
                    href={post.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#0088cc',
                      textDecoration: 'none'
                    }}
                  >
                    <FaTelegram /> Telegram
                  </a>
                )}
                {post.discord && (
                  <a
                    href={post.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#5865F2',
                      textDecoration: 'none'
                    }}
                  >
                    <FaDiscord /> Discord
                  </a>
                )}
              </div>

              {/* Engagement Buttons */}
              <div style={{
                display: 'flex',
                gap: 24,
                paddingTop: 24,
                borderTop: '1px solid #333'
              }}>
                <button
                  onClick={handleLike}
                  style={{
                    background: 'transparent',
                    color: isLiked ? '#ff6b6b' : '#aaa',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 16
                  }}
                >
                  {isLiked ? <FaHeart /> : <FaRegHeart />}
                  {post.likes?.length || 0}
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  color: '#aaa'
                }}>
                  <FaComment /> {post.commentCount || post.comments?.length || 0}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16,
                  color: '#aaa'
                }}>
                  <FaShare /> {post.shareCount || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Yorumlar</h2>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} style={{ marginBottom: 30 }}>
              <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 12
              }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Yorum yaz..."
                  style={{
                    flex: 1,
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
                <button
                  type="submit"
                  disabled={commentLoading}
                  style={{
                    background: '#ffd700',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: commentLoading ? 0.6 : 1
                  }}
                >
                  {commentLoading ? 'Yükleniyor...' : 'Gönder'}
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {commentsLoading ? (
                <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>Yorumlar yükleniyor...</div>
              ) : comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 12,
                      padding: '16px',
                      display: 'flex',
                      gap: 12
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#ffd700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a1a1a',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      {getInitial(comment.author?.username)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <VerifiedUsername
                          username={comment.author?.username || 'Anonymous'}
                          badges={comment.author?.badges || []}
                          isVerified={comment.author?.badges?.some(b => typeof b === 'string' ? b.includes('Verified') : false) || false}
                          fontSize={14}
                          walletAddress={comment.authorAddress}
                        />
                        <div style={{ color: '#aaa', fontSize: 12 }}>
                          {comment.authorAddress?.slice(0, 6)}...{comment.authorAddress?.slice(-4)}
                        </div>
                        <div style={{ color: '#aaa', fontSize: 12, marginLeft: 'auto' }}>
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <p style={{ margin: '0 0 12px 0', color: '#e0e0e0' }}>
                        {comment.content}
                      </p>
                      <div style={{ display: 'flex', gap: 8, color: '#aaa', fontSize: 12 }}>
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <FaRegHeart /> {comment.likes?.length || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                  Henüz yorum yok
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

