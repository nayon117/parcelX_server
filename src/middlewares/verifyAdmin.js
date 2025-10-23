import User from "../models/User.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch (error) {
    console.error("Error in verifyAdmin middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};

