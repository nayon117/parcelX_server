import express from 'express';
import { createRider, getApprovedRiders, getAvailableRiders, getPendingRiders, updateRiderStatus } from '../controllers/riderController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyAdmin } from '../middlewares/verifyAdmin.js';

const router = express.Router();

router.post('/', createRider);
router.get('/pending', verifyToken, verifyAdmin, getPendingRiders);
router.get('/approved', verifyToken, verifyAdmin, getApprovedRiders);
router.get('/available', getAvailableRiders);
router.patch('/:id/status', updateRiderStatus);

export default router;
