const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

exports.googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Google credential is required' });

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    if (!result.rows.length) {
      const byEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (byEmail.rows.length) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, byEmail.rows[0].id]);
        result = byEmail;
      } else {
        result = await pool.query(
          `INSERT INTO users (email, google_id, username, role)
           VALUES ($1, $2, $3, 'member')
           RETURNING *`,
          [email, googleId, name || email.split('@')[0]]
        );
      }
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: 'Invalid Google credential' });
  }
};

exports.inviteMember = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const existing = await pool.query('SELECT id, password FROM users WHERE email = $1', [email]);
    if (existing.rows.length && existing.rows[0].password) {
      return res.status(400).json({ message: 'A user with this email already has an account' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (existing.rows.length) {
      await pool.query(
        'UPDATE users SET invite_token = $1, invite_expires = $2 WHERE id = $3',
        [token, expires, existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO users (email, role, invite_token, invite_expires)
         VALUES ($1, 'member', $2, $3)`,
        [email, token, expires]
      );
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const inviteUrl = `${frontendUrl}/accept-invite?token=${token}`;

    const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
    if (smtpConfigured) {
      const transporter = nodemailer.createTransport(
        process.env.SMTP_HOST
          ? { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
          : { service: process.env.SMTP_SERVICE, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      );
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'You have been invited to IdealTask',
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>You're invited</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo / Brand -->
        <tr><td align="center" style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:14px;width:48px;height:48px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-size:22px;font-weight:800;line-height:48px;">IT</span>
              </td>
              <td style="padding-left:12px;vertical-align:middle;">
                <span style="font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">IdealTask</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Top accent bar -->
          <tr><td style="background:linear-gradient(90deg,#4f46e5,#7c3aed);height:5px;"></td></tr>

          <!-- Body -->
          <tr><td style="padding:40px 40px 32px;">

            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6366f1;letter-spacing:1px;text-transform:uppercase;">Team Invitation</p>
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#1e293b;line-height:1.2;">You're invited to join<br/>the team 🎉</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
              Someone has invited you to collaborate on <strong style="color:#1e293b;">IdealTask</strong> — a smart task management platform. Click the button below to set up your account and get started.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                    Accept Invitation →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#475569;">What happens next?</p>
                <ul style="margin:8px 0 0;padding-left:18px;color:#64748b;font-size:13px;line-height:1.8;">
                  <li>Click the button above to open the setup page</li>
                  <li>Choose your name and a secure password</li>
                  <li>You'll be logged in automatically</li>
                </ul>
              </td></tr>
            </table>

            <!-- Expiry notice -->
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              ⏳ This invitation link expires in <strong>7 days</strong>. If it expires, ask your admin to resend it.
            </p>

          </td></tr>

          <!-- Divider -->
          <tr><td style="border-top:1px solid #f1f5f9;"></td></tr>

          <!-- Footer -->
          <tr><td style="padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">Can't click the button? Copy this link into your browser:</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;word-break:break-all;">${inviteUrl}</p>
          </td></tr>

        </td></tr>

        <!-- Bottom caption -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by IdealTask · You received this because someone invited you.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
        text: `You have been invited to join IdealTask.\n\nClick the link below to set up your account:\n${inviteUrl}\n\nThis link expires in 7 days.\n\nIf you did not expect this invitation, you can ignore this email.`,
      });
    }

    res.json({ message: smtpConfigured ? 'Invitation sent via email' : 'Invitation created', invite_url: inviteUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  const { token, username, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

  try {
    const user = await pool.query(
      'SELECT id, email FROM users WHERE invite_token = $1 AND invite_expires > NOW()',
      [token]
    );
    if (!user.rows.length) {
      return res.status(400).json({ message: 'Invalid or expired invite link' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await pool.query(
      `UPDATE users
       SET password = $1, username = $2, invite_token = NULL, invite_expires = NULL
       WHERE id = $3
       RETURNING id, email, role, username`,
      [hashedPassword, username || null, user.rows[0].id]
    );

    const u = updated.rows[0];
    const jwtToken = jwt.sign(
      { id: u.id, role: u.role, email: u.email, username: u.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { email, password, username } = req.body;

  if (typeof email !== 'string' || !email.trim()
    || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

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
      [email, hashedPassword, 'member', username || null]
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
       WHERE role = 'member' AND password IS NOT NULL
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

    // Clear all FK references so the DELETE cannot be blocked by constraints
    await pool.query('UPDATE tasks SET user_id = NULL WHERE user_id = $1', [id]);
    await pool.query('UPDATE tasks SET created_by = NULL WHERE created_by = $1', [id]);
    await pool.query('UPDATE task_activity SET actor_user_id = NULL WHERE actor_user_id = $1', [id]);
    await pool.query('DELETE FROM project_members WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM comments WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM reminder_log WHERE user_id = $1', [id]);

    const deleted = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    res.json({ message: 'Member deleted', id: deleted.rows[0].id });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!user.rows.length) {
      return res.json({ message: 'If that email exists, you will receive reset instructions.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.rows[0].id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
    if (smtpConfigured) {
      const transporter = nodemailer.createTransport(
        process.env.SMTP_HOST
          ? { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
          : { service: process.env.SMTP_SERVICE, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      );
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Password Reset Request',
        text: `Click the link below to reset your password. It expires in 1 hour.\n\n${resetUrl}`,
      });
    }

    res.json({ message: 'If that email exists, you will receive reset instructions.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const user = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (!user.rows.length) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMySettings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, notifications_enabled, dark_mode, timezone, language,
              avatar_url, smtp_service, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_from,
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

exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    res.json({ avatar_url: avatarUrl });
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
