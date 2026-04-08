const pool = require('../config/db');

// Get all tasks for logged-in user
exports.getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await pool.query(
        `SELECT t.*, p.name AS project_name
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         ORDER BY t.id DESC`
      );
    } else {
      tasks = await pool.query(
        `SELECT t.*, p.name AS project_name
         FROM tasks t
         INNER JOIN project_members pm ON pm.project_id = t.project_id
         LEFT JOIN projects p ON p.id = t.project_id
         WHERE pm.user_id = $1
         ORDER BY t.id DESC`,
        [req.user.id]
      );
    }

    res.json(tasks.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  const { title, status, project_id } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!project_id) {
    return res.status(400).json({ message: 'Project is required' });
  }

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create tasks' });
    }

    const task = await pool.query(
      `INSERT INTO tasks (title, status, project_id, created_by, user_id, completed_at)
       VALUES ($1, $2, $3, $4, $4, $5)
       RETURNING *`,
      [
        title.trim(),
        status || 'todo',
        project_id,
        req.user.id,
        status === 'done' ? new Date() : null,
      ]
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete tasks' });
    }

    const deleted = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    if (!deleted.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, status, project_id } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!project_id) {
    return res.status(400).json({ message: 'Project is required' });
  }

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update tasks' });
    }

    const existingTask = await pool.query('SELECT status, completed_at FROM tasks WHERE id = $1', [id]);
    if (!existingTask.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let completedAt = existingTask.rows[0].completed_at;
    if (status === 'done' && !completedAt) {
      completedAt = new Date();
    } else if (status !== 'done') {
      completedAt = null;
    }

    const updated = await pool.query(
      `UPDATE tasks
       SET title = $1, status = $2, project_id = $3, completed_at = $4
       WHERE id = $5
       RETURNING *`,
      [title.trim(), status, project_id, completedAt, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};