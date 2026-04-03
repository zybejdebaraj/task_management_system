const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // your database logic will go here later
    // e.g. const project = await Project.create({ name, description });

    res.status(201).json({ message: 'Project created successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createProject };