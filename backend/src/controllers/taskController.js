const pool = require('../config/db');
const nodemailer = require('nodemailer');

const sendAssignmentEmail = async (toEmail, taskTitle, dueDate) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    const transporter = nodemailer.createTransport(
      process.env.SMTP_HOST
        ? { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : { service: process.env.SMTP_SERVICE, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    );
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `New task assigned: ${taskTitle}`,
      html: `<p>You have been assigned a new task: <strong>${taskTitle}</strong>${dueDate ? ` due <strong>${new Date(dueDate).toLocaleString()}</strong>` : ''}.</p><p>Log in to IdealTask to view details.</p>`,
      text: `You have been assigned: ${taskTitle}${dueDate ? ` (due ${new Date(dueDate).toLocaleString()})` : ''}.`,
    });
  } catch (err) {
    console.error('Assignment email failed:', err.message);
  }
};

const createNotification = async (userId, taskId, message) => {
  await pool.query(
    `INSERT INTO notifications (user_id, task_id, message)
     VALUES ($1, $2, $3)`,
    [userId, taskId, message]
  );
};

const logTaskActivity = async (taskId, actorUserId, action, detail) => {
  await pool.query(
    `INSERT INTO task_activity (task_id, actor_user_id, action, detail)
     VALUES ($1, $2, $3, $4)`,
    [taskId, actorUserId || null, action, detail || null]
  );
};

// Get all tasks for logged-in user
exports.getTasks = async (req, res) => {
  try {
    let tasks;
    const selectFields = `t.*, p.name AS project_name, u.email AS assignee_email, u.username AS assignee_username,
      COALESCE(t.labels, '[]'::jsonb) AS labels,
      COALESCE(json_agg(
        json_build_object('id',ta.id,'file_name',ta.file_name,'original_name',ta.original_name,'mime_type',ta.mime_type,'size',ta.size,'url',ta.url)
      ) FILTER (WHERE ta.id IS NOT NULL), '[]') AS attachments`;

    if (req.user.role === 'admin') {
      tasks = await pool.query(
        `SELECT ${selectFields} FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         LEFT JOIN users u ON u.id = t.user_id
         LEFT JOIN task_attachments ta ON ta.task_id = t.id
         WHERE p.created_by = $1
         GROUP BY t.id, p.name, u.email, u.username
         ORDER BY t.id DESC`,
        [req.user.id]
      );
    } else {
      tasks = await pool.query(
        `SELECT ${selectFields} FROM tasks t
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
  const { title, description, project_id, user_id, due_date, priority, is_big, labels } = req.body;

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

    const projectOwnership = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [project_id, req.user.id]
    );
    if (!projectOwnership.rows.length) {
      return res.status(403).json({ message: 'You can only create tasks in your own projects' });
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

    let parsedLabels = [];
    try { parsedLabels = labels ? JSON.parse(labels) : []; } catch { parsedLabels = []; }

    const task = await pool.query(
      `INSERT INTO tasks (title, description, status, project_id, created_by, user_id, completed_at, due_date, priority, is_big, labels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title.trim(),
        description ? String(description).trim() : null,
        'todo',
        project_id,
        req.user.id,
        assigneeId,
        null,
        due_date || null,
        priority || 'medium',
        is_big === true || is_big === 'true',
        JSON.stringify(parsedLabels),
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
    const assigneeUser = await pool.query('SELECT email FROM users WHERE id = $1', [assigneeId]);
    if (assigneeUser.rows.length) {
      sendAssignmentEmail(assigneeUser.rows[0].email, title.trim(), due_date).catch(() => {});
    }
    await logTaskActivity(
      createdTask.id,
      req.user.id,
      'task_created',
      `Task created and assigned to user #${assigneeId}`
    );

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

    const deleted = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1
         AND project_id IN (SELECT id FROM projects WHERE created_by = $2)
       RETURNING id`,
      [id, req.user.id]
    );
    if (!deleted.rows.length) {
      return res.status(403).json({ message: 'Task not found or not authorized' });
    }

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, project_id, user_id, due_date, priority, is_big, labels } = req.body;

  try {
    const existingTask = await pool.query(
      `SELECT t.title, t.description, t.status, t.completed_at, t.user_id, t.project_id,
              t.due_date, t.priority, t.is_big, t.labels, p.created_by AS project_owner_id
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [id]
    );
    if (!existingTask.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const existing = existingTask.rows[0];

    if (status !== undefined && !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    // Workflow rule: once Done, it can't move back.
    if (existing.status === 'done' && status && status !== 'done') {
      return res.status(400).json({ message: 'Done tasks cannot be moved back' });
    }

    if (req.user.role === 'admin') {
      // Admin can only touch tasks in their own projects
      if (Number(existing.project_owner_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to update tasks in this project' });
      }
    } else {
      // Members can only update tasks assigned to them, and only status.
      if (!existing.user_id || Number(existing.user_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      if (['title', 'description', 'project_id', 'user_id', 'due_date', 'priority', 'is_big', 'labels']
        .some((field) => Object.prototype.hasOwnProperty.call(req.body, field))) {
        return res.status(403).json({ message: 'Members can only update task status' });
      }
      // Members can only change status of their own assigned tasks
      if (status && status !== existing.status) {
        if (!existing.user_id || Number(existing.user_id) !== Number(req.user.id)) {
          return res.status(403).json({ message: 'Only the assigned member can change task status' });
        }
      }
    }

    const finalTitle = title !== undefined ? title : existing.title;
    const finalDescription = description !== undefined ? (description ? String(description).trim() : null) : existing.description;
    const finalProjectId = project_id !== undefined ? project_id : existing.project_id;
    const finalAssigneeId = user_id !== undefined ? user_id : existing.user_id;
    const finalDueDate = due_date !== undefined ? due_date : existing.due_date;
    const finalPriority = priority !== undefined ? priority : existing.priority;
    const finalIsBig = is_big !== undefined ? (is_big === true || is_big === 'true') : existing.is_big;
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

    const trimmedFinalTitle = finalTitle ? finalTitle.trim() : existing.title;
    let parsedLabels = existing.labels;
    if (labels !== undefined) {
      try { parsedLabels = typeof labels === 'string' ? JSON.parse(labels) : labels; } catch { parsedLabels = []; }
    }

    const updated = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, project_id = $4, completed_at = $5, user_id = $6, due_date = $7, priority = $8, is_big = $9, labels = $10
       WHERE id = $11
       RETURNING *`,
      [trimmedFinalTitle, finalDescription, finalStatus, finalProjectId, completedAt, finalAssigneeId, finalDueDate, finalPriority, finalIsBig, JSON.stringify(parsedLabels || []), id]
    );

    if (finalAssigneeId && Number(finalAssigneeId) !== Number(existing.user_id)) {
      const reassignedMessage = `You have been assigned a task: "${trimmedFinalTitle}"${finalDueDate ? ` due ${new Date(finalDueDate).toLocaleString()}` : ''}.`;
      await createNotification(finalAssigneeId, id, reassignedMessage);
      const assigneeUser = await pool.query('SELECT email FROM users WHERE id = $1', [finalAssigneeId]);
      if (assigneeUser.rows.length) {
        sendAssignmentEmail(assigneeUser.rows[0].email, trimmedFinalTitle, finalDueDate).catch(() => {});
      }
    }

    // Notify only the project-owning admin when a member completes a task.
    if (existing.status !== 'done' && finalStatus === 'done' && req.user.role !== 'admin') {
      const projectOwner = await pool.query(
        `SELECT created_by AS id FROM projects WHERE id = $1`,
        [finalProjectId]
      );
      if (projectOwner.rows.length && Number(projectOwner.rows[0].id) !== Number(req.user.id)) {
        const actorName = req.user.username || req.user.email || 'A member';
        await createNotification(
          projectOwner.rows[0].id,
          id,
          `${actorName} completed task "${trimmedFinalTitle}".`
        );
      }
    }

    const changes = [];
    if (existing.title !== trimmedFinalTitle) changes.push(`title: "${existing.title}" -> "${trimmedFinalTitle}"`);
    if ((existing.description || '') !== (finalDescription || '')) changes.push('description updated');
    if (existing.status !== finalStatus) changes.push(`status: ${existing.status} -> ${finalStatus}`);
    if (Number(existing.project_id) !== Number(finalProjectId)) changes.push(`project: ${existing.project_id || '-'} -> ${finalProjectId || '-'}`);
    if (Number(existing.user_id) !== Number(finalAssigneeId)) changes.push(`assignee: ${existing.user_id || '-'} -> ${finalAssigneeId || '-'}`);
    if ((existing.due_date || null) !== (finalDueDate || null)) changes.push('due date updated');
    if ((existing.priority || null) !== (finalPriority || null)) changes.push(`priority: ${existing.priority || '-'} -> ${finalPriority || '-'}`);
    if (!!existing.is_big !== !!finalIsBig) changes.push(`big task: ${existing.is_big ? 'yes' : 'no'} -> ${finalIsBig ? 'yes' : 'no'}`);
    if (changes.length) {
      await logTaskActivity(id, req.user.id, 'task_updated', changes.join(', '));
    }

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.duplicateTask = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can duplicate tasks' });

    const existing = await pool.query(
      `SELECT t.*, p.created_by AS project_owner_id
       FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [id]
    );
    if (!existing.rows.length) return res.status(404).json({ message: 'Task not found' });

    const t = existing.rows[0];
    if (Number(t.project_owner_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const copy = await pool.query(
      `INSERT INTO tasks (title, description, status, project_id, created_by, user_id, due_date, priority, is_big, labels)
       VALUES ($1, $2, 'todo', $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [`${t.title} (copy)`, t.description, t.project_id, req.user.id, t.user_id, t.due_date, t.priority, t.is_big, JSON.stringify(t.labels || [])]
    );

    await pool.query(
      `INSERT INTO subtasks (task_id, title, is_done, position)
       SELECT $1, title, FALSE, position FROM subtasks WHERE task_id = $2
       ORDER BY position, id`,
      [copy.rows[0].id, id]
    );

    await logTaskActivity(copy.rows[0].id, req.user.id, 'task_created', `Duplicated from task #${id}`);
    res.status(201).json(copy.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllActivity = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  try {
    const result = await pool.query(
      `SELECT ta.id, ta.task_id, t.title AS task_title, ta.action, ta.detail,
              ta.created_at, u.username, u.email
       FROM task_activity ta
       LEFT JOIN tasks t ON t.id = ta.task_id
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = ta.actor_user_id
       WHERE p.created_by = $1
       ORDER BY ta.created_at DESC, ta.id DESC
       LIMIT 500`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTaskActivity = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await pool.query(
      `SELECT t.id, t.user_id, p.created_by AS project_owner_id
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [id]
    );
    if (!task.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (req.user.role === 'admin') {
      if (Number(task.rows[0].project_owner_id) !== Number(req.user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (Number(task.rows[0].user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT ta.id, ta.task_id, ta.action, ta.detail, ta.created_at, u.username, u.email
       FROM task_activity ta
       LEFT JOIN users u ON u.id = ta.actor_user_id
       WHERE ta.task_id = $1
       ORDER BY ta.created_at DESC, ta.id DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkDelete = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No task IDs provided' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can bulk delete' });
  try {
    await pool.query(
      `DELETE FROM tasks WHERE id = ANY($1::int[])
       AND project_id IN (SELECT id FROM projects WHERE created_by = $2)`,
      [ids, req.user.id]
    );
    res.json({ message: `${ids.length} tasks deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkUpdateStatus = async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No task IDs provided' });
  if (!['todo', 'in-progress', 'done'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can bulk update' });
  try {
    const completedAt = status === 'done' ? new Date() : null;
    await pool.query(
      `UPDATE tasks SET status = $1, completed_at = $2
       WHERE id = ANY($3::int[])
       AND project_id IN (SELECT id FROM projects WHERE created_by = $4)
       AND status <> 'done'`,
      [status, completedAt, ids, req.user.id]
    );
    res.json({ message: `${ids.length} tasks updated` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM task_templates WHERE created_by = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTemplate = async (req, res) => {
  const { name, title, description, priority, is_big } = req.body;
  if (!name || !title) return res.status(400).json({ message: 'Name and title are required' });
  try {
    const result = await pool.query(
      `INSERT INTO task_templates (name, title, description, priority, is_big, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, title, description || null, priority || 'medium', !!is_big, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM task_templates WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    res.json({ message: 'Template deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendDueReminders = async () => {
  const dueSoonQuery = await pool.query(
    `SELECT t.id, t.title, t.due_date, t.user_id
     FROM tasks t
     WHERE t.status <> 'done'
       AND t.user_id IS NOT NULL
       AND t.due_date IS NOT NULL
       AND t.due_date > NOW()
       AND t.due_date <= NOW() + INTERVAL '24 hours'`
  );

  for (const task of dueSoonQuery.rows) {
    const hoursLeft = (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
    const reminderType = hoursLeft <= 1 ? 'due_1h' : 'due_24h';

    const alreadySent = await pool.query(
      `SELECT 1
       FROM reminder_log
       WHERE task_id = $1 AND user_id = $2 AND reminder_type = $3`,
      [task.id, task.user_id, reminderType]
    );
    if (alreadySent.rows.length) continue;

    const label = reminderType === 'due_1h' ? 'within 1 hour' : 'within 24 hours';
    await createNotification(task.user_id, task.id, `Reminder: "${task.title}" is due ${label}.`);
    await pool.query(
      `INSERT INTO reminder_log (task_id, user_id, reminder_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (task_id, user_id, reminder_type) DO NOTHING`,
      [task.id, task.user_id, reminderType]
    );
  }
};
