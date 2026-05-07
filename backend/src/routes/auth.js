const express = require('express');
const router = express.Router();

const express = require('express');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, '../uploads') });

const {
  register, login, googleAuth, inviteMember, acceptInvite,
  getUsers, getMembers, adminDeleteMember, adminUpdateMember, adminCreateMember,
  forgotPassword, resetPassword,
  getMySettings, updateMyProfile, updateMyPassword, updateMyPreferences, updateMyMailbox,
  uploadAvatar,
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/role');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/accept-invite', acceptInvite);
router.post('/invite', auth, isAdmin, inviteMember);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
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
router.post('/me/avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;