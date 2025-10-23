import mongoose from "mongoose";

const riderSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    age: String,
    phone: String,
    region: String,
    district: String,
    nid: String,
    bikeBrand: String,
    bikeRegistration: String,
    status: String,       // e.g., approved, pending
    work_status: String,  // e.g., in_delivery, idle
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Rider", riderSchema);
