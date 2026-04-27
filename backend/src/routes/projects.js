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
  listProjectMembers,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');

router.get('/', auth, listProjects);
router.post('/', auth, isAdmin, createProject);
router.put('/:id', auth, isAdmin, updateProject);
router.delete('/:id', auth, isAdmin, deleteProject);
router.post('/:id/join', auth, joinProject);
router.get('/:id/members', auth, isAdmin, listProjectMembers);
router.post('/:id/members', auth, isAdmin, addProjectMember);
router.delete('/:id/members/:userId', auth, isAdmin, removeProjectMember);

module.exports = router;