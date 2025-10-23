import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { createPaymentIntent, getAllPayments, getUserPayments, recordPayment } from '../controllers/paymentController.js';
import { verifyAdmin } from '../middlewares/verifyAdmin.js';

const router = express.Router();

router.get("/", verifyToken, getUserPayments);
router.get("/admin", verifyToken, verifyAdmin, getAllPayments);
router.post("/", recordPayment);
router.post("/create-payment-intent", createPaymentIntent);

export default router;
