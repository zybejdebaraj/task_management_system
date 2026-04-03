const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/role');
const { createProject } = require('../controllers/projectController');

router.post('/', auth, isAdmin, createProject);

module.exports = router;