const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/role');
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
} = require('../controllers/projectController');

router.get('/', auth, listProjects);
router.post('/', auth, isAdmin, createProject);
router.put('/:id', auth, isAdmin, updateProject);
router.delete('/:id', auth, isAdmin, deleteProject);
router.post('/:id/join', auth, joinProject);

module.exports = router;