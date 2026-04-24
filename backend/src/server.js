require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');
const ensureSchema = require('./utils/ensureSchema');
const { sendDueReminders } = require('./controllers/taskController');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const emailRoutes = require('./routes/email');

const projectRoutes = require('./routes/projects');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');
const subtaskRoutes = require('./routes/subtasks');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/projects', projectRoutes);
app.use('/api', commentRoutes);
app.use('/api', subtaskRoutes);

const bootstrap = async () => {
  try {
    await pool.query('SELECT NOW()');
    await ensureSchema();
    await sendDueReminders();
    setInterval(() => {
      sendDueReminders().catch((err) => {
        console.error('Reminder check failed', err.message);
      });
    }, 60 * 1000);
    console.log('DB connected and schema ensured');
  } catch (err) {
    console.error('DB bootstrap failed', err);
  }
};

bootstrap();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});