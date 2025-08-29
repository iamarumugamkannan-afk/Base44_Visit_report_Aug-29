const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all configurations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = 'SELECT * FROM configurations WHERE is_active = true';
    const params = [];
    
    if (type) {
      query += ' AND config_type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY config_type, display_order ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get configurations error:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Create configuration (admin only)
router.post('/', authenticateToken, requireRole(['admin']), [
  body('config_type').isIn(['visit_purposes', 'canna_products', 'shop_presentation_options', 'competitor_presence']),
  body('config_name').trim().isLength({ min: 1 }),
  body('config_value').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      config_type,
      config_name,
      config_value,
      display_order = 0,
      is_active = true
    } = req.body;

    const result = await pool.query(
      `INSERT INTO configurations (config_type, config_name, config_value, display_order, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [config_type, config_name, config_value, display_order, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create configuration error:', error);
    res.status(500).json({ error: 'Failed to create configuration' });
  }
});

// Update configuration (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updateData)];

    const result = await pool.query(
      `UPDATE configurations SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update configuration error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Delete configuration (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM configurations WHERE id = $1 RETURNING config_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Delete configuration error:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

module.exports = router;