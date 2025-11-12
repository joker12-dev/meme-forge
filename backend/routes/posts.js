/**
 * Posts API Routes
 * Launch updates, announcements, ve general posts
 * Comments, likes, ve engagement sistemi
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { Post, Comment, PostLike, CommentLike, User } = require('../models');
const { sequelize } = require('../config/database');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryUpload');
const { Op } = require('sequelize');
const { validatePostContent, validateComment } = require('../middleware/validators');

// Helper function to get client IP safely (IPv6 compatible)
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

// Rate limiters
const createPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 posts per 15 minutes
  message: 'Çok fazla gönderi oluşturdunuz. Lütfen 15 dakika sonra tekrar deneyin.',
  keyGenerator: (req) => req.headers['wallet-address'] || getClientIP(req),
  skip: (req) => !req.headers['wallet-address'],
});

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 comments per 15 minutes
  message: 'Çok fazla yorum yaptınız. Lütfen biraz bekleyin.',
  keyGenerator: (req) => req.headers['wallet-address'] || getClientIP(req),
  skip: (req) => !req.headers['wallet-address'],
});

// ============================
// 📨 POST ENDPOINTS
// ============================

/**
 * GET /api/posts
 * Tüm postları getir (pagination, filtering)
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'newest'; // newest, likes-desc, likes-asc, comments-desc
    const type = req.query.type || 'all'; // all, launch, update, announcement

    console.log('📨 GET /api/posts - Page:', page, 'Limit:', limit, 'Sort:', sortBy, 'Type:', type);

    // Build where clause for type filtering
    let where = {};
    if (type !== 'all') {
      where.postType = type;
    }

    // Get all posts first, then sort in JS if needed (safer approach)
    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges']
        }
      ],
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
      limit: 1000, // Get more for sorting
      offset: 0
    });

    console.log('✅ Posts found:', count, 'Returned:', rows.length);

    // Remove duplicate IDs - keep first occurrence
    const seenIds = new Set();
    const uniqueRows = rows.filter(post => {
      if (seenIds.has(post.id)) {
        console.warn('⚠️ Duplicate post ID found and filtered:', post.id);
        return false;
      }
      seenIds.add(post.id);
      return true;
    });

    console.log('✅ After filtering duplicates:', uniqueRows.length);

    // Sort based on criteria
    let sortedRows = uniqueRows;
    if (sortBy === 'likes-desc') {
      sortedRows = rows.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (sortBy === 'likes-asc') {
      sortedRows = rows.sort((a, b) => (a.likes?.length || 0) - (b.likes?.length || 0));
    } else if (sortBy === 'comments-desc') {
      sortedRows = rows.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    } else if (sortBy === 'comments-asc') {
      sortedRows = rows.sort((a, b) => (a.commentCount || 0) - (b.commentCount || 0));
    }

    // Apply pagination after sorting
    const paginatedRows = sortedRows.slice(offset, offset + limit);
    const pages = Math.ceil(count / limit);

    res.json({
      success: true,
      posts: paginatedRows,
      pagination: {
        total: count,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Get posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts/tag/:tagName
 * Belirtilen etiketi kullanan tüm postları getir
 * MUST be BEFORE /:postId route to avoid param matching
 */
router.get('/tag/:tagName', async (req, res) => {
  try {
    const { tagName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log('🏷️ GET /api/posts/tag/:tagName - Tag:', tagName, 'Page:', page);

    // Case-insensitive tag search using PostgreSQL array operations
    const { count, rows } = await Post.findAndCountAll({
      where: {
        tags: {
          [Op.contains]: [tagName.toLowerCase()]
        }
      },
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges']
        }
      ],
      order: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset
    });

    console.log(`✅ Found ${rows.length} posts with tag: ${tagName}`);

    res.json({
      success: true,
      tag: tagName,
      posts: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('❌ Get posts by tag error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts/tags/popular
 * En çok kullanılan etiketleri getir
 * MUST be BEFORE /:postId route
 */
router.get('/tags/popular', async (req, res) => {
  try {
    console.log('🏆 GET /api/posts/tags/popular - Fetching popular tags');

    // Get all posts
    const posts = await Post.findAll({
      attributes: ['tags'],
      raw: true
    });

    // Count tag frequencies
    const tagCounts = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
        });
      }
    });

    // Sort by frequency and get top 5
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    console.log(`✅ Found ${popularTags.length} popular tags:`, popularTags);

    res.json({
      success: true,
      tags: popularTags
    });
  } catch (error) {
    console.error('❌ Get popular tags error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts/:postId
 * Tek post ve tüm comments
 */
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId, {
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/posts
 * Yeni post oluştur (image upload optional)
 */
router.post('/', createPostLimiter, validatePostContent, upload.single('image'), async (req, res) => {
  try {
    const { title, content, postType, launchTime, tokenAddress, website, twitter, telegram, discord } = req.body;
    const creatorAddress = req.headers['wallet-address'];

    console.log('📝 [POST CREATE] Received:', { title: title?.substring(0, 20), creatorAddress });
    console.log('📝 [POST CREATE] File:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'No file');

    if (!creatorAddress || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, content, wallet-address'
      });
    }

    // Upload image if provided
    let imageUrl = null;
    if (req.file) {
      try {
        console.log('📤 [POST CREATE] Uploading image to Cloudinary...');
        const uploadResult = await uploadToCloudinary(req.file, 'meme-token/posts');
        imageUrl = uploadResult.url;
        console.log('✅ [POST CREATE] Image uploaded:', imageUrl);
      } catch (uploadError) {
        console.error('❌ [POST CREATE] Image upload failed:', uploadError);
        return res.status(400).json({ success: false, error: 'Image upload failed', details: uploadError.message });
      }
    }

    // Normalize addresses
    const normalizedCreator = creatorAddress.toLowerCase().startsWith('0x')
      ? creatorAddress.toLowerCase()
      : '0x' + creatorAddress.toLowerCase();

    console.log('💾 [POST CREATE] Creating post with data:', {
      title: title?.substring(0, 20),
      imageUrl: imageUrl?.substring(0, 50),
      website: website ? 'yes' : 'no',
      twitter: twitter ? 'yes' : 'no'
    });

    // Create post
    const post = await Post.create({
      title,
      content,
      image: imageUrl,
      creatorAddress: normalizedCreator,
      postType: postType || 'announcement',
      launchTime: launchTime || null,
      tokenAddress: tokenAddress || null,
      website: website || null,
      twitter: twitter || null,
      telegram: telegram || null,
      discord: discord || null,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    // Load creator info
    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: createdPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/posts/:postId
 * Post düzenle (sadece creator)
 */
router.put('/:postId', upload.single('image'), async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, postType, launchTime, website, twitter, telegram, discord, tags } = req.body;
    const creatorAddress = req.headers['wallet-address'];

    if (!creatorAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check authorization
    if (post.creatorAddress.toLowerCase() !== creatorAddress.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Only creator can edit post' });
    }

    // Save old content to history
    const previousContent = post.content;
    if (post.editHistory) {
      post.editHistory.push({
        editedAt: new Date(),
        previousContent,
        previousTitle: post.title
      });
    }

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (postType) post.postType = postType;
    if (launchTime) post.launchTime = launchTime;
    if (website) post.website = website;
    if (twitter) post.twitter = twitter;
    if (telegram) post.telegram = telegram;
    if (discord) post.discord = discord;
    
    // Update tags
    if (tags) {
      post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Handle new image
    if (req.file) {
      // Delete old image if exists
      if (post.image && post.image.includes('cloudinary')) {
        try {
          const oldPublicId = post.image.split('/').pop().split('.')[0];
          await deleteFromCloudinary(oldPublicId);
        } catch (err) {
          console.warn('Failed to delete old image:', err);
        }
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(req.file, 'meme-token/posts');
      post.image = uploadResult.url;
    }

    post.editedAt = new Date();
    await post.save();

    const updatedPost = await Post.findByPk(postId, {
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/posts/:postId
 * Post sil (sadece creator)
 */
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const creatorAddress = req.headers['wallet-address'];

    if (!creatorAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check authorization
    if (post.creatorAddress.toLowerCase() !== creatorAddress.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Only creator can delete post' });
    }

    // Delete image from Cloudinary
    if (post.image && post.image.includes('cloudinary')) {
      try {
        const publicId = post.image.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.warn('Failed to delete image:', err);
      }
    }

    // Delete all comments
    await Comment.destroy({ where: { postId } });

    // Delete post
    await post.destroy();

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// 👍 LIKE ENDPOINTS
// ============================

/**
 * POST /api/posts/:postId/like
 * Post'u like/unlike yap
 */
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const userAddress = req.headers['wallet-address'];

    if (!userAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const normalizedUser = userAddress.toLowerCase();

    // Initialize likes if null
    let currentLikes = post.likes || [];
    if (!Array.isArray(currentLikes)) {
      currentLikes = [];
    }

    // Check if already liked
    let newLikes;
    if (currentLikes.includes(normalizedUser)) {
      // Unlike
      newLikes = currentLikes.filter(addr => addr !== normalizedUser);
    } else {
      // Like
      newLikes = [...currentLikes, normalizedUser];
    }

    console.log(`[LIKE] Post ${postId} - User: ${normalizedUser}`);
    console.log(`[LIKE] Old likes:`, currentLikes);
    console.log(`[LIKE] New likes:`, newLikes);

    // Force update on JSONB field using raw sequelize update
    const updateResult = await Post.update(
      { likes: newLikes },
      { where: { id: postId }, returning: true, raw: true }
    );

    console.log(`[LIKE] Database update result:`, updateResult);

    // Fetch fresh post from DB
    const updatedPost = await Post.findByPk(postId);
    
    console.log(`[LIKE] Post ${postId} after DB fetch. Final likes:`, updatedPost.likes);

    res.json({
      success: true,
      likes: updatedPost.likes || [],
      likeCount: (updatedPost.likes || []).length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// 💬 COMMENT ENDPOINTS
// ============================

/**
 * POST /api/posts/:postId/comments
 * Yeni comment ekle
 */
router.post('/:postId/comments', commentLimiter, validateComment, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, replyToCommentId } = req.body;
    const authorAddress = req.headers['wallet-address'];

    if (!authorAddress || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, wallet-address'
      });
    }

    // Check post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Create comment
    const comment = await Comment.create({
      content,
      postId,
      authorAddress: authorAddress.toLowerCase(),
      replyToCommentId: replyToCommentId || null
    });

    // Increment comment count
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Load comment with author info
    const populatedComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ['walletAddress', 'username', 'profileImage'],
          as: 'author',
          foreignKey: 'authorAddress'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/posts/:postId/comments
 * Post comments'lerini getir (pagination)
 */
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log('📨 GET /api/posts/:postId/comments - postId:', postId);

    const { count, rows } = await Comment.findAndCountAll({
      where: { postId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: ['walletAddress', 'username', 'profileImage'],
          as: 'author'
        },
        {
          model: Comment,
          as: 'replies',
          attributes: ['id', 'content', 'authorAddress', 'likes', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['walletAddress', 'username', 'profileImage'],
              as: 'author'
            }
          ]
        }
      ]
    });

    const pages = Math.ceil(count / limit);

    console.log('✅ Comments found:', count);

    res.json({
      success: true,
      comments: rows,
      pagination: { total: count, page, pages, limit }
    });
  } catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/comments/:commentId
 * Comment düzenle (sadece author)
 */
router.put('/comment/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const authorAddress = req.headers['wallet-address'];

    if (!authorAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (comment.authorAddress.toLowerCase() !== authorAddress.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Only author can edit comment' });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          attributes: ['walletAddress', 'username', 'profileImage'],
          as: 'author',
          foreignKey: 'authorAddress'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/comments/:commentId
 * Comment sil (sadece author)
 */
router.delete('/comment/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const authorAddress = req.headers['wallet-address'];

    if (!authorAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (comment.authorAddress.toLowerCase() !== authorAddress.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Only author can delete comment' });
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    // Decrement post comment count
    const post = await Post.findByPk(comment.postId);
    if (post) {
      post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
      await post.save();
    }

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/comments/:commentId/like
 * Comment'i like/unlike yap
 */
router.post('/comment/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userAddress = req.headers['wallet-address'];

    if (!userAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const normalizedUser = userAddress.toLowerCase();

    // Initialize likes if null
    let currentLikes = comment.likes || [];
    if (!Array.isArray(currentLikes)) {
      currentLikes = [];
    }

    // Check if already liked
    let newLikes;
    if (currentLikes.includes(normalizedUser)) {
      // Unlike
      newLikes = currentLikes.filter(addr => addr !== normalizedUser);
    } else {
      // Like
      newLikes = [...currentLikes, normalizedUser];
    }

    console.log(`[COMMENT-LIKE] Comment ${commentId} - User: ${normalizedUser}`);
    console.log(`[COMMENT-LIKE] Old likes:`, currentLikes);
    console.log(`[COMMENT-LIKE] New likes:`, newLikes);

    // Force update on JSONB field using raw sequelize update
    const updateResult = await Comment.update(
      { likes: newLikes },
      { where: { id: commentId }, returning: true, raw: true }
    );

    console.log(`[COMMENT-LIKE] Database update result:`, updateResult);

    // Fetch fresh comment from DB
    const updatedComment = await Comment.findByPk(commentId);
    
    console.log(`[COMMENT-LIKE] Comment ${commentId} after DB fetch. Final likes:`, updatedComment.likes);

    res.json({
      success: true,
      likes: updatedComment.likes || [],
      likeCount: (updatedComment.likes || []).length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/posts/:postId/pin - Toggle pin status
router.post('/:postId/pin', async (req, res) => {
  try {
    const { postId } = req.params;
    const Post = require('../models/Post');

    // Get current post
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Toggle pin status
    const newPinStatus = !post.isPinned;
    post.isPinned = newPinStatus;
    await post.save();

    res.json({
      success: true,
      message: newPinStatus ? 'Post pinned' : 'Post unpinned',
      isPinned: newPinStatus,
      post: post
    });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
