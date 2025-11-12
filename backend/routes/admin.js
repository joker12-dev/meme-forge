/**
 * Admin API Routes
 * Token hype management, platform settings, ve admin operations
 */

const express = require('express');
const router = express.Router();
const { TokenHype, Token } = require('../models');
const { Op } = require('sequelize');

/**
 * POST /api/admin/hypes
 * Yeni token hype oluştur
 */
router.post('/hypes', async (req, res) => {
  try {
    const { tokenAddress, tier, startDate, endDate, description } = req.body;

    // Validation
    if (!tokenAddress || !tier) {
      return res.status(400).json({
        success: false,
        error: 'Token address ve tier gerekli'
      });
    }

    // Check if token exists
    const token = await Token.findOne({ where: { address: tokenAddress } });
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token bulunamadı'
      });
    }

    // Check if hype already exists for this token and tier
    const existingHype = await TokenHype.findOne({
      where: {
        tokenAddress: tokenAddress,
        tier: tier,
        status: 'active'
      }
    });

    if (existingHype) {
      return res.status(400).json({
        success: false,
        error: 'Bu token için bu tier zaten aktif'
      });
    }

    // Create new hype
    const hype = await TokenHype.create({
      tokenAddress,
      tier,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
      description: description || '',
      status: 'active'
    });

    console.log(`[ADMIN-HYPE] Created: Token=${tokenAddress}, Tier=${tier}`);

    res.json({
      success: true,
      message: 'Hype başarıyla oluşturuldu',
      hype
    });
  } catch (error) {
    console.error('Create hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/hypes
 * Tüm hypes'ları listele (pagination, filtering)
 */
router.get('/hypes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all'; // all, active, inactive, expired
    const tier = req.query.tier || 'all'; // all, gold, silver, bronze

    console.log(`[ADMIN-HYPE] List - Page:${page}, Status:${status}, Tier:${tier}`);

    // Build where clause
    const where = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (tier !== 'all') {
      where.tier = tier;
    }

    // Find hypes
    const { count, rows } = await TokenHype.findAndCountAll({
      where,
      include: [
        {
          model: Token,
          as: 'token',
          attributes: ['address', 'symbol', 'name', 'logoURL']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const pages = Math.ceil(count / limit);

    res.json({
      success: true,
      hypes: rows,
      pagination: {
        total: count,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    console.error('List hypes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/hypes/:id
 * Spesifik hype'ın detayını getir
 */
router.get('/hypes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hype = await TokenHype.findByPk(id, {
      include: [
        {
          model: Token,
          as: 'token',
          attributes: ['address', 'symbol', 'name', 'logoURL', 'description']
        }
      ]
    });

    if (!hype) {
      return res.status(404).json({
        success: false,
        error: 'Hype bulunamadı'
      });
    }

    res.json({ success: true, hype });
  } catch (error) {
    console.error('Get hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/hypes/:id
 * Hype'ı güncelle
 */
router.put('/hypes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tier, startDate, endDate, description, status } = req.body;

    const hype = await TokenHype.findByPk(id);

    if (!hype) {
      return res.status(404).json({
        success: false,
        error: 'Hype bulunamadı'
      });
    }

    // Update fields
    if (tier) hype.tier = tier;
    if (startDate) hype.startDate = startDate;
    if (endDate) hype.endDate = endDate;
    if (description !== undefined) hype.description = description;
    if (status) hype.status = status;

    await hype.save();

    console.log(`[ADMIN-HYPE] Updated: ID=${id}, Status=${status || 'unchanged'}`);

    res.json({
      success: true,
      message: 'Hype başarıyla güncellendi',
      hype
    });
  } catch (error) {
    console.error('Update hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/hypes/:id
 * Hype'ı sil
 */
router.delete('/hypes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hype = await TokenHype.findByPk(id);

    if (!hype) {
      return res.status(404).json({
        success: false,
        error: 'Hype bulunamadı'
      });
    }

    await hype.destroy();

    console.log(`[ADMIN-HYPE] Deleted: ID=${id}`);

    res.json({
      success: true,
      message: 'Hype başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/hypes/:id/activate
 * Hype'ı aktif et
 */
router.post('/hypes/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const hype = await TokenHype.findByPk(id);

    if (!hype) {
      return res.status(404).json({
        success: false,
        error: 'Hype bulunamadı'
      });
    }

    hype.status = 'active';
    await hype.save();

    console.log(`[ADMIN-HYPE] Activated: ID=${id}`);

    res.json({
      success: true,
      message: 'Hype aktif edildi',
      hype
    });
  } catch (error) {
    console.error('Activate hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/hypes/:id/deactivate
 * Hype'ı deaktif et
 */
router.post('/hypes/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const hype = await TokenHype.findByPk(id);

    if (!hype) {
      return res.status(404).json({
        success: false,
        error: 'Hype bulunamadı'
      });
    }

    hype.status = 'inactive';
    await hype.save();

    console.log(`[ADMIN-HYPE] Deactivated: ID=${id}`);

    res.json({
      success: true,
      message: 'Hype deaktif edildi',
      hype
    });
  } catch (error) {
    console.error('Deactivate hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tokens/:tokenAddress/hype
 * Token'ın aktif hype'ını getir (public endpoint)
 */
router.get('/tokens/:tokenAddress/hype', async (req, res) => {
  try {
    const { tokenAddress } = req.params;

    const hype = await TokenHype.findOne({
      where: {
        tokenAddress: tokenAddress,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (!hype) {
      return res.json({
        success: true,
        hype: null,
        message: 'Bu token için aktif hype yok'
      });
    }

    res.json({
      success: true,
      hype: {
        tier: hype.tier,
        description: hype.description,
        startDate: hype.startDate,
        endDate: hype.endDate
      }
    });
  } catch (error) {
    console.error('Get token hype error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/campaigns
 * List campaigns with filters and pagination
 */
router.get('/campaigns', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const status = req.query.status || 'all';
    const category = req.query.category || 'all';
    const offset = (page - 1) * limit;

    const { Campaign, Token } = require('../models');

    let where = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (category !== 'all') {
      where.category = category;
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where,
      include: [{ model: Token, as: 'token', attributes: ['name', 'symbol', 'logoURL', 'address'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      campaigns,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/campaigns
 * Create new campaign
 */
router.post('/campaigns', async (req, res) => {
  try {
    const { tokenAddress, title, description, startDate, endDate, category, tier } = req.body;
    const { Campaign, Token } = require('../models');

    if (!tokenAddress || !title) {
      return res.status(400).json({ success: false, error: 'Token address ve title gerekli' });
    }

    // Check token exists
    const token = await Token.findOne({ where: { address: tokenAddress } });
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    const campaign = await Campaign.create({
      tokenAddress: tokenAddress.toLowerCase(),
      title,
      description,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      category: category || 'general',
      tier: tier || 'bronze',
      status: 'active'
    });

    res.json({
      success: true,
      message: 'Campaign created',
      campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/campaigns/:id
 * Update campaign
 */
router.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, tier, endDate } = req.body;
    const { Campaign } = require('../models');

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (status) campaign.status = status;
    if (tier) campaign.tier = tier;
    if (endDate) campaign.endDate = endDate;

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated',
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/campaigns/:id
 * Delete campaign
 */
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Campaign } = require('../models');

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    await campaign.destroy();

    res.json({
      success: true,
      message: 'Campaign deleted'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
