const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Backward-compat: older tokens may not include role.
    if (!decoded.role && decoded.id) {
      const result = await pool.query('SELECT role FROM users WHERE id = $1', [decoded.id]);
      decoded.role = result.rows[0]?.role || 'member';
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};