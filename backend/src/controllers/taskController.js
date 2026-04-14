const pool = require('../config/db');

const createNotification = async (userId, taskId, message) => {
  await pool.query(
    `INSERT INTO notifications (user_id, task_id, message)
     VALUES ($1, $2, $3)`,
    [userId, taskId, message]
  );
};

// Get all tasks for logged-in user
exports.getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await pool.query(
        `SELECT t.*, p.name AS project_name, u.email AS assignee_email, u.username AS assignee_username,
                COALESCE(json_agg(
                  json_build_object(
                    'id', ta.id,
                    'file_name', ta.file_name,
                    'original_name', ta.original_name,
                    'mime_type', ta.mime_type,
                    'size', ta.size,
                    'url', ta.url
                  )
                ) FILTER (WHERE ta.id IS NOT NULL), '[]') AS attachments
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.user_id
         LEFT JOIN task_attachments ta ON ta.task_id = t.id
         GROUP BY t.id, p.name, u.email, u.username
         ORDER BY t.id DESC`
      );
    } else {
      tasks = await pool.query(
        `SELECT t.*, p.name AS project_name, u.email AS assignee_email, u.username AS assignee_username,
                COALESCE(json_agg(
                  json_build_object(
                    'id', ta.id,
                    'file_name', ta.file_name,
                    'original_name', ta.original_name,
                    'mime_type', ta.mime_type,
                    'size', ta.size,
                    'url', ta.url
                  )
                ) FILTER (WHERE ta.id IS NOT NULL), '[]') AS attachments
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.user_id
         LEFT JOIN task_attachments ta ON ta.task_id = t.id
         WHERE t.user_id = $1
         GROUP BY t.id, p.name, u.email, u.username
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
  const { title, project_id, user_id, due_date, priority } = req.body;

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
      `INSERT INTO tasks (title, status, project_id, created_by, user_id, completed_at, due_date, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        'todo',
        project_id,
        req.user.id,
        assigneeId,
        null,
        due_date || null,
        priority || 'medium',
      ]
    );

    if (req.files && req.files.length) {
      const attachmentPromises = req.files.map((file) =>
        pool.query(
          `INSERT INTO task_attachments (task_id, file_name, original_name, mime_type, size, url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            task.rows[0].id,
            file.filename,
            file.originalname,
            file.mimetype,
            file.size,
            `/uploads/${file.filename}`,
          ]
        )
      );
      await Promise.all(attachmentPromises);
    }

    const createdTask = task.rows[0];
    createdTask.attachments = req.files?.map((file) => ({
      id: null,
      file_name: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    })) || [];

    const assignmentMessage = `You have been assigned a new task: "${title.trim()}"${due_date ? ` due ${new Date(due_date).toLocaleString()}` : ''}.`;
    await createNotification(assigneeId, createdTask.id, assignmentMessage);

    res.json(createdTask);

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
  const { title, status, project_id, user_id, due_date, priority } = req.body;

  try {
    const existingTask = await pool.query(
      'SELECT title, status, completed_at, user_id, project_id, due_date, priority FROM tasks WHERE id = $1',
      [id]
    );
    if (!existingTask.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const existing = existingTask.rows[0];

    // Workflow rule: once Done, it can't move back.
    if (existing.status === 'done' && status && status !== 'done') {
      return res.status(400).json({ message: 'Done tasks cannot be moved back' });
    }

    // Only the assigned member can change status
    if (status && status !== existing.status) {
      if (!existing.user_id || Number(existing.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Only the assigned member can change task status' });
      }
    }

    // Members can only update tasks assigned to them, and only status.
    if (req.user.role !== 'admin') {
      if (!existing.user_id || Number(existing.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      if (title || project_id || user_id || due_date || priority) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
    }

    const finalTitle = title !== undefined ? title : existing.title;
    const finalProjectId = project_id !== undefined ? project_id : existing.project_id;
    const finalAssigneeId = user_id !== undefined ? user_id : existing.user_id;
    const finalDueDate = due_date !== undefined ? due_date : existing.due_date;
    const finalPriority = priority !== undefined ? priority : existing.priority;
    const finalStatus = status !== undefined ? status : existing.status;

    if (finalTitle && !finalTitle.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let completedAt = existing.completed_at;
    if (finalStatus === 'done' && !completedAt) {
      completedAt = new Date();
    } else if (finalStatus !== 'done') {
      completedAt = null;
    }

    if (finalAssigneeId && finalProjectId) {
      const assigneeIsProjectMember = await pool.query(
        `SELECT 1
         FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [finalProjectId, finalAssigneeId]
      );
      if (!assigneeIsProjectMember.rows.length) {
        return res.status(400).json({ message: 'Assignee must be a member of the selected project' });
      }
    }

    const updated = await pool.query(
      `UPDATE tasks
       SET title = $1, status = $2, project_id = $3, completed_at = $4, user_id = $5, due_date = $6, priority = $7
       WHERE id = $8
       RETURNING *`,
      [finalTitle ? finalTitle.trim() : existing.title, finalStatus, finalProjectId, completedAt, finalAssigneeId, finalDueDate, finalPriority, id]
    );

    if (finalAssigneeId && Number(finalAssigneeId) !== Number(existing.user_id)) {
      const reassignedMessage = `You have been assigned a task: "${finalTitle.trim()}"${finalDueDate ? ` due ${new Date(finalDueDate).toLocaleString()}` : ''}.`;
      await createNotification(finalAssigneeId, id, reassignedMessage);
    }

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};