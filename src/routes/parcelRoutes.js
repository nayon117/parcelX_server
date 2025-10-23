import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { assignParcelToRider, cashoutParcel, createParcel, deleteParcel, getParcelById, getParcels, getRiderCompletedParcels, getRiderPendingParcels, updateParcelStatus } from '../controllers/parcelController.js';
import { verifyRider } from '../middlewares/verifyRider.js';

const router = express.Router();

router.get('/', verifyToken, getParcels);
router.get('/rider/completed-parcels', verifyToken, verifyRider, getRiderCompletedParcels);
router.get('/rider', verifyToken, verifyRider, getRiderPendingParcels);
router.get('/:id', getParcelById);

router.patch('/:id/assign', assignParcelToRider);
router.patch('/:id/status', verifyToken, verifyRider, updateParcelStatus);
router.patch('/:id/cashout', cashoutParcel);
router.post('/', createParcel);
router.delete('/:id', deleteParcel);


export default router;
