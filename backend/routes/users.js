const express = require('express');
const router = express.Router();
const { User, Token } = require('../models');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryUpload');
const { validateUsername, validateBioDescription, validateSocialLinks, sanitizeString } = require('../middleware/validators');

// ============ GET /api/users/:address - Herkese açık profil ============
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    console.log('🔵 [GET /api/users/:address] Fetching profile for:', normalizedAddress);

    const user = await User.findByAddress(normalizedAddress);
    if (!user) {
      console.log('❌ User not found:', normalizedAddress);
      return res.status(404).json({ success: false, error: 'Profil bulunamadı' });
    }

    console.log('📊 User found - badges:', user.badges);

    // Kullanıcının oluşturduğu tokenları getir
    const tokens = await Token.findAll({
      where: { creator: normalizedAddress },
      order: [['createdAt', 'DESC']]
    });

    // Stats güncelle ve rozetleri hesapla
    await user.updateStats(tokens);
    const profileResponse = user.toProfileResponse(tokens);

    console.log('✅ Profile response - badges:', profileResponse.badges);
    return res.json({ success: true, profile: profileResponse });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ============ POST /api/users/connect - Cüzdan bağlantısı ============
router.post('/connect', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'walletAddress zorunlu' });
    }

    const user = await User.findOrCreateByAddress(walletAddress);
    const tokens = await Token.findAll({
      where: { creator: walletAddress.toLowerCase() },
      order: [['createdAt', 'DESC']]
    });

    await user.updateStats(tokens);
    return res.json({ success: true, profile: user.toProfileResponse(tokens) });
  } catch (err) {
    console.error('Connect error:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ============ PUT /api/users/:address - Profil güncelleme ============
router.put('/:address', upload.single('profileImage'), validateUsername, validateBioDescription, validateSocialLinks, async (req, res) => {
  try {
    const { address } = req.params;
    const walletHeader = req.headers['wallet-address'];

    console.log('💾 [PROFILE UPDATE] Request:', { address: address?.substring(0, 10), hasFile: !!req.file });

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    // Yalnız kendi profilini güncelleyebilir
    if (walletHeader && walletHeader.toLowerCase() !== normalizedAddress) {
      return res.status(403).json({ success: false, error: 'Yalnız kendi profilini güncelleyebilirsin' });
    }

    const user = await User.findByAddress(normalizedAddress);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Profil bulunamadı' });
    }

    // Güncellenebilir alanlar
    const {
      username,
      profileImageBase64,
      bio,
      description,
      twitter,
      telegram,
      website,
      discord,
      socialLinks
    } = req.body;

    // Kullanıcı adı benzersizliğini kontrol et
    if (username) {
      // Length validation is already done in middleware
      const existingUser = await User.findOne({
        where: { 
          username: username,
          walletAddress: { [require('sequelize').Op.ne]: normalizedAddress }
        }
      });

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          error: 'Bu kullanıcı adı zaten kullanılıyor' 
        });
      }

      user.username = username;
    }
    if (bio !== undefined) user.bio = bio;
    if (description !== undefined) user.description = description;
    if (twitter !== undefined) user.twitter = twitter;
    if (telegram !== undefined) user.telegram = telegram;
    if (website !== undefined) user.website = website;
    if (discord !== undefined) user.discord = discord;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;

    // Handle profile image upload
    if (req.file) {
      try {
        console.log('📤 [PROFILE UPDATE] File received:', { 
          filename: req.file.filename, 
          size: req.file.size,
          mimetype: req.file.mimetype,
          fieldname: req.file.fieldname
        });
        
        // Eski görüntüyü sil
        if (user.profileImage && user.profileImage.includes('cloudinary')) {
          try {
            const oldPublicId = user.profileImage.split('/').pop().split('.')[0];
            console.log('🗑️ [PROFILE UPDATE] Deleting old image:', oldPublicId);
            await deleteFromCloudinary(`meme-token/profiles/${oldPublicId}`);
          } catch (err) {
            console.warn('⚠️ [PROFILE UPDATE] Failed to delete old image:', err);
          }
        }

        // Yeni görüntüyü upload et
        console.log('📤 [PROFILE UPDATE] Uploading to Cloudinary...');
        const uploadResult = await uploadToCloudinary(req.file, 'meme-token/profiles');
        console.log('📤 [PROFILE UPDATE] Upload result:', uploadResult);
        
        if (!uploadResult || !uploadResult.url) {
          throw new Error('Cloudinary upload returned no URL');
        }
        
        user.profileImage = uploadResult.url;
        console.log('✅ [PROFILE UPDATE] Image uploaded:', uploadResult.url?.substring(0, 50));
      } catch (uploadError) {
        console.error('❌ [PROFILE UPDATE] Image upload error:', uploadError);
        console.error('❌ [PROFILE UPDATE] Error details:', { 
          message: uploadError.message, 
          code: uploadError.code,
          status: uploadError.status 
        });
        return res.status(400).json({ 
          success: false, 
          error: 'Image upload failed', 
          details: uploadError.message 
        });
      }
    }

    console.log('💾 [PROFILE UPDATE] Saving user...');
    user.lastActive = new Date();
    await user.save();

    const tokens = await Token.findAll({
      where: { creator: normalizedAddress },
      order: [['createdAt', 'DESC']]
    });

    await user.updateStats(tokens);
    console.log('✅ [PROFILE UPDATE] Profile saved successfully');
    return res.json({ success: true, profile: user.toProfileResponse(tokens) });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ============ GET /api/users - Top creators listesi ============
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const sortBy = req.query.sortBy || 'totalTokensCreated'; // totalTokensCreated, trustScore, voteCount

    const users = await User.findAll({
      order: [[sortBy, 'DESC']],
      limit,
      offset,
      attributes: ['walletAddress', 'username', 'profileImage', 'totalTokensCreated', 'trustScore', 'badges', 'createdAt']
    });

    const total = await User.count();

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ============ POST /api/users/:address/vote - Oylama sistemi ============
router.post('/:address/vote', async (req, res) => {
  try {
    const { address } = req.params;
    const { type } = req.body; // 'up' veya 'down'
    const voterAddress = req.headers['wallet-address'];

    if (!voterAddress) {
      return res.status(401).json({ success: false, error: 'Cüzdan bağlı değil' });
    }

    if (type !== 'up' && type !== 'down') {
      return res.status(400).json({ success: false, error: 'Geçersiz oy tipi' });
    }

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    if (voterAddress.toLowerCase() === normalizedAddress) {
      return res.status(400).json({ success: false, error: 'Kendine oy veremezsin' });
    }

    const user = await User.findByAddress(normalizedAddress);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Profil bulunamadı' });
    }

    // Vote count'u artır (basitleştirilmiş sistem)
    user.voteCount = (user.voteCount || 0) + 1;

    // Trust score güncelle (positif oylar trust'ı arttırır)
    if (type === 'up') {
      user.trustScore = Math.min(100, (user.trustScore || 0) + 2);
    } else {
      user.trustScore = Math.max(0, (user.trustScore || 0) - 1);
    }

    await user.save();

    return res.json({
      success: true,
      voteCount: user.voteCount,
      trustScore: user.trustScore
    });
  } catch (err) {
    console.error('Vote error:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ============ GET /api/users/:address/tokens - Kullanıcının tokenları (pagination) ============
router.get('/:address/tokens', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const sortBy = req.query.sortBy || 'createdAt'; // createdAt, marketCap, liquidity, totalVolume
    const sortOrder = req.query.sortOrder || 'DESC';

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    const tokens = await Token.findAll({
      where: { creator: normalizedAddress },
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    const total = await Token.count({ where: { creator: normalizedAddress } });

    return res.json({
      success: true,
      data: tokens,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get user tokens error:', err);
    return res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// ============ GET /api/users/:address/posts - Kullanıcının postları ============
router.get('/:address/posts', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const sortOrder = req.query.sortOrder || 'DESC';

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : '0x' + address.toLowerCase();

    // Import models from index.js
    const { Post, Comment } = require('../models');

    const posts = await Post.findAll({
      where: { creatorAddress: normalizedAddress },
      include: [
        {
          association: 'creator',
          attributes: ['walletAddress', 'username', 'profileImage', 'badges']
        },
        {
          model: Comment,
          attributes: ['id', 'content', 'authorAddress', 'createdAt'],
          as: 'comments',
          limit: 3, // Show only first 3 comments
          separate: true,
          include: [
            {
              model: require('../models').User,
              attributes: ['walletAddress', 'username', 'profileImage'],
              as: 'author'
            }
          ]
        }
      ],
      order: [['createdAt', sortOrder]],
      limit,
      offset,
      attributes: ['id', 'title', 'content', 'image', 'creatorAddress', 'launchTime', 'likes', 'commentCount', 'viewCount', 'createdAt', 'updatedAt']
    });

    const total = await Post.count({
      where: { creatorAddress: normalizedAddress }
    });

    return res.json({
      success: true,
      posts,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Get user posts error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
