const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask
} = require('../controllers/subtaskController');

router.get('/tasks/:taskId/subtasks', auth, getSubtasks);
router.post('/tasks/:taskId/subtasks', auth, createSubtask);
router.put('/subtasks/:id', auth, updateSubtask);
router.delete('/subtasks/:id', auth, deleteSubtask);

module.exports = router;
