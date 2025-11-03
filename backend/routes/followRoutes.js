/**
 * Users - Follow Endpoints
 * Birbirini takip etme sistemi
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { Op } = require('sequelize');

// ============================
// 👥 FOLLOW ENDPOINTS
// ============================

/**
 * POST /api/follow/:address/follow
 * Kullanıcıyı takip et
 */
router.post('/:address/follow', async (req, res) => {
  try {
    const { address } = req.params;
    const followerAddress = req.headers['wallet-address'];

    console.log('🔗 POST /api/follow/:address/follow - Target:', address, 'Follower:', followerAddress);

    if (!followerAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const normalizedTarget = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    const normalizedFollower = followerAddress.toLowerCase().startsWith('0x')
      ? followerAddress.toLowerCase()
      : '0x' + followerAddress.toLowerCase();

    console.log('✅ Normalized - Target:', normalizedTarget, 'Follower:', normalizedFollower);

    // Kendini takip etmeyi engelle
    if (normalizedTarget === normalizedFollower) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }

    // Target kullanıcısını bul
    const targetUser = await User.findOne({
      where: { walletAddress: normalizedTarget }
    });

    if (!targetUser) {
      console.log('❌ Target user not found:', normalizedTarget);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Follower kullanıcısını bul veya oluştur
    let followerUser = await User.findOne({
      where: { walletAddress: normalizedFollower }
    });

    if (!followerUser) {
      followerUser = await User.create({
        walletAddress: normalizedFollower
      });
    }

    // Zaten takip ediliyor mu kontrol et
    if (targetUser.followersList && targetUser.followersList.includes(normalizedFollower)) {
      return res.status(400).json({ success: false, error: 'Already following this user' });
    }

    // Follow işlemini yap
    if (!targetUser.followersList) {
      targetUser.followersList = [];
    }
    const newFollowersList = [...targetUser.followersList, normalizedFollower];

    if (!followerUser.followingList) {
      followerUser.followingList = [];
    }
    const newFollowingList = [...followerUser.followingList, normalizedTarget];

    console.log('💾 [FOLLOW] Target followers before:', targetUser.followersList);
    console.log('💾 [FOLLOW] Target followers after:', newFollowersList);
    console.log('💾 [FOLLOW] Follower following before:', followerUser.followingList);
    console.log('💾 [FOLLOW] Follower following after:', newFollowingList);

    // Use raw update to ensure ARRAY is saved
    await User.update(
      { 
        followersList: newFollowersList,
        followersCount: newFollowersList.length 
      },
      { where: { id: targetUser.id } }
    );
    
    await User.update(
      { 
        followingList: newFollowingList,
        followingCount: newFollowingList.length 
      },
      { where: { id: followerUser.id } }
    );

    // Refresh from database to confirm save
    const updatedTargetUser = await User.findByPk(targetUser.id);
    const updatedFollowerUser = await User.findByPk(followerUser.id);

    console.log('✅ [FOLLOW] After DB update - Target followers:', updatedTargetUser.followersList);
    console.log('✅ [FOLLOW] After DB update - Follower following:', updatedFollowerUser.followingList);

    res.json({
      success: true,
      message: 'Successfully followed user',
      targetFollowers: updatedTargetUser.followersCount,
      yourFollowing: updatedFollowerUser.followingCount
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/users/:address/unfollow
 * Kullanıcıyı takip etmeyi bırak
 */
router.post('/:address/unfollow', async (req, res) => {
  try {
    const { address } = req.params;
    const followerAddress = req.headers['wallet-address'];

    if (!followerAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const normalizedTarget = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    const normalizedFollower = followerAddress.toLowerCase().startsWith('0x')
      ? followerAddress.toLowerCase()
      : '0x' + followerAddress.toLowerCase();

    // Target kullanıcısını bul
    const targetUser = await User.findOne({
      where: { walletAddress: normalizedTarget }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Follower kullanıcısını bul
    const followerUser = await User.findOne({
      where: { walletAddress: normalizedFollower }
    });

    if (!followerUser) {
      return res.status(404).json({ success: false, error: 'Follower not found' });
    }

    // Takip ediliyor mu kontrol et
    if (!targetUser.followersList || !targetUser.followersList.includes(normalizedFollower)) {
      return res.status(400).json({ success: false, error: 'Not following this user' });
    }

    // Unfollow işlemini yap
    const newFollowersList = targetUser.followersList.filter(
      addr => addr !== normalizedFollower
    );

    const newFollowingList = followerUser.followingList.filter(
      addr => addr !== normalizedTarget
    );

    console.log('💾 [UNFOLLOW] Target followers before:', targetUser.followersList);
    console.log('💾 [UNFOLLOW] Target followers after:', newFollowersList);
    console.log('💾 [UNFOLLOW] Follower following before:', followerUser.followingList);
    console.log('💾 [UNFOLLOW] Follower following after:', newFollowingList);

    // Use raw update to ensure ARRAY is saved
    await User.update(
      { 
        followersList: newFollowersList,
        followersCount: newFollowersList.length 
      },
      { where: { id: targetUser.id } }
    );

    await User.update(
      { 
        followingList: newFollowingList,
        followingCount: newFollowingList.length 
      },
      { where: { id: followerUser.id } }
    );

    // Refresh from database to confirm save
    const updatedTargetUser = await User.findByPk(targetUser.id);
    const updatedFollowerUser = await User.findByPk(followerUser.id);

    console.log('✅ [UNFOLLOW] After DB update - Target followers:', updatedTargetUser.followersList);
    console.log('✅ [UNFOLLOW] After DB update - Follower following:', updatedFollowerUser.followingList);

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
      targetFollowers: updatedTargetUser.followersCount,
      yourFollowing: updatedFollowerUser.followingCount
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/:address/followers
 * Kullanıcının takipçilerini getir
 */
router.get('/:address/followers', async (req, res) => {
  try {
    const { address } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    const user = await User.findOne({
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const followersList = user.followersList || [];
    const paginatedFollowers = followersList.slice(offset, offset + limit);

    // Takipçi bilgilerini getir
    const followers = await User.findAll({
      where: { walletAddress: { [Op.in]: paginatedFollowers } },
      attributes: ['walletAddress', 'username', 'profileImage', 'badges', 'trustScore', 'followersCount']
    });

    res.json({
      success: true,
      followers,
      pagination: {
        total: followersList.length,
        page,
        pages: Math.ceil(followersList.length / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/:address/following
 * Kullanıcının takip ettiklerini getir
 */
router.get('/:address/following', async (req, res) => {
  try {
    const { address } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    const user = await User.findOne({
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const followingList = user.followingList || [];
    const paginatedFollowing = followingList.slice(offset, offset + limit);

    // Takip edilen kullanıcı bilgilerini getir
    const following = await User.findAll({
      where: { walletAddress: { [Op.in]: paginatedFollowing } },
      attributes: ['walletAddress', 'username', 'profileImage', 'badges', 'trustScore', 'followersCount']
    });

    res.json({
      success: true,
      following,
      pagination: {
        total: followingList.length,
        page,
        pages: Math.ceil(followingList.length / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/:address/is-following
 * Belirli bir kullanıcıyı takip ediyorsanız kontrol et
 */
router.get('/:address/is-following', async (req, res) => {
  try {
    const { address } = req.params;
    const userAddress = req.headers['wallet-address'];

    console.log('🔍 Checking follow status - Target:', address, 'User:', userAddress);

    if (!userAddress) {
      return res.json({ success: true, isFollowing: false });
    }

    const normalizedTarget = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    const normalizedUser = userAddress.toLowerCase().startsWith('0x')
      ? userAddress.toLowerCase()
      : '0x' + userAddress.toLowerCase();

    console.log('✅ Normalized - Target:', normalizedTarget, 'User:', normalizedUser);

    const targetUser = await User.findOne({
      where: { walletAddress: normalizedTarget }
    });

    if (!targetUser || !targetUser.followersList) {
      console.log('⚠️ Target user not found or no followers list');
      return res.json({ success: true, isFollowing: false });
    }

    const isFollowing = targetUser.followersList.includes(normalizedUser);
    console.log('📊 Is following:', isFollowing, 'Followers list:', targetUser.followersList);

    res.json({ success: true, isFollowing });
  } catch (error) {
    console.error('Is following error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
