const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();

const auth = require('../middleware/auth');
const {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
  getTaskActivity,
} = require('../controllers/taskController');

const upload = multer({ dest: path.join(__dirname, '../uploads') });

router.get('/', auth, getTasks);
router.post('/', auth, upload.array('attachments', 5), createTask);
router.get('/:id/activity', auth, getTaskActivity);
router.delete('/:id', auth, deleteTask);
router.put('/:id', auth, updateTask);

module.exports = router;