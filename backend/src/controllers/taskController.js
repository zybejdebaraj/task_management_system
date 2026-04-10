const pool = require('../config/db');

// Get all tasks for logged-in user
exports.getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await pool.query(
        `SELECT t.*, p.name AS project_name, u.email AS assignee_email, u.username AS assignee_username
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.user_id
         ORDER BY t.id DESC`
      );
    } else {
      tasks = await pool.query(
        `SELECT t.*, p.name AS project_name, u.email AS assignee_email, u.username AS assignee_username
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.user_id
         WHERE t.user_id = $1
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
  const { title, status, project_id, user_id } = req.body;

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

    const assigneeId = user_id ?? req.user.id;
    if (!assigneeId) {
      return res.status(400).json({ message: 'Assignee is required' });
    }

    const assigneeIsProjectMember = await pool.query(
      `SELECT 1
       FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [project_id, assigneeId]
    );
    if (!assigneeIsProjectMember.rows.length) {
      return res.status(400).json({ message: 'Assignee must be a member of the selected project' });
    }

    const task = await pool.query(
      `INSERT INTO tasks (title, status, project_id, created_by, user_id, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title.trim(),
        status || 'todo',
        project_id,
        req.user.id,
        assigneeId,
        (status || 'todo') === 'done' ? new Date() : null,
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
  const { title, status, project_id, user_id } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const existingTask = await pool.query(
      'SELECT title, status, completed_at, user_id, project_id FROM tasks WHERE id = $1',
      [id]
    );
    if (!existingTask.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const existing = existingTask.rows[0];

    // Workflow rule: once Done, it can't move back.
    if (existing.status === 'done' && status !== 'done') {
      return res.status(400).json({ message: 'Done tasks cannot be moved back' });
    }

    // Members can only update status of tasks assigned to them.
    if (req.user.role !== 'admin') {
      if (!existing.user_id || Number(existing.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }

      let completedAt = existing.completed_at;
      if (status === 'done' && !completedAt) {
        completedAt = new Date();
      } else if (status !== 'done') {
        completedAt = null;
      }

      const updated = await pool.query(
        `UPDATE tasks
         SET status = $1, completed_at = $2
         WHERE id = $3
         RETURNING *`,
        [status, completedAt, id]
      );

      return res.json(updated.rows[0]);
    }

    const finalTitle = (typeof title === 'string' ? title : existing.title) || '';
    const finalProjectId = project_id ?? existing.project_id;
    if (!finalTitle.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let completedAt = existingTask.rows[0].completed_at;
    if (status === 'done' && !completedAt) {
      completedAt = new Date();
    } else if (status !== 'done') {
      completedAt = null;
    }

    const nextAssigneeId = user_id ?? existing.user_id;
    if (nextAssigneeId && finalProjectId) {
      const assigneeIsProjectMember = await pool.query(
        `SELECT 1
         FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [finalProjectId, nextAssigneeId]
      );
      if (!assigneeIsProjectMember.rows.length) {
        return res.status(400).json({ message: 'Assignee must be a member of the selected project' });
      }
    }

    const updated = await pool.query(
      `UPDATE tasks
       SET title = $1, status = $2, project_id = $3, completed_at = $4, user_id = $5
       WHERE id = $6
       RETURNING *`,
      [finalTitle.trim(), status, finalProjectId, completedAt, nextAssigneeId, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};