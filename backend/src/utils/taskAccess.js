const pool = require('../config/db');

module.exports = async function getTaskForUser(taskId, user) {
  const result = await pool.query(
    `SELECT t.id, t.user_id, p.created_by AS project_owner_id
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     WHERE t.id = $1`,
    [taskId]
  );
  if (!result.rows.length) return null;
  const task = result.rows[0];
  const allowed = user.role === 'admin'
    ? Number(task.project_owner_id) === Number(user.id)
    : Number(task.user_id) === Number(user.id);
  return allowed ? task : false;
};
