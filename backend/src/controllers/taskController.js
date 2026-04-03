const pool = require('../config/db');

// Get all tasks for logged-in user
exports.getTasks = async (req, res) => {
  try {
    const tasks = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1',
      [req.user.id]
    );

    res.json(tasks.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  const { title, status } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const task = await pool.query(
      'INSERT INTO tasks (title, status, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, status || 'todo', req.user.id]
    );

    res.json(task.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, status } = req.body;

  try {
    const updated = await pool.query(
      'UPDATE tasks SET title=$1, status=$2 WHERE id=$3 AND user_id=$4 RETURNING *',
      [title, status, id, req.user.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  if (!title || title.trim() === '') {
  return res.status(400).json({ message: 'Title is required' });
}
};