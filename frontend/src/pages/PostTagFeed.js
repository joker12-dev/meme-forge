import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import VerifiedUsername from '../components/VerifiedUsername';
import ErrorAlert from '../components/ErrorAlert';
import {
  FaHeart, FaRegHeart, FaComment, FaShare, FaFilter,
  FaSearch, FaArrowLeft, FaArrowRight, FaHashtag,
  FaClock, FaUser, FaFire, FaCheckCircle, FaThumbtack
} from 'react-icons/fa';
import './PostsFeed.css';

const PostTagFeed = () => {
  const { tagName } = useParams();
  const navigate = useNavigate();
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

  // Update wallet from context
  useEffect(() => {
    if (walletAccount) {
      setWalletAddress(walletAccount.toLowerCase());
    }
  }, [walletAccount]);

  // Load posts by tag
  useEffect(() => {
    loadPostsByTag();
  }, [currentPage, tagName]);

  const loadPostsByTag = async () => {
    try {
      setLoading(true);
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

      const url = `${backendURL}/api/posts/tag/${encodeURIComponent(tagName)}?page=${currentPage}&limit=${postsPerPage}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      } else {
        setError('Could not load posts');
      }
    } catch (err) {
      console.error('Load posts by tag error:', err);
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  // Like post
  const handleLikePost = async (postId) => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendURL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'wallet-address': walletAddress }
      });

      const data = await response.json();

      if (data.success) {
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

  // Check if post is liked
  const isLiked = (post) => {
    return post.likes && post.likes.includes(walletAddress);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 30) return `${diffDays}d`;

    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="posts-feed-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="posts-feed-container">
      <div className="feed-header">
        <div className="feed-title">
          <button 
            className="btn-back"
            onClick={() => navigate('/posts')}
            title="Go Back"
          >
            <FaArrowLeft />
          </button>
          <h2>
            <FaHashtag /> {tagName}
          </h2>
          <span className="post-count">{posts.length} posts</span>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {posts.length === 0 ? (
        <div className="empty-state">
          <FaHashtag size={48} />
          <h3>No posts found with this tag</h3>
          <Link to="/posts" className="btn-primary">View All Posts</Link>
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className={`post-item ${post.isPinned ? 'pinned' : ''}`}>
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
                  <div className="post-badges">
                    {post.isPinned && (
                      <span 
                        className="badge-type pinned" 
                        title="Pinned by admin"
                      >
                        <FaThumbtack /> PIN
                      </span>
                    )}
                    {post.postType === 'launch' && (
                      <span className="badge-type launch">LAUNCH</span>
                    )}
                  </div>
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

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="post-tags">
                        {post.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className={`tag ${tag.toLowerCase() === tagName.toLowerCase() ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (tag.toLowerCase() !== tagName.toLowerCase()) {
                                navigate(`/posts/tag/${encodeURIComponent(tag)}`);
                              }
                            }}
                          >
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
                    title={isLiked(post) ? 'Remove like' : 'Like'}
                  >
                    {isLiked(post) ? <FaHeart /> : <FaRegHeart />}
                    {post.likes?.length || 0}
                  </button>
                  <button className="engagement-btn comment" title="Comment">
                    <FaComment /> {post.commentCount || 0}
                  </button>
                  <button className="engagement-btn share" title="Share">
                    <FaShare /> {post.shareCount || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn-pagination"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <FaArrowLeft /> Previous
              </button>
              <span className="page-info">
                Page {currentPage} / {totalPages}
              </span>
              <button 
                className="btn-pagination"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next <FaArrowRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostTagFeed;
