import express from 'express';
import { createUser, getUserRole, searchUsers, updateUserProfile, updateUserRole } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyAdmin } from '../middlewares/verifyAdmin.js';

const router = express.Router();

router.post('/', createUser)
router.get('/:email/role', getUserRole)
router.get('/search', searchUsers)
router.patch('/:id/role',verifyToken, verifyAdmin, updateUserRole)
router.patch('/:id/profile', verifyToken, updateUserProfile)


export default router;
