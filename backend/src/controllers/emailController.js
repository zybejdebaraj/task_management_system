const nodemailer = require('nodemailer');
const pool = require('../config/db');

const createTransporter = (config) => {
  if (config.smtp_host && config.smtp_port && config.smtp_user && config.smtp_pass) {
    return nodemailer.createTransport({
      host: config.smtp_host,
      port: Number(config.smtp_port),
      secure: !!config.smtp_secure,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });
  }

  if (config.smtp_service && config.smtp_user && config.smtp_pass) {
    return nodemailer.createTransport({
      service: config.smtp_service,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });
  }

  return null;
};

exports.sendEmail = async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ message: 'to, subject, and body are required' });
  }

  try {
    const userRes = await pool.query(
      `SELECT email, smtp_service, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );
    const userRow = userRes.rows[0];
    if (!userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const perUserConfig = {
      smtp_service: userRow.smtp_service,
      smtp_host: userRow.smtp_host,
      smtp_port: userRow.smtp_port,
      smtp_secure: userRow.smtp_secure,
      smtp_user: userRow.smtp_user,
      smtp_pass: userRow.smtp_pass,
    };

    const systemConfig = {
      smtp_service: process.env.SMTP_SERVICE,
      smtp_host: process.env.SMTP_HOST,
      smtp_port: process.env.SMTP_PORT,
      smtp_secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      smtp_user: process.env.SMTP_USER,
      smtp_pass: process.env.SMTP_PASS,
    };

    const usingUserMailbox = !!(perUserConfig.smtp_user && perUserConfig.smtp_pass);
    const transporter = createTransporter(usingUserMailbox ? perUserConfig : systemConfig);

    if (!transporter) {
      return res.status(500).json({
        message: 'SMTP is not configured. Configure system SMTP or your mailbox in settings.',
      });
    }

    const fromAddress = usingUserMailbox
      ? userRow.smtp_from || userRow.smtp_user
      : process.env.SMTP_FROM || process.env.SMTP_USER;
    const replyToEmail = userRow.email || fromAddress;

    await transporter.sendMail({
      from: fromAddress,
      replyTo: replyToEmail,
      to,
      subject,
      text: body,
    });

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email', error: err.message });
  }
};
