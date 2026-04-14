const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password, role, username } = req.body;

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (email, password, role, username)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, username`,
      [email, hashedPassword, role || 'member', username || null]
    );

    res.json(newUser.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        role: user.rows[0].role,
        email: user.rows[0].email,
        username: user.rows[0].username
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT id, username, email, role, created_at
       FROM users
       ORDER BY id DESC`
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT id, username, email, role, created_at
       FROM users
       WHERE role = 'member'
       ORDER BY id DESC`
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminDeleteMember = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (existing.rows[0].role !== 'member') {
      return res.status(400).json({ message: 'Only members can be deleted from this page' });
    }

    const deleted = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    res.json({ message: 'Member deleted', id: deleted.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminUpdateMember = async (req, res) => {
  const { id } = req.params;
  const { email, password, username } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const existing = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (existing.rows[0].role !== 'member') {
      return res.status(400).json({ message: 'Only members can be updated from this page' });
    }

    const emailTaken = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, id]);
    if (emailTaken.rows.length) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    let hashedPassword = null;
    if (typeof password === 'string' && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updated = await pool.query(
      `UPDATE users
       SET email = $1,
           username = $2,
           password = COALESCE($3, password)
       WHERE id = $4
       RETURNING id, username, email, role, created_at`,
      [email, username || null, hashedPassword, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminCreateMember = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await pool.query(
      `INSERT INTO users (email, password, role, username)
       VALUES ($1, $2, 'member', $3)
       RETURNING id, email, role, username`,
      [email, hashedPassword, username || null]
    );

    res.status(201).json(createdUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMySettings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, notifications_enabled, dark_mode, timezone, language,
              smtp_service, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_from,
              (smtp_pass IS NOT NULL AND smtp_pass <> '') AS has_smtp_pass
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  const { username, email, timezone, language } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const emailTaken = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2',
      [email, req.user.id]
    );
    if (emailTaken.rows.length) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const updated = await pool.query(
      `UPDATE users
       SET username = $1, email = $2, timezone = $3, language = $4
       WHERE id = $5
       RETURNING id, username, email, role, notifications_enabled, dark_mode, timezone, language`,
      [username || null, email, timezone || 'UTC', language || 'en', req.user.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMyPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMyPreferences = async (req, res) => {
  const { notifications_enabled, dark_mode } = req.body;

  try {
    const updated = await pool.query(
      `UPDATE users
       SET notifications_enabled = $1, dark_mode = $2
       WHERE id = $3
       RETURNING id, username, email, role, notifications_enabled, dark_mode, timezone, language`,
      [!!notifications_enabled, !!dark_mode, req.user.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMyMailbox = async (req, res) => {
  const {
    smtp_service,
    smtp_host,
    smtp_port,
    smtp_secure,
    smtp_user,
    smtp_pass,
    smtp_from,
  } = req.body;

  try {
    const existing = await pool.query('SELECT smtp_pass FROM users WHERE id = $1', [req.user.id]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const finalPassword =
      typeof smtp_pass === 'string' && smtp_pass.trim() !== ''
        ? smtp_pass.trim()
        : existing.rows[0].smtp_pass;

    const updated = await pool.query(
      `UPDATE users
       SET smtp_service = $1,
           smtp_host = $2,
           smtp_port = $3,
           smtp_secure = $4,
           smtp_user = $5,
           smtp_pass = $6,
           smtp_from = $7
       WHERE id = $8
       RETURNING smtp_service, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_from,
                 (smtp_pass IS NOT NULL AND smtp_pass <> '') AS has_smtp_pass`,
      [
        smtp_service || null,
        smtp_host || null,
        Number(smtp_port) || 587,
        !!smtp_secure,
        smtp_user || null,
        finalPassword || null,
        smtp_from || null,
        req.user.id,
      ]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};