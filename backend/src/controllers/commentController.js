const pool = require('../config/db');

// Get comments for a task
exports.getComments = async (req, res) => {
  const { taskId } = req.params;

  try {
    const comments = await pool.query(
      `SELECT c.*, u.username, u.email
       FROM comments c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json(comments.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create comment
exports.createComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const comment = await pool.query(
      `INSERT INTO comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, req.user.id, content.trim()]
    );

    // Parse @mentions and notify mentioned users
    const mentions = [...content.matchAll(/@(\w+)/g)].map(m => m[1]);
    if (mentions.length) {
      const mentionedUsers = await pool.query(
        `SELECT id, username FROM users WHERE username = ANY($1::text[]) AND id <> $2`,
        [mentions, req.user.id]
      );
      const actor = req.user.username || req.user.email || 'Someone';
      for (const user of mentionedUsers.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)`,
          [user.id, taskId, `${actor} mentioned you in a comment.`]
        );
      }
    }

    res.status(201).json(comment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (!comment.rows.length) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (req.user.role !== 'admin' && comment.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};