import mongoose from "mongoose";

const parcelSchema = new mongoose.Schema(
  {
    type: String,
    title: String,

    senderName: String,
    senderContact: String,
    senderRegion: String,
    senderCenter: String,
    senderAddress: String,
    pickupInstruction: String,

    receiverName: String,
    receiverContact: String,
    receiverRegion: String,
    receiverCenter: String,
    receiverAddress: String,
    deliveryInstruction: String,

    cost: Number,
    payment_status: String,
    delivery_status: String,

    created_by: String,
    creation_date: { type: Date, default: Date.now },
    tracking_id: String,

    assigned_rider_email: String,
    assigned_rider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assigned_rider_name: String,

    picked_at: Date,
    delivered_at: Date,
    cashed_out_at: Date,

    cashout_status: String,
  },
  { timestamps: true }
);

export default mongoose.model("Parcel", parcelSchema);
