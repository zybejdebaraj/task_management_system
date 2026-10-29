const pool = require('../config/db');

const getTaskForUser = require('../utils/taskAccess');

const syncParentTaskStatus = async (taskId, user) => {
  const summary = await pool.query(
    `SELECT
       t.status,
       COUNT(s.id)::int AS total,
       COUNT(s.id) FILTER (WHERE s.is_done = TRUE)::int AS done_count
     FROM tasks t
     LEFT JOIN subtasks s ON s.task_id = t.id
     WHERE t.id = $1
     GROUP BY t.id, t.status`,
    [taskId]
  );
  if (!summary.rows.length) return;

  const { status, total, done_count: doneCount } = summary.rows[0];
  if (total > 0 && doneCount === total && status !== 'done') {
    const completed = await pool.query(
      `UPDATE tasks
       SET status = 'done', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status <> 'done'
       RETURNING title, project_id`,
      [taskId]
    );
    if (completed.rows.length) {
      await pool.query(
        `INSERT INTO task_activity (task_id, actor_user_id, action, detail)
         VALUES ($1, $2, 'task_updated', $3)`,
        [taskId, user.id, `status: ${status} -> done (checklist completed)`]
      );
      if (user.role !== 'admin') {
        const owner = await pool.query('SELECT created_by FROM projects WHERE id = $1', [completed.rows[0].project_id]);
        if (owner.rows[0]?.created_by && Number(owner.rows[0].created_by) !== Number(user.id)) {
          await pool.query(
            'INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)',
            [owner.rows[0].created_by, taskId, `${user.username || user.email || 'A member'} completed task "${completed.rows[0].title}".`]
          );
        }
      }
    }
    return;
  }

  if (total > 0 && doneCount < total && status === 'done') {
    await pool.query(
      `UPDATE tasks
       SET status = 'in-progress', completed_at = NULL
       WHERE id = $1`,
      [taskId]
    );
  }
};

exports.getSubtasks = async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await getTaskForUser(taskId, req.user);
    if (task === null) return res.status(404).json({ message: 'Task not found' });
    if (task === false) return res.status(403).json({ message: 'Access denied' });

    const result = await pool.query(
      `SELECT id, task_id, title, is_done, position, created_at
       FROM subtasks
       WHERE task_id = $1
       ORDER BY position ASC, id ASC`,
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSubtask = async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Subtask title is required' });
  }
  try {
    const task = await getTaskForUser(taskId, req.user);
    if (task === null) return res.status(404).json({ message: 'Task not found' });
    if (task === false) return res.status(403).json({ message: 'Access denied' });

    const nextPosResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM subtasks WHERE task_id = $1',
      [taskId]
    );
    const position = Number(nextPosResult.rows[0]?.next_position || 0);
    const created = await pool.query(
      `INSERT INTO subtasks (task_id, title, is_done, position)
       VALUES ($1, $2, FALSE, $3)
       RETURNING id, task_id, title, is_done, position, created_at`,
      [taskId, title.trim(), position]
    );
    await syncParentTaskStatus(taskId, req.user);
    res.json(created.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubtask = async (req, res) => {
  const { id } = req.params;
  const { title, is_done } = req.body;
  try {
    const existingResult = await pool.query(
      `SELECT s.id, s.task_id, s.title, s.is_done, s.position
       FROM subtasks s
       WHERE s.id = $1`,
      [id]
    );
    if (!existingResult.rows.length) return res.status(404).json({ message: 'Subtask not found' });

    const existing = existingResult.rows[0];
    const task = await getTaskForUser(existing.task_id, req.user);
    if (task === null) return res.status(404).json({ message: 'Task not found' });
    if (task === false) return res.status(403).json({ message: 'Access denied' });

    const finalTitle = title !== undefined ? title.trim() : existing.title;
    if (!finalTitle) return res.status(400).json({ message: 'Subtask title is required' });
    const finalDone = is_done !== undefined ? (is_done === true || is_done === 'true') : existing.is_done;

    const updated = await pool.query(
      `UPDATE subtasks
       SET title = $1, is_done = $2
       WHERE id = $3
       RETURNING id, task_id, title, is_done, position, created_at`,
      [finalTitle, finalDone, id]
    );
    await syncParentTaskStatus(existing.task_id, req.user);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubtask = async (req, res) => {
  const { id } = req.params;
  try {
    const existingResult = await pool.query(
      `SELECT id, task_id
       FROM subtasks
       WHERE id = $1`,
      [id]
    );
    if (!existingResult.rows.length) return res.status(404).json({ message: 'Subtask not found' });

    const task = await getTaskForUser(existingResult.rows[0].task_id, req.user);
    if (task === null) return res.status(404).json({ message: 'Task not found' });
    if (task === false) return res.status(403).json({ message: 'Access denied' });

    const taskId = existingResult.rows[0].task_id;
    await pool.query('DELETE FROM subtasks WHERE id = $1', [id]);
    await syncParentTaskStatus(taskId, req.user);
    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
