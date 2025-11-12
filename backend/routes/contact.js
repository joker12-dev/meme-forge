const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const logger = require('../utils/logger');
const { sendContactReply } = require('../config/email');

/**
 * POST /api/contact
 * Create a new contact message
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, subject, message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Create contact message
    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      ipAddress,
      userAgent,
      status: 'new'
    });

    logger.info(`New contact message from ${email}: ${subject}`);

    res.status(201).json({
      success: true,
      message: 'Contact message received successfully',
      data: {
        id: contactMessage.id,
        email: contactMessage.email,
        subject: contactMessage.subject,
        createdAt: contactMessage.createdAt
      }
    });
  } catch (error) {
    logger.error('Contact message creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save contact message'
    });
  }
});

/**
 * GET /api/contact
 * Get all contact messages (admin only)
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const messages = await ContactMessage.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    logger.error('Fetch contact messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contact messages'
    });
  }
});

/**
 * GET /api/contact/:id
 * Get a specific contact message (admin only)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Fetch contact message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contact message'
    });
  }
});

/**
 * PATCH /api/contact/:id/status
 * Update contact message status (admin only)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const message = await ContactMessage.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    await message.update({ status });

    logger.info(`Contact message ${id} status updated to ${status}`);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: message
    });
  } catch (error) {
    logger.error('Update contact message status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update contact message status'
    });
  }
});

/**
 * POST /api/contact/:id/reply
 * Send reply to contact message (admin only)
 */
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    // Validation
    if (!replyMessage || replyMessage.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply message is required'
      });
    }

    // Find contact message
    const message = await ContactMessage.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    // Send email reply
    const emailResult = await sendContactReply(
      message.email,
      message.subject,
      replyMessage,
      'Meme Forge Support'
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send reply email: ' + emailResult.error
      });
    }

    // Update message status to 'replied'
    await message.update({
      status: 'replied',
      repliedAt: new Date(),
      reply: replyMessage
    });

    logger.info(`Reply sent to contact message ${id} (${message.email})`);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        id: message.id,
        email: message.email,
        status: message.status,
        repliedAt: message.repliedAt
      }
    });
  } catch (error) {
    logger.error('Send contact reply error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send reply'
    });
  }
});

/**
 * DELETE /api/contact/:id
 * Delete a contact message (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    await message.destroy();

    logger.info(`Contact message ${id} deleted`);

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    logger.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete contact message'
    });
  }
});

module.exports = router;
