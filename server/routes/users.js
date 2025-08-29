const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, status, department, territory, phone, 
              created_at, last_login, password_reset_required
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('full_name').optional().trim().isLength({ min: 2 }),
  body('department').optional().trim(),
  body('territory').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, department, territory, phone } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           department = COALESCE($2, department),
           territory = COALESCE($3, territory),
           phone = COALESCE($4, phone),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, full_name, role, status, department, territory, phone`,
      [full_name, department, territory, phone, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), [
  body('role').optional().isIn(['user', 'manager', 'admin']),
  body('status').optional().isIn(['active', 'inactive']),
  body('department').optional().trim(),
  body('territory').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role, status, department, territory, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET role = COALESCE($1, role),
           status = COALESCE($2, status),
           department = COALESCE($3, department),
           territory = COALESCE($4, territory),
           phone = COALESCE($5, phone),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, full_name, role, status, department, territory, phone`,
      [role, status, department, territory, phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, actor_email, target_user_id, target_email, action, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        req.user.id,
        req.user.email,
        id,
        result.rows[0].email,
        'update_user',
        JSON.stringify({ role, status, department, territory, phone })
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, requireRole(['admin']), [
  body('password').isLength({ min: 8 }),
  body('require_change_on_login').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { password, require_change_on_login = true } = req.body;

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           password_reset_required = $2,
           last_password_reset = NOW(),
           password_reset_by = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING email`,
      [hashedPassword, require_change_on_login, req.user.email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, actor_email, target_user_id, target_email, action, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        req.user.id,
        req.user.email,
        id,
        result.rows[0].email,
        'reset_password',
        JSON.stringify({ require_change_on_login })
      ]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;