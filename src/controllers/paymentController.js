import Parcel from "../models/Parcel.js";
import Payment from "../models/Payment.js";
import { stripe } from "../utils/stripe.js";


export const getUserPayments = async (req, res) => {
  try {
    const email = req.query.email;
    if (req.user.email !== email) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const payments = await Payment.find({ email }).sort({ paid_at: -1 });
    res.json(payments);
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ message: "Error fetching payments" });
  }
};


export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ paid_at: -1 });
    res.json(payments);
  } catch (err) {
    console.error("Error fetching all payments:", err);
    res.status(500).json({ message: "Error fetching all payments" });
  }
};

// Record payment and update parcel
export const recordPayment = async (req, res) => {
  try {
    const { id, email, amount, paymentMethod, transactionId } = req.body;

    const parcel = await Parcel.findByIdAndUpdate(
      id,
      { payment_status: "paid" },
      { new: true }
    );

    if (!parcel) return res.status(404).json({ message: "Parcel not found" });

    const payment = new Payment({
      parcelId: id,
      email,
      amount,
      paymentMethod,
      transactionId,
      paid_at_string: new Date().toISOString(),
      paid_at: new Date(),
    });

    const savedPayment = await payment.save();

    res.status(201).json({
      message: "Payment recorded and parcel updated",
      payment: savedPayment,
      parcel,
    });
  } catch (err) {
    console.error("Error processing payment:", err);
    res.status(500).json({ message: "Error processing payment" });
  }
};

// Create Stripe payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(500).json({ message: "Error creating payment intent" });
  }
};
