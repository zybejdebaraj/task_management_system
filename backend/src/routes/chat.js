const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const pool = require('../config/db');

let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// ── helpers ────────────────────────────────────────────────────────────────

function taskLine(t, now, showAssignee = false) {
  const status = `[${t.status}]`;
  const assignee = showAssignee && t.assignee ? ` | Assignee: ${t.assignee}` : '';
  const proj = t.project_name ? ` | Project: ${t.project_name}` : '';
  const pri = t.priority ? ` | Priority: ${t.priority}` : '';
  const due = t.due_date ? ` | Due: ${new Date(t.due_date).toLocaleDateString()}` : '';
  const late = t.due_date && new Date(t.due_date) < now && t.status !== 'done' ? ' ⚠ OVERDUE' : '';
  return `  - ${status} ${t.title}${assignee}${proj}${pri}${due}${late}`;
}

function buildStats(tasks, now) {
  return {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length,
  };
}

// ── admin context ──────────────────────────────────────────────────────────

async function buildAdminContext(userId) {
  const [tasksResult, projectsResult, membersResult, userResult] = await Promise.all([
    pool.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date,
              p.name AS project_name,
              COALESCE(u.username, u.email) AS assignee
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 200`
    ),
    pool.query(
      `SELECT p.id, p.name, p.description,
              COUNT(pm.user_id) AS member_count
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.created_by = $1
       GROUP BY p.id ORDER BY p.name`,
      [userId]
    ),
    pool.query(
      `SELECT id, COALESCE(username, email) AS name, role FROM users ORDER BY role, name`
    ),
    pool.query('SELECT username, email, role FROM users WHERE id = $1', [userId]),
  ]);

  const now = new Date();
  const tasks = tasksResult.rows;
  const projects = projectsResult.rows;
  const members = membersResult.rows;
  const user = userResult.rows[0];
  const stats = buildStats(tasks, now);

  const byAssignee = {};
  for (const t of tasks) {
    const key = t.assignee || 'Unassigned';
    if (!byAssignee[key]) byAssignee[key] = [];
    byAssignee[key].push(t);
  }

  const workloadLines = Object.entries(byAssignee).map(([name, ts]) => {
    const s = buildStats(ts, now);
    return `  ${name}: ${s.total} tasks (todo:${s.todo} in-progress:${s.inProgress} done:${s.done} overdue:${s.overdue})`;
  }).join('\n');

  const projectLines = projects.length
    ? projects.map(p => `  - ${p.name} (${p.member_count} members)${p.description ? ': ' + p.description : ''}`).join('\n')
    : '  (none)';

  const memberLines = members.map(m => `  - ${m.name} (${m.role})`).join('\n');
  const taskLines = tasks.map(t => taskLine(t, now, true)).join('\n');

  return `You are a smart assistant for IdealTask, a project management app.
You have full admin visibility across the entire team and all projects.

Admin: ${user.username || user.email}

--- Team members (${members.length}) ---
${memberLines}

--- Projects (${projects.length}) ---
${projectLines}

--- Team task summary ---
Total: ${stats.total} | Todo: ${stats.todo} | In-progress: ${stats.inProgress} | Done: ${stats.done} | Overdue: ${stats.overdue}

--- Workload by member ---
${workloadLines}

--- All tasks ---
${tasks.length ? taskLines : '  (none)'}

Guidelines:
- You have visibility across all team members, projects, and tasks.
- Answer questions about team workload, project status, individual members, overdue items, or overall progress.
- Be brief and direct. Use bullet points when listing items.
- When asked who to reassign work to, consider each member's current workload.
- Do not make up data that is not in the context above.`;
}

// ── member context ─────────────────────────────────────────────────────────

async function buildMemberContext(userId) {
  const [tasksResult, projectsResult, userResult] = await Promise.all([
    pool.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date,
              p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.user_id = $1 OR t.created_by = $1
       ORDER BY t.created_at DESC LIMIT 60`,
      [userId]
    ),
    pool.query(
      `SELECT p.id, p.name, p.description
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1`,
      [userId]
    ),
    pool.query('SELECT username, email, role FROM users WHERE id = $1', [userId]),
  ]);

  const now = new Date();
  const tasks = tasksResult.rows;
  const projects = projectsResult.rows;
  const user = userResult.rows[0];
  const stats = buildStats(tasks, now);

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const activeLines = activeTasks.length
    ? activeTasks.map(t => taskLine(t, now, false)).join('\n')
    : '  (no active tasks)';

  const projectLines = projects.length
    ? projects.map(p => `  - ${p.name}${p.description ? ': ' + p.description : ''}`).join('\n')
    : '  (none)';

  return `You are a smart assistant for IdealTask, a project management app.
You help the user understand and manage their active tasks and projects.

User: ${user.username || user.email}

--- My projects (${projects.length}) ---
${projectLines}

--- My task summary ---
Todo: ${stats.todo} | In-progress: ${stats.inProgress} | Done: ${stats.done} | Overdue: ${stats.overdue}

--- My active tasks (todo & in-progress only) ---
${activeLines}

Guidelines:
- Focus only on active tasks (todo and in-progress). Do NOT mention done tasks unless the user explicitly asks about them.
- Answer only questions about this user's own tasks and projects.
- Be brief and direct. Use bullet points when listing items.
- If asked what to work on next, prioritise overdue tasks first, then high-priority todo items.
- Do not make up tasks or projects that are not in the data above.`;
}

// ── route ──────────────────────────────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const isAdmin = req.user.role === 'admin';
    const systemPrompt = isAdmin
      ? await buildAdminContext(req.user.id)
      : await buildMemberContext(req.user.id);

    const response = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    const reply = response.choices[0].message.content ?? '';

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

module.exports = router;
