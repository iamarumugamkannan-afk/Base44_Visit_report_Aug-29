const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM customers 
       WHERE status = 'active' 
       ORDER BY shop_name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', authenticateToken, [
  body('shop_name').trim().isLength({ min: 2 }),
  body('shop_type').isIn(['growshop', 'garden_center', 'nursery', 'hydroponics_store', 'other']),
  body('shop_address').optional().trim(),
  body('contact_email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      shop_name,
      shop_type,
      shop_address,
      zipcode,
      city,
      county,
      contact_person,
      contact_phone,
      contact_email,
      job_title,
      region,
      status = 'active'
    } = req.body;

    const result = await pool.query(
      `INSERT INTO customers (
        shop_name, shop_type, shop_address, zipcode, city, county,
        contact_person, contact_phone, contact_email, job_title,
        region, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *`,
      [
        shop_name, shop_type, shop_address, zipcode, city, county,
        contact_person, contact_phone, contact_email, job_title,
        region, status, req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', authenticateToken, [
  body('shop_name').optional().trim().isLength({ min: 2 }),
  body('shop_type').optional().isIn(['growshop', 'garden_center', 'nursery', 'hydroponics_store', 'other']),
  body('contact_email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateFields = req.body;
    updateFields.updated_at = new Date();

    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updateFields)];

    const result = await pool.query(
      `UPDATE customers SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has associated visits
    const visitsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM shop_visits WHERE customer_id = $1',
      [id]
    );

    if (parseInt(visitsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with associated visit reports' 
      });
    }

    const result = await pool.query(
      'DELETE FROM customers WHERE id = $1 RETURNING shop_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;