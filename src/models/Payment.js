import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  parcelId: String,
  email: String,
  amount: Number,
  paymentMethod: String,
  transactionId: String,
  paid_at_string: String,
  paid_at: Date,
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
