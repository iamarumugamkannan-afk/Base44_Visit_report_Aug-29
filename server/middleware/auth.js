const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const userResult = await pool.query(
      'SELECT id, email, full_name, role, status FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, 'active']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};