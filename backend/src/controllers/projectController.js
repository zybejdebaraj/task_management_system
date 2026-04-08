const pool = require('../config/db');

const listProjects = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(
        `SELECT p.*, u.email AS created_by_email
         FROM projects p
         LEFT JOIN users u ON u.id = p.created_by
         ORDER BY p.id DESC`
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
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
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

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
};