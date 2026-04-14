require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const pool = require('./config/db'); 
const ensureSchema = require('./utils/ensureSchema');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const emailRoutes = require('./routes/email');

const projectRoutes = require('./routes/projects');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/projects', projectRoutes);
app.use('/api', commentRoutes);

const bootstrap = async () => {
  try {
    await pool.query('SELECT NOW()');
    await ensureSchema();
    console.log('DB connected and schema ensured');
  } catch (err) {
    console.error('DB bootstrap failed', err);
  }
};

bootstrap();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});