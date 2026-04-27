const pool = require('../config/db');

const listProjects = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(
        `SELECT p.*, u.email AS created_by_email
         FROM projects p
         LEFT JOIN users u ON u.id = p.created_by
         WHERE p.created_by = $1
         ORDER BY p.id DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    }

    const result = await pool.query(
      `SELECT p.*, u.email AS created_by_email
       FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE pm.user_id = $1
       ORDER BY p.id DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const ownership = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );
    if (!ownership.rows.length) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [name.trim(), description || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(403).json({ message: 'Not authorized or project not found' });
    }

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinProject = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await pool.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (!exists.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [id, req.user.id]
    );

    res.json({ message: 'Joined project successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );
    if (!exists.rows.length) {
      return res.status(403).json({ message: 'Not authorized or project not found' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.role
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.email ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const projectExists = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );
    if (!projectExists.rows.length) {
      return res.status(403).json({ message: 'Not authorized or project not found' });
    }

    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (!userExists.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [id, user_id]
    );

    res.status(201).json({ message: 'Member added to project' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const ownership = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );
    if (!ownership.rows.length) {
      return res.status(403).json({ message: 'Not authorized or project not found' });
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Member removed from project' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
  listProjectMembers,
  addProjectMember,
  removeProjectMember,
};