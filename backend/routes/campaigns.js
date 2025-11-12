/**
 * Campaign Management Routes
 * Handles token campaign creation, listing, updating
 */

const express = require('express');
const router = express.Router();
const { Campaign, Token } = require('../models');
const { Op } = require('sequelize');

/**
 * POST /api/campaigns
 * Create new campaign
 */
router.post('/', async (req, res) => {
  try {
    const { tokenAddress, title, description, startDate, endDate, category, tier } = req.body;

    // Validation
    if (!tokenAddress || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Token address, title ve description gerekli'
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

    // Create campaign
    const campaign = await Campaign.create({
      tokenAddress: tokenAddress.toLowerCase(),
      title,
      description,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
      category: category || 'general',
      tier: tier || 'bronze',
      status: 'active',
      views: 0,
      clicks: 0
    });

    console.log('✅ Campaign created:', campaign.id);

    res.json({
      success: true,
      message: 'Campaign oluşturuldu',
      campaign: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/campaigns
 * List all campaigns with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const status = req.query.status || 'all';
    const offset = (page - 1) * limit;

    let where = {};
    if (status !== 'all') {
      where.status = status;
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where,
      include: [{ model: Token, as: 'token', attributes: ['name', 'symbol', 'logoURL'] }],
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
 * GET /api/campaigns/active
 * Get active campaigns for slider
 */
router.get('/active', async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: {
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'tokenAddress', 'title', 'slug', 'description', 'imageUrl', 'bannerUrl', 'category', 'status', 'endDate', 'views', 'clicks', 'tier']
    });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Get active campaigns error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/campaigns/:id
 * Get single campaign detail
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id, {
      include: [{ model: Token, as: 'token' }]
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, endDate, status } = req.body;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (endDate) campaign.endDate = endDate;
    if (status) campaign.status = status;

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign güncellendi',
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    await campaign.destroy();

    res.json({
      success: true,
      message: 'Campaign silindi'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/click
 * Record click on campaign
 */
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    campaign.clicks = (campaign.clicks || 0) + 1;
    await campaign.save();

    res.json({ success: true, clicks: campaign.clicks });
  } catch (error) {
    console.error('Record click error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/campaigns/:id/view
 * Record view on campaign
 */
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    campaign.views = (campaign.views || 0) + 1;
    await campaign.save();

    res.json({ success: true, views: campaign.views });
  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
