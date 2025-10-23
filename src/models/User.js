import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true},
    role: { type: String, enum: ["user", "admin", "rider"], default: "user" },
    address: { type: String },
    phone: { type: String },
    created_at: { type: Date, default: Date.now },
    last_login: { type: Date },
  },
);

export default mongoose.model("User", userSchema);
