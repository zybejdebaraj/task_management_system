const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// All comment routes require authentication
router.use(auth);

// Get comments for a task
router.get('/tasks/:taskId/comments', commentController.getComments);

// Create comment
router.post('/tasks/:taskId/comments', commentController.createComment);

// Delete comment
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;