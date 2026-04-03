require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./config/db'); 

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const projectRoutes = require('./routes/projects');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use('/api/projects', projectRoutes);

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection failed', err);
  } else {
    console.log('DB connected:', res.rows[0]);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});