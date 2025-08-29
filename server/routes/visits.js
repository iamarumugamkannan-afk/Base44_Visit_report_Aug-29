const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all visits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, offset = 0, customer_id } = req.query;
    
    let query = `
      SELECT sv.*, c.shop_name as customer_shop_name, c.shop_type as customer_shop_type
      FROM shop_visits sv
      LEFT JOIN customers c ON sv.customer_id = c.id
    `;
    
    const params = [];
    
    if (customer_id) {
      query += ' WHERE sv.customer_id = $1';
      params.push(customer_id);
    }
    
    query += ` ORDER BY sv.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Get visit by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT sv.*, c.shop_name as customer_shop_name 
       FROM shop_visits sv
       LEFT JOIN customers c ON sv.customer_id = c.id
       WHERE sv.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
});

// Create new visit
router.post('/', authenticateToken, [
  body('customer_id').isUUID(),
  body('shop_name').trim().isLength({ min: 2 }),
  body('visit_date').isISO8601(),
  body('visit_purpose').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const visitData = {
      ...req.body,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Calculate score if not provided
    if (!visitData.calculated_score) {
      visitData.calculated_score = calculateVisitScore(visitData);
    }

    // Set priority level based on score
    if (!visitData.priority_level) {
      visitData.priority_level = getPriorityLevel(visitData.calculated_score);
    }

    const columns = Object.keys(visitData);
    const values = Object.values(visitData);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO shop_visits (${columns.join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Update visit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    // Recalculate score if relevant fields changed
    if (updateData.product_visibility_score !== undefined || 
        updateData.commercial_outcome !== undefined ||
        updateData.overall_satisfaction !== undefined) {
      updateData.calculated_score = calculateVisitScore(updateData);
      updateData.priority_level = getPriorityLevel(updateData.calculated_score);
    }

    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updateData)];

    const result = await pool.query(
      `UPDATE shop_visits SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

// Delete visit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM shop_visits WHERE id = $1 RETURNING shop_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

// Helper functions
function calculateVisitScore(data) {
  let score = 0;
  score += (data.product_visibility_score || 0) * 0.3;
  if (data.training_provided) score += 20;
  
  const commercialScores = {
    new_order: 25,
    order_commitment: 20,
    price_negotiation: 15,
    complaint_resolved: 10,
    information_only: 5,
    no_outcome: 0
  };
  score += commercialScores[data.commercial_outcome] || 0;
  score += (data.overall_satisfaction || 0) * 2.5;
  
  return Math.min(100, Math.max(0, score));
}

function getPriorityLevel(score) {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

module.exports = router;