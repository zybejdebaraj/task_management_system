const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getUsers,
  getMembers,
  adminDeleteMember,
  adminUpdateMember,
  adminCreateMember,
  getMySettings,
  updateMyProfile,
  updateMyPassword,
  updateMyPreferences,
  updateMyMailbox,
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/role');

router.post('/register', register);
router.post('/login', login);
router.get('/users', auth, isAdmin, getUsers);
router.get('/members', auth, isAdmin, getMembers);
router.post('/admin/members', auth, isAdmin, adminCreateMember);
router.delete('/admin/members/:id', auth, isAdmin, adminDeleteMember);
router.put('/admin/members/:id', auth, isAdmin, adminUpdateMember);
router.get('/me', auth, getMySettings);
router.put('/me/profile', auth, updateMyProfile);
router.put('/me/password', auth, updateMyPassword);
router.put('/me/preferences', auth, updateMyPreferences);
router.put('/me/mailbox', auth, updateMyMailbox);

module.exports = router;